# Bookly — B2B Appointment Booking Platform

A complete take-home implementation for the Hanabi Technologies B2B Appointment Booking Platform assignment. The implementation is intentionally focused on one coherent end-to-end journey: System Owner onboarding → Business Admin configuration → public customer booking → admin appointment management.

The assignment asks for multi-tenancy, server-side authorization, availability-derived slots, conflict protection, validation, tests, responsive UI, a README, a Vercel deployment and implementation/final walkthrough recordings. This repository covers the application and engineering artifacts; deployment/video links are environment-specific and must be added after deployment/recording. See the original assignment for the submission checklist.

## Stack

- Next.js 15 + React 19 + TypeScript
- PostgreSQL + Prisma
- JWT session in an HTTP-only cookie
- Zod validation
- Luxon for timezone-aware slot generation
- Vitest for booking business-logic tests
- Plain CSS for a dependency-light responsive UI

## Local setup

1. Install Node.js 20+.
2. Start PostgreSQL:

```bash
docker compose up -d
```

3. Copy environment variables:

```bash
cp .env.example .env
```

4. Install packages:

```bash
npm install
```

5. Apply the database migration and generate Prisma Client:

```bash
npx prisma migrate dev
npx prisma generate
```

6. Seed the demo accounts/data:

```bash
npm run db:seed
```

7. Start the app:

```bash
npm run dev
```

Open http://localhost:3000.

## Demo credentials

- System Owner: `owner@demo.local` / `Owner123!`
- Business Admin: `admin@acme.local` / `Admin123!`
- Public booking page: `/book/acme-consulting`

For a real deployment, change credentials and use a secret stored in Vercel environment variables. The seeded password values are demo-only.

## Product flow

### 1. System Owner

- Sign in at `/login`.
- Open the Owner dashboard.
- Create a business with basic contact information and an initial Business Admin.
- Enable/disable tenant accounts.

### 2. Business Admin

- Sign in using the onboarded admin account.
- Maintain the business profile.
- Create/activate/deactivate services with a duration.
- Define weekly availability.
- View and manage appointments.
- Open the public booking page.

### 3. End Customer

- Visit `/book/{business-slug}`.
- Select an active service and date.
- See only valid future slots generated from the tenant's weekly availability.
- Enter customer details and confirm.
- Receive a tokenized confirmation page.
- Use the booking token + email to cancel a confirmed appointment.

## Architecture

This is a single Next.js application with route handlers acting as the backend API. This keeps the take-home easy to run and deploy while maintaining clear boundaries:

```text
src/
  app/                 UI pages + API route handlers
  components/          shared UI
  lib/
    auth.ts             session/authentication
    booking.ts          pure booking conflict rules
    slots.ts            timezone-aware slot generation
    validation.ts       Zod request validation
    prisma.ts           database client
prisma/
  schema.prisma         core data model
  migrations/           PostgreSQL schema + exclusion constraint
  seed.ts               reviewer demo data
 tests/
  booking.test.ts       booking rule tests
```

## Data model

- **Tenant** — one onboarded business/customer. Holds profile, timezone and enabled status.
- **User** — System Owner or Business Admin. A Business Admin has exactly one `tenantId`.
- **Service** — belongs to one tenant and defines name/duration/status.
- **AvailabilityRule** — weekly day/time window owned by one tenant.
- **Appointment** — belongs to one tenant and service, stores customer details, UTC start/end, lifecycle status and a unique booking token.

The implementation intentionally models one shared bookable calendar/resource per tenant. That is a reasonable scope choice because the assignment says staff/resources are only required if the design needs them. If multiple staff calendars were needed, `resourceId` would be added to the appointment and the overlap constraint would be scoped by `(tenantId, resourceId)`.

## Tenant isolation and authorization

Authorization is enforced in the backend, not just the UI.

- Owner APIs call `requireRole(SYSTEM_OWNER)`.
- Admin APIs call `requireRole(BUSINESS_ADMIN)`.
- Admin queries always include `tenantId` from the signed session rather than trusting a tenant ID supplied by the browser.
- Updates/deletes use both the resource ID and session tenant ID (`updateMany/deleteMany`) so a Business Admin cannot mutate another tenant's resource even with a manually crafted request.
- Public booking endpoints resolve the tenant from the business slug and verify that the selected service belongs to that same tenant.
- Disabled tenants are rejected by login/admin authorization and public booking endpoints.

The middleware also prevents unauthenticated navigation to `/owner` and `/admin`; the API remains the security boundary.

## End customer authentication decision

The assignment allows a reasonable choice. End Customers do not need a full account. A successful booking creates a unique opaque `bookingToken`. The confirmation URL contains that token, and cancellation additionally requires the booking email. This gives a low-friction booking experience while avoiding password/account management that is outside the assignment scope.

For production, the token URL should be treated as a bearer credential, rate-limited, logged carefully and optionally supplemented with an email OTP.

## Availability and timezone strategy

Each tenant has an IANA timezone, e.g. `Asia/Kolkata`.

- Weekly rules are stored as local wall-clock `HH:mm` values plus `dayOfWeek`.
- Slot generation interprets those rules in the tenant timezone.
- Appointment timestamps are stored as PostgreSQL timestamps representing UTC instants.
- The booking API re-generates the requested day's slots immediately before insertion, so stale browser data is not enough to book an invalid slot.
- Slots are generated every 15 minutes and only when the entire service duration fits inside an availability rule.
- Past slots are excluded.

## Double-booking strategy

There are two layers:

1. The API checks current appointments before creating a booking.
2. PostgreSQL has a **database-level exclusion constraint** using `tstzrange(startAt, endAt, '[)')` scoped to the tenant and active appointment statuses.

The database constraint is the important concurrency protection: if two requests pass the application-level check at nearly the same time, PostgreSQL still rejects the overlapping insert. Cancelled appointments are excluded from the constraint and therefore stop blocking availability.

## Appointment lifecycle

`CONFIRMED → COMPLETED`

`CONFIRMED → CANCELLED`

`CONFIRMED → NO_SHOW`

Only confirmed appointments can be cancelled by the customer. Admins can update the lifecycle from the dashboard.

## Testing

Run:

```bash
npm test
```

The tests cover:

- overlapping appointments are rejected;
- adjacent appointments are allowed;
- cancelled appointments do not block a slot;
- unavailable slots are rejected.

The PostgreSQL exclusion constraint is also part of the production database migration and is the concurrency backstop.

## Vercel deployment

1. Create a managed PostgreSQL database (Neon, Supabase, Railway, etc.).
2. Push the repository to GitHub.
3. Import the repository into Vercel.
4. Add `DATABASE_URL`, `AUTH_SECRET` and `NEXT_PUBLIC_APP_URL` as Vercel environment variables.
5. Run the migration against the production database before first use:

```bash
npx prisma migrate deploy
npx prisma generate
```

6. Seed only if a demo account is required:

```bash
npx prisma db seed
```

7. Verify `/login`, the Owner flow, an Admin flow and `/book/acme-consulting` (or the created tenant's slug).

Add the final Vercel URL and working reviewer credentials to the submission. The implementation and final walkthrough recording links are also intentionally deployment-specific and should be added after recording.

## Assumptions and known limitations

- One shared calendar/resource per tenant; no individual staff scheduling UI.
- No payments, email or SMS integrations because the assignment explicitly marks them as not required.
- End-customer access uses booking token + email rather than a persistent customer account.
- Admin appointment date filtering is a simple API filter; the UI displays dates in the browser's locale. A production version would use explicit tenant-zone formatting everywhere.
- Rate limiting, CSRF protection beyond SameSite cookies, audit logs, email verification and password reset are outside the take-home scope.

## What I would improve with more time

- Staff/resource calendars and resource-specific availability.
- Email confirmations and cancellation notifications.
- Customer OTP authentication and a customer booking history.
- Stronger rate limiting and security headers.
- Integration tests against a real PostgreSQL test database, including concurrent booking attempts.
- More granular appointment filters, pagination and calendar views.
- Automated deployment checks and observability.

## Customer Portal

Customers have a separate account flow at `/customer/login`. They can register with name, email, phone (optional), and password, or sign in to an existing account. The portal at `/customer` lists all appointments matching the authenticated customer's email, including bookings made before the account was created, and allows cancellation of confirmed appointments. Customer authentication uses a separate HTTP-only `customer_session` cookie and never grants Business Admin or System Owner access.

After adding the Customer model, run `npx prisma migrate dev --name add_customer_accounts` (or `npm run db:push` for local development) before starting the app.
