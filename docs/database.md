# Database and schema

## Overview

PostgreSQL 16 is provisioned by `docker-compose.yml` with a named volume. Prisma owns the schema, migrations and client.
The initial migration is `server/prisma/migrations/20261105104752_init`.

- Host port: `5433` (mapped to container `5432`) to avoid clashing with a local PostgreSQL service.
- Database: `amaravati_one`
- User / password: `amaravati` / `amaravati`
- Connection string: `postgresql://amaravati:amaravati@localhost:5433/amaravati_one?schema=public`

## Entity relationship diagram

```mermaid
erDiagram
  User ||--o| CitizenProfile : has
  User ||--o{ Application : files
  User ||--o{ Application : "assigned officer"
  User ||--o{ ApplicationDocument : uploads
  User ||--o{ ApplicationDocument : verifies
  User ||--o{ ApplicationStatusHistory : changes
  User ||--o{ Credential : owns
  User ||--o{ Payment : makes
  User ||--o{ Notification : receives
  User ||--o{ DueDate : owes
  User ||--o{ OfficerAssignment : "officer / assigner"
  User ||--o{ AuditLog : acts

  Service ||--o{ Application : categorises

  Application ||--o{ ApplicationDocument : contains
  Application ||--o{ ApplicationStatusHistory : records
  Application ||--o{ Payment : billed
  Application ||--o{ OfficerAssignment : routed

  Credential ||--o{ CredentialVerification : checked
```

## Tables

### `users`

Primary account table for all three roles.

| Column | Notes |
| --- | --- |
| `id` | cuid primary key |
| `email` | unique, lower-cased on registration and login |
| `passwordHash` | bcrypt hash |
| `fullName` | display name |
| `phone` | optional, unique |
| `role` | `CITIZEN`, `OFFICER`, `ADMIN` |
| `isActive` | deactivation blocks authentication immediately |
| `phoneVerified` | set by simulated OTP confirmation |
| `phoneOtp` | demo OTP storage |
| `resetToken`, `resetTokenExpiry` | one-hour password reset token |
| `createdAt`, `updatedAt` | timestamps |

### `citizen_profiles`

One-to-one optional profile for citizens. Stores Aadhaar reference, address, district, state, PIN, date of birth and
gender. Deleting a user cascades.

### `services`

Catalogue entries with a unique code, category, description, eligibility text, required documents array, fee
(`Decimal(10,2)`), processing days and an `isActive` flag. Deactivation is a soft delete.

### `applications`

The central workflow record.

| Column | Notes |
| --- | --- |
| `referenceNo` | unique `AMA-YYYY-NNN` reference |
| `userId` | applicant |
| `serviceId` | requested service |
| `status` | workflow enum |
| `formData` | free-form JSON captured from the service form |
| `assignedOfficerId` | denormalised current officer for queue performance |
| `officerRemarks` | latest officer narrative |
| `submittedAt`, `updatedAt`, `decidedAt` | lifecycle timestamps |

Indexed on `userId` and `status`.

### `application_documents`

Uploaded evidence. Stores original file name, relative path, MIME type, size, document type, verification state and
verifier identity. Cascades when the application is deleted.

### `application_status_history`

Append-only workflow timeline. Each row captures status, remarks, actor and timestamp. Cascades with the application.

### `credentials`

Digital wallet entries: type, title, issuer, optional credential number, status, validity dates and arbitrary metadata
JSON. Indexed on `userId`.

### `credential_verifications`

Append-only verification attempts with status, method (default `SIMULATED`), remarks and timestamp. Cascades with the
credential.

### `payments`

Fees and standalone transactions: unique reference, optional application link, amount, currency, status, method, purpose,
transaction ID, UPI ID and paid timestamp. Indexed on `userId`.

### `notifications`

Per-user in-app messages with type, title, body, optional deep link and read state. Indexed on `userId`.

### `due_dates`

Citizen obligations with type, title, description, due date, optional amount and reference ID, completion state and
`reminderSentAt` (used to avoid duplicate reminders). Indexed on `userId`.

### `officer_assignments`

Assignment history. Active row plus deactivated prior rows provide an audit-friendly trail while
`applications.assignedOfficerId` keeps queue queries cheap.

### `audit_logs`

Actor (nullable for system events), action, entity, entity ID, metadata JSON, IP address and timestamp.

## Enumerations

| Enum | Values |
| --- | --- |
| `Role` | `CITIZEN`, `OFFICER`, `ADMIN` |
| `ApplicationStatus` | `SUBMITTED`, `DOCUMENTS_VERIFIED`, `UNDER_REVIEW`, `CORRECTION_REQUESTED`, `APPROVED`, `REJECTED` |
| `PaymentStatus` | `PENDING`, `SUCCESS`, `FAILED`, `REFUNDED` |
| `CredentialType` | `AADHAAR`, `DIGILOCKER`, `PROPERTY`, `LICENCE`, `DOCUMENT` |
| `CredentialStatus` | `PENDING`, `VERIFIED`, `REJECTED`, `EXPIRED` |
| `NotificationType` | `DUE_DATE`, `STATUS_UPDATE`, `PAYMENT`, `GENERAL` |
| `DueType` | `PROPERTY_TAX`, `LICENCE_EXPIRY`, `APPLICATION_ACTION`, `PAYMENT_DEADLINE`, `DOCUMENT_EXPIRY` |

## Conventions

- Primary keys use cuid strings.
- Tables use snake_case names via `@@map`; Prisma models stay camelCase.
- Money uses `Decimal(10, 2)` and is converted to `Number` at API boundaries.
- JSON columns hold service-specific form data and credential metadata without schema churn.
- Cascade deletes are used for child records that have no meaning without their parent (documents, history,
  verifications, notifications, due dates, assignments).
- Applications and payments intentionally do not cascade from users, preserving operational records.

## Seed data

`server/prisma/seed.js` deletes all rows in dependency order and recreates:

- 5 accounts: 2 citizens, 2 officers, 1 administrator.
- 8 services across land, utilities, licences and civic categories.
- 4 applications spanning submitted, under review, approved and correction-requested states.
- Payments including successful and pending examples.
- Credentials including verified, pending and expiring records.
- Due dates, notifications and audit history for dashboards and reports.
- A small demo upload file for document UI checks.

Because the seed is destructive, use it to reset the demo between runs. Never point it at production data.

## Common operations

```powershell
npm run db:up                         # start PostgreSQL
npm run db:migrate                    # apply migrations
npm run db:seed                       # reset demo data
npm run db:reset                      # drop, migrate, seed
npm run db:studio --prefix server     # browse data
```

Creating a new migration during development:

```powershell
npm run db:migrate --prefix server -- --name describe_change
```

Apply migrations without prompts in a deployed environment:

```powershell
npm run db:deploy --prefix server
```
