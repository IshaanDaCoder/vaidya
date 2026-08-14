"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getPostAuthRedirect } from "@/utils/get-post-auth-redirect";
import { loginSchema, signupSchema } from "@/utils/validation/auth";

export async function signup(formData: FormData) {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    role: formData.get("role"),
  });

  if (!parsed.success) {
    redirect(`/signup?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  if (formData.get("consent") !== "on") {
    redirect(
      `/signup?error=${encodeURIComponent("You must agree to data processing to create an account.")}`,
    );
  }

  const supabase = await createClient();
  const { email, password, role } = parsed.data;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { role } },
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/login?checkEmail=1");
}

export async function login(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  redirect(await getPostAuthRedirect(supabase));
}

// Google's Supabase provider defaults to a scope set that already
// includes email, but Azure's does not — its default authorize request
// only asks for "openid", which gets a token with no permission to read
// the user's profile. Supabase then tries to call Microsoft Graph's
// /me endpoint to fetch the email and fails with "Error getting user
// email from external provider" — a real, reproduced bug, not a config
// typo. Requesting "email" and "profile" explicitly here is what fixes
// it; the API permission grant in Azure alone was not sufficient,
// because that just makes the scope available, it doesn't request it.
const OAUTH_SCOPES: Partial<Record<"google" | "azure", string>> = {
  azure: "openid email profile",
};

async function signInWithOAuthProvider(
  provider: "google" | "azure",
  label: string,
) {
  const supabase = await createClient();
  // Prefer the explicit site URL — the "origin" header isn't guaranteed to
  // be present on every request path, and a silent fallback to `undefined`
  // here produces a redirect to the literal host "undefined", which shows
  // up to the user as a browser-level "website not found" error.
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin");

  if (!origin) {
    redirect(`/login?error=${encodeURIComponent(`${label} sign-in is misconfigured (no site URL).`)}`);
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
      scopes: OAUTH_SCOPES[provider],
    },
  });

  if (error || !data.url) {
    redirect(`/login?error=${encodeURIComponent(error?.message ?? `${label} sign-in failed.`)}`);
  }

  redirect(data.url);
}

export async function signInWithGoogle() {
  await signInWithOAuthProvider("google", "Google");
}

export async function signInWithMicrosoft() {
  await signInWithOAuthProvider("azure", "Microsoft");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
