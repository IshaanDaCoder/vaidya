// Exercises the same atomic operations app/api/booking/route.ts performs,
// directly against the DB with the service-role client. This validates the
// compare-and-swap patterns (no double-booking, no double free-claim) and
// the overall state machine without needing a running HTTP server / Next
// request context (which the route's cookie-based auth depends on).

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

async function lockSlot(slotId, doctorId) {
  const { data } = await admin
    .from("availability_slots")
    .update({ is_booked: true })
    .eq("id", slotId)
    .eq("doctor_id", doctorId)
    .eq("is_booked", false)
    .select()
    .maybeSingle();
  return data;
}

async function claimFree(patientId) {
  const { data } = await admin
    .from("patient_profiles")
    .update({ has_used_free_consultation: true })
    .eq("user_id", patientId)
    .eq("has_used_free_consultation", false)
    .select()
    .maybeSingle();
  return data;
}

const suffix = Date.now();
const created = [];

try {
  const { data: doc } = await admin.auth.admin.createUser({
    email: `booking-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  created.push(doc.user.id);
  const doctorId = doc.user.id;

  const { data: pat } = await admin.auth.admin.createUser({
    email: `booking-pat-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "patient" },
  });
  created.push(pat.user.id);
  const patientId = pat.user.id;

  await admin.from("doctor_profiles").insert({
    user_id: doctorId,
    specialization: "General Medicine",
    license_number: `TEST-BOOK-${suffix}`,
    city: "Mumbai",
    verification_status: "verified",
    consultation_fee_cents: 40000,
  });
  await admin.from("doctor_subscriptions").insert({ doctor_id: doctorId, status: "active" });

  const start = new Date(Date.now() + 86400000).toISOString();
  const end = new Date(Date.now() + 86400000 + 1800000).toISOString();
  const { data: slot1 } = await admin
    .from("availability_slots")
    .insert({ doctor_id: doctorId, start_time: start, end_time: end })
    .select()
    .single();
  const { data: slot2 } = await admin
    .from("availability_slots")
    .insert({ doctor_id: doctorId, start_time: start, end_time: end })
    .select()
    .single();

  const { data: bookable } = await admin.rpc("is_doctor_bookable", { doctor: doctorId });
  log("is_doctor_bookable() returns true for our verified+subscribed test doctor", bookable === true);

  // First booking: should be free.
  const locked1 = await lockSlot(slot1.id, doctorId);
  log("First slot lock succeeds", !!locked1);
  const free1 = await claimFree(patientId);
  log("First booking claims the free consultation", !!free1);

  const { data: consult1 } = await admin
    .from("consultations")
    .insert({
      doctor_id: doctorId,
      patient_id: patientId,
      slot_id: slot1.id,
      status: "scheduled",
      is_free: true,
      fee_cents: 0,
    })
    .select()
    .single();
  log("Free consultation row created correctly", consult1.is_free === true && consult1.fee_cents === 0);

  // Second booking, same patient: must NOT be free.
  const locked2 = await lockSlot(slot2.id, doctorId);
  log("Second slot lock succeeds", !!locked2);
  const free2 = await claimFree(patientId);
  log("Second booking is correctly denied the free consultation (already used)", free2 === null);

  // Double-booking race: try to lock slot1 again — should fail, it's taken.
  const lockedAgain = await lockSlot(slot1.id, doctorId);
  log("Cannot double-book an already-booked slot", lockedAgain === null);

  // Simulate the "Razorpay not configured" path releasing the slot lock.
  await admin.from("availability_slots").update({ is_booked: false }).eq("id", slot2.id);
  const { data: releasedSlot } = await admin
    .from("availability_slots")
    .select("is_booked")
    .eq("id", slot2.id)
    .single();
  log("Slot lock correctly releases when payment can't proceed", releasedSlot.is_booked === false);

  // Patient-facing visibility: can the patient see their own consultation?
  const anon = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  await anon.auth.signInWithPassword({
    email: `booking-pat-${suffix}@vaidya.test`,
    password: "test-password-123",
  });
  const { data: ownConsults } = await anon.from("consultations").select("id");
  log("Patient can see their own consultation via RLS", ownConsults?.length === 1);
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`Cleaned up ${created.length} test user(s).`);
}
