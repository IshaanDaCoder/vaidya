-- Creates the profiles row (and, for patients, an empty patient_profiles
-- row) automatically when a new auth.users row appears, reading `role`
-- from signup metadata. This sidesteps a real timing problem: right
-- after supabase.auth.signUp() with email confirmation pending, there is
-- no active session yet, so a normal RLS-respecting insert from the
-- server action would fail (auth.uid() is null until confirmation). A
-- SECURITY DEFINER trigger writes the row regardless of session state.
--
-- If `role` isn't present in metadata (the OAuth signup path, where role
-- is chosen in a post-login step rather than at signup), the trigger
-- simply does nothing — it must never fail, since a trigger error here
-- would abort user creation entirely.
--
-- doctor_profiles is deliberately NOT created here: it has required
-- columns (specialization, license_number, city) that aren't known at
-- signup, so it's created for real during Day 5's onboarding action.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role text := new.raw_user_meta_data ->> 'role';
begin
  if new_role in ('doctor', 'patient') then
    insert into public.profiles (id, role, consent_given_at)
    values (new.id, new_role, now());

    if new_role = 'patient' then
      insert into public.patient_profiles (user_id)
      values (new.id);
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
