import Razorpay from "razorpay";
import crypto from "node:crypto";

export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

function getClient() {
  if (!isRazorpayConfigured()) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
}

/** amountCents is the smallest currency unit (paise for INR), matching
 *  consultation_fee_cents / fee_cents in the schema. */
export async function createRazorpayOrder(amountCents: number, receipt: string) {
  const client = getClient();
  if (!client) return null;

  return client.orders.create({
    amount: amountCents,
    currency: "INR",
    receipt,
  });
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return false;

  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  // Constant-time comparison — a plain === here would leak timing
  // information an attacker could use to guess the signature byte by byte.
  return (
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  );
}
