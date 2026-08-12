import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminEmail } from "@/utils/is-admin";
import { markConsultationCompleted } from "@/app/consultation/[id]/actions";

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

function formatSlot(startIso: string | undefined) {
  if (!startIso) return "Time not set";
  const start = new Date(startIso);
  const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}`;
}

export default async function DoctorDashboardPage() {
  const user = await requireRole("doctor");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("doctor_profiles")
    .select("verification_status, specialization, city")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, patient_id, slot_id, status, is_free, fee_cents, created_at")
    .eq("doctor_id", user.id)
    .order("created_at", { ascending: false });

  const patientIds = [...new Set((consultations ?? []).map((c) => c.patient_id))];
  const slotIds = (consultations ?? []).map((c) => c.slot_id).filter((s): s is string => !!s);

  const { data: patients } =
    patientIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", patientIds)
      : { data: [] };
  const { data: slots } =
    slotIds.length > 0
      ? await supabase.from("availability_slots").select("id, start_time").in("id", slotIds)
      : { data: [] };

  const nameById = new Map((patients ?? []).map((p) => [p.id, p.full_name]));
  const startById = new Map((slots ?? []).map((s) => [s.id, s.start_time]));

  const upcoming = (consultations ?? []).filter((c) => c.status === "scheduled");
  const past = (consultations ?? []).filter((c) => c.status !== "scheduled");

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

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Upcoming consultations ({upcoming.length})
        </h2>
        <div className="mt-3 space-y-2">
          {upcoming.length === 0 && <p className="text-sm text-muted">Nothing scheduled yet.</p>}
          {upcoming.map((c) => (
            <div key={c.id} className="rounded-md border border-line px-4 py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {nameById.get(c.patient_id) || "Patient"}
                  </p>
                  <p className="text-xs text-muted">
                    {formatSlot(startById.get(c.slot_id ?? ""))} ·{" "}
                    {c.is_free ? "Free consultation" : `₹${Math.round(c.fee_cents / 100)}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/consultation/${c.id}`}
                    className="rounded-md bg-trust px-3 py-1.5 text-xs font-medium text-white hover:bg-trust-dark"
                  >
                    Join call
                  </Link>
                  <form>
                    <input type="hidden" name="consultationId" value={c.id} />
                    <button
                      formAction={markConsultationCompleted}
                      className="text-xs font-medium text-muted underline underline-offset-4 hover:text-foreground"
                    >
                      Mark completed
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {past.length > 0 && (
        <section className="mt-10">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Past</h2>
          <div className="mt-3 space-y-2">
            {past.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between rounded-md border border-line px-4 py-3 text-sm"
              >
                <span className="text-foreground">{nameById.get(c.patient_id) || "Patient"}</span>
                <span className="text-xs capitalize text-muted">{c.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <form className="mt-10">
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
