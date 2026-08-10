import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Where to send a user right after they get a session — role-based for
 * doctors/patients, or to role selection if no profiles row exists yet
 * (the OAuth path, where role isn't known until after the redirect).
 */
export async function getPostAuthRedirect(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return "/login";

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role === "doctor") return "/doctor/dashboard";
  if (profile?.role === "patient") return "/search";
  return "/onboarding/role";
}
