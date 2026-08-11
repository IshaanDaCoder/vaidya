"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { availabilitySlotSchema } from "@/utils/validation/doctor";

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
