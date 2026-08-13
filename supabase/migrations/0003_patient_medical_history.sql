-- Patient-reported medical history: medications, past medical/surgical
-- history, family history, social history (smoking/alcohol), and
-- height/weight (with BMI auto-derived, not entered separately).
--
-- Kept as its own table rather than added to patient_profiles: this is
-- meaningfully more sensitive data (real medical history vs. basic
-- account info), so keeping it separate makes the RLS policies below
-- easier to audit in isolation, and leaves room to tighten access
-- further later (e.g. a stricter grant) without touching the base
-- profile table.
--
-- RLS mirrors patient_profiles exactly: the patient owns their own row,
-- and a doctor can read it only through an existing consultations link
-- to that patient — never a full patient directory. This is
-- patient-reported data, not a clinical record a doctor writes to; it
-- has no doctor-facing write path.

create table if not exists public.patient_medical_history (
  user_id uuid primary key references public.patient_profiles (user_id) on delete cascade,
  medications text,
  past_medical_history text,
  past_surgical_history text,
  family_history text,
  smoking_status text check (smoking_status in ('never', 'former', 'current')),
  alcohol_use text check (alcohol_use in ('never', 'occasional', 'regular')),
  height_cm numeric(5, 1) check (height_cm is null or height_cm > 0),
  weight_kg numeric(5, 1) check (weight_kg is null or weight_kg > 0),
  bmi numeric(4, 1) generated always as (
    case
      when height_cm is not null and height_cm > 0 and weight_kg is not null
        then round((weight_kg / ((height_cm / 100.0) ^ 2))::numeric, 1)
      else null
    end
  ) stored,
  updated_at timestamptz not null default now()
);

alter table public.patient_medical_history enable row level security;

create policy "patient_medical_history_select_own" on public.patient_medical_history
  for select using (auth.uid() = user_id);
create policy "patient_medical_history_insert_own" on public.patient_medical_history
  for insert with check (auth.uid() = user_id);
create policy "patient_medical_history_update_own" on public.patient_medical_history
  for update using (auth.uid() = user_id);

create policy "patient_medical_history_select_by_treating_doctor" on public.patient_medical_history
  for select using (
    exists (
      select 1 from public.consultations c
      where c.patient_id = patient_medical_history.user_id and c.doctor_id = auth.uid()
    )
  );
