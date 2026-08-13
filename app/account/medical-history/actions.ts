"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  patientMedicalHistorySchema,
  patientProfileSchema,
} from "@/utils/validation/patient";

// Form fields come through as "" when left blank, not undefined — zod's
// .optional() only matches undefined, so an empty text/number input
// would otherwise fail validation (or coerce "" to 0 for numbers)
// instead of being treated as "not provided."
function emptyToUndefined(value: FormDataEntryValue | null) {
  if (value === null) return undefined;
  const str = String(value).trim();
  return str === "" ? undefined : str;
}

export async function updateMedicalHistory(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = patientMedicalHistorySchema.safeParse({
    medications: emptyToUndefined(formData.get("medications")),
    pastMedicalHistory: emptyToUndefined(formData.get("pastMedicalHistory")),
    pastSurgicalHistory: emptyToUndefined(formData.get("pastSurgicalHistory")),
    familyHistory: emptyToUndefined(formData.get("familyHistory")),
    smokingStatus: emptyToUndefined(formData.get("smokingStatus")),
    alcoholUse: emptyToUndefined(formData.get("alcoholUse")),
    heightCm: emptyToUndefined(formData.get("heightCm")),
    weightKg: emptyToUndefined(formData.get("weightKg")),
  });

  if (!parsed.success) {
    redirect(
      `/account/medical-history?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const {
    medications,
    pastMedicalHistory,
    pastSurgicalHistory,
    familyHistory,
    smokingStatus,
    alcoholUse,
    heightCm,
    weightKg,
  } = parsed.data;

  const { error } = await supabase.from("patient_medical_history").upsert(
    {
      user_id: user.id,
      medications,
      past_medical_history: pastMedicalHistory,
      past_surgical_history: pastSurgicalHistory,
      family_history: familyHistory,
      smoking_status: smokingStatus,
      alcohol_use: alcoholUse,
      height_cm: heightCm,
      weight_kg: weightKg,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/account/medical-history?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account/medical-history?saved=1");
}

export async function updatePatientProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = patientProfileSchema.safeParse({
    dateOfBirth: formData.get("dateOfBirth"),
    gender: formData.get("gender"),
    city: formData.get("city"),
  });

  if (!parsed.success) {
    redirect(
      `/account/medical-history?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const { error } = await supabase.from("patient_profiles").upsert(
    {
      user_id: user.id,
      date_of_birth: parsed.data.dateOfBirth.toISOString().slice(0, 10),
      gender: parsed.data.gender,
      city: parsed.data.city,
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/account/medical-history?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/account/medical-history?saved=1");
}
