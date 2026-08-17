import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { signInWithGoogle, signInWithMicrosoft, signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const { error, role } = await searchParams;
  const defaultRole = role === "doctor" ? "doctor" : "patient";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-semibold text-trust-dark">
          Vaidya
        </Link>
        <ThemeToggle />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        Choose how you&apos;ll use Vaidya. You can&apos;t change this after signing up.
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
            <input
              type="radio"
              name="role"
              value="patient"
              defaultChecked={defaultRole === "patient"}
              className="sr-only"
            />
            Patient
          </label>
          <label className="flex cursor-pointer items-center justify-center rounded-md border border-line px-4 py-3 text-sm font-medium text-foreground has-[:checked]:border-trust has-[:checked]:bg-trust/10 has-[:checked]:text-trust-dark dark:has-[:checked]:text-trust">
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
          <label htmlFor="email" className="text-xs text-muted">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs text-muted">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          <span>
            I agree to the{" "}
            <Link
              href="/terms"
              target="_blank"
              rel="noreferrer"
              className="font-medium text-trust-dark underline underline-offset-4 dark:text-trust"
            >
              Terms and Conditions
            </Link>{" "}
            and consent to Vaidya processing my personal data to provide this
            service.
          </span>
        </label>

        <button
          formAction={signup}
          className="w-full rounded-md bg-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-trust-dark"
        >
          Sign up
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        <div className="text-center text-xs text-muted">Or continue with</div>
        <form>
          <button
            formAction={signInWithGoogle}
            className="w-full rounded-md border border-line px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Google
          </button>
        </form>
        <form>
          <button
            formAction={signInWithMicrosoft}
            className="w-full rounded-md border border-line px-4 py-2.5 text-sm font-medium text-foreground hover:bg-surface"
          >
            Microsoft
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-trust-dark underline underline-offset-4 dark:text-trust">
          Log in
        </Link>
      </p>

    </main>
  );
}
