# 📅 Bookly — B2B Appointment Booking Platform

Bookly is a full-stack, multi-tenant appointment booking platform. A System Owner onboards business customers ("tenants"), each Business Admin manages their own services, availability, and appointments, and End Customers browse a business's public booking page to book and cancel their own appointments.

**Live demo:** [bookly-nu-seven.vercel.app](https://bookly-nu-seven.vercel.app)

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Architecture & Technology Choices](#-architecture--technology-choices)
- [Data Model](#-data-model)
- [Tenant Isolation & Role Authorization](#-tenant-isolation--role-authorization)
- [Preventing Double Booking](#-preventing-double-booking)
- [End Customer Identification](#-end-customer-identification)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Demo Credentials](#-demo-credentials)
- [Testing](#-testing)
- [Deployment](#-deployment)
- [Assumptions & Known Limitations](#-assumptions--known-limitations)
- [What I'd Improve With More Time](#-what-id-improve-with-more-time)
- [Troubleshooting](#-troubleshooting)
- [Useful Commands](#-useful-commands)
- [Security Notes](#-security-notes)

---

## 🚀 Features

### 👑 System Owner
- Platform-wide authentication, separate from any tenant
- Onboard a new business — creates the tenant **and** its first Business Admin account in a single transaction
- List all onboarded businesses, with admin contact info and appointment counts
- Enable/disable a business; a disabled business can no longer take bookings or let its admin operate

### 🏢 Business Admin
- Authentication scoped to exactly one tenant
- Manage business profile, services (name, duration, status), and weekly availability rules
- View appointments, filterable by date and status
- Update appointment status through a defined lifecycle (`CONFIRMED → COMPLETED / CANCELLED / NO_SHOW`)

### 👤 End Customer
- Public booking page per business (`/book/[slug]`) — no login required to browse
- Optional account (register/login) for a persistent booking history, **or** a token-based link for guest cancellation
- Book a service + valid time slot; slots are computed live from availability rules minus existing bookings
- View and cancel their own appointments

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js (App Router) | Frontend + API routes, single deployable unit |
| React + TypeScript | UI, type safety |
| Prisma | Database ORM + migrations |
| PostgreSQL (Neon) | Primary datastore |
| `jose` | JWT signing/verification for sessions |
| `bcryptjs` | Password hashing |
| `zod` | Server-side input validation |
| `luxon` | Timezone-aware date/time handling |
| `vitest` | Unit tests |
| Vercel | Deployment |

---

## 🏗 Architecture & Technology Choices

**Single Next.js app, no separate backend service.** All API logic lives under `src/app/api/**` as Next.js route handlers. For a project this size, running frontend and backend as one deployable unit removes an entire category of setup/CORS/deploy complexity without sacrificing a clean separation between UI (`src/app/**/page.tsx`), route handlers (`src/app/api/**/route.ts`), and shared business logic (`src/lib/**`). Route handlers stay thin — parse input, call into `src/lib`, return a response — so the actual rules (auth, slot generation, conflict checking) live in one testable place instead of being duplicated across endpoints.

**Three separate authentication surfaces, one mechanism.** System Owner and Business Admin share a `User` table and a JWT cookie (`booking_session`) carrying `{ userId, role, tenantId }`; End Customers get their own `Customer` table and cookie (`customer_session`). Using the same JWT/cookie mechanism for both keeps the auth code small, while keeping the tables and cookies separate reflects that these are genuinely different account types with different lifecycles — a customer never needs a `tenantId`, an admin never registers themselves.

**API routes enforce auth, not just the UI.** `middleware.ts` does a cheap, fast check (does *any* session cookie exist) before a `/owner` or `/admin` page even renders, purely to avoid a flash of protected UI. The actual authority check — is this a valid JWT, does the role match, is the tenant still enabled — happens inside every route handler via `requireRole()` / `requireCustomer()` in `src/lib/auth.ts`. This means the middleware is a UX convenience, not the security boundary; the security boundary is the server-side check that runs on every request regardless of how it was made (browser, curl, or a modified client).

**PostgreSQL over MongoDB**, specifically because of one feature: a range-overlap `EXCLUDE` constraint (see [Preventing Double Booking](#-preventing-double-booking)) that lets the database itself guarantee no two active appointments for the same tenant can overlap, even under concurrent writes. That guarantee is much harder to get right in application code alone.

---

## 🧬 Data Model

```
Tenant (business)
 ├─ users            : User[]              (Business Admins for this tenant)
 ├─ services         : Service[]
 ├─ availability     : AvailabilityRule[]
 └─ appointments     : Appointment[]

User
 ├─ role             : SYSTEM_OWNER | BUSINESS_ADMIN
 └─ tenantId         : null for System Owner, set for Business Admin

Customer                                    (separate from User — see below)
 └─ appointments     : Appointment[]        (optional link, via email or account)

Service
 ├─ tenantId
 ├─ durationMin
 └─ status           : ACTIVE | INACTIVE

AvailabilityRule
 ├─ tenantId
 ├─ dayOfWeek        : 0–6
 └─ startTime/endTime (local business time, "HH:mm")

Appointment
 ├─ tenantId, serviceId, customerId (nullable)
 ├─ startAt/endAt    : UTC timestamps
 ├─ status           : CONFIRMED | COMPLETED | CANCELLED | NO_SHOW
 └─ bookingToken     : unique — lets a guest customer manage a booking without an account
```

**Design decisions worth calling out:**

- **`User` and `Customer` are deliberately separate tables**, not one `User` model with a `CUSTOMER` role. System Owners and Business Admins are platform accounts with a `tenantId`; customers belong to *no* tenant — the same customer can book across multiple businesses. Merging them would have meant a nullable `tenantId` with different meaning per role, which is a common source of bugs.
- **No `Staff`/resource model.** Availability is defined per-tenant, not per-staff-member — Bookly currently models "one shared bookable calendar per business," not per-employee schedules. This was a deliberate scope decision (see [Assumptions](#-assumptions--known-limitations)) — the schema/booking-conflict logic would extend naturally to a `staffId` on `AvailabilityRule` and `Appointment` if per-staff scheduling were needed.
- **`Appointment.customerId` is nullable** so a guest can book with just name/email/phone and manage the booking later via `bookingToken`, without being forced to create an account.

---

## 🔐 Tenant Isolation & Role Authorization

Every privileged request goes through `requireRole(role)` (`src/lib/auth.ts`), which verifies the JWT, checks the role matches what the route requires, and — for Business Admins — re-checks that their tenant is still `enabled` on every single request (so disabling a business takes effect immediately, not just at next login).

Tenant scoping is then enforced **at the query level**, not just at the auth-check level — every Business Admin query includes `tenantId: session.tenantId` directly in the `where` clause:

```ts
// GET /api/admin/services
await prisma.service.findMany({ where: { tenantId: s.tenantId! } });

// PATCH /api/admin/appointments/[id]  — note updateMany + tenantId, not findUnique + update
await prisma.appointment.updateMany({
  where: { id, tenantId: s.tenantId! },
  data: { status },
});
```

The `updateMany`-with-`tenantId` pattern is intentional: if a Business Admin from Tenant A crafts a request for an appointment `id` that actually belongs to Tenant B, the `where` clause matches zero rows. The API returns a generic 404, identical to what it would return for a nonexistent ID — it never confirms or denies that the resource exists under another tenant. This was verified by hand: authenticating as Tenant A's admin and calling `PATCH /api/admin/appointments/{tenant-B-appointment-id}` returns `404 Not found`, not `403 Forbidden`.

The System Owner role is the one exception by design — its routes (`/api/owner/**`) intentionally query across all tenants, since platform management is its whole job.

---

## 🔒 Preventing Double Booking

Conflict prevention happens at **two layers**, deliberately redundant:

1. **Application layer** (`src/lib/slots.ts`, `src/lib/booking.ts`) — before showing available times, `generateSlots()` builds every possible slot from the tenant's `AvailabilityRule`s and subtracts anything that overlaps an existing `CONFIRMED`/`COMPLETED`/`NO_SHOW` appointment. When a booking request comes in, the server re-runs `generateSlots()` and rejects the request with `409` if the requested time isn't in that freshly computed list — closing the window between "customer saw a slot" and "customer submitted the booking."

2. **Database layer** (the layer that actually matters under concurrency) — a PostgreSQL `EXCLUDE` constraint added directly in the migration SQL:

   ```sql
   CREATE EXTENSION IF NOT EXISTS btree_gist;

   ALTER TABLE "Appointment"
     ADD CONSTRAINT "Appointment_no_overlap"
     EXCLUDE USING gist (
       "tenantId" WITH =,
       tsrange("startAt", "endAt", '[)') WITH &&
     )
     WHERE ("status" IN ('CONFIRMED', 'COMPLETED', 'NO_SHOW'));
   ```

   This tells Postgres: for a given tenant, no two rows with an "active" status may have overlapping `[startAt, endAt)` ranges — full stop, enforced by the database itself, regardless of how many requests arrive at the same instant. If two customers race for the same slot, the first `INSERT` wins and the second raises a constraint violation, which the API catches and turns into a clean `409 "That slot was just booked by someone else."` response instead of a 500.

   A cancelled appointment (`status = CANCELLED`) is excluded from the constraint's `WHERE` clause, so cancelling correctly frees the slot for rebooking — this is also covered by a unit test (`tests/booking.test.ts`, "ignores cancelled bookings").

Layer 1 gives a fast, friendly rejection in the common case. Layer 2 is what actually makes the guarantee true under real concurrent load — application-level checks alone (read-then-write) can never fully close a race condition; only a database constraint can.

---

## 🙋 End Customer Identification

Customers get a **real account system** (`Customer` table, bcrypt-hashed password, JWT session in a `customer_session` cookie) rather than just an email field — this was chosen over anonymous/email-only identification so a customer can see all of their past and upcoming appointments across businesses in one place (`/customer`), not just the one they just booked.

To avoid forcing an account on someone who just wants to book once, every booking also gets a unique `bookingToken`. The confirmation page and a `/booking/[token]` link let a guest view and cancel that specific appointment without ever logging in — the token acts as a capability/bearer credential scoped to exactly one appointment, not to the customer's whole history.

---

## 📁 Project Structure

```text
Bookly/
├── middleware.ts                          # Lightweight route-guard (cookie presence only)
├── docker-compose.yml                     # Local PostgreSQL for development
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts                            # Creates demo Owner + Business Admin + tenant
│   └── migrations/
│       ├── ..._init/                      # Core schema + the EXCLUDE overlap constraint
│       └── ..._add_customer/              # Adds the Customer table
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/                      # Owner/Admin login, logout, me
│   │   │   ├── customer/
│   │   │   │   ├── auth/                  # Customer register, login, logout, me
│   │   │   │   └── appointments/          # Customer's own bookings + cancel (+ by-token)
│   │   │   ├── owner/businesses/          # Onboard/list/enable/disable tenants
│   │   │   ├── admin/
│   │   │   │   ├── business/              # Business profile
│   │   │   │   ├── services/              # CRUD, tenant-scoped
│   │   │   │   ├── availability/          # CRUD, tenant-scoped
│   │   │   │   └── appointments/          # List/filter, update status, tenant-scoped
│   │   │   └── public/businesses/[slug]/  # Public: business info, availability, booking
│   │   ├── owner/            admin/            customer/       # Dashboards
│   │   ├── login/            customer/login/                   # Login pages
│   │   └── book/[slug]/      booking/[token]/                  # Public booking + guest view
│   ├── components/
│   └── lib/
│       ├── auth.ts           # Sessions, hashing, requireRole / requireCustomer
│       ├── booking.ts        # overlaps() / canBookSlot() — unit tested
│       ├── slots.ts          # Timezone-aware slot generation
│       ├── validation.ts     # Zod schemas for every input
│       ├── http.ts           # ok()/error() response helpers
│       └── prisma.ts         # Prisma client singleton
├── tests/
│   └── booking.test.ts       # Overlap + conflict-rule unit tests
├── .env.example
└── package.json
```

---

## 🏁 Getting Started

### 1. Requirements

- Node.js 18+, npm, Git
- A PostgreSQL database — Neon (recommended), Supabase, or the included `docker-compose.yml` for a local instance

### 2. Clone & Install

```bash
git clone https://github.com/shruthisagzzz/Bookly.git
cd Bookly
npm install
```

### 3. Database

**Option A — Neon (cloud):** create a project at [neon.tech](https://neon.tech), copy the connection string from the **Connect** panel.

**Option B — local, via Docker:**

```bash
docker compose up -d
# gives you postgresql://postgres:postgres@localhost:5432/booking_platform
```

### 4. Environment Variables

Copy the example file and fill it in:

```bash
cp .env.example .env
```

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon or local) |
| `AUTH_SECRET` | Yes | 32+ random characters, signs the session JWTs |
| `NEXT_PUBLIC_APP_URL` | Yes | Base URL, e.g. `http://localhost:3000` |
| `SEED_OWNER_PASSWORD` | No | Overrides the seeded Owner password (defaults to `Owner123!`) |
| `SEED_ADMIN_PASSWORD` | No | Overrides the seeded Admin password (defaults to `Admin123!`) |

### 5. Migrate & Seed

```bash
npx prisma migrate dev
npx prisma db seed
```

This applies all migrations — **including the `EXCLUDE` overlap constraint**, which requires the `btree_gist` extension (created automatically by the migration) — and seeds a demo Owner, one demo Business (`acme-consulting`) with an admin, a service, and weekday availability.

### 6. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🔐 Demo Credentials

| Role | Email | Password | Where |
|---|---|---|---|
| System Owner | `owner@demo.local` | `Owner123!` | `/login` |
| Business Admin (Acme Consulting) | `admin@acme.local` | `Admin123!` | `/login` |
| End Customer | *register your own at* `/customer/login` | — | Public flow |

Try the public booking flow without any login at `/book/acme-consulting`.

---

## 🧪 Testing

```bash
npm test
```

`tests/booking.test.ts` covers the assignment's core requirement — booking validity and conflict behavior:

- Overlapping ranges are correctly detected
- Adjacent (back-to-back) appointments are correctly **not** flagged as conflicts
- A cancelled appointment does not block the slot it used to occupy
- An unavailable slot is rejected regardless of conflicts

These are unit tests against the pure functions in `src/lib/booking.ts`. See [What I'd Improve](#-what-id-improve-with-more-time) for the integration-test gap.

---

## 🚀 Deployment

Deployed on Vercel, connected to a Neon production database.

1. Import the repo into Vercel (auto-detects Next.js).
2. Set `DATABASE_URL`, `AUTH_SECRET`, `NEXT_PUBLIC_APP_URL` under **Project → Settings → Environment Variables**, pointing at the **production** Neon database.
3. Apply migrations against production once, then on every schema change:
   ```bash
   npx prisma migrate deploy
   ```
4. Redeploy after any environment variable change (Vercel doesn't pick these up on existing builds).

---

## 📌 Assumptions & Known Limitations

- **One shared calendar per tenant, no per-staff scheduling.** Availability is defined at the business level, not per employee/resource. Extending to per-staff availability would mean adding a `Staff` model and a `staffId` on `AvailabilityRule`/`Appointment`, and widening the `EXCLUDE` constraint's partition key from `tenantId` to `(tenantId, staffId)`.
- **Timezone is set once per tenant** (`Tenant.timezone`, default `Asia/Kolkata`) and applied to all of that business's availability and slot display. There's no per-appointment or per-customer timezone override — a customer in a different timezone sees times labeled in the *business's* timezone, which is a reasonable default for a single-location service business but wouldn't fit a fully remote/global one.
- **No email/SMS notifications** — explicitly out of scope per the assignment. Confirmation is shown on-screen and via the `bookingToken` link.
- **Business Admin accounts are created by the System Owner directly** (email + password set at onboarding time), not via an email invitation flow — simpler to build and test, and functionally equivalent for this assignment's purposes, but a real product would likely use an invite-token + admin-sets-own-password flow instead.
- **Slot granularity is fixed at 15-minute increments** (`src/lib/slots.ts`), not configurable per business.
- **No soft-delete / audit trail** for services or availability rules — updates overwrite in place.
- **Middleware only checks cookie presence**, not JWT validity or role, for `/owner` and `/admin` page routes. This is a UX-only guard against a flash of protected UI; the actual authorization boundary is the per-request check inside every API route handler, which does fully validate the JWT and role. A Business Admin visiting `/owner/*` would see the page shell but every data-fetching call underneath would still be correctly rejected with 401 by `requireRole(SYSTEM_OWNER)`.

---

## 🔭 What I'd Improve With More Time

1. **Integration test for the concurrency guarantee.** The current tests validate the *logic* of `canBookSlot()`/`overlaps()` in isolation; I'd add a test that fires two simultaneous `POST /api/public/businesses/[slug]/appointments` requests for the same slot against a real (test) database and asserts exactly one succeeds — that's the test that actually exercises the `EXCLUDE` constraint, which is the part doing the real work under load.
2. **Per-staff availability**, as described above, since real businesses with more than one person taking appointments will need it.
3. **Stronger middleware.** Verify the JWT and role in `middleware.ts` itself (not just cookie presence), so an unauthorized role gets redirected before any page code runs, rather than relying entirely on the API layer.
4. **Admin invite flow** for Business Admins instead of the System Owner setting an initial password directly.
5. **Rate limiting** on the public booking and login endpoints — currently unthrottled.
6. **Structured logging/audit trail** for status changes and cross-tenant admin actions, useful for a real support/ops workflow.

---

## 🐛 Troubleshooting

**Prisma Client is missing a model**
```text
Property 'customer' does not exist on type 'PrismaClient'
```
Confirm the model exists in `prisma/schema.prisma`, then run `npx prisma generate`.

**Cannot reach database server**
```text
P1001: Can't reach database server
```
Check `DATABASE_URL`, that the Neon project/branch is active, that `sslmode=require` is present, and that `.env` is in the project root.

**Migration fails with `btree_gist` / `EXCLUDE` errors**
The overlap constraint requires the `btree_gist` extension. Most managed Postgres providers (including Neon) allow `CREATE EXTENSION IF NOT EXISTS btree_gist;` by default; if your provider restricts extensions, that statement will need to be run with elevated privileges first.

**"Zero-length key is not supported"**
`AUTH_SECRET` is empty. Set a real value in both `.env` and Vercel's environment variables.

---

## 📋 Useful Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Run development server |
| `npm run build` | Build for production (also runs `prisma generate`) |
| `npm start` | Start production server |
| `npm test` | Run unit tests |
| `npx prisma migrate dev` | Create/apply a migration locally |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma db seed` | Seed demo data |
| `npx prisma studio` | Browse the database visually |

---

## 🔒 Security Notes

- `.env`, `.env.local`, `.env.production` are gitignored — never commit real secrets.
- Passwords are always stored as bcrypt hashes, never plain text.
- Sessions are httpOnly, sameSite=lax JWT cookies — not accessible to client-side JS, mitigating XSS-based session theft.
- All tenant-scoped queries filter by `tenantId` at the database layer, not just at the authorization-check layer.
- `AUTH_SECRET` must be a long, random value in every environment (dev and production) — never left empty or default.
