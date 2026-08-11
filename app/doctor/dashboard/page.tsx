import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/(auth)/actions";

const statusCopy: Record<string, { label: string; tone: string; note: string }> = {
  pending: {
    label: "Pending review",
    tone: "border-amber-300 bg-amber-50 text-amber-800",
    note: "An admin is reviewing your license details. You'll be listed to patients once approved.",
  },
  verified: {
    label: "Verified",
    tone: "border-teal-300 bg-teal-50 text-teal-800",
    note: "You're verified. You'll also need an active subscription (Day 7) to appear in patient search.",
  },
  rejected: {
    label: "Rejected",
    tone: "border-red-300 bg-red-50 text-red-800",
    note: "Your submission wasn't approved. Update your details below and resubmit.",
  },
};

export default async function DoctorDashboardPage() {
  const user = await requireRole("doctor");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("verification_status, specialization, city")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-2xl font-semibold">Doctor dashboard</h1>
      <p className="mt-2 text-sm text-gray-600">Signed in as {user.email}</p>

      {!profile ? (
        <div className="mt-6 rounded-md border border-gray-300 bg-gray-50 px-4 py-4">
          <p className="text-sm text-gray-700">
            You haven&apos;t submitted your profile for verification yet.
          </p>
          <Link
            href="/doctor/onboarding"
            className="mt-3 inline-block rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Complete your profile
          </Link>
        </div>
      ) : (
        <div className={`mt-6 rounded-md border px-4 py-4 ${statusCopy[profile.verification_status].tone}`}>
          <p className="text-sm font-medium capitalize">
            {statusCopy[profile.verification_status].label}
          </p>
          <p className="mt-1 text-sm">{statusCopy[profile.verification_status].note}</p>
          <Link
            href="/doctor/onboarding"
            className="mt-3 inline-block text-sm font-medium underline underline-offset-4"
          >
            {profile.verification_status === "rejected" ? "Update and resubmit" : "Edit profile"}
          </Link>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-600">
        Availability and today&apos;s consultations land here on Days 6–10.
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
