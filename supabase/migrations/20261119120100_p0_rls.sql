-- P0: lock clinical tables down now that the app has a staff roster and the
-- public booking flow goes through security-definer RPCs.
-- Run this AFTER 20261119120000_p0_schema.sql.
--
-- It replaces every existing policy on patients/appointments/staff, so review
-- before applying to a database that has hand-written policies you still need.

begin;

alter table public.patients enable row level security;
alter table public.appointments enable row level security;
alter table public.staff enable row level security;

do $$
declare
  pol record;
begin
  for pol in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('patients', 'appointments', 'staff')
  loop
    execute format('drop policy if exists %I on public.%I', pol.policyname, pol.tablename);
  end loop;
end $$;

-- A staff member can read their own roster row (used by the dashboard gate).
create policy "staff_select_self"
  on public.staff for select to authenticated
  using (user_id = auth.uid());

-- Patients: staff manage everything; a patient can read/update their own record.
create policy "staff_manage_patients"
  on public.patients for all to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid()))
  with check (exists (select 1 from public.staff s where s.user_id = auth.uid()));

create policy "patient_select_self"
  on public.patients for select to authenticated
  using (user_id = auth.uid());

create policy "patient_update_self"
  on public.patients for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Appointments: staff manage everything; patients read only their own bookings.
create policy "staff_manage_appointments"
  on public.appointments for all to authenticated
  using (exists (select 1 from public.staff s where s.user_id = auth.uid()))
  with check (exists (select 1 from public.staff s where s.user_id = auth.uid()));

create policy "patient_select_own_appointments"
  on public.appointments for select to authenticated
  using (user_id = auth.uid());

commit;
