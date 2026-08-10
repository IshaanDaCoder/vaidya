import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/**
 * Server-component guard: redirects to /login if not signed in, or to
 * the correct role landing page if signed in as the wrong role. Returns
 * the authenticated user when the role matches.
 */
export async function requireRole(role: "doctor" | "patient") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) redirect("/onboarding/role");
  if (profile.role !== role) {
    redirect(profile.role === "doctor" ? "/doctor/dashboard" : "/search");
  }

  return user;
}
