import Link from "next/link";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { Alert } from "@/components/ui/Alert";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { heading, input, label, link } from "@/components/ui/styles";
import { login, signInWithGoogle, signInWithMicrosoft } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  return (
    <main className="bg-noise flex min-h-screen flex-col justify-center px-6 py-16">
      <div className="mx-auto w-full max-w-sm">
        <BrandHeader />

        <div className="mt-8 rounded-2xl border border-line bg-surface p-7 shadow-sm">
          <h1 className={heading("md")}>Welcome back</h1>

          {checkEmail && (
            <div className="mt-5">
              <Alert tone="success">Check your email to confirm your account before logging in.</Alert>
            </div>
          )}
          {error && (
            <div className="mt-5">
              <Alert tone="error">{error}</Alert>
            </div>
          )}

          <form className="mt-6 space-y-4">
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
              <input id="password" name="password" type="password" required className={input} />
            </div>

            <SubmitButton formAction={login} pendingText="Logging in…" className="mt-2 w-full">
              Log in
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
          Don&apos;t have an account? <Link href="/signup" className={link}>Sign up</Link>
        </p>

        <p className="mt-4 text-center text-xs text-muted">
          While logging in, you are consenting to the{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms and Conditions
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
