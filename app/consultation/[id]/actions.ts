"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// consultations has no update policy for authenticated users (Day 2 RLS
// — only the service role can write it, matching the booking/webhook
// pattern). So this reads the row through the caller's own RLS-scoped
// client first (proving they're the doctor on it — a patient or a
// stranger gets nothing back), then performs the actual write with the
// admin client.
export async function markConsultationCompleted(formData: FormData) {
  const consultationId = formData.get("consultationId") as string;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: consultation } = await supabase
    .from("consultations")
    .select("id, doctor_id, status")
    .eq("id", consultationId)
    .maybeSingle();

  if (!consultation || consultation.doctor_id !== user.id) {
    redirect("/doctor/dashboard?error=Consultation not found.");
  }
  if (consultation.status !== "scheduled") {
    redirect("/doctor/dashboard");
  }

  const admin = createAdminClient();
  await admin.from("consultations").update({ status: "completed" }).eq("id", consultationId);

  revalidatePath("/doctor/dashboard");
  redirect("/doctor/dashboard");
}
