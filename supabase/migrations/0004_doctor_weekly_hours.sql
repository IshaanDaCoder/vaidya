-- Doctor "hours of operation": a recurring weekly template (one row per
-- day of week) that bookable availability_slots rows get generated from,
-- instead of a doctor manually adding every single slot by hand.
--
-- RLS is owner-only, no relationship exception needed: unlike
-- patient-facing data, this is purely a doctor's own scheduling
-- preference and is never read directly by anyone else — patients only
-- ever see the actual generated availability_slots rows, which already
-- have their own public-read policy from Day 2.

create table if not exists public.doctor_weekly_hours (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles (user_id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_duration_minutes integer not null default 30 check (slot_duration_minutes > 0),
  is_active boolean not null default true,
  unique (doctor_id, day_of_week),
  check (end_time > start_time)
);

alter table public.doctor_weekly_hours enable row level security;

create policy "doctor_weekly_hours_all_own" on public.doctor_weekly_hours
  for all using (auth.uid() = doctor_id) with check (auth.uid() = doctor_id);

-- Lets slot generation be idempotent — running "Generate slots" again
-- after hours change just fills in whatever's missing, via
-- `on conflict (doctor_id, start_time) do nothing`, instead of needing
-- to track which slots came from which generation run.
create unique index if not exists availability_slots_doctor_start_unique
  on public.availability_slots (doctor_id, start_time);
