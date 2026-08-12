import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/(auth)/actions";
import { ThemeToggle } from "@/components/ThemeToggle";
import { isAdminEmail } from "@/utils/is-admin";

function formatFee(cents: number) {
  return `₹${Math.round(cents / 100)}`;
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ specialty?: string; city?: string }>;
}) {
  const { specialty, city } = await searchParams;
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

  const userIds = (doctorProfiles ?? []).map((d) => d.user_id);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", userIds)
      : { data: [] };
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

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

      <form className="mt-8 flex flex-wrap gap-3">
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

      <div className="mt-8 space-y-3">
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
    </main>
  );
}
