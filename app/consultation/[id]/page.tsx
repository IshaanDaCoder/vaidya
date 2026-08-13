import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getConsultationRoomName } from "@/utils/video";
import { JitsiRoom } from "@/components/JitsiRoom";

export default async function ConsultationRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // RLS (consultations_select_own) already scopes this to the doctor or
  // patient on the row — anyone else querying this id gets nothing back,
  // which we treat as a normal 404 rather than a separate auth check.
  const { data: consultation } = await supabase
    .from("consultations")
    .select("id, doctor_id, patient_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!consultation) notFound();

  const isDoctor = consultation.doctor_id === user.id;
  const otherPartyId = isDoctor ? consultation.patient_id : consultation.doctor_id;
  const { data: otherParty } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", otherPartyId)
    .maybeSingle();
  const { data: self } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  // RLS (patient_medical_history_select_by_treating_doctor) already
  // scopes this to a patient the doctor has an actual consultation
  // with — the query is safe to run unconditionally, but there's no
  // reason to even issue it when the viewer is the patient themselves.
  const { data: medicalHistory } = isDoctor
    ? await supabase
        .from("patient_medical_history")
        .select("*")
        .eq("user_id", consultation.patient_id)
        .maybeSingle()
    : { data: null };
  const { data: patientProfile } = isDoctor
    ? await supabase
        .from("patient_profiles")
        .select("date_of_birth, gender")
        .eq("user_id", consultation.patient_id)
        .maybeSingle()
    : { data: null };

  const roomName = getConsultationRoomName(consultation.id);
  const backHref = isDoctor ? "/doctor/dashboard" : "/search";

  return (
    <main className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b border-line px-6 py-3">
        <div>
          <p className="text-sm font-medium text-foreground">
            Consultation with{" "}
            {otherParty?.full_name ||
              (otherParty?.role === "doctor" ? "your doctor" : "your patient")}
          </p>
          <p className="text-xs text-muted capitalize">{consultation.status}</p>
        </div>
        <Link
          href={backHref}
          className="text-sm text-trust-dark underline underline-offset-4 dark:text-trust"
        >
          Leave
        </Link>
      </div>

      {isDoctor && (medicalHistory || patientProfile) && (
        <details className="border-b border-line bg-surface px-6 py-3">
          <summary className="cursor-pointer text-sm font-medium text-foreground">
            Patient medical history
          </summary>
          <div className="mt-3 grid max-w-2xl grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            {patientProfile?.gender && (
              <div>
                <span className="text-xs text-muted">Gender</span>
                <p className="text-foreground/85">{patientProfile.gender}</p>
              </div>
            )}
            {medicalHistory?.bmi != null && (
              <div>
                <span className="text-xs text-muted">
                  BMI {medicalHistory.height_cm && medicalHistory.weight_kg
                    ? `(${medicalHistory.height_cm}cm, ${medicalHistory.weight_kg}kg)`
                    : ""}
                </span>
                <p className="text-foreground/85">{medicalHistory.bmi}</p>
              </div>
            )}
            {medicalHistory?.smoking_status && (
              <div>
                <span className="text-xs text-muted">Smoking</span>
                <p className="text-foreground/85 capitalize">{medicalHistory.smoking_status}</p>
              </div>
            )}
            {medicalHistory?.alcohol_use && (
              <div>
                <span className="text-xs text-muted">Alcohol</span>
                <p className="text-foreground/85 capitalize">{medicalHistory.alcohol_use}</p>
              </div>
            )}
            {medicalHistory?.medications && (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted">Current medications</span>
                <p className="whitespace-pre-wrap text-foreground/85">{medicalHistory.medications}</p>
              </div>
            )}
            {medicalHistory?.past_medical_history && (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted">Past medical history</span>
                <p className="whitespace-pre-wrap text-foreground/85">
                  {medicalHistory.past_medical_history}
                </p>
              </div>
            )}
            {medicalHistory?.past_surgical_history && (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted">Past surgical history</span>
                <p className="whitespace-pre-wrap text-foreground/85">
                  {medicalHistory.past_surgical_history}
                </p>
              </div>
            )}
            {medicalHistory?.family_history && (
              <div className="sm:col-span-2">
                <span className="text-xs text-muted">Family history</span>
                <p className="whitespace-pre-wrap text-foreground/85">{medicalHistory.family_history}</p>
              </div>
            )}
            {!medicalHistory?.medications &&
              !medicalHistory?.past_medical_history &&
              !medicalHistory?.past_surgical_history &&
              !medicalHistory?.family_history &&
              medicalHistory?.bmi == null && (
                <p className="text-muted sm:col-span-2">
                  This patient hasn&apos;t filled out their medical history yet.
                </p>
              )}
          </div>
        </details>
      )}

      <div className="flex-1">
        <JitsiRoom roomName={roomName} displayName={self?.full_name ?? undefined} />
      </div>
    </main>
  );
}
