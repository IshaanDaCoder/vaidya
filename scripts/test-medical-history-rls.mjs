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
  const { data: docV } = await admin.auth.admin.createUser({
    email: `mh-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  const { data: patA } = await admin.auth.admin.createUser({
    email: `mh-pat-a-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "patient" },
  });
  const { data: patB } = await admin.auth.admin.createUser({
    email: `mh-pat-b-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "patient" },
  });
  created.push(docV.user.id, patA.user.id, patB.user.id);

  await admin.from("doctor_profiles").insert({
    user_id: docV.user.id,
    specialization: "General Medicine",
    license_number: `TEST-MH-${suffix}`,
    city: "Chennai",
    verification_status: "verified",
  });

  const patAClient = createClient(url, anonKey);
  await patAClient.auth.signInWithPassword({
    email: `mh-pat-a-${suffix}@vaidya.test`,
    password: "test-password-123",
  });

  // Patient A fills out their own medical history.
  const { data: inserted, error: insertErr } = await patAClient
    .from("patient_medical_history")
    .insert({
      user_id: patA.user.id,
      medications: "Metformin 500mg",
      past_medical_history: "Type 2 diabetes",
      past_surgical_history: "Appendectomy 2015",
      family_history: "Father: hypertension",
      smoking_status: "never",
      alcohol_use: "occasional",
      height_cm: 170,
      weight_kg: 70,
    })
    .select()
    .single();
  log("Patient can insert their own medical history", !insertErr);
  log("BMI auto-calculates correctly (70kg / 1.70m^2 = 24.2)", inserted?.bmi === 24.2);

  // Patient B cannot see or write Patient A's history.
  const patBClient = createClient(url, anonKey);
  await patBClient.auth.signInWithPassword({
    email: `mh-pat-b-${suffix}@vaidya.test`,
    password: "test-password-123",
  });
  const { data: bSeesA } = await patBClient
    .from("patient_medical_history")
    .select("user_id")
    .eq("user_id", patA.user.id);
  log("A different patient cannot read someone else's medical history", bSeesA?.length === 0);

  await patBClient
    .from("patient_medical_history")
    .update({ medications: "tampered" })
    .eq("user_id", patA.user.id);
  const { data: afterTamper } = await admin
    .from("patient_medical_history")
    .select("medications")
    .eq("user_id", patA.user.id)
    .single();
  log(
    "A different patient cannot modify someone else's medical history",
    afterTamper?.medications === "Metformin 500mg",
  );

  // Doctor with no consultation history cannot see it.
  const docClient = createClient(url, anonKey);
  await docClient.auth.signInWithPassword({
    email: `mh-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
  });
  const { data: docSeesBefore } = await docClient
    .from("patient_medical_history")
    .select("user_id")
    .eq("user_id", patA.user.id);
  log("A doctor with no relationship to the patient cannot see their history", docSeesBefore?.length === 0);

  // After a consultation exists, the treating doctor can see it.
  await admin.from("consultations").insert({
    doctor_id: docV.user.id,
    patient_id: patA.user.id,
    status: "scheduled",
    is_free: true,
  });
  const { data: docSeesAfter } = await docClient
    .from("patient_medical_history")
    .select("user_id, medications")
    .eq("user_id", patA.user.id);
  log(
    "The treating doctor can see the patient's medical history once a consultation exists",
    docSeesAfter?.length === 1 && docSeesAfter[0].medications === "Metformin 500mg",
  );
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`Cleaned up ${created.length} test user(s).`);
}
