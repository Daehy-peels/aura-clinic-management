-- P4: least-privilege table grants.
-- Run after the P3 migrations.
--
-- Records a permission correction already applied directly in the Supabase
-- production SQL Editor. Revokes all table-level privileges from anon and
-- authenticated on patients, appointments, and staff, then re-grants only the
-- privileges needed by authenticated roles. Public booking continues to work
-- through the SECURITY DEFINER create_booking RPC, which executes as the
-- function owner and does not require anon table privileges.
--
-- No RLS policies or RPC permissions are changed by this migration.
-- This migration records a change already applied and verified remotely.
-- Do not re-run against a database where this has already been applied.

begin;

revoke all privileges
on table
    public.patients,
    public.appointments,
    public.staff
from anon;

revoke all privileges
on table
    public.patients,
    public.appointments,
    public.staff
from authenticated;

grant select
on table public.staff
to authenticated;

grant select, insert, update, delete
on table
    public.patients,
    public.appointments
to authenticated;

commit;
