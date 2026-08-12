import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { addAvailabilitySlot, removeAvailabilitySlot } from "./actions";

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

export default async function AvailabilityPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireRole("doctor");
  const supabase = await createClient();

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, start_time, end_time, is_booked")
    .eq("doctor_id", user.id)
    .gte("end_time", new Date().toISOString())
    .order("start_time", { ascending: true });

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Availability</h1>
        <ThemeToggle />
      </div>
      <p className="mt-2 text-sm text-muted">
        Add slots patients can book you for. Booked slots can&apos;t be removed here.
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

      <form className="mt-8 flex flex-wrap items-end gap-3">
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

      <div className="mt-8 space-y-2">
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
    </main>
  );
}
