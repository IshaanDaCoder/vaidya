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
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

function log(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
}

const suffix = Date.now();
const created = [];

try {
  const { data: doc } = await admin.auth.admin.createUser({
    email: `lifecycle-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  const { data: doc2 } = await admin.auth.admin.createUser({
    email: `lifecycle-doc2-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  const { data: pat } = await admin.auth.admin.createUser({
    email: `lifecycle-pat-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "patient" },
  });
  created.push(doc.user.id, doc2.user.id, pat.user.id);

  await admin.from("doctor_profiles").insert({
    user_id: doc.user.id,
    specialization: "Cardiology",
    license_number: `TEST-LC-${suffix}`,
    city: "Delhi",
    verification_status: "verified",
    consultation_fee_cents: 60000,
  });
  await admin.from("doctor_subscriptions").insert({ doctor_id: doc.user.id, status: "active" });

  const { data: slot } = await admin
    .from("availability_slots")
    .insert({
      doctor_id: doc.user.id,
      start_time: new Date(Date.now() + 3600_000).toISOString(),
      end_time: new Date(Date.now() + 5400_000).toISOString(),
      is_booked: true,
    })
    .select()
    .single();

  const { data: consultation } = await admin
    .from("consultations")
    .insert({
      doctor_id: doc.user.id,
      patient_id: pat.user.id,
      slot_id: slot.id,
      status: "scheduled",
      is_free: true,
      fee_cents: 0,
    })
    .select()
    .single();

  const docClient = createClient(url, anonKey);
  await docClient.auth.signInWithPassword({
    email: `lifecycle-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
  });
  const doc2Client = createClient(url, anonKey);
  await doc2Client.auth.signInWithPassword({
    email: `lifecycle-doc2-${suffix}@vaidya.test`,
    password: "test-password-123",
  });
  const patClient = createClient(url, anonKey);
  await patClient.auth.signInWithPassword({
    email: `lifecycle-pat-${suffix}@vaidya.test`,
    password: "test-password-123",
  });

  // Mirrors markConsultationCompleted's ownership check.
  const { data: seenByOwner } = await docClient
    .from("consultations")
    .select("id")
    .eq("id", consultation.id)
    .maybeSingle();
  log("The treating doctor can see the consultation to mark it complete", !!seenByOwner);

  const { data: seenByOtherDoctor } = await doc2Client
    .from("consultations")
    .select("id")
    .eq("id", consultation.id)
    .maybeSingle();
  log("A different doctor cannot see this consultation (would be blocked from marking it complete)", !seenByOtherDoctor);

  await admin.from("consultations").update({ status: "completed" }).eq("id", consultation.id);

  // Patient submits a review — via the RLS-scoped client, exactly as the
  // real submitReview action does (reviews is the one client-writable
  // table by design).
  const { error: reviewErr } = await patClient.from("reviews").insert({
    consultation_id: consultation.id,
    doctor_id: doc.user.id,
    patient_id: pat.user.id,
    rating: 5,
    comment: "Great, on time, clear explanation.",
  });
  log("Patient can submit a review for their completed consultation", !reviewErr);

  const { data: publicReviews } = await createClient(url, anonKey)
    .from("reviews")
    .select("rating, comment")
    .eq("doctor_id", doc.user.id);
  log("Review is publicly visible on the doctor's profile", publicReviews?.length === 1);

  const { error: doubleReviewErr } = await patClient.from("reviews").insert({
    consultation_id: consultation.id,
    doctor_id: doc.user.id,
    patient_id: pat.user.id,
    rating: 1,
    comment: "trying to review twice",
  });
  log("Patient cannot submit a second review for the same consultation (unique constraint)", !!doubleReviewErr);
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`Cleaned up ${created.length} test user(s).`);
}
