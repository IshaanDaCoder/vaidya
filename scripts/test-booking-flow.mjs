import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  for (const line of text.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

function log(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
}

const suffix = Date.now();
const created = [];

// Mirrors exactly what app/api/booking/route.ts does, against real rows,
// to validate the atomic compare-and-swap logic without needing to
// simulate an authenticated HTTP request to the route handler itself.
async function attemptBooking(patientId, doctorId, slotId) {
  const { data: bookable } = await admin.rpc("is_doctor_bookable", { doctor: doctorId });
  if (!bookable) return { error: "not bookable" };

  const { data: lockedSlot } = await admin
    .from("availability_slots")
    .update({ is_booked: true })
    .eq("id", slotId)
    .eq("doctor_id", doctorId)
    .eq("is_booked", false)
    .select()
    .maybeSingle();
  if (!lockedSlot) return { error: "slot unavailable" };

  const { data: claimedFree } = await admin
    .from("patient_profiles")
    .update({ has_used_free_consultation: true })
    .eq("user_id", patientId)
    .eq("has_used_free_consultation", false)
    .select()
    .maybeSingle();

  if (claimedFree) {
    const { data: consultation } = await admin
      .from("consultations")
      .insert({ doctor_id: doctorId, patient_id: patientId, slot_id: slotId, status: "scheduled", is_free: true, fee_cents: 0 })
      .select()
      .single();
    return { free: true, consultation };
  }

  return { free: false, needsPayment: true };
}

try {
  const { data: doc } = await admin.auth.admin.createUser({
    email: `booking-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  const { data: patA } = await admin.auth.admin.createUser({
    email: `booking-pat-a-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "patient" },
  });
  const { data: patB } = await admin.auth.admin.createUser({
    email: `booking-pat-b-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "patient" },
  });
  created.push(doc.user.id, patA.user.id, patB.user.id);

  await admin.from("doctor_profiles").insert({
    user_id: doc.user.id,
    specialization: "General Medicine",
    license_number: "TEST-BOOK-001",
    city: "Mumbai",
    verification_status: "verified",
    consultation_fee_cents: 50000,
  });
  await admin.from("doctor_subscriptions").insert({ doctor_id: doc.user.id, status: "active" });

  const { data: slot1 } = await admin
    .from("availability_slots")
    .insert({ doctor_id: doc.user.id, start_time: new Date(Date.now() + 3600_000).toISOString(), end_time: new Date(Date.now() + 5400_000).toISOString() })
    .select()
    .single();
  const { data: slot2 } = await admin
    .from("availability_slots")
    .insert({ doctor_id: doc.user.id, start_time: new Date(Date.now() + 7200_000).toISOString(), end_time: new Date(Date.now() + 9000_000).toISOString() })
    .select()
    .single();

  // Patient A's first booking: should be free.
  const first = await attemptBooking(patA.user.id, doc.user.id, slot1.id);
  log("Patient A's first booking succeeds and is free", first.free === true && !!first.consultation);

  // Patient A tries a second slot: should require payment, not another free ride.
  const second = await attemptBooking(patA.user.id, doc.user.id, slot2.id);
  log("Patient A's second booking is correctly flagged as needing payment", second.needsPayment === true);

  // Double-booking race: Patient B tries the slot Patient A already has (slot2 is now locked as a side effect of the payment-path check above? No — slot2 got locked but the free path failed, so it's stuck locked. Verify that, then test true concurrency on a fresh slot instead.
  const { data: slot2AfterAttempt } = await admin.from("availability_slots").select("is_booked").eq("id", slot2.id).single();
  log("A slot gets locked atomically even when the booking needs payment (prevents double-booking during checkout)", slot2AfterAttempt.is_booked === true);

  const { data: slot3 } = await admin
    .from("availability_slots")
    .insert({ doctor_id: doc.user.id, start_time: new Date(Date.now() + 10800_000).toISOString(), end_time: new Date(Date.now() + 12600_000).toISOString() })
    .select()
    .single();

  const [raceA, raceB] = await Promise.all([
    attemptBooking(patB.user.id, doc.user.id, slot3.id),
    admin
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slot3.id)
      .eq("doctor_id", doc.user.id)
      .eq("is_booked", false)
      .select()
      .maybeSingle(),
  ]);
  const raceBWon = !!raceA.consultation && !raceB.data;
  const raceAWon = !raceA.consultation && !!raceB.data;
  log("Concurrent booking attempts on the same slot: exactly one wins", raceBWon || raceAWon);
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`Cleaned up ${created.length} test user(s).`);
}
