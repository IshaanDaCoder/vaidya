import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  addAvailabilitySlot,
  generateSlotsFromHours,
  removeAvailabilitySlot,
  saveWeeklyHours,
} from "./actions";

const DAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatSlot(startIso: string, endIso: string) {
  const start = new Date(startIso);
  const end = new Date(endIso);
  const dateFmt = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  const timeFmt = new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  });
  return `${dateFmt.format(start)} · ${timeFmt.format(start)}–${timeFmt.format(end)}`;
}

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; savedHours?: string; generated?: string }>;
}) {
  const { error, savedHours, generated } = await searchParams;
  const user = await requireRole("doctor");
  const supabase = await createClient();

  // doctor_weekly_hours and availability_slots both have a foreign key
  // to doctor_profiles(user_id) — a doctor who hasn't completed
  // onboarding yet has no row there, so saving hours or adding a slot
  // would otherwise fail with a raw Postgres foreign-key error instead
  // of a page that explains what to do first.
  const { data: doctorProfile } = await supabase
    .from("doctor_profiles")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!doctorProfile) {
    return (
      <main className="mx-auto max-w-2xl px-6 py-16">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-foreground">Availability</h1>
          <ThemeToggle />
        </div>
        <div className="mt-6 rounded-md border border-line bg-surface px-4 py-4">
          <p className="text-sm text-foreground/85">
            Complete your doctor profile before setting your availability.
          </p>
          <Link
            href="/doctor/onboarding"
            className="mt-3 inline-block rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
          >
            Complete your profile
          </Link>
        </div>
      </main>
    );
  }

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time, end_time, is_booked")
    .eq("doctor_id", user.id)
    .gte("end_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  const { data: weeklyHours } = await supabase
    .from("doctor_weekly_hours")
    .select("day_of_week, start_time, end_time, slot_duration_minutes, is_active")
    .eq("doctor_id", user.id);

  const hoursByDay = new Map((weeklyHours ?? []).map((h) => [h.day_of_week, h]));
  const sharedDuration = weeklyHours?.[0]?.slot_duration_minutes ?? 30;

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Availability</h1>
        <ThemeToggle />
      </div>
      <p className="mt-2 text-sm text-muted">
        Set your recurring hours of operation, generate bookable slots from them, or add
        one-off slots by hand.
      </p>
      <Link
        href="/doctor/dashboard"
        className="mt-2 inline-block text-sm text-trust-dark underline underline-offset-4 dark:text-trust"
      >
        Back to dashboard
      </Link>

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {savedHours && (
        <p className="mt-6 rounded-md border border-trust/30 bg-trust/10 px-4 py-3 text-sm text-trust-dark dark:text-trust">
          Hours of operation saved.
        </p>
      )}
      {generated !== undefined && (
        <p className="mt-6 rounded-md border border-trust/30 bg-trust/10 px-4 py-3 text-sm text-trust-dark dark:text-trust">
          {generated === "0"
            ? "No new slots to generate — everything in the next 3 weeks already exists."
            : `Generated ${generated} new slot${generated === "1" ? "" : "s"} for the next 3 weeks.`}
        </p>
      )}

      {/* Hours of operation */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Hours of operation
        </h2>
        <p className="mt-1 text-sm text-muted">
          Turn on the days you work, set your hours, and pick a consultation length. Times
          are in IST.
        </p>

        <form className="mt-4 space-y-4">
          <div className="flex items-end gap-3">
            <div>
              <label htmlFor="slotDurationMinutes" className="text-xs text-muted">
                Consultation length (minutes)
              </label>
              <input
                id="slotDurationMinutes"
                name="slotDurationMinutes"
                type="number"
                min="5"
                max="240"
                step="5"
                defaultValue={sharedDuration}
                required
                className="mt-1 w-32 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
              />
            </div>
          </div>

          <div className="space-y-2">
            {DAY_LABELS.map((label, i) => {
              const existing = hoursByDay.get(i);
              return (
                <div
                  key={i}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-line px-4 py-3"
                >
                  <label className="flex w-28 shrink-0 items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      name={`active_${i}`}
                      defaultChecked={existing?.is_active ?? false}
                      className="h-4 w-4"
                    />
                    {label}
                  </label>
                  <input
                    type="time"
                    name={`start_${i}`}
                    defaultValue={existing?.start_time?.slice(0, 5) ?? "09:00"}
                    className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
                  />
                  <span className="text-sm text-muted">to</span>
                  <input
                    type="time"
                    name={`end_${i}`}
                    defaultValue={existing?.end_time?.slice(0, 5) ?? "17:00"}
                    className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
                  />
                </div>
              );
            })}
          </div>

          <button
            formAction={saveWeeklyHours}
            className="rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
          >
            Save hours
          </button>
        </form>

        <form className="mt-3">
          <button
            formAction={generateSlotsFromHours}
            className="rounded-md border border-line px-4 py-2 text-sm font-medium text-foreground hover:bg-surface"
          >
            Generate slots for the next 3 weeks
          </button>
          <p className="mt-1 text-xs text-muted">
            Fills in bookable slots from your saved hours. Safe to click again later —
            it only adds what&apos;s missing, never duplicates.
          </p>
        </form>
      </section>

      {/* One-off slot */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Add a one-off slot
        </h2>
        <form className="mt-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="startTime" className="text-xs text-muted">
              Start
            </label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              required
              className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            />
          </div>
          <div>
            <label htmlFor="endTime" className="text-xs text-muted">
              End
            </label>
            <input
              id="endTime"
              name="endTime"
              type="datetime-local"
              required
              className="mt-1 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            />
          </div>
          <button
            formAction={addAvailabilitySlot}
            className="rounded-md bg-trust px-4 py-2.5 text-sm font-medium text-white hover:bg-trust-dark"
          >
            Add slot
          </button>
        </form>
      </section>

      {/* Upcoming slots */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Upcoming slots ({(slots ?? []).length})
        </h2>
        <div className="mt-3 space-y-2">
          {(slots ?? []).length === 0 && (
            <p className="text-sm text-muted">No upcoming slots yet.</p>
          )}
          {(slots ?? []).map((s) => (
            <div
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line px-4 py-3 text-sm"
            >
              <span className="text-foreground">{formatSlot(s.start_time, s.end_time)}</span>
              {s.is_booked ? (
                <span className="text-xs font-medium text-trust-dark dark:text-trust">Booked</span>
              ) : (
                <form>
                  <input type="hidden" name="slotId" value={s.id} />
                  <button
                    formAction={removeAvailabilitySlot}
                    className="text-xs font-medium text-red-700 hover:underline dark:text-red-300"
                  >
                    Remove
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
