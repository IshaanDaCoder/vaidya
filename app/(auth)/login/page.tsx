import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";
import { login, signInWithGoogle, signInWithMicrosoft } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/" className="font-serif text-lg font-semibold text-trust-dark">
          Vaidya
        </Link>
        <ThemeToggle />
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-foreground">Welcome back</h1>

      {checkEmail && (
        <p className="mt-6 rounded-md border border-trust/30 bg-trust/10 px-4 py-3 text-sm text-trust-dark dark:text-trust">
          Check your email to confirm your account before logging in.
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-5">
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
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
          />
        </div>

        <button
          formAction={login}
          className="w-full rounded-md bg-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-trust-dark"
        >
          Log in
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
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-trust-dark underline underline-offset-4 dark:text-trust">
          Sign up
        </Link>
      </p>

      <p className="mt-8 text-center text-xs text-muted">
        While logging in, you are consenting to the{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
          Terms and Conditions
        </Link>
        .
      </p>
    </main>
  );
}
