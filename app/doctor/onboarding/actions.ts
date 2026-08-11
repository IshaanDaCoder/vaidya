"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { doctorOnboardingSchema } from "@/utils/validation/doctor";

export async function submitDoctorProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const feeRupees = Number(formData.get("consultationFeeRupees"));
  const parsed = doctorOnboardingSchema.safeParse({
    specialization: formData.get("specialization"),
    qualifications: formData.get("qualifications"),
    licenseNumber: formData.get("licenseNumber"),
    city: formData.get("city"),
    bio: formData.get("bio") || undefined,
    consultationFeeCents: Math.round(feeRupees * 100),
  });

  if (!parsed.success) {
    redirect(
      `/doctor/onboarding?error=${encodeURIComponent(parsed.error.issues[0].message)}`,
    );
  }

  const file = formData.get("licenseDocument");
  let licenseDocumentPath: string | undefined;

  if (file instanceof File && file.size > 0) {
    const extension = file.name.split(".").pop() || "pdf";
    const path = `${user.id}/license-${Date.now()}.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("doctor-documents")
      .upload(path, file, { upsert: true });

    if (uploadError) {
      redirect(
        `/doctor/onboarding?error=${encodeURIComponent("Could not upload document: " + uploadError.message)}`,
      );
    }
    licenseDocumentPath = path;
  }

  const { specialization, qualifications, licenseNumber, city, bio, consultationFeeCents } =
    parsed.data;

  const { error } = await supabase.from("doctor_profiles").upsert(
    {
      user_id: user.id,
      specialization,
      qualifications,
      license_number: licenseNumber,
      city,
      bio,
      consultation_fee_cents: consultationFeeCents,
      ...(licenseDocumentPath ? { license_document_path: licenseDocumentPath } : {}),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    redirect(`/doctor/onboarding?error=${encodeURIComponent(error.message)}`);
  }

  redirect("/doctor/dashboard");
}
