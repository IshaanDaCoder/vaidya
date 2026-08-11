import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { chooseRole } from "./actions";

export default async function ChooseRolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Already has a role — this page is only for the gap between an OAuth
  // sign-in and choosing one, so don't show it again once that's settled.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    redirect(profile.role === "doctor" ? "/doctor/dashboard" : "/search");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold text-foreground">One more thing</h1>
      <p className="mt-2 text-sm text-muted">
        How will you use Vaidya? This can&apos;t be changed later.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-5">
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">I am a...</legend>
          <label className="flex cursor-pointer items-center justify-center rounded-md border border-line px-4 py-3 text-sm font-medium text-foreground has-[:checked]:border-trust has-[:checked]:bg-trust/10 has-[:checked]:text-trust-dark dark:has-[:checked]:text-trust">
            <input type="radio" name="role" value="patient" defaultChecked className="sr-only" />
            Patient
          </label>
          <label className="flex cursor-pointer items-center justify-center rounded-md border border-line px-4 py-3 text-sm font-medium text-foreground has-[:checked]:border-trust has-[:checked]:bg-trust/10 has-[:checked]:text-trust-dark dark:has-[:checked]:text-trust">
            <input type="radio" name="role" value="doctor" className="sr-only" />
            Doctor
          </label>
        </fieldset>

        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          I agree to Vaidya processing my personal data to provide this service,
          in line with the privacy policy.
        </label>

        <button
          formAction={chooseRole}
          className="w-full rounded-md bg-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-trust-dark"
        >
          Continue
        </button>
      </form>
    </main>
  );
}
