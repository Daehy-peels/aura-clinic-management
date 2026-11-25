-- P0: unify appointment timing on duration (minutes), link auth users to
-- patients, add a staff roster, and expose safe booking RPCs.
-- Run this in the Supabase SQL editor before deploying the app changes.

begin;

-- 1. duration becomes the single source of truth for appointment length.
alter table public.appointments
  add column if not exists duration integer;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'appointments'
      and column_name = 'ended_at'
  ) then
    execute $sql$
      update public.appointments
      set duration = greatest(
        5,
        ceil(extract(epoch from (ended_at - scheduled_at)) / 60)::int
      )
      where duration is null
        and ended_at is not null
        and ended_at > scheduled_at
    $sql$;
    execute 'alter table public.appointments alter column ended_at drop not null';
    execute $sql$comment on column public.appointments.ended_at is 'Deprecated: use duration (minutes) instead.'$sql$;
  end if;
end $$;

update public.appointments set duration = 30 where duration is null;
alter table public.appointments alter column duration set default 30;
alter table public.appointments alter column duration set not null;

-- 2. Link auth users to clinical records.
alter table public.patients
  add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.appointments
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists appointments_scheduled_at_idx on public.appointments (scheduled_at);
create index if not exists appointments_user_id_idx on public.appointments (user_id);
create index if not exists patients_user_id_idx on public.patients (user_id);
create index if not exists patients_email_lower_idx on public.patients (lower(email));

-- Guests may book without a date of birth; staff complete the profile later.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'patients'
      and column_name = 'date_of_birth'
  ) then
    execute 'alter table public.patients alter column date_of_birth drop not null';
  end if;
end $$;

-- 3. Staff roster. Existing accounts are grandfathered in so the current
-- admin/demo user keeps dashboard access after the role gate ships.
create table if not exists public.staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('admin', 'staff', 'practitioner')),
  created_at timestamptz not null default now()
);

insert into public.staff (user_id, email, role)
select id, email, 'admin' from auth.users
on conflict (user_id) do nothing;

-- 4. Public availability: exposes occupied time windows only, never patient data.
create or replace function public.get_booked_slots(p_date date)
returns table (starts_at timestamp, duration_minutes integer)
language sql
security definer
set search_path = public, pg_temp
as $$
  select a.scheduled_at, coalesce(a.duration, 30)
  from public.appointments a
  where a.status <> 'cancelled'
    and a.scheduled_at >= p_date::timestamp
    and a.scheduled_at < (p_date + 1)::timestamp
  order by a.scheduled_at;
$$;

-- 5. Public booking: match or create the patient, reject overlaps, then insert.
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
set search_path = public, pg_temp
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
  if p_duration is null or p_duration < 5 then
    raise exception 'invalid_duration';
  end if;

  if exists (
    select 1
    from public.appointments a
    where a.status <> 'cancelled'
      and a.scheduled_at < p_scheduled_at + make_interval(mins => p_duration)
      and a.scheduled_at + make_interval(mins => coalesce(a.duration, 30)) > p_scheduled_at
  ) then
    raise exception 'slot_taken';
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

  return json_build_object(
    'appointment_id', v_appointment_id,
    'patient_id', v_patient_id
  );
end;
$$;

revoke all on function public.get_booked_slots(date) from public;
revoke all on function public.create_booking(text, text, text, text, text, timestamp, integer, text) from public;
grant execute on function public.get_booked_slots(date) to anon, authenticated;
grant execute on function public.create_booking(text, text, text, text, text, timestamp, integer, text) to anon, authenticated;

grant select on public.staff to authenticated;
grant select, insert, update, delete on public.patients to authenticated;
grant select, insert, update, delete on public.appointments to authenticated;

commit;
