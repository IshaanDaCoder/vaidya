-- Vaidya — initial schema
-- profiles (role-discriminated), doctor_profiles, patient_profiles,
-- availability_slots, doctor_subscriptions, consultations, reviews.
--
-- RLS is scoped by relationship, not just ownership: a doctor can read a
-- patient's profile/patient_profiles rows only through an existing
-- consultations link, never the full patient table. Money- and
-- trust-critical fields (verification_status, has_used_free_consultation)
-- are additionally protected by triggers so a client can't self-grant
-- verification or reset their own free-consultation eligibility, even
-- though they're covered by an otherwise-permissive "update own row"
-- policy.

create extension if not exists "pgcrypto";

-- ---------- profiles ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('doctor', 'patient')),
  full_name text,
  phone text,
  consent_given_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ---------- doctor_profiles ----------
create table if not exists public.doctor_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  specialization text not null,
  qualifications text,
  license_number text not null,
  license_document_path text,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'verified', 'rejected')),
  city text not null,
  bio text,
  consultation_fee_cents integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.doctor_profiles enable row level security;

-- ---------- doctor_subscriptions ----------
-- Declared before the doctor_profiles select policy below, which joins
-- against it to decide public search visibility.
create table if not exists public.doctor_subscriptions (
  doctor_id uuid primary key references public.doctor_profiles (user_id) on delete cascade,
  razorpay_subscription_id text,
  status text not null default 'inactive'
    check (status in ('inactive', 'active', 'cancelled', 'past_due')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

alter table public.doctor_subscriptions enable row level security;

create policy "doctor_subscriptions_select_own" on public.doctor_subscriptions
  for select using (auth.uid() = doctor_id);
-- No insert/update/delete policy: subscription status is written only by
-- the Razorpay webhook handler via the service-role key.

-- doctor_subscriptions has its own RLS (owner-only select), so a plain
-- join/EXISTS against it from another table's policy would be silently
-- blocked for anon/patient callers and always evaluate false. This
-- SECURITY DEFINER function runs as its owner (the table owner, which
-- has an implicit RLS bypass since FORCE ROW LEVEL SECURITY is never
-- set on these tables), so it can legitimately check subscription status
-- on behalf of any caller without exposing the subscriptions table itself.
create or replace function public.is_doctor_bookable(doctor uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.doctor_profiles d
    join public.doctor_subscriptions s on s.doctor_id = d.user_id
    where d.user_id = doctor
      and d.verification_status = 'verified'
      and s.status = 'active'
  );
$$;

create policy "doctor_profiles_select" on public.doctor_profiles
  for select using (
    user_id = auth.uid()
    or public.is_doctor_bookable(user_id)
  );
create policy "doctor_profiles_insert_own" on public.doctor_profiles
  for insert with check (auth.uid() = user_id);
create policy "doctor_profiles_update_own" on public.doctor_profiles
  for update using (auth.uid() = user_id);

-- A doctor's own "update own row" policy above would otherwise let them
-- set verification_status = 'verified' themselves. Revert any change to
-- that column unless the request is running as the service role.
create or replace function public.protect_doctor_verification()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.verification_status is distinct from old.verification_status
     and auth.role() <> 'service_role' then
    new.verification_status := old.verification_status;
  end if;
  return new;
end;
$$;

drop trigger if exists doctor_profiles_protect_verification on public.doctor_profiles;
create trigger doctor_profiles_protect_verification
  before update on public.doctor_profiles
  for each row execute function public.protect_doctor_verification();

-- ---------- patient_profiles ----------
create table if not exists public.patient_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  date_of_birth date,
  gender text,
  city text,
  has_used_free_consultation boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.patient_profiles enable row level security;

create policy "patient_profiles_select_own" on public.patient_profiles
  for select using (auth.uid() = user_id);
create policy "patient_profiles_insert_own" on public.patient_profiles
  for insert with check (auth.uid() = user_id);
create policy "patient_profiles_update_own" on public.patient_profiles
  for update using (auth.uid() = user_id);

-- Same self-grant problem as verification_status, but for the
-- platform-wide free-consultation flag: without this trigger a patient
-- could flip it back to false via their own "update own row" access and
-- claim a free consultation more than once.
create or replace function public.protect_free_consultation_flag()
returns trigger
language plpgsql
security definer
as $$
begin
  if new.has_used_free_consultation is distinct from old.has_used_free_consultation
     and auth.role() <> 'service_role' then
    new.has_used_free_consultation := old.has_used_free_consultation;
  end if;
  return new;
end;
$$;

drop trigger if exists patient_profiles_protect_free_flag on public.patient_profiles;
create trigger patient_profiles_protect_free_flag
  before update on public.patient_profiles
  for each row execute function public.protect_free_consultation_flag();

-- ---------- availability_slots ----------
create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles (user_id) on delete cascade,
  start_time timestamptz not null,
  end_time timestamptz not null,
  is_booked boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.availability_slots enable row level security;

create policy "availability_slots_select" on public.availability_slots
  for select using (
    doctor_id = auth.uid()
    or (is_booked = false and public.is_doctor_bookable(doctor_id))
  );
create policy "availability_slots_all_own" on public.availability_slots
  for all using (doctor_id = auth.uid()) with check (doctor_id = auth.uid());

-- ---------- consultations ----------
-- Declared before the relationship-scoped policies on profiles /
-- patient_profiles / doctor_profiles that join against it.
create table if not exists public.consultations (
  id uuid primary key default gen_random_uuid(),
  doctor_id uuid not null references public.doctor_profiles (user_id) on delete cascade,
  patient_id uuid not null references public.patient_profiles (user_id) on delete cascade,
  slot_id uuid references public.availability_slots (id),
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled', 'no_show')),
  is_free boolean not null default false,
  fee_cents integer not null default 0,
  razorpay_payment_id text,
  video_room_url text,
  created_at timestamptz not null default now()
);

alter table public.consultations enable row level security;

create policy "consultations_select_own" on public.consultations
  for select using (auth.uid() = doctor_id or auth.uid() = patient_id);
-- No insert/update/delete policy: a consultation is created by the
-- booking server action and updated by the Razorpay webhook, both running
-- as the service role. There is no client-facing "create a consultation"
-- write path, which is also what keeps the free-consultation flag honest.

-- ---------- relationship-scoped visibility ----------
-- A doctor can read a patient's base profile and patient_profiles row
-- only if a consultations row actually links them — never the full
-- patient table. Symmetrically, a patient (or anyone) can read a
-- doctor's base profile once that doctor is verified and subscribed,
-- matching doctor_profiles' own public-search visibility above.

create policy "profiles_select_by_treating_doctor" on public.profiles
  for select using (
    role = 'patient'
    and exists (
      select 1 from public.consultations c
      where c.patient_id = profiles.id and c.doctor_id = auth.uid()
    )
  );

create policy "profiles_select_public_doctor" on public.profiles
  for select using (
    role = 'doctor' and public.is_doctor_bookable(id)
  );

create policy "patient_profiles_select_by_treating_doctor" on public.patient_profiles
  for select using (
    exists (
      select 1 from public.consultations c
      where c.patient_id = patient_profiles.user_id and c.doctor_id = auth.uid()
    )
  );

-- ---------- reviews ----------
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  consultation_id uuid not null unique references public.consultations (id) on delete cascade,
  doctor_id uuid not null references public.doctor_profiles (user_id) on delete cascade,
  patient_id uuid not null references public.patient_profiles (user_id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

create policy "reviews_select_public" on public.reviews
  for select using (true);
create policy "reviews_insert_own_completed" on public.reviews
  for insert with check (
    patient_id = auth.uid()
    and exists (
      select 1 from public.consultations c
      where c.id = reviews.consultation_id
        and c.patient_id = auth.uid()
        and c.doctor_id = reviews.doctor_id
        and c.status = 'completed'
    )
  );
-- No update/delete policy: reviews are immutable once posted.

-- ---------- private storage: doctor license documents ----------
insert into storage.buckets (id, name, public)
values ('doctor-documents', 'doctor-documents', false)
on conflict (id) do nothing;

-- Files are stored under a path prefixed with the owning doctor's UID
-- (e.g. "doctor-documents/<uid>/license.pdf"), so this policy scopes
-- access to files under the caller's own UID folder. The service role
-- (used by the admin verification review) bypasses RLS entirely.
drop policy if exists "doctor_documents_owner_access" on storage.objects;
create policy "doctor_documents_owner_access" on storage.objects
  for all using (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'doctor-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
