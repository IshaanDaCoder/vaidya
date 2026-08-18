import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { Alert } from "@/components/ui/Alert";
import { heading, link, buttonVariants } from "@/components/ui/styles";
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
    <main className="bg-noise flex min-h-screen flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-sm">
        <BrandHeader />

        <div className="mt-8 rounded-2xl border border-line bg-surface p-7 shadow-sm">
          <h1 className={heading("md")}>One more thing</h1>
          <p className="mt-1.5 text-sm text-muted">
            How will you use Vaidya? This can&apos;t be changed later.
          </p>

          {error && (
            <div className="mt-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <form className="mt-6 space-y-4">
            <fieldset className="grid grid-cols-2 gap-3">
              <legend className="sr-only">I am a...</legend>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-trust has-[:checked]:bg-trust/10 has-[:checked]:text-trust-dark dark:has-[:checked]:text-trust">
                <input type="radio" name="role" value="patient" defaultChecked className="sr-only" />
                Patient
              </label>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-trust has-[:checked]:bg-trust/10 has-[:checked]:text-trust-dark dark:has-[:checked]:text-trust">
                <input type="radio" name="role" value="doctor" className="sr-only" />
                Doctor
              </label>
            </fieldset>

            <label className="flex items-start gap-2.5 text-xs text-muted">
              <input type="checkbox" name="consent" required className="mt-0.5 h-3.5 w-3.5 accent-trust" />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noreferrer" className={link}>
                  Terms and Conditions
                </Link>{" "}
                and consent to Vaidya processing my personal data to provide this service.
              </span>
            </label>

            <button formAction={chooseRole} className={`w-full ${buttonVariants("primary")}`}>
              Continue
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
