import Link from "next/link";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { Alert } from "@/components/ui/Alert";
import { heading, input, label, link } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { signInWithGoogle, signInWithMicrosoft, signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const { error, role } = await searchParams;
  const defaultRole = role === "doctor" ? "doctor" : "patient";

  return (
    <main className="bg-noise flex min-h-screen flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-sm">
        <BrandHeader />

        <div className="mt-8 rounded-2xl border border-line bg-surface p-7 shadow-sm">
          <h1 className={heading("md")}>Create your account</h1>
          <p className="mt-1.5 text-sm text-muted">
            Choose how you&apos;ll use Vaidya. You can&apos;t change this after signing up.
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
                <input
                  type="radio"
                  name="role"
                  value="patient"
                  defaultChecked={defaultRole === "patient"}
                  className="sr-only"
                />
                Patient
              </label>
              <label className="flex cursor-pointer items-center justify-center rounded-lg border border-line bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors has-[:checked]:border-trust has-[:checked]:bg-trust/10 has-[:checked]:text-trust-dark dark:has-[:checked]:text-trust">
                <input
                  type="radio"
                  name="role"
                  value="doctor"
                  defaultChecked={defaultRole === "doctor"}
                  className="sr-only"
                />
                Doctor
              </label>
            </fieldset>

            <div>
              <label htmlFor="email" className={label}>
                Email
              </label>
              <input id="email" name="email" type="email" required className={input} />
            </div>
            <div>
              <label htmlFor="password" className={label}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={6}
                className={input}
              />
            </div>

            <label className="flex items-start gap-2.5 pt-1 text-xs text-muted">
              <input type="checkbox" name="consent" required className="mt-0.5 h-3.5 w-3.5 accent-trust" />
              <span>
                I agree to the{" "}
                <Link href="/terms" target="_blank" rel="noreferrer" className={link}>
                  Terms and Conditions
                </Link>{" "}
                and consent to Vaidya processing my personal data to provide this service.
              </span>
            </label>

            <SubmitButton formAction={signup} pendingText="Creating account…" className="mt-1 w-full">
              Sign up
            </SubmitButton>
          </form>

          <div className="mt-6 flex flex-col gap-2">
            <div className="flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" />
              Or continue with
              <span className="h-px flex-1 bg-line" />
            </div>
            <form>
              <SubmitButton formAction={signInWithGoogle} variant="secondary" className="w-full">
                Google
              </SubmitButton>
            </form>
            <form>
              <SubmitButton formAction={signInWithMicrosoft} variant="secondary" className="w-full">
                Microsoft
              </SubmitButton>
            </form>
          </div>
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          Already have an account? <Link href="/login" className={link}>Log in</Link>
        </p>
      </div>
    </main>
  );
}
