"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { reviewSchema } from "@/utils/validation/booking";

// Unlike consultations, reviews genuinely is client-writable — RLS
// (reviews_insert_own_completed) already enforces that a patient can
// only review their own completed consultation, so the regular
// RLS-scoped client is the correct one here, not the admin client.
export async function submitReview(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const parsed = reviewSchema.safeParse({
    consultationId: formData.get("consultationId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });

  if (!parsed.success) {
    redirect(`/search?error=${encodeURIComponent(parsed.error.issues[0].message)}`);
  }

  const { data: consultation } = await supabase
    .from("consultations")
    .select("doctor_id")
    .eq("id", parsed.data.consultationId)
    .single();

  const { error } = await supabase.from("reviews").insert({
    consultation_id: parsed.data.consultationId,
    doctor_id: consultation!.doctor_id,
    patient_id: user.id,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
  });

  if (error) {
    redirect(`/search?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/search");
  redirect("/search");
}
