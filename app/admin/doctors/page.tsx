import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/utils/is-admin";
import { reviewDoctorSubmission } from "./actions";
import { AppHeader } from "@/components/ui/AppHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Alert } from "@/components/ui/Alert";
import { link, listRow } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";

async function withSignedDocUrl(
  admin: ReturnType<typeof createAdminClient>,
  path: string | null,
) {
  if (!path) return null;
  const { data } = await admin.storage
    .from("doctor-documents")
    .createSignedUrl(path, 60 * 10); // 10 minutes
  return data?.signedUrl ?? null;
}

export default async function AdminDoctorsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminEmail(user.email)) {
    redirect("/login");
  }

  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("doctor_profiles")
    .select("user_id, specialization, qualifications, license_number, city, license_document_path, created_at")
    .eq("verification_status", "pending")
    .order("created_at", { ascending: true });

  const { data: decided } = await admin
    .from("doctor_profiles")
    .select("user_id, specialization, city, verification_status")
    .neq("verification_status", "pending")
    .order("created_at", { ascending: false })
    .limit(20);

  const pendingWithUrls = await Promise.all(
    (pending ?? []).map(async (d) => ({
      ...d,
      docUrl: await withSignedDocUrl(admin, d.license_document_path),
    })),
  );

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppHeader title="Doctor verification queue" description={`Signed in as admin: ${user.email}`} />

      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      <section className="mt-10">
        <SectionHeading>Pending ({pendingWithUrls.length})</SectionHeading>

        {pendingWithUrls.length === 0 && (
          <p className="mt-4 text-sm text-muted">Nothing waiting for review.</p>
        )}

        <div className="mt-4 space-y-4">
          {pendingWithUrls.map((d) => (
            <div key={d.user_id} className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.specialization}</p>
                  <p className="text-xs text-muted">{d.qualifications} · {d.city}</p>
                </div>
                <p className="font-mono text-xs text-muted">{d.user_id}</p>
              </div>
              <p className="mt-2 text-sm text-foreground/85">
                License/registration number: <span className="font-medium">{d.license_number}</span>
              </p>
              {d.docUrl ? (
                <a href={d.docUrl} target="_blank" rel="noreferrer" className={`mt-1 inline-block text-sm ${link}`}>
                  View submitted document
                </a>
              ) : (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">No document uploaded</p>
              )}

              <div className="mt-4 flex gap-3">
                <form>
                  <input type="hidden" name="doctorId" value={d.user_id} />
                  <input type="hidden" name="decision" value="verified" />
                  <SubmitButton formAction={reviewDoctorSubmission} size="sm" pendingText="Approving…">
                    Approve
                  </SubmitButton>
                </form>
                <form>
                  <input type="hidden" name="doctorId" value={d.user_id} />
                  <input type="hidden" name="decision" value="rejected" />
                  <button
                    formAction={reviewDoctorSubmission}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-red-300 px-3.5 py-1.5 text-xs font-medium text-red-700 transition-all duration-150 hover:-translate-y-0.5 hover:bg-red-50 hover:shadow-md active:scale-[0.97] dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    Reject
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <SectionHeading>Recently decided</SectionHeading>
        <div className="mt-4 space-y-2">
          {(decided ?? []).map((d) => (
            <div key={d.user_id} className={listRow}>
              <span className="text-sm text-foreground">{d.specialization} · {d.city}</span>
              <span className="text-xs capitalize text-muted">{d.verification_status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
