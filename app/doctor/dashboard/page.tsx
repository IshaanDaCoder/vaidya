import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminEmail } from "@/utils/is-admin";

const statusCopy: Record<string, { label: string; tone: string; note: string }> = {
  pending: {
    label: "Pending review",
    tone: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-300",
    note: "An admin is reviewing your license details. You'll be listed to patients once approved.",
  },
  verified: {
    label: "Verified",
    tone: "border-trust/30 bg-trust/10 text-trust-dark dark:text-trust",
    note: "You're verified. You'll also need an active subscription (Day 7) to appear in patient search.",
  },
  rejected: {
    label: "Rejected",
    tone: "border-red-300 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300",
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Doctor dashboard</h1>
        <div className="flex items-center gap-4">
          {isAdminEmail(user.email) && (
            <Link
              href="/admin/doctors"
              className="text-sm font-medium text-trust-dark underline underline-offset-4 dark:text-trust"
            >
              Admin
            </Link>
          )}
          <ThemeToggle />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">Signed in as {user.email}</p>

      {!profile ? (
        <div className="mt-6 rounded-md border border-line bg-surface px-4 py-4">
          <p className="text-sm text-foreground/85">
            You haven&apos;t submitted your profile for verification yet.
          </p>
          <Link
            href="/doctor/onboarding"
            className="mt-3 inline-block rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
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

      <Link
        href="/doctor/availability"
        className="mt-6 inline-block rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
      >
        Manage availability
      </Link>
      <p className="mt-6 text-sm text-muted">
        Today&apos;s consultations land here on Days 9–10.
      </p>
      <form className="mt-8">
        <button
          formAction={logout}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Log out
        </button>
      </form>
    </main>
  );
}
