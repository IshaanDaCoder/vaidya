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

  const otherPartyId =
    consultation.doctor_id === user.id ? consultation.patient_id : consultation.doctor_id;
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

  const roomName = getConsultationRoomName(consultation.id);
  const backHref = consultation.doctor_id === user.id ? "/doctor/dashboard" : "/search";

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

      <div className="flex-1">
        <JitsiRoom roomName={roomName} displayName={self?.full_name ?? undefined} />
      </div>
    </main>
  );
}
