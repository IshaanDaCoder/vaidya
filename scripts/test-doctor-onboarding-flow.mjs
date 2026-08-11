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
const docCreds = { email: `onboarding-test-${suffix}@vaidya.test`, password: "test-password-123" };
const created = [];

try {
  const { data: docUser } = await admin.auth.admin.createUser({
    ...docCreds,
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  created.push(docUser.user.id);
  const docId = docUser.user.id;

  const docClient = createClient(url, anonKey);
  await docClient.auth.signInWithPassword(docCreds);

  // Not visible to public search before onboarding
  const { data: beforeSearch } = await createClient(url, anonKey)
    .from("doctor_profiles")
    .select("user_id")
    .eq("user_id", docId);
  log("Doctor with no profile is invisible to search", beforeSearch?.length === 0);

  // Simulate the onboarding submission (bucket upload skipped — tested separately)
  const { error: submitErr } = await docClient.from("doctor_profiles").insert({
    user_id: docId,
    specialization: "Dermatology",
    qualifications: "MBBS, MD",
    license_number: "TEST-ONBOARD-001",
    city: "Bengaluru",
    consultation_fee_cents: 150000,
  });
  log("Doctor can submit their own onboarding profile", !submitErr);

  const { data: afterSubmit } = await admin
    .from("doctor_profiles")
    .select("verification_status")
    .eq("user_id", docId)
    .single();
  log("New submission starts as pending", afterSubmit?.verification_status === "pending");

  // Still not searchable while pending
  const { data: pendingSearch } = await createClient(url, anonKey)
    .from("doctor_profiles")
    .select("user_id")
    .eq("user_id", docId);
  log("Pending doctor is still invisible to search", pendingSearch?.length === 0);

  // Admin approves (service-role update — the one legitimate path)
  await admin.from("doctor_profiles").update({ verification_status: "verified" }).eq("user_id", docId);
  await admin.from("doctor_subscriptions").insert({ doctor_id: docId, status: "active" });

  const { data: afterApproval } = await createClient(url, anonKey)
    .from("doctor_profiles")
    .select("user_id")
    .eq("user_id", docId);
  log(
    "Verified + subscribed doctor becomes visible to public search",
    afterApproval?.length === 1,
  );
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`Cleaned up ${created.length} test user(s).`);
}
