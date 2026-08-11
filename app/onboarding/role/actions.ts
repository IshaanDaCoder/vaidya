"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { roleSchema } from "@/utils/validation/auth";

// Used only by the OAuth path — email/password signup already carries
// role through to the Day 4 trigger. This runs with the user's own
// authenticated session (RLS-respecting insert), which is valid here
// because an OAuth sign-in has an active session immediately, unlike
// email/password with confirmation pending.
export async function chooseRole(formData: FormData) {
  const parsed = roleSchema.safeParse(formData.get("role"));
  if (!parsed.success) {
    redirect(`/onboarding/role?error=${encodeURIComponent("Choose an account type.")}`);
  }

  if (formData.get("consent") !== "on") {
    redirect(
      `/onboarding/role?error=${encodeURIComponent("You must agree to data processing to continue.")}`,
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role = parsed.data;

  const { error } = await supabase
    .from("profiles")
    .insert({ id: user.id, role, consent_given_at: new Date().toISOString() });

  if (error) {
    redirect(`/onboarding/role?error=${encodeURIComponent(error.message)}`);
  }

  if (role === "patient") {
    await supabase.from("patient_profiles").insert({ user_id: user.id });
    redirect("/search");
  }

  redirect("/doctor/dashboard");
}
