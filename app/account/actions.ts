"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

// The DPDP Act gives users a right to erasure. Deleting the auth.users
// row cascades through profiles, doctor_profiles/patient_profiles,
// availability_slots, consultations, and reviews via the ON DELETE
// CASCADE foreign keys set up in the Day 2 migration — one call here is
// enough to actually remove someone's data, not just deactivate them.
export async function deleteAccount(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (formData.get("confirm") !== "DELETE") {
    const referer = (await headers()).get("referer") ?? "/";
    const back = new URL(referer);
    back.searchParams.set("error", "Type DELETE to confirm.");
    redirect(back.pathname + back.search);
  }

  const admin = createAdminClient();
  await supabase.auth.signOut();
  await admin.auth.admin.deleteUser(user.id);

  redirect("/");
}
