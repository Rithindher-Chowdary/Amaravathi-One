# Amaravati One

Unified citizen services super app and digital wallet for the APCRDA pilot. Built as a production-shaped PERN
(PostgreSQL, Express, React, Node) monorepo with citizen, officer and administrator experiences in one codebase.

> Prototype notice: UPI, Aadhaar, DigiLocker and phone OTP integrations are simulated. No real money moves, no
> government registry is queried, and nothing in this application is a legal identity check.

## What you can do

### Citizen
- Register, sign in, recover a password and verify a mobile number (demo OTP `123456`).
- Browse the service catalogue with fees, eligibility and document checklists.
- Apply for a service, upload PDF/JPG/PNG/TXT documents and track a full status timeline.
- Resubmit a corrected application when an officer requests changes.
- Keep Aadhaar, DigiLocker, property, licence and document records in a digital wallet with simulated verification.
- Pay application fees through a simulated UPI flow and download receipts.
- See due-date reminders, in-app notifications and a personalised dashboard.

### Officer
- Work queue of only the applications assigned to the signed-in officer.
- Verify or flag uploaded documents.
- Move files through `DOCUMENTS_VERIFIED`, `UNDER_REVIEW`, `CORRECTION_REQUESTED`, `APPROVED` or `REJECTED` with
  remarks that are visible to the citizen.
- Personal dashboard with workload, recent assignments and recorded decisions.

### Administrator
- Operations dashboard covering citizens, officers, applications, revenue and pipeline health.
- Citizen directory with search, profile review and account activation.
- Service catalogue management including fees, SLAs, eligibility and document checklists.
- Application oversight and officer assignment.
- Payment ledger and receipts, due-date creation and reminder jobs.
- Single-citizen or broadcast notifications.
- Reports for revenue trend, payment status, application workflow and service demand, plus audit history.

## Technology

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite 6, React Router 6, Tailwind CSS 3, Axios, lucide-react |
| Backend | Node.js, Express 4, Prisma 6, JSON Web Tokens, bcryptjs, zod, multer, helmet |
| Database | PostgreSQL 16 (Docker Compose) |
| Tooling | npm workspaces-by-folder scripts, concurrently, nodemon, Prisma migrations and seed |

## Repository layout

```text
AmaravathiOne/
  client/                 React application
    src/
      components/         Layouts, UI primitives, toast system
      context/            Authentication provider
      lib/                Axios client and formatting helpers
      pages/              Public, citizen, officer and admin screens
  server/                 Express API
    prisma/               Schema, migration, seed
    src/
      config/             Environment loading
      lib/                Prisma client
      middleware/         Auth, validation, uploads, errors
      routes/             REST endpoints
      services/           Due-date reminder engine
      utils/              Audit, notifications, references, tokens
    uploads/              Local document storage
  scripts/smoke.ps1       End-to-end API and web smoke test
  docs/                   Architecture, API, database, testing, demo guides
  docker-compose.yml      PostgreSQL 16 on host port 5433
```

## Quick start

Prerequisites: Node.js 20+, npm 10+, and Docker Desktop (or another PostgreSQL 16 instance).

```powershell
cd D:\AmaravathiOne
npm install
Copy-Item server\.env.example server\.env
npm run setup
npm run dev
```

`npm run setup` starts PostgreSQL in Docker, installs server and client dependencies, applies migrations and seeds
demo data.

Open:

- Web app: `http://localhost:5173`
- API health: `http://localhost:4000/api/health`
- Prisma Studio: `npm run db:studio --prefix server`

### Database port note

Docker publishes PostgreSQL on host port **5433**, not 5432, because a local PostgreSQL 18 service may already own
5432 on this machine. The connection string is:

```text
postgresql://amaravati:amaravati@localhost:5433/amaravati_one?schema=public
```

If both ports are free you can change `docker-compose.yml` to `5432:5432` and update `server/.env` accordingly. If you
prefer a local PostgreSQL server, create an `amaravati_one` database, point `DATABASE_URL` at it, then run
`npm run db:migrate` and `npm run db:seed`.

### Step-by-step setup

```powershell
npm install                     # root tooling (concurrently)
npm run db:up                   # Docker PostgreSQL
Copy-Item server\.env.example server\.env
npm run install:all
npm run db:migrate
npm run db:seed
npm run dev
```

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Citizen | `citizen@amaravati.one` | `Citizen@123` |
| Citizen | `priya@amaravati.one` | `Citizen@123` |
| Officer | `officer@amaravati.one` | `Officer@123` |
| Officer | `officer2@amaravati.one` | `Officer@123` |
| Administrator | `admin@amaravati.one` | `Admin@123` |

The seed also creates eight services, four applications, payments in different states, wallet credentials, due dates,
notifications and audit history. Re-running `npm run db:seed` wipes and restores this demo dataset.

## Environment variables

`server/.env`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Signing secret for access tokens |
| `JWT_EXPIRES_IN` | Token lifetime, for example `7d` |
| `PORT` | API port, default `4000` |
| `CLIENT_ORIGIN` | Allowed CORS origin(s), comma separated |
| `UPLOAD_DIR` | Local upload directory, default `uploads` |

`client/.env` is optional; it defaults to `VITE_API_URL=http://localhost:4000/api`.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs API and web app together |
| `npm run setup` | Database, dependencies, migrations and seed |
| `npm run db:up` / `db:down` | Start or stop Docker PostgreSQL |
| `npm run db:migrate` | Apply Prisma migrations |
| `npm run db:seed` | Reset demo data |
| `npm run db:reset` | Drop, migrate and seed the database |
| `npm run build` | Production build of the React app |
| `npm run start` | Start the API without nodemon |
| `npm run test:smoke` | Run the API and web smoke test (servers must be running) |

Server-only helpers: `npm run prisma:generate --prefix server`, `npm run db:studio --prefix server`.

## Testing

With PostgreSQL, the API and the web app running:

```powershell
npm run test:smoke
```

The script signs in as each role and checks health, dashboards, wallet, payments, notifications, due dates, officer
queue, admin management endpoints, reports, reminders, receipts, and that Vite serves the app. It completes one due date
and generates reminders, so run `npm run db:seed` afterwards to restore the exact demo state.

See [docs/testing.md](docs/testing.md) for the manual QA matrix and [scripts/smoke.ps1](scripts/smoke.ps1) for the
automated checks.

## Documentation

- [Architecture](docs/architecture.md)
- [API reference](docs/api.md)
- [Database and schema](docs/database.md)
- [Testing guide](docs/testing.md)
- [Demo script](docs/demo-script.md)

## Known limitations

- UPI, Aadhaar, DigiLocker and OTP are simulated and clearly labelled in the UI.
- Uploaded files are stored on local disk, not object storage.
- Verification and payment endpoints have no live provider callbacks or idempotency keys.
- There is no rate limiting, email delivery, refresh-token rotation or multi-factor authentication beyond the demo OTP.
- The reminder job runs in-process on a daily interval; production should use a durable scheduler.
- Reports are computed from live tables and are intended for pilot-scale data.
