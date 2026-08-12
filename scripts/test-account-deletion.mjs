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

const { data: doc } = await admin.auth.admin.createUser({
  email: `delete-test-${suffix}@vaidya.test`,
  password: "test-password-123",
  email_confirm: true,
  user_metadata: { role: "doctor" },
});
const doctorId = doc.user.id;

await admin.from("doctor_profiles").insert({
  user_id: doctorId,
  specialization: "General Medicine",
  license_number: `TEST-DEL-${suffix}`,
  city: "Pune",
  verification_status: "verified",
  consultation_fee_cents: 30000,
});
await admin.from("doctor_subscriptions").insert({ doctor_id: doctorId, status: "active" });
const { data: slot } = await admin
  .from("availability_slots")
  .insert({
    doctor_id: doctorId,
    start_time: new Date(Date.now() + 3600_000).toISOString(),
    end_time: new Date(Date.now() + 5400_000).toISOString(),
  })
  .select()
  .single();

// Mirrors deleteAccount() exactly: delete the auth user, rely on the
// schema's ON DELETE CASCADE to remove everything downstream.
const { error: deleteError } = await admin.auth.admin.deleteUser(doctorId);
log("auth.admin.deleteUser succeeds", !deleteError);

const { data: profileAfter } = await admin.from("profiles").select("id").eq("id", doctorId).maybeSingle();
log("profiles row is gone", !profileAfter);

const { data: doctorProfileAfter } = await admin
  .from("doctor_profiles")
  .select("user_id")
  .eq("user_id", doctorId)
  .maybeSingle();
log("doctor_profiles row is gone", !doctorProfileAfter);

const { data: subAfter } = await admin
  .from("doctor_subscriptions")
  .select("doctor_id")
  .eq("doctor_id", doctorId)
  .maybeSingle();
log("doctor_subscriptions row is gone", !subAfter);

const { data: slotAfter } = await admin
  .from("availability_slots")
  .select("id")
  .eq("id", slot.id)
  .maybeSingle();
log("availability_slots row is gone", !slotAfter);
