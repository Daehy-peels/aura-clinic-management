-- P2: claim_my_patient_record ownership security.
-- Run after the P1 migrations.
--
-- Replaces public.claim_my_patient_record() with a concurrency-safe version:
--   * Requires confirmed email (email_confirmed_at is not null)
--   * Detects duplicate unclaimed email matches (best-effort under concurrency)
--   * Revalidates email in the patient ownership UPDATE
--   * Uses UPDATE ... RETURNING to establish ownership atomically
--   * Never backfills appointments unless patient ownership was established
--   * Only backfills appointments where user_id IS NULL
--
-- Existing demo data, guest booking, and unrelated functions are unchanged.

begin;

-- 1. Replace claim_my_patient_record() with concurrency-safe implementation
create or replace function public.claim_my_patient_record()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_patient_id uuid;
  v_match_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  -- 1. Already owns a patient record? Return it (idempotent for same user)
  select p.id into v_patient_id
  from public.patients p
  where p.user_id = v_uid
  limit 1;

  if v_patient_id is null then
    -- 2. Require confirmed email
    select u.email into v_email
    from auth.users u
    where u.id = v_uid
      and u.email_confirmed_at is not null;

    if v_email is not null then
      -- 3. Best-effort duplicate detection
      -- NOTE: concurrent inserts can create additional matching rows after this check.
      -- This check may falsely reject under races but never incorrectly claims.
      select count(*) into v_match_count
      from public.patients p
      where p.user_id is null
        and lower(p.email) = lower(v_email);

      if v_match_count = 1 then
        select p.id into v_patient_id
        from public.patients p
        where p.user_id is null
          and lower(p.email) = lower(v_email)
        limit 1;

        -- 4. Atomic ownership establishment with email re-validation
        -- The email check ensures the patient still matches the verified email
        -- at the moment of claiming, preventing a race where a staff member
        -- changed the email between candidate selection and this UPDATE.
        update public.patients
        set user_id = v_uid
        where id = v_patient_id
          and user_id is null
          and lower(email) = lower(v_email)
        returning id into v_patient_id;

        -- 5. If RETURNING is null, someone else claimed it or email changed -> exit safely
        if v_patient_id is null then
          return null;
        end if;
      elsif v_match_count > 1 then
        raise exception 'ambiguous_email_match';
      end if;
    end if;
  end if;

  -- 6. Backfill only unclaimed appointments -- only reached if patient ownership established
  if v_patient_id is not null then
    update public.appointments
    set user_id = v_uid
    where patient_id = v_patient_id
      and user_id is null;
  end if;

  return v_patient_id;
end;
$$;

-- 2. Function permissions
revoke all on function public.claim_my_patient_record() from public;
revoke all on function public.claim_my_patient_record() from anon;
grant execute on function public.claim_my_patient_record() to authenticated;

commit;
