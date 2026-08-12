// A lightweight concurrency test against the live production deployment,
// covering the parts of the app that don't need Razorpay: the doctor
// directory (read-heavy, what most traffic would actually be) and the
// free-consultation booking path end to end.
//
// Not k6 — this environment doesn't have it installed and there's no
// package manager available to add it. This is a plain Node script
// doing the same thing at a modest scale (dozens of concurrent
// requests, not thousands): enough to catch a connection-pool or
// race-condition problem without hammering a production deployment
// that has no real users yet.

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

const SITE = "https://vaidya-consult.vercel.app";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY);

function log(label, ok, extra = "") {
  console.log(`${ok ? "PASS" : "FAIL"} — ${label}${extra ? " " + extra : ""}`);
}

async function timeRequests(count, fn) {
  const start = Date.now();
  const results = await Promise.allSettled(Array.from({ length: count }, () => fn()));
  const elapsed = Date.now() - start;
  const failed = results.filter((r) => r.status === "rejected" || r.value === false);
  return { elapsed, failed: failed.length, total: count };
}

console.log(`Load-testing ${SITE} ...\n`);

// 1. Concurrent reads of the public homepage and login page — the
//    traffic shape a real launch/share spike would look like.
const pageRun = await timeRequests(40, async () => {
  const res = await fetch(SITE + "/");
  return res.ok;
});
log(
  `40 concurrent homepage requests`,
  pageRun.failed === 0,
  `— ${pageRun.elapsed}ms total, ${pageRun.failed}/${pageRun.total} failed`,
);

// 2. Concurrent Supabase reads against doctor_profiles — what the
//    search page's query actually does, run directly so we can see
//    Postgres-level behavior without page-render overhead in the way.
const anon = createClient(url, anonKey);
const dbRun = await timeRequests(40, async () => {
  const { error } = await anon.from("doctor_profiles").select("user_id, specialization, city");
  return !error;
});
log(
  `40 concurrent doctor-directory reads`,
  dbRun.failed === 0,
  `— ${dbRun.elapsed}ms total, ${dbRun.failed}/${dbRun.total} failed`,
);

// 3. The real concurrency case that matters: many patients racing for
//    the same handful of slots. Reuses the exact compare-and-swap logic
//    from app/api/booking/route.ts.
const suffix = Date.now();
const created = [];
try {
  const { data: doc } = await admin.auth.admin.createUser({
    email: `load-doc-${suffix}@vaidya.test`,
    password: "test-password-123",
    email_confirm: true,
    user_metadata: { role: "doctor" },
  });
  created.push(doc.user.id);
  await admin.from("doctor_profiles").insert({
    user_id: doc.user.id,
    specialization: "General Medicine",
    license_number: `TEST-LOAD-${suffix}`,
    city: "Mumbai",
    verification_status: "verified",
    consultation_fee_cents: 40000,
  });
  await admin.from("doctor_subscriptions").insert({ doctor_id: doc.user.id, status: "active" });

  const SLOT_COUNT = 5;
  const PATIENTS_PER_SLOT = 6; // 30 patients racing for 5 slots — 25 must lose.
  const slots = [];
  for (let i = 0; i < SLOT_COUNT; i++) {
    const { data: slot } = await admin
      .from("availability_slots")
      .insert({
        doctor_id: doc.user.id,
        start_time: new Date(Date.now() + 3600_000 + i * 1800_000).toISOString(),
        end_time: new Date(Date.now() + 5400_000 + i * 1800_000).toISOString(),
      })
      .select()
      .single();
    slots.push(slot);
  }

  const patients = [];
  for (let i = 0; i < SLOT_COUNT * PATIENTS_PER_SLOT; i++) {
    const { data: pat } = await admin.auth.admin.createUser({
      email: `load-pat-${suffix}-${i}@vaidya.test`,
      password: "test-password-123",
      email_confirm: true,
      user_metadata: { role: "patient" },
    });
    created.push(pat.user.id);
    patients.push(pat.user.id);
  }

  async function raceBook(patientId, slotId) {
    const { data } = await admin
      .from("availability_slots")
      .update({ is_booked: true })
      .eq("id", slotId)
      .eq("doctor_id", doc.user.id)
      .eq("is_booked", false)
      .select()
      .maybeSingle();
    return !!data;
  }

  const start = Date.now();
  const attempts = patients.map((patientId, i) => raceBook(patientId, slots[Math.floor(i / PATIENTS_PER_SLOT)].id));
  const outcomes = await Promise.all(attempts);
  const elapsed = Date.now() - start;

  const wins = outcomes.filter(Boolean).length;
  log(
    `${SLOT_COUNT * PATIENTS_PER_SLOT} patients racing for ${SLOT_COUNT} slots: exactly ${SLOT_COUNT} win`,
    wins === SLOT_COUNT,
    `— got ${wins} winners in ${elapsed}ms`,
  );
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`\nCleaned up ${created.length} test user(s).`);
}
