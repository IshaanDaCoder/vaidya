import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { isAdminEmail } from "@/utils/is-admin";
import { ThemeToggle } from "@/components/ThemeToggle";
import { reviewDoctorSubmission } from "./actions";

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Doctor verification queue</h1>
        <ThemeToggle />
      </div>
      <p className="mt-2 text-sm text-muted">
        Signed in as admin: {user.email}
      </p>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Pending ({pendingWithUrls.length})
        </h2>

        {pendingWithUrls.length === 0 && (
          <p className="mt-3 text-sm text-muted">Nothing waiting for review.</p>
        )}

        <div className="mt-4 space-y-4">
          {pendingWithUrls.map((d) => (
            <div key={d.user_id} className="rounded-md border border-line p-4">
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
                <a
                  href={d.docUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1 inline-block text-sm text-trust-dark dark:text-trust underline underline-offset-4"
                >
                  View submitted document
                </a>
              ) : (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">No document uploaded</p>
              )}

              <form className="mt-4 flex gap-3">
                <input type="hidden" name="doctorId" value={d.user_id} />
                <button
                  formAction={reviewDoctorSubmission}
                  name="decision"
                  value="verified"
                  className="rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
                >
                  Approve
                </button>
                <button
                  formAction={reviewDoctorSubmission}
                  name="decision"
                  value="rejected"
                  className="rounded-md border border-red-300 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                >
                  Reject
                </button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Recently decided
        </h2>
        <div className="mt-4 space-y-2">
          {(decided ?? []).map((d) => (
            <div
              key={d.user_id}
              className="flex items-center justify-between rounded-md border border-line px-4 py-2 text-sm"
            >
              <span className="text-foreground">{d.specialization} · {d.city}</span>
              <span className="capitalize text-muted">{d.verification_status}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
