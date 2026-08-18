import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { submitDoctorProfile } from "./actions";
import { BrandHeader } from "@/components/ui/BrandHeader";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { heading, input, label } from "@/components/ui/styles";
import { SubmitButton } from "@/components/ui/SubmitButton";

export default async function DoctorOnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const user = await requireRole("doctor");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("doctor_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <main className="mx-auto max-w-lg px-6 py-16">
      <BrandHeader href="/doctor/dashboard" />

      <div className="mt-8 rounded-2xl border border-line bg-surface p-7 shadow-sm">
        <h1 className={heading("md")}>
          {existing ? "Update your profile" : "Complete your doctor profile"}
        </h1>
        <p className="mt-2 text-sm text-muted">
          This information is reviewed before your profile becomes visible to
          patients. You can&apos;t approve your own verification — an admin
          reviews every submission.
        </p>

        {existing && (
          <div className="mt-4">
            <Badge tone="neutral">Status: {existing.verification_status}</Badge>
          </div>
        )}

        {error && (
          <div className="mt-5">
            <Alert tone="error">{error}</Alert>
          </div>
        )}

        <form className="mt-6 space-y-4">
          <div>
            <label htmlFor="specialization" className={label}>
              Specialization
            </label>
            <input
              id="specialization"
              name="specialization"
              required
              defaultValue={existing?.specialization ?? ""}
              className={input}
            />
          </div>

          <div>
            <label htmlFor="qualifications" className={label}>
              Qualifications
            </label>
            <input
              id="qualifications"
              name="qualifications"
              required
              placeholder="MBBS, MD (General Medicine)"
              defaultValue={existing?.qualifications ?? ""}
              className={input}
            />
          </div>

          <div>
            <label htmlFor="licenseNumber" className={label}>
              Medical registration / license number
            </label>
            <input
              id="licenseNumber"
              name="licenseNumber"
              required
              defaultValue={existing?.license_number ?? ""}
              className={input}
            />
          </div>

          <div>
            <label htmlFor="licenseDocument" className={label}>
              Upload license / registration certificate
              {existing?.license_document_path && (
                <span className="ml-1 text-trust-dark dark:text-trust">(already on file — optional to replace)</span>
              )}
            </label>
            <input
              id="licenseDocument"
              name="licenseDocument"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              required={!existing?.license_document_path}
              className="mt-1.5 w-full text-sm text-foreground file:mr-3 file:rounded-full file:border-0 file:bg-trust/10 file:px-3.5 file:py-1.5 file:text-xs file:font-medium file:text-trust-dark dark:file:text-trust"
            />
          </div>

          <div>
            <label htmlFor="city" className={label}>
              City
            </label>
            <input id="city" name="city" required defaultValue={existing?.city ?? ""} className={input} />
          </div>

          <div>
            <label htmlFor="consultationFeeRupees" className={label}>
              Consultation fee (₹, from your second consultation with a patient onward)
            </label>
            <input
              id="consultationFeeRupees"
              name="consultationFeeRupees"
              type="number"
              min="1"
              step="1"
              required
              defaultValue={existing ? Math.round(existing.consultation_fee_cents / 100) : ""}
              className={input}
            />
          </div>

          <div>
            <label htmlFor="bio" className={label}>
              Bio (shown on your public profile)
            </label>
            <textarea id="bio" name="bio" rows={4} defaultValue={existing?.bio ?? ""} className={input} />
          </div>

          <SubmitButton formAction={submitDoctorProfile} pendingText="Submitting…" className="w-full">
            {existing ? "Save changes" : "Submit for verification"}
          </SubmitButton>
        </form>
      </div>
    </main>
  );
}
