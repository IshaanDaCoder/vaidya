import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import {
  addAvailabilitySlot,
  generateSlotsFromHours,
  removeAvailabilitySlot,
  saveWeeklyHours,
} from "./actions";
import { AppHeader } from "@/components/ui/AppHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Alert } from "@/components/ui/Alert";
import { card, input, label, buttonVariants } from "@/components/ui/styles";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatSlot(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateFmt = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const timeFmt = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; savedHours?: string; generated?: string }>;
}) {
  const { error, savedHours, generated } = await searchParams;
  const user = await requireRole("doctor");
  const supabase = await createClient();

  // doctor_weekly_hours and availability_slots both have a foreign key
  // to doctor_profiles(user_id) — a doctor who hasn't completed
  // onboarding yet has no row there, so saving hours or adding a slot
  // would otherwise fail with a raw Postgres foreign-key error instead
  // of a page that explains what to do first.
  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!doctorProfile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <AppHeader title="Availability" />
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm text-foreground/85">
            Complete your doctor profile before setting your availability.
          </p>
          <Link href="/doctor/onboarding" className={`mt-3 inline-flex ${buttonVariants("primary", "sm")}`}>
            Complete your profile
          </Link>
        </div>
      </main>
    );
  }

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time, end_time, is_booked")
    .eq("doctor_id", user.id)
    .gte("end_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  const { data: weeklyHours } = await supabase
    .from("doctor_weekly_hours")
    .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active")
    .eq("doctor_id", user.id);

  const hoursByDay = new Map((weeklyHours ?? []).map((h) => [h.day_of_week, h]));
  const sharedDuration = weeklyHours?.[0]?.slot_duration_minutes ?? 30;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <AppHeader
        title="Availability"
        description="Set your recurring hours of operation, generate bookable slots from them, or add one-off slots by hand."
        backHref="/doctor/dashboard"
        backLabel="Back to dashboard"
      />

      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}
      {savedHours && (
        <div className="mt-6">
          <Alert tone="success">Hours of operation saved.</Alert>
        </div>
      )}
      {generated !== undefined && (
        <div className="mt-6">
          <Alert tone="success">
            {generated === "0"
              ? "No new slots to generate — everything in the next 3 weeks already exists."
              : `Generated ${generated} new slot${generated === "1" ? "" : "s"} for the next 3 weeks.`}
          </Alert>
        </div>
      )}

      {/* Hours of operation */}
      <section className="mt-8">
        <SectionHeading>Hours of operation</SectionHeading>
        <p className="mt-2 text-sm text-muted">
          Turn on the days you work, set your hours, and pick a consultation length. Times
          are in IST.
        </p>

        <form className={`mt-4 space-y-4 ${card}`}>
          <div className="flex items-end gap-3">
            <div>
              <label htmlFor="slotDurationMinutes" className={label}>
                Consultation length (minutes)
              </label>
              <input
                id="slotDurationMinutes"
                name="slotDurationMinutes"
                type="number"
                min="5"
                max="240"
                step="5"
                defaultValue={sharedDuration}
                required
                className={`${input} w-32`}
              />
            </div>
          </div>

          <div className="space-y-2">
            {DAY_LABELS.map((dayLabel, i) => {
              const existing = hoursByDay.get(i);
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-background px-4 py-3 transition-colors has-[:checked]:border-trust/40 has-[:checked]:bg-trust/5"
                >
                  <label className="flex w-28 shrink-0 items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      name={`active_${i}`}
                      defaultChecked={existing?.is_active ?? false}
                      className="h-4 w-4 accent-trust"
                    />
                    {dayLabel}
                  </label>
                  <input
                    type="time"
                    name={`start_${i}`}
                    defaultValue={existing?.start_time?.slice(0, 5) ?? "09:00"}
                    className={`${input} mt-0 w-auto`}
                  />
                  <span className="text-sm text-muted">to</span>
                  <input
                    type="time"
                    name={`end_${i}`}
                    defaultValue={existing?.end_time?.slice(0, 5) ?? "17:00"}
                    className={`${input} mt-0 w-auto`}
                  />
                </div>
              );
            })}
          </div>

          <button formAction={saveWeeklyHours} className={buttonVariants("primary")}>
            Save hours
          </button>
        </form>

        <form className="mt-3">
          <button formAction={generateSlotsFromHours} className={buttonVariants("secondary")}>
            Generate slots for the next 3 weeks
          </button>
          <p className="mt-1.5 text-xs text-muted">
            Fills in bookable slots from your saved hours. Safe to click again later —
            it only adds what&apos;s missing, never duplicates.
          </p>
        </form>
      </section>

      {/* One-off slot */}
      <section className="mt-10">
        <SectionHeading>Add a one-off slot</SectionHeading>
        <form className={`mt-4 flex flex-wrap items-end gap-3 ${card}`}>
          <div>
            <label htmlFor="startTime" className={label}>
              Start
            </label>
            <input id="startTime" name="startTime" type="datetime-local" required className={input} />
          </div>
          <div>
            <label htmlFor="endTime" className={label}>
              End
            </label>
            <input id="endTime" name="endTime" type="datetime-local" required className={input} />
          </div>
          <button formAction={addAvailabilitySlot} className={buttonVariants("primary")}>
            Add slot
          </button>
        </form>
      </section>

      {/* Upcoming slots */}
      <section className="mt-10">
        <SectionHeading>Upcoming slots ({(slots ?? []).length})</SectionHeading>
        <div className="mt-4 space-y-2">
          {(slots ?? []).length === 0 && <p className="text-sm text-muted">No upcoming slots yet.</p>}
          {(slots ?? []).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-line bg-surface px-4 py-3.5 text-sm shadow-sm"
            >
              <span className="text-foreground">{formatSlot(s.start_time, s.end_time)}</span>
              {s.is_booked ? (
                <span className="text-xs font-medium text-trust-dark dark:text-trust">Booked</span>
              ) : (
                <form>
                  <input type="hidden" name="slotId" value={s.id} />
                  <button
                    formAction={removeAvailabilitySlot}
                    className="text-xs font-medium text-red-700 hover:underline dark:text-red-300"
                  >
                    Remove
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
