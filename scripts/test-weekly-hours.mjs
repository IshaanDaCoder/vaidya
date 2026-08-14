// Mirrors the compare-and-swap/idempotency behavior of
// generateSlotsFromHours in app/doctor/availability/actions.ts against
// real rows, so this can run without a browser. The generation math
// itself (day-of-week matching, IST offset construction, cursor
// stepping) is exercised live in scripts/test-doctor-onboarding-flow.mjs
// style browser testing during development; this script instead proves
// the RLS boundary and the FK-guard behavior the page depends on.

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
  const { data: docNoProfile } = await admin.auth.admin.createUser({
    email: `wh-noprofile-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  const { data: docWithProfile } = await admin.auth.admin.createUser({
    email: `wh-profile-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  const { data: otherDoctor } = await admin.auth.admin.createUser({
    email: `wh-other-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  created.push(docNoProfile.user.id, docWithProfile.user.id, otherDoctor.user.id);

  await admin.from("doctor_profiles").insert([
    {
      user_id: docWithProfile.user.id,
      specialization: "General Medicine",
      license_number: `TEST-WH-${suffix}`,
      city: "Bengaluru",
      verification_status: "verified",
    },
    {
      user_id: otherDoctor.user.id,
      specialization: "Cardiology",
      license_number: `TEST-WH-OTHER-${suffix}`,
      city: "Pune",
      verification_status: "verified",
    },
  ]);

  // The page guards against this in the UI, but the underlying FK is
  // the real enforcement — confirm it's actually still there.
  const { error: fkErr } = await admin.from("doctor_weekly_hours").insert({
    doctor_id: docNoProfile.user.id,
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });
  log(
    "A doctor with no doctor_profiles row cannot get a weekly_hours row (FK enforced)",
    !!fkErr,
  );

  const docClient = createClient(url, anonKey);
  await docClient.auth.signInWithPassword({
    email: `wh-profile-${suffix}@vaidya.test`,
    password: "test-password-123",
  });

  const { error: insertErr } = await docClient.from("doctor_weekly_hours").insert({
    doctor_id: docWithProfile.user.id,
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    slot_duration_minutes: 30,
  });
  log("A doctor with a profile can save their own weekly hours", !insertErr);

  const otherClient = createClient(url, anonKey);
  await otherClient.auth.signInWithPassword({
    email: `wh-other-${suffix}@vaidya.test`,
    password: "test-password-123",
  });
  const { data: otherSees } = await otherClient
    .from("doctor_weekly_hours")
    .select("doctor_id")
    .eq("doctor_id", docWithProfile.user.id);
  log("A different doctor cannot read another doctor's weekly hours", otherSees?.length === 0);

  await otherClient
    .from("doctor_weekly_hours")
    .update({ start_time: "06:00" })
    .eq("doctor_id", docWithProfile.user.id);
  const { data: afterTamper } = await admin
    .from("doctor_weekly_hours")
    .select("start_time")
    .eq("doctor_id", docWithProfile.user.id)
    .single();
  log(
    "A different doctor cannot modify another doctor's weekly hours",
    afterTamper?.start_time === "09:00:00",
  );

  // Availability_slots_doctor_start_unique — confirm the unique index
  // from the same migration is actually enforced, since that's what
  // makes ignoreDuplicates-based generation safe against duplicates.
  const start = new Date(Date.now() + 7 * 86_400_000).toISOString();
  const end = new Date(Date.now() + 7 * 86_400_000 + 1_800_000).toISOString();
  await admin
    .from("availability_slots")
    .insert({ doctor_id: docWithProfile.user.id, start_time: start, end_time: end });
  const { data: dupeInsert, error: dupeErr } = await admin
    .from("availability_slots")
    .upsert(
      [{ doctor_id: docWithProfile.user.id, start_time: start, end_time: end }],
      { onConflict: "doctor_id,start_time", ignoreDuplicates: true },
    )
    .select("id");
  log(
    "Upserting a slot that already exists at (doctor_id, start_time) inserts nothing new",
    !dupeErr && dupeInsert?.length === 0,
  );
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`Cleaned up ${created.length} test user(s).`);
}
