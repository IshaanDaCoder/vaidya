import { requireRole } from "@/utils/require-role";
import { logout } from "@/app/(auth)/actions";

export default async function DoctorDashboardPage() {
  const user = await requireRole("doctor");

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Doctor dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>
      <p className="mt-6 text-sm text-gray-600">
        Onboarding (specialization, license, availability) and today&apos;s
        consultations land here on Days 5–10.
      </p>
      <form className="mt-8">
        <button
          formAction={logout}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
