"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/utils/is-admin";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/login");
  }
}

export async function reviewDoctorSubmission(formData: FormData) {
  await requireAdmin();

  const doctorId = formData.get("doctorId") as string;
  const decision = formData.get("decision") as string;

  if (decision !== "verified" && decision !== "rejected") {
    redirect("/admin/doctors?error=Invalid decision");
  }

  // Runs as the service role, which is the one legitimate way to change
  // verification_status — the Day 2 trigger reverts this column for any
  // non-service-role update, so a doctor can never self-approve.
  const admin = createAdminClient();
  const { error } = await admin
    .from("doctor_profiles")
    .update({ verification_status: decision })
    .eq("user_id", doctorId);

  if (error) {
    redirect(`/admin/doctors?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/admin/doctors");
  redirect("/admin/doctors");
}
