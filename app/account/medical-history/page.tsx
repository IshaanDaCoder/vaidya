import Link from "next/link";
import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { ThemeToggle } from "@/components/ThemeToggle";
import { updateMedicalHistory, updatePatientProfile } from "./actions";

function calculateAge(dateOfBirth: string | null) {
  if (!dateOfBirth) return null;
  const dob = new Date(dateOfBirth);
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const hasHadBirthdayThisYear =
    now.getMonth() > dob.getMonth() ||
    (now.getMonth() === dob.getMonth() && now.getDate() >= dob.getDate());
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
}

export default async function MedicalHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; saved?: string }>;
}) {
  const { error, saved } = await searchParams;
  const user = await requireRole("patient");
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("patient_profiles")
    .select("date_of_birth, gender, city")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: history } = await supabase
    .from("patient_medical_history")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  const age = calculateAge(profile?.date_of_birth ?? null);

  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Medical history</h1>
        <ThemeToggle />
      </div>
      <p className="mt-2 text-sm text-muted">
        This is shared with a doctor only once you&apos;ve booked a consultation with them —
        never with the full doctor directory.
      </p>
      <Link
        href="/search"
        className="mt-2 inline-block text-sm text-trust-dark underline underline-offset-4 dark:text-trust"
      >
        Back to search
      </Link>

      {saved && (
        <p className="mt-6 rounded-md border border-trust/30 bg-trust/10 px-4 py-3 text-sm text-trust-dark dark:text-trust">
          Saved.
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {/* Basic info: age, gender, city */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Basic information
        </h2>
        <form className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="dateOfBirth" className="text-xs text-muted">
              Date of birth {age !== null && <span className="text-foreground/70">(Age {age})</span>}
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={profile?.date_of_birth ?? ""}
              required
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            />
          </div>
          <div>
            <label htmlFor="gender" className="text-xs text-muted">
              Gender
            </label>
            <select
              id="gender"
              name="gender"
              defaultValue={profile?.gender ?? ""}
              required
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            >
              <option value="" disabled>
                Select
              </option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
              <option value="prefer_not_to_say">Prefer not to say</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="city" className="text-xs text-muted">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              defaultValue={profile?.city ?? ""}
              required
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              formAction={updatePatientProfile}
              className="rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
            >
              Save basic information
            </button>
          </div>
        </form>
      </section>

      {/* Height, weight, BMI */}
      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Height &amp; weight
        </h2>
        <form className="mt-4 flex flex-wrap items-end gap-4">
          <div>
            <label htmlFor="heightCm" className="text-xs text-muted">
              Height (cm)
            </label>
            <input
              id="heightCm"
              name="heightCm"
              type="number"
              step="0.1"
              min="0"
              defaultValue={history?.height_cm ?? ""}
              className="mt-1 w-32 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            />
          </div>
          <div>
            <label htmlFor="weightKg" className="text-xs text-muted">
              Weight (kg)
            </label>
            <input
              id="weightKg"
              name="weightKg"
              type="number"
              step="0.1"
              min="0"
              defaultValue={history?.weight_kg ?? ""}
              className="mt-1 w-32 rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
            />
          </div>
          {history?.bmi != null && (
            <div className="rounded-md border border-line bg-surface px-4 py-2">
              <span className="text-xs text-muted">BMI</span>
              <p className="text-sm font-medium text-foreground">{history.bmi}</p>
            </div>
          )}
          {/* medications etc. below share this same form */}
          <div className="w-full space-y-4">
            <div>
              <label htmlFor="medications" className="text-xs text-muted">
                Current medications
              </label>
              <textarea
                id="medications"
                name="medications"
                rows={2}
                placeholder="e.g. Metformin 500mg twice daily"
                defaultValue={history?.medications ?? ""}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
              />
            </div>
            <div>
              <label htmlFor="pastMedicalHistory" className="text-xs text-muted">
                Past medical history
              </label>
              <textarea
                id="pastMedicalHistory"
                name="pastMedicalHistory"
                rows={2}
                placeholder="e.g. Type 2 diabetes, diagnosed 2019"
                defaultValue={history?.past_medical_history ?? ""}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
              />
            </div>
            <div>
              <label htmlFor="pastSurgicalHistory" className="text-xs text-muted">
                Past surgical history
              </label>
              <textarea
                id="pastSurgicalHistory"
                name="pastSurgicalHistory"
                rows={2}
                placeholder="e.g. Appendectomy, 2015"
                defaultValue={history?.past_surgical_history ?? ""}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
              />
            </div>
            <div>
              <label htmlFor="familyHistory" className="text-xs text-muted">
                Family history
              </label>
              <textarea
                id="familyHistory"
                name="familyHistory"
                rows={2}
                placeholder="e.g. Father: hypertension, Mother: none known"
                defaultValue={history?.family_history ?? ""}
                className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="smokingStatus" className="text-xs text-muted">
                  Smoking
                </label>
                <select
                  id="smokingStatus"
                  name="smokingStatus"
                  defaultValue={history?.smoking_status ?? ""}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
                >
                  <option value="">Prefer not to say</option>
                  <option value="never">Never smoked</option>
                  <option value="former">Former smoker</option>
                  <option value="current">Current smoker</option>
                </select>
              </div>
              <div>
                <label htmlFor="alcoholUse" className="text-xs text-muted">
                  Alcohol
                </label>
                <select
                  id="alcoholUse"
                  name="alcoholUse"
                  defaultValue={history?.alcohol_use ?? ""}
                  className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-trust focus:ring-1 focus:ring-trust"
                >
                  <option value="">Prefer not to say</option>
                  <option value="never">Never</option>
                  <option value="occasional">Occasional</option>
                  <option value="regular">Regular</option>
                </select>
              </div>
            </div>

            <button
              formAction={updateMedicalHistory}
              className="rounded-md bg-trust px-4 py-2 text-sm font-medium text-white hover:bg-trust-dark"
            >
              Save medical history
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
