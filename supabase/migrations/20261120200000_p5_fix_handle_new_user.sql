-- P5: fix handle_new_user() trigger to avoid duplicate patient creation on signup.
-- Run after the P4 migrations.
--
-- Problem: The remote auth.users trigger on_auth_user_created calls
-- public.handle_new_user(), which previously inserted a new row into public.patients
-- with the new Auth user's email. When that email already existed as an unclaimed
-- guest patient record (user_id IS NULL), the INSERT violated the
-- patients_email_key UNIQUE constraint (error 23505), causing registration to fail.
--
-- Fix: Replace handle_new_user() so that on new Auth user creation it:
--   1. Normalizes the email consistently (lowercase, trimmed).
--   2. Does NOT claim any existing patient record — ownership is established
--      only by claim_my_patient_record() after email confirmation.
--   3. Does NOT backfill appointments to an unconfirmed Auth user.
--   4. Skips creating a new patient record when one already exists with this email.
--   5. Creates a new patient record only when no matching patient exists.
--   6. Uses INSERT ... ON CONFLICT (email) DO NOTHING for concurrent safety.
--   7. Preserves SECURITY DEFINER and SET search_path = ''.
--   8. Preserves the UNIQUE(email) constraint.
--
-- claim_my_patient_record() remains responsible for claiming existing guest
-- patient records and backfilling appointments, and it continues to require
-- email_confirmed_at IS NOT NULL.
--
-- Does not modify RLS policies, RPC permissions, or the UNIQUE email constraint.
-- Does not delete patient records or Auth users.
-- Does not assign user_id inside the Auth creation trigger.

begin;

-- 1. Replace public.handle_new_user() with the corrected trigger function
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_patient_id uuid;
begin
  -- Normalize email consistently with application logic
  v_email := lower(trim(coalesce(NEW.email, '')));

  if v_email = '' then
    return NEW;
  end if;

  -- Idempotent: if this Auth user already owns a patient record, skip
  select p.id into v_patient_id
  from public.patients p
  where p.user_id = NEW.id
  limit 1;

  if v_patient_id is null then
    -- Skip creation if a patient already exists with this email (case-insensitive).
    -- This never assigns user_id to an existing record; ownership is established
    -- only by claim_my_patient_record() after email confirmation.
    select p.id into v_patient_id
    from public.patients p
    where lower(p.email) = v_email
    limit 1;
  end if;

  -- Create a new patient record only when no matching patient exists.
  -- ON CONFLICT (email) DO NOTHING handles concurrent registrations with the
  -- same normalized email: one INSERT succeeds, the others are silently skipped.
  if v_patient_id is null then
    insert into public.patients (
      first_name,
      last_name,
      email,
      phone
    )
    values (
      trim(coalesce(NEW.raw_user_meta_data->>'first_name', '')),
      trim(coalesce(NEW.raw_user_meta_data->>'last_name', '')),
      v_email,
      nullif(trim(coalesce(NEW.raw_user_meta_data->>'phone', '')), '')
    )
    on conflict (email) do nothing
    returning id into v_patient_id;
  end if;

  return NEW;
end;
$$;

-- 2. Ensure the on_auth_user_created trigger exists on auth.users
do $$
begin
  if not exists (
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created'
      and n.nspname = 'auth'
      and c.relname = 'users'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row
      execute function public.handle_new_user();
  end if;
end $$;

commit;
