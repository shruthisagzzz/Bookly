# 📅 Bookly — Appointment Booking Platform

Bookly is a full-stack, multi-tenant appointment booking platform. Businesses manage their services, availability, appointments, and customers through an admin dashboard, while customers browse services, pick a time slot, and book appointments through a self-serve customer portal.

---

## 📖 Table of Contents

- [Features](#-features)
- [Tech Stack](#️-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  1. [Requirements](#1-requirements)
  2. [Clone the Project](#2-clone-the-project)
  3. [Install Dependencies](#3-install-dependencies)
  4. [Set Up the Database](#4-set-up-the-database)
  5. [Configure Environment Variables](#5-configure-environment-variables)
  6. [Set Up Prisma](#6-set-up-prisma)
  7. [Run the Application](#7-run-the-application)
- [Demo Login Credentials](#-demo-login-credentials)
- [Testing the Application](#-testing-the-application)
- [How It Works](#-how-it-works)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Useful Commands](#-useful-commands)
- [Security Notes](#-security-notes)
- [Development Workflow](#-development-workflow)
- [Author](#-author)

---

## 🚀 Features

### 👤 Customer
- Registration, login, and authentication
- Browse available services
- View available appointment slots
- Book appointments
- View and manage their own appointments

### 🏢 Business Admin
- Admin authentication
- Business dashboard
- Manage services
- Configure business availability
- View and manage appointment status
- View customer information

### 👑 System Owner
- System owner authentication
- Manage businesses/tenants
- Manage business administrators
- Monitor platform-level information

### 🗄️ Backend
- REST API routes
- PostgreSQL database with Prisma ORM
- Authentication and session management
- Password hashing
- Multi-tenant database architecture

### 🎨 Frontend
- Next.js + React + TypeScript
- Responsive UI
- Separate customer portal and admin dashboard

---

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js | Frontend + API |
| React | UI |
| TypeScript | Type safety |
| Node.js | Runtime |
| Prisma | Database ORM |
| PostgreSQL | Database |
| Neon | Cloud PostgreSQL |
| bcrypt | Password hashing |
| Zod | Input validation |
| GitHub | Source control |
| Vercel | Deployment |

---

## 📁 Project Structure

```text
appointment-booking-platform/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── public/
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── customer/
│   │   │   ├── admin/
│   │   │   └── appointments/
│   │   │
│   │   ├── customer/
│   │   ├── admin/
│   │   └── login/
│   │
│   ├── components/
│   ├── lib/
│   └── ...
│
├── .env
├── .gitignore
├── package.json
├── package-lock.json
├── prisma.config.ts
└── README.md
```

Key Prisma models: `Tenant`, `User`, `Service`, `AvailabilityRule`, `Appointment`, plus enums `UserRole`, `ServiceStatus`, `AppointmentStatus`.

---

## 🏁 Getting Started

### 1. Requirements

Before installing the project, make sure you have:

- Node.js 18+
- npm
- Git
- A PostgreSQL database (local, [Neon](https://neon.tech), or Supabase)
- A GitHub account

Verify your setup:

```bash
node --version
npm --version
git --version
```

### 2. Clone the Project

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd appointment-booking-platform
code .
```

### 3. Install Dependencies

```bash
npm install
```

This reads `package.json` and installs everything the project needs. You don't need to install packages one by one — they're already listed there.

If Prisma isn't installed for some reason:

```bash
npm install prisma @prisma/client
npm install -D prisma
npx prisma --version
```

### 4. Set Up the Database

This project uses **PostgreSQL**. You can use:

- [Neon](https://neon.tech) *(recommended for cloud deployment)*
- Local PostgreSQL
- Supabase
- Any other PostgreSQL provider

#### Using Neon

1. Go to [neon.tech](https://neon.tech) and create an account.
2. Create a new project and PostgreSQL database.
3. Open the **Connect** section and copy the connection string. It looks like:

```text
postgresql://USERNAME:PASSWORD@HOST/DATABASE?sslmode=require
```

### 5. Configure Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="your_postgresql_connection_string"
AUTH_SECRET="your_long_random_secret"
```

> ⚠️ **Never commit `.env` to GitHub.** Make sure your `.gitignore` includes:
> ```text
> .env
> .env.local
> .env.production
> node_modules/
> .next/
> ```

Instead, commit a `.env.example` with just the variable names, so other developers know what to fill in:

```env
DATABASE_URL=
AUTH_SECRET=
```

A new developer can then run:

```bash
copy .env.example .env
```

and fill in the real values.

### 6. Set Up Prisma

The schema lives at `prisma/schema.prisma` and connects to your database like this:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Generate the Prisma Client (run this any time the schema changes):

```bash
npx prisma generate
```

Validate the schema before starting the app:

```bash
npx prisma validate
```

You should see: `The schema at prisma/schema.prisma is valid`.

Create the database tables (for a brand-new database):

```bash
npx prisma migrate dev --name init
```

This reads `schema.prisma`, compares it to the database, creates a migration, applies it, and regenerates the Prisma Client.

Optionally, seed demo data if a seed script exists:

```bash
npx prisma db seed
```

You can inspect your data visually at any time with:

```bash
npx prisma studio
```

> ⚠️ **If Prisma says** *"The migration was modified after it was applied"* — don't hand-edit the migration file. On a development database where losing data is fine:
> ```bash
> npx prisma migrate reset
> npx prisma migrate dev
> ```
> `prisma migrate reset` **deletes all data** — never run it against production.

### 7. Run the Application

```bash
npm run dev
```

You should see:

```text
Local: http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔐 Demo Login Credentials

| Role | Email | Password |
|---|---|---|
| System Owner | `owner@demo.local` | `Owner123!` |
| Business Admin | `admin@acme.local` | `Admin123!` |

These only work if the corresponding demo users exist in your database. Customers register their own accounts through the customer registration flow. For production, always create your own secure credentials — passwords are stored as hashes, never as plain text.

---

## 🧪 Testing the Application

**Admin workflow:**

```text
Login → Admin Dashboard → Create Service → Configure Availability → View Appointments
```

**Customer workflow:**

```text
Register → Login → Browse Services → Select Date → Select Time → Book Appointment → View Appointment
```

---

## 🔌 How It Works

**Frontend → Backend:**

```text
Browser → Next.js Frontend → API Route → Prisma Client → PostgreSQL / Neon
```

Example API routes:

```text
/api/customer/auth/login
/api/customer/auth/register
/api/appointments
```

**Prisma → PostgreSQL:**

```text
.env → DATABASE_URL → Prisma → PostgreSQL → Neon
```

---

## 🚀 Deployment

### Deploy to Vercel

1. Open [Vercel](https://vercel.com) and sign in with GitHub.
2. Click **Add New Project**.
3. Import your GitHub repository — Vercel auto-detects the Next.js project.
4. Go to **Project → Settings → Environment Variables** and add:
   - `DATABASE_URL` (production Neon connection string)
   - `AUTH_SECRET`

Production architecture:

```text
User → Vercel → Next.js → Prisma → Neon PostgreSQL
```

Make sure `DATABASE_URL` in Vercel points to your **production** Neon database, not your local one.

### Deploy Database Migrations

Before using the production app, apply existing migrations to the production database:

```bash
npx prisma migrate deploy
```

### Redeploy After Environment Variable Changes

Whenever you change an environment variable in Vercel, trigger a new deployment — either click **Redeploy**, or push a new commit:

```bash
git add .
git commit -m "Update environment configuration"
git push
```

### Test the Production Build Locally

```bash
npm run build
npm start
```

---

## 🐛 Troubleshooting

**Prisma Client is missing a model**
```text
Property 'customer' does not exist on type 'PrismaClient'
```
Check the model exists in `prisma/schema.prisma`, then run `npx prisma generate`. If the database also needs updating, run `npx prisma migrate dev`.

**Database column doesn't exist**
```text
The column `Appointment.customerId` does not exist
```
Your schema and database are out of sync. Run `npx prisma migrate dev`, or on a disposable dev database: `npx prisma migrate reset` followed by `npx prisma generate`.

**Cannot reach database server**
```text
P1001: Can't reach database server
```
Check that:
- `DATABASE_URL` is correct
- The Neon database is available
- `sslmode=require` is present where required
- You're using the correct Neon branch
- Your `.env` file is in the project root

**"Zero-length key is not supported"**
Your `AUTH_SECRET` is empty. Set it to a real value in both `.env` and Vercel:
```env
AUTH_SECRET="a-long-random-secret-value"
```

---

## 📋 Useful Commands

| Command | Description |
|---|---|
| `npm install` | Install dependencies |
| `npm run dev` | Run development server |
| `npm run build` | Build the application |
| `npm start` | Start production server |
| `npx prisma validate` | Validate the Prisma schema |
| `npx prisma generate` | Generate Prisma Client |
| `npx prisma migrate dev --name migration_name` | Create a migration |
| `npx prisma migrate deploy` | Apply migrations in production |
| `npx prisma migrate reset` | Reset the development database |
| `npx prisma studio` | Open Prisma Studio |

---

## 🔒 Security Notes

- Never commit `.env`, `.env.local`, or `.env.production`.
- Never expose `DATABASE_URL`, `AUTH_SECRET`, database passwords, API keys, or other credentials.
- Always use environment variables for secrets.
- Use strong, unique passwords and secrets in production.

---

## 🔄 Development Workflow

```text
1. Modify code
2. Modify Prisma schema (if required)
3. Create a migration
4. Generate Prisma Client
5. Test locally
6. git add .
7. git commit
8. git push
9. Vercel automatically deploys
```

For schema changes specifically:

```bash
npx prisma migrate dev --name describe_your_change
npx prisma generate

git add .
git commit -m "Update database schema"
git push
```

---

## 👨‍💻 Author

Developed as a full-stack appointment booking platform using **Next.js**, **TypeScript**, **Prisma**, **PostgreSQL**, **Neon**, and **Vercel**.
