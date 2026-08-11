import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { verifyRazorpayWebhookSignature } from "@/utils/razorpay";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const admin = createAdminClient();

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity;
    const order = event.payload?.order?.entity;
    const consultationId = order?.receipt;
    if (consultationId && payment?.id) {
      await admin
        .from("consultations")
        .update({ razorpay_payment_id: payment.id })
        .eq("id", consultationId);
    }
  }

  if (event.event === "payment.failed") {
    const order = event.payload?.order?.entity;
    const consultationId = order?.receipt;
    if (consultationId) {
      const { data: consultation } = await admin
        .from("consultations")
        .select("slot_id")
        .eq("id", consultationId)
        .single();

      await admin.from("consultations").update({ status: "cancelled" }).eq("id", consultationId);
      if (consultation?.slot_id) {
        await admin
          .from("availability_slots")
          .update({ is_booked: false })
          .eq("id", consultation.slot_id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
