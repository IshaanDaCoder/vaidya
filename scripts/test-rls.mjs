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
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const admin = createClient(url, serviceKey);

function log(label, ok) {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}`);
}

const suffix = Date.now();
const password = "test-password-123";
const doctorVerified = { email: `rls-doc-verified-${suffix}@vaidya.test`, password };
const doctorPending = { email: `rls-doc-pending-${suffix}@vaidya.test`, password };
const patientA = { email: `rls-patient-a-${suffix}@vaidya.test`, password };
const patientB = { email: `rls-patient-b-${suffix}@vaidya.test`, password };

const created = [];

async function createTestUser(creds) {
  const { data, error } = await admin.auth.admin.createUser({
    ...creds,
    email_confirm: true,
  });
  if (error) throw error;
  created.push(data.user.id);
  return data.user.id;
}

async function signIn(creds) {
  const client = createClient(url, anonKey);
  const { error } = await client.auth.signInWithPassword(creds);
  if (error) throw error;
  return client;
}

try {
  const docVId = await createTestUser(doctorVerified);
  const docPId = await createTestUser(doctorPending);
  const patAId = await createTestUser(patientA);
  const patBId = await createTestUser(patientB);

  // Seed base rows as service role — the real app will do this through
  // the onboarding actions built on Days 4–5; today we're only proving
  // the schema and RLS are correct.
  await admin.from("profiles").insert([
    { id: docVId, role: "doctor", full_name: "Dr. Verified" },
    { id: docPId, role: "doctor", full_name: "Dr. Pending" },
    { id: patAId, role: "patient", full_name: "Patient A" },
    { id: patBId, role: "patient", full_name: "Patient B" },
  ]);
  await admin.from("doctor_profiles").insert([
    {
      user_id: docVId,
      specialization: "General Medicine",
      license_number: "TEST-V-001",
      city: "Mumbai",
      verification_status: "verified",
    },
    {
      user_id: docPId,
      specialization: "Cardiology",
      license_number: "TEST-P-001",
      city: "Delhi",
      verification_status: "pending",
    },
  ]);
  await admin
    .from("doctor_subscriptions")
    .insert([{ doctor_id: docVId, status: "active" }]);
  await admin.from("patient_profiles").insert([
    { user_id: patAId, city: "Mumbai" },
    { user_id: patBId, city: "Delhi" },
  ]);
  const { data: consultation } = await admin
    .from("consultations")
    .insert({
      doctor_id: docVId,
      patient_id: patAId,
      status: "completed",
      is_free: true,
    })
    .select()
    .single();

  const clientDocV = await signIn(doctorVerified);
  const clientDocP = await signIn(doctorPending);
  const clientPatA = await signIn(patientA);
  const clientPatB = await signIn(patientB);
  const anon = createClient(url, anonKey);

  // Search visibility
  const { data: searchable } = await anon.from("doctor_profiles").select("user_id");
  log(
    "Public search sees the verified+subscribed doctor but not the pending one",
    searchable?.length === 1 && searchable[0].user_id === docVId,
  );

  // Doctor <-> treated-patient relationship scoping
  const { data: docVPatients } = await clientDocV.from("patient_profiles").select("user_id");
  log(
    "Treating doctor sees exactly their one treated patient (A), not B",
    docVPatients?.length === 1 && docVPatients[0].user_id === patAId,
  );

  const { data: docPPatients } = await clientDocP.from("patient_profiles").select("user_id");
  log(
    "A doctor with no consultations sees zero patients",
    docPPatients?.length === 0,
  );

  const { data: patBOwn } = await clientPatB.from("patient_profiles").select("user_id");
  log(
    "Patient B can read their own patient_profiles row",
    patBOwn?.length === 1 && patBOwn[0].user_id === patBId,
  );

  // Doctor can read the treated patient's base profile (name)
  const { data: docVProfiles } = await clientDocV.from("profiles").select("id");
  log(
    "Treating doctor can read their patient's base profile",
    docVProfiles?.some((p) => p.id === patAId) && !docVProfiles?.some((p) => p.id === patBId),
  );

  // Self-verification is blocked by trigger
  await clientDocP
    .from("doctor_profiles")
    .update({ verification_status: "verified" })
    .eq("user_id", docPId);
  const { data: afterSelfVerify } = await admin
    .from("doctor_profiles")
    .select("verification_status")
    .eq("user_id", docPId)
    .single();
  log(
    "Doctor cannot self-approve their own verification_status",
    afterSelfVerify?.verification_status === "pending",
  );

  // Free-consultation flag can't be reset by the patient themselves
  await clientPatA
    .from("patient_profiles")
    .update({ has_used_free_consultation: true })
    .eq("user_id", patAId);
  const { data: afterFreeFlagAttempt } = await admin
    .from("patient_profiles")
    .select("has_used_free_consultation")
    .eq("user_id", patAId)
    .single();
  log(
    "Patient cannot flip their own has_used_free_consultation flag directly",
    afterFreeFlagAttempt?.has_used_free_consultation === false,
  );

  // Patients cannot write consultations themselves
  const { error: patientInsertConsultErr } = await clientPatB.from("consultations").insert({
    doctor_id: docVId,
    patient_id: patBId,
    status: "completed",
    is_free: true,
  });
  log(
    "A patient cannot insert their own consultation row (service-role only)",
    !!patientInsertConsultErr,
  );

  // Review flow: patient A can review their completed consultation with docV
  const { error: reviewErr } = await clientPatA.from("reviews").insert({
    consultation_id: consultation.id,
    doctor_id: docVId,
    patient_id: patAId,
    rating: 5,
    comment: "Great consultation.",
  });
  log("Patient can review their own completed consultation", !reviewErr);

  const { error: reviewAsBErr } = await clientPatB.from("reviews").insert({
    consultation_id: consultation.id,
    doctor_id: docVId,
    patient_id: patBId,
    rating: 1,
    comment: "I was never in this consultation.",
  });
  log(
    "A different patient cannot post a review for someone else's consultation",
    !!reviewAsBErr,
  );
} finally {
  for (const id of created) {
    await admin.auth.admin.deleteUser(id);
  }
  console.log(`Cleaned up ${created.length} test user(s) and their data.`);
}
