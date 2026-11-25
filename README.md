# Aura Aesthetic Clinic

Aura Aesthetic Clinic is a college demonstration project for an aesthetic clinic management system. It provides public guest booking, patient registration and portal access, and a staff dashboard for managing patients and appointments.

## Core Features

### Public Guest Appointment Booking
Unauthenticated visitors can browse treatments, select a date and time slot, and submit a booking through the public `/book` page. Booking uses Supabase SECURITY DEFINER RPCs, so no direct table privileges are required for anonymous users. Cancelled appointments free up their time slots.

### Patient Registration and Portal
New patients can register at `/portal`. After email confirmation, they can log in and access `/account` to view their profile, upcoming and past appointments, cancel or reschedule eligible visits, and update intake details (phone, date of birth, medical history). Existing guest bookings made with the same email can be claimed after email confirmation.

### Patient Appointment Management
Authenticated patients can view their own appointments only, cancel upcoming visits, and reschedule to available slots. Cross-patient access is prevented by Row Level Security (RLS) policies.

### Staff Dashboard
Authorized staff members access `/dashboard` to view clinic statistics, manage the patient directory, and create, edit, or cancel appointments. Staff access is gated by membership in the `staff` table and enforced both server-side and at the edge middleware level.

### Patient and Appointment Management (Staff)
Staff can create new patient records, edit existing patient profiles, schedule new appointments, update appointment status and timing, and delete records as needed through the dashboard.

## Technology Stack

- **Next.js 16** — App Router, server components, middleware
- **React 19** — Client-side UI
- **TypeScript** — Type safety
- **Tailwind CSS** — Styling
- **Supabase** — PostgreSQL database, Authentication, Row Level Security, and RPC functions

## Prerequisites

- Node.js (v20 or later)
- npm
- A Supabase project (for database and authentication)

## Installation

1. Clone or download the project to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Configure the required environment variables in `.env.local` (see Environment Variables below).
5. Run the development server:
   ```bash
   npm run dev
   ```
6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Environment Variables

The following environment variables are required in `.env.local`:

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL (e.g., `https://xxx.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous public key |

**Important:** The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed in client-side code or committed to version control. It is a server-only secret used only for administrative operations if needed. `.env.local` is already ignored by Git via the `.env*` pattern in `.gitignore`.

Do not include actual secret values in this document or in committed files.

## Database Setup

The project includes seven Supabase migration files in `supabase/migrations/`, to be applied in chronological order:

1. `20261119120000_p0_schema.sql` — Schema foundation: appointment duration column, patient/appointment `user_id` links, staff table, indexes, `get_booked_slots()` and `create_booking()` RPCs, initial table grants.
2. `20261119120100_p0_rls.sql` — Row Level Security enabled on `patients`, `appointments`, and `staff`; policies for staff and patient self-access.
3. `20261119130000_p1_patient_portal.sql` — Original patient portal functions (`claim_my_patient_record`, `cancel_my_appointment`, `reschedule_my_appointment`). Superseded by later security migrations for claim logic.
4. `20261119140000_p2_claim_security.sql` — Replaced `claim_my_patient_record()` with concurrency-safe version requiring confirmed email, duplicate detection, atomic `UPDATE ... RETURNING` ownership claim, and appointment backfill.
5. `20261119150000_p3_booking_concurrency.sql` — Exclusion constraint `appointments_no_overlap` to prevent overlapping non-cancelled appointments; duration CHECK constraint; updated `create_booking`/`cancel_my_appointment`/`reschedule_my_appointment` with constraint violation handling.
6. `20261120190000_p4_least_privilege_grants.sql` — Least-privilege table grants: revokes all table privileges from `anon` and `authenticated`, re-grants only SELECT on `staff` and SELECT/INSERT/UPDATE/DELETE on `patients` and `appointments` to `authenticated`.
7. `20261120200000_p5_fix_handle_new_user.sql` — Fixed `handle_new_user()` trigger function to prevent duplicate patient creation on signup; skips creation if a patient with the email already exists; uses `INSERT ... ON CONFLICT DO NOTHING` for concurrent safety.

### Applying Migrations

**Fresh Supabase project:** Apply the migrations in order using the Supabase SQL Editor or `supabase db push`.

**Existing production project:** These migrations have already been applied to the production database. Do not reapply them unless you are setting up a new environment. The `p5` migration fixes the `handle_new_user()` trigger; apply it only if the trigger has not yet been corrected on your target database.

## Authentication

### Patient Email Confirmation
Registration sends a confirmation email. The patient must click the confirmation link before they can claim an existing guest patient record. Unconfirmed emails cannot establish patient ownership.

### Patient Ownership Claiming
After logging in with a confirmed email, the `/account` page invokes `claim_my_patient_record()`. This RPC atomically links the authenticated user to an existing unclaimed guest patient record with a matching email (case-insensitive), and backfills any unclaimed appointments to that patient. If multiple unclaimed records match, the claim is rejected as ambiguous.

### Staff Login Process
Staff members log in at `/login`. After successful authentication, the application verifies the user exists in the `staff` table. Staff users are redirected to `/dashboard`; non-staff authenticated users are redirected to `/portal`.

### Email Callback Route
`/auth/callback` handles Supabase auth code exchange after email confirmation or sign-in, redirecting patients to `/account` and staff to `/dashboard`.

## Demo Account

Demonstration administrator credentials (for college demo purposes only):

- **Email:** admin@aura.com
- **Password:** Auraadmin123

Use the "Use demo details" button on the login page to auto-fill these credentials. These are demonstration credentials and should not be changed or removed from the application.

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server with Turbopack |
| `npm run build` | Create an optimized production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npx tsc --noEmit` | Run TypeScript type checking |

## Project Structure

| Directory | Description |
|---|---|
| `src/app/` | Next.js App Router pages and layouts |
| `src/app/book/` | Public guest booking page |
| `src/app/(auth)/portal/` | Combined patient login/register page |
| `src/app/account/` | Patient portal (profile, appointments, cancel/reschedule) |
| `src/app/dashboard/` | Staff dashboard (overview, patients, appointments) |
| `src/app/auth/callback/route.ts` | Supabase auth code exchange route |
| `src/lib/supabase/` | Supabase browser and server clients |
| `src/types/` | TypeScript type definitions (`AppointmentStatus`, `Patient`, `Appointment`) |
| `supabase/migrations/` | Seven chronological SQL migration files |
| `supabase/config.toml` | Supabase CLI configuration |

## License

This is a college demonstration project.
