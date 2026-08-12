import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminEmail } from "@/utils/is-admin";
import { submitReview } from "./actions";
import { DeleteAccountSection } from "@/components/DeleteAccountSection";

function formatFee(cents: number) {
  return `₹${Math.round(cents / 100)}`;
}

function formatSlot(startIso: string | undefined) {
  if (!startIso) return "Time not set";
  const start = new Date(startIso);
  const dateFmt = new Intl.DateTimeFormat("en-IN", { weekday: "short", day: "numeric", month: "short" });
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; city?: string; error?: string }>;
}) {
  const { specialty, city, error } = await searchParams;
  const user = await requireRole("patient");
  const supabase = await createClient();

  // RLS (doctor_profiles_select) already limits this to verified +
  // subscribed doctors — there's no separate "is this doctor safe to
  // show" check needed here, the database enforces it.
  let query = supabase
    .from("doctor_profiles")
    .select("user_id, specialization, qualifications, city, bio, consultation_fee_cents")
    .order("created_at", { ascending: false });

  if (specialty) query = query.ilike("specialization", `%${specialty}%`);
  if (city) query = query.ilike("city", `%${city}%`);

  const { data: doctorProfiles } = await query;

  const doctorIds = (doctorProfiles ?? []).map((d) => d.user_id);
  const { data: profiles } =
    doctorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", doctorIds)
      : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const { data: consultations } = await supabase
    .from("consultations")
    .select("id, doctor_id, slot_id, status, is_free, fee_cents")
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false });

  const consultDoctorIds = [...new Set((consultations ?? []).map((c) => c.doctor_id))];
  const consultSlotIds = (consultations ?? []).map((c) => c.slot_id).filter((s): s is string => !!s);

  const { data: consultDoctors } =
    consultDoctorIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", consultDoctorIds)
      : { data: [] };
  const { data: consultSlots } =
    consultSlotIds.length > 0
      ? await supabase.from("availability_slots").select("id, start_time").in("id", consultSlotIds)
      : { data: [] };
  const { data: myReviews } = await supabase
    .from("reviews")
    .select("consultation_id")
    .eq("patient_id", user.id);

  const doctorNameById = new Map((consultDoctors ?? []).map((d) => [d.id, d.full_name]));
  const slotStartById = new Map((consultSlots ?? []).map((s) => [s.id, s.start_time]));
  const reviewedConsultIds = new Set((myReviews ?? []).map((r) => r.consultation_id));

  const upcoming = (consultations ?? []).filter((c) => c.status === "scheduled");
  const past = (consultations ?? []).filter((c) => c.status !== "scheduled");

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Find a doctor</h1>
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

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {(upcoming.length > 0 || past.length > 0) && (
        <section className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            My consultations
          </h2>
          <div className="mt-3 space-y-3">
            {upcoming.map((c) => (
              <div key={c.id} className="rounded-md border border-line px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {doctorNameById.get(c.doctor_id) || "Doctor"}
                    </p>
                    <p className="text-xs text-muted">
                      {formatSlot(slotStartById.get(c.slot_id ?? ""))} ·{" "}
                      {c.is_free ? "Free consultation" : `₹${Math.round(c.fee_cents / 100)}`}
                    </p>
                  </div>
                  <Link
                    href={`/consultation/${c.id}`}
                    className="rounded-md bg-trust px-3 py-1.5 text-xs font-medium text-white hover:bg-trust-dark"
                  >
                    Join call
                  </Link>
                </div>
              </div>
            ))}
            {past.map((c) =>
              c.status === "completed" && !reviewedConsultIds.has(c.id) ? (
                <div key={c.id} className="rounded-md border border-line px-4 py-3">
                  <p className="text-sm font-medium text-foreground">
                    {doctorNameById.get(c.doctor_id) || "Doctor"}
                  </p>
                  <p className="text-xs text-muted">Completed · leave a review</p>
                  <form className="mt-3 flex flex-wrap items-end gap-3">
                    <input type="hidden" name="consultationId" value={c.id} />
                    <div>
                      <label className="text-xs text-muted">Rating</label>
                      <select
                        name="rating"
                        required
                        className="mt-1 block rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-foreground"
                      >
                        {[5, 4, 3, 2, 1].map((n) => (
                          <option key={n} value={n}>
                            {n} star{n === 1 ? "" : "s"}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      name="comment"
                      placeholder="Optional comment"
                      className="min-w-[200px] flex-1 rounded-md border border-line bg-surface px-3 py-1.5 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
                    />
                    <button
                      formAction={submitReview}
                      className="rounded-md bg-trust px-3 py-1.5 text-xs font-medium text-white hover:bg-trust-dark"
                    >
                      Submit review
                    </button>
                  </form>
                </div>
              ) : (
                <div
                  key={c.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-4 py-3 text-sm"
                >
                  <span className="text-foreground">{doctorNameById.get(c.doctor_id) || "Doctor"}</span>
                  <span className="text-xs capitalize text-muted">
                    {c.status === "completed" ? "Reviewed" : c.status}
                  </span>
                </div>
              ),
            )}
          </div>
        </section>
      )}

      <h2 className="mt-10 text-sm font-semibold uppercase tracking-wide text-muted">
        Search doctors
      </h2>
      <form className="mt-3 flex flex-wrap gap-3">
        <input
          type="text"
          name="specialty"
          placeholder="Specialty (e.g. Cardiology)"
          defaultValue={specialty ?? ""}
          className="min-w-[200px] flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
        />
        <input
          type="text"
          name="city"
          placeholder="City"
          defaultValue={city ?? ""}
          className="min-w-[160px] flex-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
        />
        <button
          type="submit"
          className="rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
        >
          Search
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {(doctorProfiles ?? []).length === 0 && (
          <p className="text-sm text-muted">
            No doctors match yet — try a different specialty or city, or check back soon.
          </p>
        )}
        {(doctorProfiles ?? []).map((d) => (
          <Link
            key={d.user_id}
            href={`/doctor/${d.user_id}`}
            className="block rounded-lg border border-line bg-surface p-5 transition-colors hover:border-trust"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium text-foreground">
                {nameById.get(d.user_id) || "Dr. " + d.specialization}
              </p>
              <p className="text-sm text-muted">{formatFee(d.consultation_fee_cents)} / consult</p>
            </div>
            <p className="mt-1 text-sm text-muted">
              {d.specialization} · {d.qualifications} · {d.city}
            </p>
            {d.bio && <p className="mt-2 line-clamp-2 text-sm text-foreground/80">{d.bio}</p>}
          </Link>
        ))}
      </div>

      <form className="mt-10">
        <button
          formAction={logout}
          className="rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
        >
          Log out
        </button>
      </form>

      <DeleteAccountSection />
    </main>
  );
}
