# Vaidya — data model (draft, built in Supabase on Day 2)

| Table | Key columns | Notes |
|---|---|---|
| `profiles` | `id` (→ auth.users), `role` (`doctor` \| `patient`), `full_name`, `phone`, `consent_given_at`, `created_at` | Base identity row for every user, either role |
| `doctor_profiles` | `user_id`, `specialization`, `qualifications`, `license_number`, `license_document_path`, `verification_status` (`pending`\|`verified`\|`rejected`), `city`, `bio`, `consultation_fee_cents` | `city` is free text — no fixed launch list |
| `patient_profiles` | `user_id`, `date_of_birth`, `gender`, `city`, `has_used_free_consultation` | Deliberately minimal — no health history collected at launch |
| `availability_slots` | `id`, `doctor_id`, `start_time`, `end_time`, `is_booked` | One row per bookable slot |
| `consultations` | `id`, `doctor_id`, `patient_id`, `slot_id`, `status` (`scheduled`\|`completed`\|`cancelled`\|`no_show`), `is_free`, `fee_cents`, `razorpay_payment_id`, `video_room_url`, `created_at` | Written server-side only, from the booking action and the Razorpay webhook |
| `doctor_subscriptions` | `doctor_id`, `razorpay_subscription_id`, `status`, `current_period_end` | Gates search visibility when combined with `verification_status` |
| `reviews` | `id`, `consultation_id`, `doctor_id`, `patient_id`, `rating`, `comment`, `created_at` | Only insertable for a patient's own `completed` consultation |

## Row Level Security summary

- `profiles`, `patient_profiles`: owner-only read/write (`auth.uid() = user_id`).
- `doctor_profiles`: owner read/write for their own row; **public** read only
  for rows that are `verified` and have an active subscription (join against
  `doctor_subscriptions`).
- `availability_slots`: doctor manages their own; public read for open slots
  belonging to searchable doctors.
- `consultations`: readable by the doctor or patient on the row; insert/update
  restricted to service-role (webhook/server action).
- `reviews`: public read; insert restricted to the patient on a `completed`
  consultation they were part of.
- `doctor_subscriptions`: owner (doctor) read-only; writes are service-role.

## Explicitly deferred (not in this schema for launch)

- Health history / EHR fields on `patient_profiles` — out of scope until
  there's a real plan for handling that data under DPDP.
- Multi-slot recurring availability templates — Day 6 ships one-off slots.
- An audit-log table for consultation record access — cut-list item.
