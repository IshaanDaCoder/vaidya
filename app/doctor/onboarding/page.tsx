import { requireRole } from "@/utils/require-role";
import { createClient } from "@/utils/supabase/server";
import { submitDoctorProfile } from "./actions";

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
      <h1 className="text-2xl font-semibold">
        {existing ? "Update your profile" : "Complete your doctor profile"}
      </h1>
      <p className="mt-2 text-sm text-gray-600">
        This information is reviewed before your profile becomes visible to
        patients. You can&apos;t approve your own verification — an admin
        reviews every submission.
      </p>

      {existing && (
        <p className="mt-4 inline-block rounded-full border px-3 py-1 text-xs font-medium capitalize">
          Status: {existing.verification_status}
        </p>
      )}

      {error && (
        <p className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <form className="mt-8 space-y-5">
        <div>
          <label htmlFor="specialization" className="text-xs text-gray-600">
            Specialization
          </label>
          <input
            id="specialization"
            name="specialization"
            required
            defaultValue={existing?.specialization ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label htmlFor="qualifications" className="text-xs text-gray-600">
            Qualifications
          </label>
          <input
            id="qualifications"
            name="qualifications"
            required
            placeholder="MBBS, MD (General Medicine)"
            defaultValue={existing?.qualifications ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label htmlFor="licenseNumber" className="text-xs text-gray-600">
            Medical registration / license number
          </label>
          <input
            id="licenseNumber"
            name="licenseNumber"
            required
            defaultValue={existing?.license_number ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label htmlFor="licenseDocument" className="text-xs text-gray-600">
            Upload license / registration certificate
            {existing?.license_document_path && (
              <span className="ml-1 text-teal-700">(already on file — optional to replace)</span>
            )}
          </label>
          <input
            id="licenseDocument"
            name="licenseDocument"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            required={!existing?.license_document_path}
            className="mt-1 w-full text-sm"
          />
        </div>

        <div>
          <label htmlFor="city" className="text-xs text-gray-600">
            City
          </label>
          <input
            id="city"
            name="city"
            required
            defaultValue={existing?.city ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label htmlFor="consultationFeeRupees" className="text-xs text-gray-600">
            Consultation fee (₹, from your second consultation with a patient onward)
          </label>
          <input
            id="consultationFeeRupees"
            name="consultationFeeRupees"
            type="number"
            min="1"
            step="1"
            required
            defaultValue={
              existing ? Math.round(existing.consultation_fee_cents / 100) : ""
            }
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <div>
          <label htmlFor="bio" className="text-xs text-gray-600">
            Bio (shown on your public profile)
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            defaultValue={existing?.bio ?? ""}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600"
          />
        </div>

        <button
          formAction={submitDoctorProfile}
          className="w-full rounded-md bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          {existing ? "Save changes" : "Submit for verification"}
        </button>
      </form>
    </main>
  );
}
