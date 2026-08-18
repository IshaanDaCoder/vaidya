import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { isAdminEmail } from "@/utils/is-admin";
import { markConsultationCompleted } from "@/app/consultation/[id]/actions";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";
import { AppHeader } from "@/components/ui/AppHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants, link, listRow } from "@/components/ui/styles";

const statusCopy: Record<
  string,
  { label: string; tone: "success" | "warning" | "error"; note: string }
> = {
  pending: {
    label: "Pending review",
    tone: "warning",
    note: "An admin is reviewing your license details. You'll be listed to patients once approved.",
  },
  verified: {
    label: "Verified",
    tone: "success",
    note: "You're verified. You'll also need an active subscription (Day 7) to appear in patient search.",
  },
  rejected: {
    label: "Rejected",
    tone: "error",
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

export default async function DoctorDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
      <AppHeader
        title="Doctor dashboard"
        description={`Signed in as ${user.email}`}
        actions={
          isAdminEmail(user.email) ? (
            <Link href="/admin/doctors" className={`text-sm ${link}`}>
              Admin
            </Link>
          ) : undefined
        }
      />

      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {!profile ? (
        <div className="mt-6 rounded-2xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-sm text-foreground/85">
            You haven&apos;t submitted your profile for verification yet.
          </p>
          <Link href="/doctor/onboarding" className={`mt-3 inline-flex ${buttonVariants("primary", "sm")}`}>
            Complete your profile
          </Link>
        </div>
      ) : (
        <div className="mt-6">
          <Alert tone={statusCopy[profile.verification_status].tone}>
            <Badge tone={statusCopy[profile.verification_status].tone}>
              {statusCopy[profile.verification_status].label}
            </Badge>
            <p className="mt-2">{statusCopy[profile.verification_status].note}</p>
            <Link href="/doctor/onboarding" className="mt-2 inline-block text-sm font-medium underline underline-offset-4">
              {profile.verification_status === "rejected" ? "Update and resubmit" : "Edit profile"}
            </Link>
          </Alert>
        </div>
      )}

      <Link href="/doctor/availability" className={`mt-6 inline-flex ${buttonVariants("secondary")}`}>
        Manage availability
      </Link>

      <section className="mt-10">
        <SectionHeading>Upcoming consultations ({upcoming.length})</SectionHeading>
        <div className="mt-4 space-y-2.5">
          {upcoming.length === 0 && <p className="text-sm text-muted">Nothing scheduled yet.</p>}
          {upcoming.map((c) => (
            <div key={c.id} className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
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
                  <Link href={`/consultation/${c.id}`} className={buttonVariants("primary", "sm")}>
                    Join call
                  </Link>
                  <form>
                    <input type="hidden" name="consultationId" value={c.id} />
                    <button formAction={markConsultationCompleted} className={`text-xs ${link}`}>
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
          <SectionHeading>Past</SectionHeading>
          <div className="mt-4 space-y-2">
            {past.map((c) => (
              <div key={c.id} className={listRow}>
                <span className="text-sm text-foreground">{nameById.get(c.patient_id) || "Patient"}</span>
                <span className="text-xs capitalize text-muted">{c.status}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <form className="mt-12">
        <button formAction={logout} className={buttonVariants("secondary")}>
          Log out
        </button>
      </form>

      <DeleteAccountSection />
    </main>
  );
}
