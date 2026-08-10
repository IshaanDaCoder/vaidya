import Link from "next/link";
import { login } from "../actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; checkEmail?: string }>;
}) {
  const { error, checkEmail } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="text-lg font-semibold text-teal-700">
        Vaidya
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Welcome back</h1>

      {checkEmail && (
        <p className="mt-6 rounded-md border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-800">
          Check your email to confirm your account before logging in.
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="text-xs text-gray-600">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>
        <div>
          <label htmlFor="password" className="text-xs text-gray-600">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <button
          formAction={login}
          className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Log in
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-teal-700 underline underline-offset-4">
          Sign up
        </Link>
      </p>
    </main>
  );
}
