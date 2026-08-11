import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { bookConsultationSchema } from "@/utils/validation/booking";
import { createRazorpayOrder, isRazorpayConfigured } from "@/utils/razorpay";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "patient") {
    return NextResponse.json({ error: "Only patients can book consultations." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bookConsultationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }
  const { doctorId, slotId } = parsed.data;

  const admin = createAdminClient();

  // Only book doctors patients are actually allowed to see (verified +
  // subscribed) — a client could otherwise POST an arbitrary doctorId.
  const { data: bookable } = await admin.rpc("is_doctor_bookable", { doctor: doctorId });
  if (!bookable) {
    return NextResponse.json({ error: "This doctor isn't currently bookable." }, { status: 403 });
  }

  // Atomic compare-and-swap: the WHERE clause makes this a single
  // statement in Postgres, so two simultaneous requests for the same
  // slot can't both succeed — the second gets zero rows back.
  const { data: lockedSlot } = await admin
    .from("availability_slots")
    .update({ is_booked: true })
    .eq("id", slotId)
    .eq("doctor_id", doctorId)
    .eq("is_booked", false)
    .select()
    .maybeSingle();

  if (!lockedSlot) {
    return NextResponse.json(
      { error: "That slot was just booked by someone else. Pick another." },
      { status: 409 },
    );
  }

  // Same compare-and-swap pattern for the free-consultation claim — this
  // is what makes it safe against two concurrent bookings both trying to
  // claim the platform-wide free consultation.
  const { data: claimedFree } = await admin
    .from("patient_profiles")
    .update({ has_used_free_consultation: true })
    .eq("user_id", user.id)
    .eq("has_used_free_consultation", false)
    .select()
    .maybeSingle();

  async function releaseSlot() {
    await admin.from("availability_slots").update({ is_booked: false }).eq("id", slotId);
  }

  if (claimedFree) {
    const { data: consultation, error } = await admin
      .from("consultations")
      .insert({
        doctor_id: doctorId,
        patient_id: user.id,
        slot_id: slotId,
        status: "scheduled",
        is_free: true,
        fee_cents: 0,
      })
      .select()
      .single();

    if (error) {
      await releaseSlot();
      await admin
        .from("patient_profiles")
        .update({ has_used_free_consultation: false })
        .eq("user_id", user.id);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ booked: true, free: true, consultationId: consultation.id });
  }

  // Already used their free consultation — this one needs payment.
  const { data: doctorProfile } = await admin
    .from("doctor_profiles")
    .select("consultation_fee_cents")
    .eq("user_id", doctorId)
    .single();

  if (!isRazorpayConfigured()) {
    await releaseSlot();
    return NextResponse.json(
      { error: "Payments aren't set up yet — this booking can't be completed right now." },
      { status: 503 },
    );
  }

  const { data: consultation, error: insertError } = await admin
    .from("consultations")
    .insert({
      doctor_id: doctorId,
      patient_id: user.id,
      slot_id: slotId,
      status: "scheduled",
      is_free: false,
      fee_cents: doctorProfile!.consultation_fee_cents,
    })
    .select()
    .single();

  if (insertError) {
    await releaseSlot();
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const order = await createRazorpayOrder(doctorProfile!.consultation_fee_cents, consultation.id);
  if (!order) {
    await releaseSlot();
    await admin.from("consultations").delete().eq("id", consultation.id);
    return NextResponse.json({ error: "Could not create payment order." }, { status: 502 });
  }

  return NextResponse.json({
    booked: true,
    free: false,
    consultationId: consultation.id,
    razorpayOrderId: order.id,
    amountCents: doctorProfile!.consultation_fee_cents,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
}
