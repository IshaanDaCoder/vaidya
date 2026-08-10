import { chooseRole } from "./actions";

export default async function ChooseRolePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 py-16">
      <h1 className="text-2xl font-semibold">One more thing</h1>
      <p className="mt-2 text-sm text-gray-600">
        How will you use Vaidya? This can&apos;t be changed later.
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="mt-8 grid grid-cols-2 gap-3">
        <button
          formAction={chooseRole}
          name="role"
          value="patient"
          className="rounded-md border border-gray-300 px-4 py-3 text-sm font-medium hover:border-teal-600 hover:bg-teal-50 hover:text-teal-800"
        >
          Patient
        </button>
        <button
          formAction={chooseRole}
          name="role"
          value="doctor"
          className="rounded-md border border-gray-300 px-4 py-3 text-sm font-medium hover:border-teal-600 hover:bg-teal-50 hover:text-teal-800"
        >
          Doctor
        </button>
      </form>
    </main>
  );
}
