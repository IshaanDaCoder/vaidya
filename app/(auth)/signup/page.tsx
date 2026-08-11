import Link from "next/link";
import { signInWithGoogle, signInWithMicrosoft, signup } from "../actions";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <Link href="/" className="text-lg font-semibold text-teal-700">
        Vaidya
      </Link>
      <h1 className="mt-6 text-2xl font-semibold">Create your account</h1>
      <p className="mt-2 text-sm text-gray-600">
        Choose how you&apos;ll use Vaidya. You can&apos;t change this after signing up.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-5">
        <fieldset className="grid grid-cols-2 gap-3">
          <legend className="sr-only">I am a...</legend>
          <label className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-sm font-medium has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-800">
            <input type="radio" name="role" value="patient" defaultChecked className="sr-only" />
            Patient
          </label>
          <label className="flex cursor-pointer items-center justify-center rounded-md border border-gray-300 px-4 py-3 text-sm font-medium has-[:checked]:border-teal-600 has-[:checked]:bg-teal-50 has-[:checked]:text-teal-800">
            <input type="radio" name="role" value="doctor" className="sr-only" />
            Doctor
          </label>
        </fieldset>

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
            minLength={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <label className="flex items-start gap-2 text-xs text-gray-600">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          I agree to Vaidya processing my personal data to provide this service,
          in line with the privacy policy.
        </label>

        <button
          formAction={signup}
          className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          Sign up
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2">
        <div className="text-center text-xs text-gray-400">Or continue with</div>
        <form>
          <button
            formAction={signInWithGoogle}
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Google
          </button>
        </form>
        <form>
          <button
            formAction={signInWithMicrosoft}
            className="w-full rounded-md border border-gray-300 px-4 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Microsoft
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-teal-700 underline underline-offset-4">
          Log in
        </Link>
      </p>

      <p className="mt-8 text-center text-xs text-gray-500">
        While signing up, you are consenting to the{" "}
        <Link href="/terms" className="underline underline-offset-4 hover:text-gray-700">
          Terms and Conditions
        </Link>
        .
      </p>
    </main>
  );
}
