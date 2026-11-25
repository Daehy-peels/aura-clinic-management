-- P1: patient self-service portal.
-- Run after the P0 migrations. Every function checks auth.uid() so a patient
-- can only touch records linked to their own account.

begin;


create or replace function public.claim_my_patient_record()
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
  v_patient_id uuid;
begin
  if v_uid is null then
    raise exception 'not_authenticated';
  end if;

  select p.id into v_patient_id
  from public.patients p
  where p.user_id = v_uid
  limit 1;

  if v_patient_id is null then
    select u.email into v_email from auth.users u where u.id = v_uid;

    select p.id into v_patient_id
    from public.patients p
    where p.user_id is null
      and v_email is not null
      and lower(p.email) = lower(v_email)
    order by p.created_at asc
    limit 1;

    if v_patient_id is not null then
      update public.patients set user_id = v_uid where id = v_patient_id;
    end if;
  end if;

  if v_patient_id is not null then
    update public.appointments
    set user_id = v_uid
    where patient_id = v_patient_id
      and user_id is null;
  end if;

  return v_patient_id;
end;
$$;

-- 2. Cancel an appointment that belongs to the caller.
create or replace function public.cancel_my_appointment(p_appointment_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments%rowtype;
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
  where id = p_appointment_id;
end;
$$;

-- 3. Move an appointment to a new slot, keeping its treatment duration.
create or replace function public.reschedule_my_appointment(
  p_appointment_id uuid,
  p_scheduled_at timestamp
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.appointments%rowtype;
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

  if exists (
    select 1
    from public.appointments a
    where a.id <> p_appointment_id
      and a.status <> 'cancelled'
      and a.scheduled_at < p_scheduled_at + make_interval(mins => coalesce(v_row.duration, 30))
      and a.scheduled_at + make_interval(mins => coalesce(a.duration, 30)) > p_scheduled_at
  ) then
    raise exception 'slot_taken';
  end if;

  update public.appointments
  set scheduled_at = p_scheduled_at
  where id = p_appointment_id;
end;
$$;

revoke all on function public.claim_my_patient_record() from public;
revoke all on function public.cancel_my_appointment(uuid) from public;
revoke all on function public.reschedule_my_appointment(uuid, timestamp) from public;
grant execute on function public.claim_my_patient_record() to authenticated;
grant execute on function public.cancel_my_appointment(uuid) to authenticated;
grant execute on function public.reschedule_my_appointment(uuid, timestamp) to authenticated;

commit;
