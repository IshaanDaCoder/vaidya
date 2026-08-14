"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { availabilitySlotSchema, weeklyHoursSchema } from "@/utils/validation/doctor";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const GENERATE_WINDOW_DAYS = 21; // three weeks ahead
const IST_OFFSET = "+05:30"; // Vaidya is India-only; doctors enter wall-clock IST times

export async function saveWeeklyHours(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const days = DAY_LABELS.map((_, i) => ({
    isActive: formData.get(`active_${i}`) === "on",
    startTime: (formData.get(`start_${i}`) as string) || "00:00",
    endTime: (formData.get(`end_${i}`) as string) || "00:00",
  }));

  const parsed = weeklyHoursSchema.safeParse({
    slotDurationMinutes: formData.get("slotDurationMinutes"),
    days,
  });

  if (!parsed.success) {
    redirect(`/doctor/availability?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { slotDurationMinutes, days: parsedDays } = parsed.data;

  // Inactive days still need end_time > start_time to satisfy the table's
  // check constraint, regardless of whatever times were left in the
  // (disabled, ignored) form inputs for that day — always store a fixed
  // placeholder range rather than trying to reuse the form's values.
  const rows = parsedDays.map((day, dayOfWeek) => ({
    doctor_id: user.id,
    day_of_week: dayOfWeek,
    start_time: day.isActive ? day.startTime : "00:00",
    end_time: day.isActive ? day.endTime : "00:01",
    slot_duration_minutes: slotDurationMinutes,
    is_active: day.isActive,
  }));

  const { error } = await supabase
    .from("doctor_weekly_hours")
    .upsert(rows, { onConflict: "doctor_id,day_of_week" });

  if (error) {
    redirect(`/doctor/availability?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/doctor/availability");
  redirect("/doctor/availability?savedHours=1");
}

export async function generateSlotsFromHours() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: hours } = await supabase
    .from("doctor_weekly_hours")
    .select("day_of_week, start_time, end_time, slot_duration_minutes")
    .eq("doctor_id", user.id)
    .eq("is_active", true);

  if (!hours || hours.length === 0) {
    redirect(
      `/doctor/availability?error=${encodeURIComponent("Set your hours of operation for at least one day first.")}`,
    );
  }

  const hoursByDay = new Map(hours.map((h) => [h.day_of_week, h]));

  // Anchor to today's date in IST, not the server's local timezone
  // (Vercel functions run in UTC) — otherwise "today" could be off by a
  // day depending on the time of day this runs.
  const istParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .formatToParts(new Date())
    .reduce<Record<string, string>>((acc, p) => ({ ...acc, [p.type]: p.value }), {});
  const todayUTC = Date.UTC(Number(istParts.year), Number(istParts.month) - 1, Number(istParts.day));

  const now = new Date();
  const newSlots: { doctor_id: string; start_time: string; end_time: string }[] = [];

  for (let offset = 0; offset < GENERATE_WINDOW_DAYS; offset++) {
    const dayDate = new Date(todayUTC + offset * 86_400_000);
    const dayOfWeek = dayDate.getUTCDay(); // 0 = Sunday, matches the schema
    const dayHours = hoursByDay.get(dayOfWeek);
    if (!dayHours) continue;

    const y = dayDate.getUTCFullYear();
    const m = String(dayDate.getUTCMonth() + 1).padStart(2, "0");
    const d = String(dayDate.getUTCDate()).padStart(2, "0");

    const [startH, startM] = dayHours.start_time.split(":").map(Number);
    const [endH, endM] = dayHours.end_time.split(":").map(Number);
    const duration = dayHours.slot_duration_minutes;

    let cursorMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    while (cursorMinutes + duration <= endMinutes) {
      const slotStartH = String(Math.floor(cursorMinutes / 60)).padStart(2, "0");
      const slotStartM = String(cursorMinutes % 60).padStart(2, "0");
      const slotStart = new Date(`${y}-${m}-${d}T${slotStartH}:${slotStartM}:00${IST_OFFSET}`);

      const slotEndCursor = cursorMinutes + duration;
      const slotEndH = String(Math.floor(slotEndCursor / 60)).padStart(2, "0");
      const slotEndM = String(slotEndCursor % 60).padStart(2, "0");
      const slotEnd = new Date(`${y}-${m}-${d}T${slotEndH}:${slotEndM}:00${IST_OFFSET}`);

      if (slotStart > now) {
        newSlots.push({
          doctor_id: user.id,
          start_time: slotStart.toISOString(),
          end_time: slotEnd.toISOString(),
        });
      }

      cursorMinutes += duration;
    }
  }

  if (newSlots.length > 0) {
    // ignoreDuplicates -> ON CONFLICT (doctor_id, start_time) DO NOTHING,
    // so re-running this after hours change never creates duplicate or
    // conflicting slots for a time that's already been generated. With
    // ignoreDuplicates, ON CONFLICT DO NOTHING means a skipped row never
    // reaches RETURNING — so .select() here reports exactly how many were
    // genuinely new, not the full candidate count computed above (which
    // stays the same size on every run regardless of what already exists,
    // and would otherwise make this message lie on a second click).
    const { data: inserted, error } = await supabase
      .from("availability_slots")
      .upsert(newSlots, { onConflict: "doctor_id,start_time", ignoreDuplicates: true })
      .select("id");

    if (error) {
      redirect(`/doctor/availability?error=${encodeURIComponent(error.message)}`);
    }

    revalidatePath("/doctor/availability");
    redirect(`/doctor/availability?generated=${inserted?.length ?? 0}`);
  }

  revalidatePath("/doctor/availability");
  redirect(`/doctor/availability?generated=0`);
}

export async function addAvailabilitySlot(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = availabilitySlotSchema.safeParse({
    startTime: formData.get("startTime"),
    endTime: formData.get("endTime"),
  });

  if (!parsed.success) {
    redirect(`/doctor/availability?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { error } = await supabase.from("availability_slots").insert({
    doctor_id: user.id,
    start_time: parsed.data.startTime.toISOString(),
    end_time: parsed.data.endTime.toISOString(),
  });

  if (error) {
    redirect(`/doctor/availability?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/doctor/availability");
  redirect("/doctor/availability");
}

export async function removeAvailabilitySlot(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slotId = formData.get("slotId") as string;

  // RLS (availability_slots_all_own) already scopes this to slots the
  // caller owns, but the explicit eq keeps intent obvious.
  await supabase.from("availability_slots").delete().eq("id", slotId).eq("doctor_id", user.id);

  revalidatePath("/doctor/availability");
  redirect("/doctor/availability");
}
