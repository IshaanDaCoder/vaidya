# Vaidya — system architecture

## Overview

```
Browser (patient or doctor)
   │
   ▼
Next.js App Router — Vercel (Server Components, Route Handlers, Server Actions)
   ├─→ Supabase Postgres (pooled connection) — profiles, doctors, patients,
   │     availability, consultations, reviews, subscriptions
   ├─→ Supabase Auth — email/password + Google OAuth + Microsoft (Outlook) OAuth
   ├─→ Supabase Storage (private bucket) — doctor license documents, signed URLs only
   ├─→ Razorpay — doctor subscriptions (recurring) + per-consultation payments
   │     (order creation client-side, webhook-verified confirmation server-side)
   ├─→ 100ms — embedded video consultation rooms, one per booked consultation
   │     (Google Meet link generation is the same-day fallback if this integration
   │     runs long — see the roadmap's cut list)
   └─→ Resend — booking confirmations, verification status, consultation reminders
```

## Roles

Vaidya has exactly two user roles, set at signup and stored on `profiles.role`:

- **patient** — searches doctors, books consultations, pays from their second
  consultation onward, leaves reviews after a completed visit.
- **doctor** — submits for verification, pays a subscription to be listed,
  manages availability, holds consultations, sees only their own patients.

There is no separate "admin" auth flow for launch — verification review is
done by a trusted operator directly in Supabase (or a minimal internal page
gated by a hardcoded allowlist of admin user IDs), not a full admin product.

## Key invariants enforced at the data layer, not just the UI

- A doctor is only returned by patient-facing search when
  `verification_status = 'verified' AND subscription_status = 'active'`.
- A patient can claim the platform-wide free consultation exactly once —
  `patient_profiles.has_used_free_consultation` is checked and flipped in the
  same transaction as the booking, to close the double-booking race.
- `orders` / `order_items`-equivalent tables here (`consultations`,
  `doctor_subscriptions`) are written only by server-side code holding the
  service-role key (webhook handlers), never by a client-facing insert policy.
- Doctor license documents live in a **private** Storage bucket. Nothing
  about them is public; access is by signed URL, generated server-side,
  scoped to the owning doctor and the admin allowlist.
- A doctor's RLS-visible patient data is scoped to patients they have an
  actual `consultations` row with — never the full patient table.

## Cities

City is a free-text field on `doctor_profiles`, not a fixed enum. There is
no launch-city whitelist: search filters against whatever cities doctors
have actually registered in, so coverage grows organically as doctors sign
up from anywhere in India, metro or otherwise.
