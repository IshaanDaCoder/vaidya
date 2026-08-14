import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BookSlotButton } from "./BookSlotButton";

function formatFee(cents: number) {
  return `₹${Math.round(cents / 100)}`;
}

function formatSlot(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateFmt = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

export default async function DoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("patient");
  const supabase = await createClient();

  // RLS (doctor_profiles_select) only returns this row if the doctor is
  // verified + subscribed — an unlisted or made-up id just comes back
  // empty, which we treat as a normal 404 rather than a special case.
  const { data: doctor } = await supabase
    .from("doctor_profiles")
    .select(
      "user_id, specialization, qualifications, city, bio, consultation_fee_cents, license_number",
    )
    .eq("user_id", id)
    .maybeSingle();

  if (!doctor) notFound();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", id)
    .maybeSingle();

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time, end_time")
    .eq("doctor_id", id)
    .eq("is_booked", false)
    .gte("start_time", new Date().toISOString())
    .order("start_time", { ascending: true })
    .limit(10);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("doctor_id", id)
    .order("created_at", { ascending: false });

  const averageRating =
    reviews && reviews.length > 0
      ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <Link href="/search" className="text-sm text-trust-dark underline underline-offset-4 dark:text-trust">
          ← Back to search
        </Link>
        <ThemeToggle />
      </div>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">
            {profile?.full_name || `Dr. ${doctor.specialization}`}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {doctor.specialization} · {doctor.qualifications}
          </p>
          <p className="text-sm text-muted">{doctor.city}</p>
          <p className="mt-1 text-xs text-muted">
            Registration no. {doctor.license_number}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-medium text-foreground">{formatFee(doctor.consultation_fee_cents)}</p>
          <p className="text-xs text-muted">per consultation</p>
        </div>
      </div>

      {averageRating && (
        <p className="mt-3 text-sm text-foreground">
          <span className="font-medium">★ {averageRating}</span>{" "}
          <span className="text-muted">({reviews!.length} review{reviews!.length === 1 ? "" : "s"})</span>
        </p>
      )}

      {doctor.bio && <p className="mt-6 text-sm leading-relaxed text-foreground/85">{doctor.bio}</p>}

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Available slots
        </h2>
        <div className="mt-3 space-y-2">
          {(slots ?? []).length === 0 && (
            <p className="text-sm text-muted">No open slots right now — check back soon.</p>
          )}
          {(slots ?? []).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-4 py-3 text-sm"
            >
              <span className="text-foreground">{formatSlot(s.start_time, s.end_time)}</span>
              <BookSlotButton
                doctorId={id}
                slotId={s.id}
                doctorName={profile?.full_name || `Dr. ${doctor.specialization}`}
                startTime={s.start_time}
                endTime={s.end_time}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">Reviews</h2>
        <div className="mt-3 space-y-3">
          {(reviews ?? []).length === 0 && (
            <p className="text-sm text-muted">No reviews yet.</p>
          )}
          {(reviews ?? []).map((r, i) => (
            <div key={i} className="rounded-md border border-line px-4 py-3">
              <p className="text-sm font-medium text-foreground">★ {r.rating}</p>
              {r.comment && <p className="mt-1 text-sm text-foreground/85">{r.comment}</p>}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
