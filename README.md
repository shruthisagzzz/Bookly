# 📅 Bookly — Appointment Booking Platform

Bookly is a full-stack appointment booking platform that allows businesses to manage their services, availability, appointments, and customers through an administrative dashboard.

Customers can browse available services, select an available time slot, create an account, and book appointments.

---

## 🚀 Features

### 👤 Customer

- Customer registration
- Customer login
- Customer authentication
- Browse available services
- View available appointment slots
- Book appointments
- View appointment details
- Customer-specific appointment management

### 🏢 Business Admin

- Admin authentication
- Business dashboard
- Manage services
- Configure business availability
- View appointments
- Manage appointment status
- View customer information

### 👑 System Owner

- System owner authentication
- Manage businesses/tenants
- Manage business administrators
- Monitor platform-level information

### 🗄️ Backend

- REST API routes
- PostgreSQL database
- Prisma ORM
- Authentication
- Password hashing
- Session management
- Multi-tenant database architecture

### 🎨 Frontend

- Next.js
- React
- TypeScript
- Responsive UI
- Customer portal
- Admin dashboard

---

# 🛠️ Tech Stack

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

# 📁 Project Structure

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
💻 1. Requirements

Before installing the project, make sure you have:

Node.js 18+ installed
npm installed
Git installed
PostgreSQL database
A GitHub account
A Neon account if using Neon PostgreSQL

Check Node.js:

node --version

Check npm:

npm --version

Check Git:

git --version
📥 2. Download / Clone the Project

Open a terminal and clone the GitHub repository:

git clone YOUR_GITHUB_REPOSITORY_URL

Example:

git clone https://github.com/yourusername/appointment-booking-platform.git

Move into the project:

cd appointment-booking-platform

Open the project in VS Code:

code .
📦 3. Install Project Libraries

After downloading the project, install all required dependencies.

Run:

npm install

This reads the package.json file and automatically installs the required libraries.

You do NOT need to manually install every package if package.json is already included.

📚 4. Install Prisma

If Prisma is not already installed:

npm install prisma @prisma/client

For development:

npm install -D prisma

Check Prisma:

npx prisma --version
🗄️ 5. Create the Database

This project uses PostgreSQL.

You can use:

Neon
Local PostgreSQL
Supabase PostgreSQL
Another PostgreSQL provider

For cloud deployment, Neon PostgreSQL is recommended.

☁️ 6. Create a Neon Database
Go to the Neon website.
Create an account.
Create a new project.
Create/select the PostgreSQL database.
Open the Connect section.
Copy the PostgreSQL connection string.

It will look similar to:

postgresql://USERNAME:PASSWORD@HOST/DATABASE?sslmode=require
🔐 7. Create the Environment File

Inside the project root, create:

.env

Example:

DATABASE_URL="your_neon_database_connection_string"

AUTH_SECRET="your_long_random_secret"

IMPORTANT:

Never upload .env to GitHub.

Your .gitignore should contain:

.env
.env.local
.env.production
node_modules/
.next/
🔑 8. Configure DATABASE_URL

The DATABASE_URL must point to your PostgreSQL database.

Example:

DATABASE_URL="postgresql://username:password@host/neondb?sslmode=require"

The value must match the connection string provided by Neon.

Do not use:

DATABASE_URL="postgres://user:pass@localhost:5432/app_dev"

unless you are intentionally using a local PostgreSQL database.

🧬 9. Configure Prisma

The project contains:

prisma/schema.prisma

The schema defines the application's database models.

The main models include:

Tenant
User
Service
AvailabilityRule
Appointment

The schema also contains enums such as:

UserRole
ServiceStatus
AppointmentStatus
🔄 10. Generate Prisma Client

After installing dependencies and configuring the database, run:

npx prisma generate

This generates the Prisma Client used by the application.

Run this whenever the Prisma schema changes.

🏗️ 11. Create the Database Tables

For a completely new database, run:

npx prisma migrate dev --name init

This will:

Read schema.prisma
Compare it with the database
Create a migration
Apply the migration
Generate/update Prisma Client
⚠️ IMPORTANT: Prisma Migration Errors

If Prisma says:

The migration was modified after it was applied.

Do NOT randomly edit the migration file.

For a development database where losing existing data is acceptable:

npx prisma migrate reset

Then confirm the reset.

After that:

npx prisma migrate dev

WARNING:

prisma migrate reset deletes the database data.

Do NOT use it on a production database.

🔍 12. Validate the Prisma Schema

Before starting the application:

npx prisma validate

You should see:

The schema at prisma/schema.prisma is valid

If validation fails, fix schema.prisma before continuing.

🖥️ 13. Open Prisma Studio

You can inspect your database using:

npx prisma studio

Prisma Studio allows you to view tables such as:

Tenant
User
Service
AvailabilityRule
Appointment

It can be useful for checking whether records are being created correctly.

🌱 14. Seed Demo Data

If the project contains a seed script, run:

npx prisma db seed

If no seed script exists, demo users can be created through the application's registration/admin functionality.

▶️ 15. Run the Application Locally

Start the development server:

npm run dev

You should see something similar to:

Local: http://localhost:3000

Open:

http://localhost:3000

in your browser.

🔐 16. Login

The application contains different types of users.

System Owner
Email:
owner@demo.local

Password:
Owner123!
Business Admin
Email:
admin@acme.local

Password:
Admin123!

These credentials are only valid if the corresponding demo users exist in your database.

For production, create your own secure credentials.

👤 17. Customer Authentication

Customers use the customer authentication system.

Customer registration creates a customer account.

Customer login uses:

Email
Password

Passwords should never be stored as plain text.

The application stores password hashes instead.

🧪 18. Test the Application

After starting the application, test the following workflow.

Admin workflow
Login
 ↓
Admin Dashboard
 ↓
Create Service
 ↓
Configure Availability
 ↓
View Appointments
Customer workflow
Customer Registration
 ↓
Customer Login
 ↓
Browse Services
 ↓
Select Date
 ↓
Select Available Time
 ↓
Book Appointment
 ↓
View Appointment
🔌 19. How Frontend Connects to Backend

The application uses Next.js API routes.

The frontend sends requests to routes such as:

/api/customer/auth/login
/api/customer/auth/register
/api/appointments

The API routes communicate with Prisma.

The overall flow is:

Browser
   ↓
Next.js Frontend
   ↓
API Route
   ↓
Prisma Client
   ↓
PostgreSQL / Neon
🗄️ 20. How Prisma Connects to PostgreSQL

The connection is configured inside:

prisma/schema.prisma

Example:

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

Prisma reads:

DATABASE_URL

from the .env file.

The connection therefore works like:

.env
 ↓
DATABASE_URL
 ↓
Prisma
 ↓
PostgreSQL
 ↓
Neon
🔒 21. Environment Variables

The application requires environment variables.

Example:

DATABASE_URL="postgresql://..."
AUTH_SECRET="..."

Never commit secrets to GitHub.

Instead, provide a .env.example file.

Create:

.env.example

with:

DATABASE_URL=
AUTH_SECRET=

A new developer can then copy it:

copy .env.example .env

and fill in the real values.

🐙 22. Upload the Project to GitHub

Initialize Git if necessary:

git init

Add the files:

git add .

Commit:

git commit -m "Initial project setup"

Create a repository on GitHub.

Then connect your local project:

git remote add origin YOUR_GITHUB_REPOSITORY_URL

Rename the branch:

git branch -M main

Push:

git push -u origin main
🚀 23. Deploy to Vercel

The application can be deployed using Vercel.

Step 1

Open Vercel and sign in using GitHub.

Step 2

Select:

Add New Project
Step 3

Import your GitHub repository.

Step 4

Vercel detects the Next.js project automatically.

Step 5

Add environment variables.

Go to:

Project
→ Settings
→ Environment Variables

Add:

DATABASE_URL

and:

AUTH_SECRET

Use the production Neon database connection string.

🗄️ 24. Connect Vercel to Neon

The production architecture is:

User
  ↓
Vercel
  ↓
Next.js
  ↓
Prisma
  ↓
Neon PostgreSQL

Make sure the DATABASE_URL in Vercel points to the correct Neon database.

Do not use your local development database connection.

🔄 25. Deploy Database Migrations

Before using the production application, make sure the production database contains the required tables.

For production migration deployment:

npx prisma migrate deploy

This applies existing migrations without creating new development migrations.

🔁 26. Redeploy After Environment Variable Changes

Whenever an environment variable is changed in Vercel, create a new deployment.

You can either:

Click Redeploy in Vercel
Push a new commit to GitHub

Example:

git add .
git commit -m "Update environment configuration"
git push

Vercel will automatically build and deploy the latest commit.

🧱 27. Production Build

Before deployment, test the production build locally:

npm run build

If the build succeeds:

✓ Build successful

then start the production server:

npm start
🐛 28. Troubleshooting
Prisma Client does not contain a model

Example:

Property 'customer' does not exist on type 'PrismaClient'

Check whether the model exists in:

prisma/schema.prisma

Then run:

npx prisma generate

If the database also needs updating:

npx prisma migrate dev
Database column does not exist

Example:

The column `Appointment.customerId` does not exist

This usually means the Prisma schema and database structure are different.

Run:

npx prisma migrate dev

For a development database that can be completely recreated:

npx prisma migrate reset

Then:

npx prisma generate
Cannot reach database server

Example:

P1001: Can't reach database server

Check:

DATABASE_URL

Make sure:

Neon database is available
Connection string is correct
sslmode=require is present when required
You are using the correct Neon branch
Your .env file is in the project root
Zero-length key is not supported

If authentication displays:

Zero-length key is not supported

check:

AUTH_SECRET=

Make sure AUTH_SECRET has a real value.

For example:

AUTH_SECRET="a-long-random-secret-value"

Do not leave it empty.

Also make sure the same variable is configured in Vercel.

📋 29. Complete Setup From Scratch

A new developer can follow these commands:

git clone YOUR_GITHUB_REPOSITORY_URL

cd appointment-booking-platform

npm install

npx prisma generate

npx prisma validate

npx prisma migrate dev --name init

npm run dev

Then open:

http://localhost:3000
🔄 Complete Development Workflow

Whenever you make changes:

1. Modify code
       ↓
2. Modify Prisma schema if required
       ↓
3. Create migration
       ↓
4. Generate Prisma Client
       ↓
5. Test locally
       ↓
6. git add .
       ↓
7. git commit
       ↓
8. git push
       ↓
9. Vercel automatically deploys

For Prisma changes:

npx prisma migrate dev --name describe_your_change
npx prisma generate

Then:

git add .
git commit -m "Update database schema"
git push
🔐 Security Notes

Never commit:

.env
.env.local
.env.production

Never expose:

DATABASE_URL
AUTH_SECRET
database passwords
API keys
private credentials

Use environment variables for secrets.

For production, always use strong passwords and secrets.

📌 Useful Commands
Install dependencies
npm install
Run development server
npm run dev
Build application
npm run build
Start production server
npm start
Validate Prisma
npx prisma validate
Generate Prisma Client
npx prisma generate
Create migration
npx prisma migrate dev --name migration_name
Apply production migrations
npx prisma migrate deploy
Reset development database
npx prisma migrate reset
Open Prisma Studio
npx prisma studio
👨‍💻 Author

Developed as a full-stack appointment booking platform using Next.js, TypeScript, Prisma, PostgreSQL, Neon and Vercel.
