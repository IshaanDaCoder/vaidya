import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { updateMedicalHistory, updatePatientProfile } from "./actions";
import { AppHeader } from "@/components/ui/AppHeader";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Alert } from "@/components/ui/Alert";
import { card, input, label } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";

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
      <AppHeader
        title="Medical history"
        description="Shared with a doctor only once you've booked a consultation with them — never with the full doctor directory."
        backHref="/search"
        backLabel="Back to search"
      />

      {saved && (
        <div className="mt-6">
          <Alert tone="success">Saved.</Alert>
        </div>
      )}
      {error && (
        <div className="mt-6">
          <Alert tone="error">{error}</Alert>
        </div>
      )}

      {/* Basic info: age, gender, city */}
      <section className="mt-8">
        <SectionHeading>Basic information</SectionHeading>
        <form className={`mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 ${card}`}>
          <div>
            <label htmlFor="dateOfBirth" className={label}>
              Date of birth {age !== null && <span className="text-foreground/70">(Age {age})</span>}
            </label>
            <input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              defaultValue={profile?.date_of_birth ?? ""}
              required
              className={input}
            />
          </div>
          <div>
            <label htmlFor="gender" className={label}>
              Gender
            </label>
            <select id="gender" name="gender" defaultValue={profile?.gender ?? ""} required className={input}>
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
            <label htmlFor="city" className={label}>
              City
            </label>
            <input id="city" name="city" type="text" defaultValue={profile?.city ?? ""} required className={input} />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton formAction={updatePatientProfile} pendingText="Saving…">
              Save basic information
            </SubmitButton>
          </div>
        </form>
      </section>

      {/* Height, weight, BMI */}
      <section className="mt-10">
        <SectionHeading>Height &amp; weight</SectionHeading>
        <form className={`mt-4 space-y-5 ${card}`}>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label htmlFor="heightCm" className={label}>
                Height (cm)
              </label>
              <input
                id="heightCm"
                name="heightCm"
                type="number"
                step="0.1"
                min="0"
                defaultValue={history?.height_cm ?? ""}
                className={`${input} w-32`}
              />
            </div>
            <div>
              <label htmlFor="weightKg" className={label}>
                Weight (kg)
              </label>
              <input
                id="weightKg"
                name="weightKg"
                type="number"
                step="0.1"
                min="0"
                defaultValue={history?.weight_kg ?? ""}
                className={`${input} w-32`}
              />
            </div>
            {history?.bmi != null && (
              <div className="rounded-lg border border-trust/25 bg-trust/10 px-4 py-2.5">
                <span className="text-xs text-muted">BMI</span>
                <p className="text-sm font-medium tabular-nums text-trust-dark dark:text-trust">
                  {history.bmi}
                </p>
              </div>
            )}
          </div>

          <div>
            <label htmlFor="medications" className={label}>
              Current medications
            </label>
            <textarea
              id="medications"
              name="medications"
              rows={2}
              placeholder="e.g. Metformin 500mg twice daily"
              defaultValue={history?.medications ?? ""}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="pastMedicalHistory" className={label}>
              Past medical history
            </label>
            <textarea
              id="pastMedicalHistory"
              name="pastMedicalHistory"
              rows={2}
              placeholder="e.g. Type 2 diabetes, diagnosed 2019"
              defaultValue={history?.past_medical_history ?? ""}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="pastSurgicalHistory" className={label}>
              Past surgical history
            </label>
            <textarea
              id="pastSurgicalHistory"
              name="pastSurgicalHistory"
              rows={2}
              placeholder="e.g. Appendectomy, 2015"
              defaultValue={history?.past_surgical_history ?? ""}
              className={input}
            />
          </div>
          <div>
            <label htmlFor="familyHistory" className={label}>
              Family history
            </label>
            <textarea
              id="familyHistory"
              name="familyHistory"
              rows={2}
              placeholder="e.g. Father: hypertension, Mother: none known"
              defaultValue={history?.family_history ?? ""}
              className={input}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="smokingStatus" className={label}>
                Smoking
              </label>
              <select
                id="smokingStatus"
                name="smokingStatus"
                defaultValue={history?.smoking_status ?? ""}
                className={input}
              >
                <option value="">Prefer not to say</option>
                <option value="never">Never smoked</option>
                <option value="former">Former smoker</option>
                <option value="current">Current smoker</option>
              </select>
            </div>
            <div>
              <label htmlFor="alcoholUse" className={label}>
                Alcohol
              </label>
              <select id="alcoholUse" name="alcoholUse" defaultValue={history?.alcohol_use ?? ""} className={input}>
                <option value="">Prefer not to say</option>
                <option value="never">Never</option>
                <option value="occasional">Occasional</option>
                <option value="regular">Regular</option>
              </select>
            </div>
          </div>

          <SubmitButton formAction={updateMedicalHistory} pendingText="Saving…">
            Save medical history
          </SubmitButton>
        </form>
      </section>
    </main>
  );
}
