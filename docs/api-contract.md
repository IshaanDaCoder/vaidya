# Vaidya — API contract

Every entry point below is a Next.js server action or route handler.
Server actions validate input with a zod schema in `utils/validation/*.ts`
before touching Supabase, Razorpay, or 100ms — see `utils/validation/`
for the schemas already drafted (auth, doctor onboarding, patient
profile, booking, reviews). Route handlers (webhooks, OAuth callbacks)
validate the same way at the top of the function.

## Auth — `app/(auth)/actions.ts` (Day 4)

| Action | Input | Behavior |
|---|---|---|
| `signup(formData)` | `email`, `password`, `role` | Validates via `signupSchema`, signs up via Supabase Auth, stores `role` in user metadata, creates the matching `profiles` row and empty `doctor_profiles`/`patient_profiles` row |
| `login(formData)` | `email`, `password` | Validates via `loginSchema`, signs in, redirects by role (doctor → dashboard, patient → search) |
| `logout()` | — | Signs out |
| OAuth (Google, Microsoft) | — | Supabase Auth OAuth redirect flow; role is collected on a post-OAuth "finish setup" step since OAuth alone doesn't carry it |

## Doctor onboarding — `app/doctor/actions.ts` (Day 5)

| Action | Input | Behavior |
|---|---|---|
| `submitDoctorProfile(formData)` | `specialization`, `qualifications`, `licenseNumber`, `city`, `bio?`, `consultationFeeCents` | Validates via `doctorOnboardingSchema`, upserts `doctor_profiles`, leaves `verification_status = 'pending'` |
| `uploadLicenseDocument(file)` | file | Uploads to the private `doctor-documents/<uid>/...` path, stores the path on `doctor_profiles.license_document_path` |
| `reviewDoctorSubmission(formData)` *(internal/admin only)* | `doctorId`, `decision` | Runs with the service-role key from an allowlisted admin session; sets `verification_status` to `verified`/`rejected` — the one legitimate path around the Day 2 self-verification trigger |

## Availability — `app/doctor/availability/actions.ts` (Day 6)

| Action | Input | Behavior |
|---|---|---|
| `addAvailabilitySlot(formData)` | `startTime`, `endTime` | Validates via `availabilitySlotSchema`, inserts an `availability_slots` row owned by the signed-in doctor |
| `removeAvailabilitySlot(formData)` | `slotId` | Deletes a slot (RLS-scoped to the owning doctor) |

## Booking & payments — `app/api/booking/route.ts`, `app/api/webhooks/razorpay/route.ts` (Day 6)

| Endpoint | Input | Behavior |
|---|---|---|
| `POST /api/booking` | `doctorId`, `slotId` (validated via `bookConsultationSchema`) | Server-side, service-role transaction: locks the slot, checks `patient_profiles.has_used_free_consultation`, either creates a free `consultations` row directly or creates a Razorpay order and returns its ID for checkout |
| `POST /api/webhooks/razorpay` (consultation payments) | Razorpay event, signature-verified | On payment success: marks the `consultations` row paid, flips `has_used_free_consultation` if this was the patient's first, marks the slot booked |

This mirrors the Undertow pattern: there is no client-facing "create a
paid consultation" action — the webhook is the only writer, which is
also what makes the Day 2 RLS (no client insert policy on
`consultations`) correct.

## Doctor subscriptions — `app/doctor/billing/actions.ts`, `app/api/webhooks/razorpay-subscription/route.ts` (Day 7)

| Endpoint | Input | Behavior |
|---|---|---|
| `startSubscription()` | — | Creates a Razorpay subscription for the signed-in doctor, returns the checkout URL |
| `POST /api/webhooks/razorpay-subscription` | Razorpay event, signature-verified | Writes `doctor_subscriptions.status`/`current_period_end` — the only writer, per Day 2's RLS |

## Video — `app/api/video/room/route.ts` (Day 10)

| Endpoint | Input | Behavior |
|---|---|---|
| `POST /api/video/room` | `consultationId` | Server-side only: confirms the caller is the doctor or patient on that consultation (mirrors the RLS check), creates or fetches the 100ms room, returns a join token scoped to that one room |

## Reviews — `app/doctor/[id]/actions.ts` (Day 11)

| Action | Input | Behavior |
|---|---|---|
| `submitReview(formData)` | `consultationId`, `rating`, `comment?` (validated via `reviewSchema`) | Insert relies on the Day 2 RLS policy (`reviews_insert_own_completed`) rather than an application-level check — the database is the source of truth for "was this consultation actually completed by this patient" |

## Provider accounts needed before Day 4

- **Razorpay** — test-mode API keys, plus a subscription plan per doctor pricing tier.
- **Google OAuth** — a Google Cloud OAuth client for "Sign in with Google."
- **Microsoft OAuth** — an Entra ID (Azure AD) app registration for "Sign in with Outlook."
- **100ms** — an account and app access key for video rooms (Day 10 build, but worth creating the account now alongside the others).
