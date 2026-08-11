import { chooseRole } from "./actions";

export default async function ChooseRolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

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
        <div className="grid grid-cols-2 gap-3">
          <button
            formAction={chooseRole}
            name="role"
            value="patient"
            className="rounded-md border border-line px-4 py-3 text-sm font-medium text-foreground hover:border-trust hover:bg-trust/10 hover:text-trust-dark dark:hover:text-trust"
          >
            Patient
          </button>
          <button
            formAction={chooseRole}
            name="role"
            value="doctor"
            className="rounded-md border border-line px-4 py-3 text-sm font-medium text-foreground hover:border-trust hover:bg-trust/10 hover:text-trust-dark dark:hover:text-trust"
          >
            Doctor
          </button>
        </div>

        <label className="flex items-start gap-2 text-xs text-muted">
          <input type="checkbox" name="consent" required className="mt-0.5" />
          I agree to Vaidya processing my personal data to provide this service,
          in line with the privacy policy.
        </label>
      </form>
    </main>
  );
}
