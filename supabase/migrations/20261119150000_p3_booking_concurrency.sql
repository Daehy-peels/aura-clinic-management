-- P3: booking concurrency protection.
-- Run after the P2 migrations.
--
-- Adds an exclusion constraint on public.appointments to prevent
-- overlapping non-cancelled appointments at the database level.
-- Updates RPC functions to handle constraint violations gracefully
-- and to revalidate ownership/status during UPDATEs.
--
-- Existing demo data, guest booking, and unrelated functions are unchanged.
-- NOTE: If existing appointments overlap, the ADD CONSTRAINT will fail.
-- Resolve overlaps before applying this migration.

begin;

-- 0. Ensure status is NOT NULL so NULL statuses cannot bypass the partial
--    exclusion constraint. Existing NULL statuses (none per data audit)
--    would cause this to fail -- resolve before applying.
alter table public.appointments
  alter column status set not null;

-- 1. Add exclusion constraint to prevent overlapping non-cancelled appointments
-- Uses PostgreSQL GiST exclusion with tsrange to detect any time-range overlap.
-- scheduled_at is timestamptz; AT TIME ZONE 'UTC' converts it to a timestamp
-- without time zone, making the expression immutable and safe for exclusion
-- constraints under GiST. coalesce(duration, 30) provides a defensive fallback
-- consistent with the previous conflict-check behavior in case duration is ever
-- NULL. Only non-cancelled appointments participate (cancelled slots are
-- reusable). No btree_gist extension needed since only tsrange && is used (no
-- scalar equality).
alter table public.appointments
  add constraint appointments_no_overlap
  exclude using gist (
    tsrange(
      scheduled_at AT TIME ZONE 'UTC',
      (scheduled_at AT TIME ZONE 'UTC') + make_interval(mins => coalesce(duration, 30)),
      '[)'
    ) with &&
  )
  where (status <> 'cancelled');

alter table public.appointments
  add constraint appointments_duration_reasonable
  check (duration >= 5 and duration <= 480);


create or replace function public.create_booking(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_treatment_type text,
  p_scheduled_at timestamp,
  p_duration integer,
  p_notes text default null
)
returns json
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_patient_id uuid;
  v_appointment_id uuid;
begin
  if p_scheduled_at is null then
    raise exception 'missing_schedule';
  end if;
  if coalesce(trim(p_email), '') = '' then
    raise exception 'missing_email';
  end if;
  if p_duration is null or p_duration < 5 or p_duration > 480 then
    raise exception 'invalid_duration';
  end if;

  select p.id into v_patient_id
  from public.patients p
  where lower(p.email) = lower(trim(p_email))
  limit 1;

  if v_patient_id is null then
    insert into public.patients (first_name, last_name, email, phone)
    values (
      trim(p_first_name),
      trim(p_last_name),
      trim(p_email),
      nullif(trim(p_phone), '')
    )
    returning id into v_patient_id;
  end if;

  begin
    insert into public.appointments (
      patient_id, treatment_type, scheduled_at, duration, status, notes, user_id
    )
    values (
      v_patient_id,
      p_treatment_type,
      p_scheduled_at,
      p_duration,
      'scheduled',
      p_notes,
      auth.uid()
    )
    returning id into v_appointment_id;
  exception when exclusion_violation then
    raise exception 'slot_taken';
  end;

  return json_build_object(
    'appointment_id', v_appointment_id,
    'patient_id', v_patient_id
  );
end;
$$;

-- 4. Update cancel_my_appointment() to revalidate ownership and status during UPDATE
create or replace function public.cancel_my_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments%rowtype;
  v_row_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select * into v_row from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_row.user_id is distinct from v_uid then
    raise exception 'not_authorized';
  end if;
  if v_row.status not in ('scheduled', 'confirmed') then
    raise exception 'not_cancellable';
  end if;

  update public.appointments
  set status = 'cancelled'
  where id = p_appointment_id
    and user_id = v_uid
    and status in ('scheduled', 'confirmed');

  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    raise exception 'not_cancellable';
  end if;
end;
$$;

-- 5. Update reschedule_my_appointment() to revalidate ownership and status during UPDATE
-- and to catch exclusion_violation raised by the database constraint.
create or replace function public.reschedule_my_appointment(
  p_appointment_id uuid,
  p_scheduled_at timestamp
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments%rowtype;
  v_row_count integer;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;
  if p_scheduled_at is null then
    raise exception 'missing_schedule';
  end if;

  select * into v_row from public.appointments where id = p_appointment_id;
  if not found then
    raise exception 'not_found';
  end if;
  if v_row.user_id is distinct from v_uid then
    raise exception 'not_authorized';
  end if;
  if v_row.status not in ('scheduled', 'confirmed') then
    raise exception 'not_reschedulable';
  end if;

  update public.appointments
  set scheduled_at = p_scheduled_at
  where id = p_appointment_id
    and user_id = v_uid
    and status in ('scheduled', 'confirmed');

  get diagnostics v_row_count = row_count;
  if v_row_count = 0 then
    raise exception 'not_reschedulable';
  end if;

  -- The exclusion constraint prevents overlapping appointments at the DB level.
  -- If the new time overlaps with another non-cancelled appointment, the UPDATE
  -- raises exclusion_violation, which we convert to a user-friendly 'slot_taken'.
  exception when exclusion_violation then
    raise exception 'slot_taken';
end;
$$;

-- 6. Update function permissions for consistency with P2 convention
revoke all on function public.create_booking(text, text, text, text, text, timestamp, integer, text) from public;
revoke all on function public.create_booking(text, text, text, text, text, timestamp, integer, text) from anon;
grant execute on function public.create_booking(text, text, text, text, text, timestamp, integer, text) to anon, authenticated;

revoke all on function public.cancel_my_appointment(uuid) from public;
revoke all on function public.cancel_my_appointment(uuid) from anon;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;

revoke all on function public.reschedule_my_appointment(uuid, timestamp) from public;
revoke all on function public.reschedule_my_appointment(uuid, timestamp) from anon;
grant execute on function public.reschedule_my_appointment(uuid, timestamp) to authenticated;

commit;
