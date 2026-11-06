# API reference

Base URL: `http://localhost:4000/api`

All requests and responses are JSON unless noted. Authenticated routes require:

```http
Authorization: Bearer <jwt>
```

## Conventions

- Success responses use `200` or `201` with a named resource key, for example `{ "application": { ... } }`.
- List responses use a plural key, for example `{ "payments": [ ... ] }`.
- Errors use `{ "message": "...", "details"?: [ ... ] }`.
- Validation failures return `400` with `details[]` entries shaped as `{ path, message }`.
- Unauthenticated requests return `401`; role or ownership failures return `403`; missing resources return `404`;
  duplicate unique values return `409`.
- Dates are ISO-8601 strings. Money is returned as a JSON number.

## Authentication

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create citizen account and return token |
| POST | `/auth/login` | Public | Authenticate and return token |
| GET | `/auth/me` | Authenticated | Current sanitized user |
| POST | `/auth/logout` | Authenticated | Audit logout; tokens are stateless |
| POST | `/auth/forgot-password` | Public | Generate a reset token (returned as preview in dev) |
| POST | `/auth/reset-password` | Public | Replace password using a valid token |
| POST | `/auth/verify-phone/request` | Authenticated | Generate demo OTP `123456` |
| POST | `/auth/verify-phone/confirm` | Authenticated | Confirm OTP and mark phone verified |
| PATCH | `/auth/profile` | Authenticated | Update name, phone and citizen profile |

Register body:

```json
{
  "fullName": "A. Ravi Teja",
  "email": "ravi@example.com",
  "password": "minimum8chars",
  "phone": "9876500000"
}
```

Login response:

```json
{
  "token": "<jwt>",
  "user": {
    "id": "cuid",
    "fullName": "A. Ravi Teja",
    "email": "citizen@amaravati.one",
    "role": "CITIZEN",
    "phone": "9876500000",
    "phoneVerified": true,
    "profile": { "district": "Guntur", "state": "Andhra Pradesh" }
  }
}
```

Profile patch accepts `fullName`, `phone` and a nested `profile` object with `aadhaarNumber`, `addressLine`, `city`,
`district`, `state`, `pincode`, `dateOfBirth` and `gender`. Null clears a field.

Forgot-password response includes `previewResetToken` in this prototype. Reset body: `{ "token": "...", "password":
"..." }`.

## Services

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/services` | Public | Active catalogue; filters `category`, `search` |
| GET | `/services/:id` | Public | Service detail |
| GET | `/services/manage/all` | Admin | All services including inactive |
| POST | `/services` | Admin | Create service |
| PATCH | `/services/:id` | Admin | Update service |
| DELETE | `/services/:id` | Admin | Soft-deactivate service |

Create/update body:

```json
{
  "code": "LAYOUT_APPROVAL",
  "name": "Layout Approval",
  "category": "Land and Layout",
  "description": "Approval of residential layout plans.",
  "eligibility": "Registered plot owners in the planning area.",
  "requiredDocuments": ["Aadhaar card", "Sale deed", "Layout plan"],
  "fee": 2500,
  "processingDays": 15,
  "isActive": true
}
```

`DELETE` sets `isActive` to false rather than removing history.

## Applications

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/applications` | Authenticated | Role-scoped list; filters `status`, `search` |
| POST | `/applications` | Citizen | Submit application |
| GET | `/applications/:id` | Owner, assigned officer or admin | Full application with service, documents, history, payments, officer |
| POST | `/applications/:id/documents` | Owner or admin | Upload document (multipart) |
| PATCH | `/applications/:id/documents/:documentId/verify` | Assigned officer or admin | Verify or flag document |
| PATCH | `/applications/:id/status` | Assigned officer or admin | Record a workflow decision |
| POST | `/applications/:id/resubmit` | Owner | Resubmit after correction request |
| POST | `/applications/:id/assign` | Admin | Assign or reassign officer |

Create body:

```json
{
  "serviceId": "cuid",
  "formData": {
    "applicantName": "A. Ravi Teja",
    "surveyNumber": "124/3"
  }
}
```

If the service fee is above zero, the response side-effect creates a `PENDING` payment automatically.

### Document upload

`Content-Type: multipart/form-data`

| Field | Type | Notes |
| --- | --- | --- |
| `file` | file | PDF, JPEG, PNG or TXT; maximum 5 MB |
| `documentType` | text | Optional label, defaults to "Supporting document" |

Response:

```json
{
  "document": {
    "id": "cuid",
    "fileName": "sale-deed.pdf",
    "filePath": "uploads/1730000000000-ab12cd.pdf",
    "mimeType": "application/pdf",
    "size": 182345,
    "documentType": "Sale deed",
    "isVerified": false
  }
}
```

Files are served from `http://localhost:4000/uploads/<name>`.

### Document decision

```json
{ "isVerified": true, "remarks": "Clear scan, details match the application." }
```

### Status decision

```json
{
  "status": "CORRECTION_REQUESTED",
  "remarks": "Upload a signed layout plan."
}
```

Allowed statuses: `SUBMITTED`, `DOCUMENTS_VERIFIED`, `UNDER_REVIEW`, `CORRECTION_REQUESTED`, `APPROVED`, `REJECTED`.
Correction requests create a five-day action reminder. Decisions complete open action reminders.

### Resubmit

```json
{ "remarks": "Uploaded the signed layout plan." }
```

Only valid when the current status is `CORRECTION_REQUESTED`; resets to `SUBMITTED`.

### Assign

```json
{ "officerId": "cuid" }
```

The officer must be active. Prior active assignment rows are closed and the officer is notified.

## Credentials (digital wallet)

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/credentials` | Authenticated | List own credentials with `effectiveStatus` |
| POST | `/credentials` | Authenticated | Add credential |
| GET | `/credentials/:id` | Owner | Detail with verification history |
| PATCH | `/credentials/:id` | Owner | Update metadata |
| DELETE | `/credentials/:id` | Owner | Remove credential |
| POST | `/credentials/:id/verify` | Owner | Simulated verification |

Create body:

```json
{
  "type": "PROPERTY",
  "title": "Plot 42, Amaravati",
  "issuer": "APCRDA",
  "credentialNumber": "APCRDA/2026/0042",
  "issuedAt": "2026-01-15",
  "expiresAt": "2031-01-14",
  "metadata": { "surveyNumber": "124/3", "areaSqYards": 200 }
}
```

Types: `AADHAAR`, `DIGILOCKER`, `PROPERTY`, `LICENCE`, `DOCUMENT`.

`effectiveStatus` is `EXPIRED` when a verified credential has passed `expiresAt`, otherwise the stored status.

Verification response includes a message explaining the simulated check and appends a `CredentialVerification` row.

## Payments

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/payments` | Authenticated | Own payments |
| POST | `/payments` | Authenticated | Create or reuse a payment |
| GET | `/payments/:id` | Owner or admin | Payment detail |
| POST | `/payments/:id/confirm` | Owner or admin | Simulate successful UPI payment |
| POST | `/payments/:id/fail` | Owner or admin | Mark a pending payment failed |
| GET | `/payments/:id/receipt` | Owner or admin | HTML receipt |

Create body options:

```json
{ "applicationId": "cuid" }
```

or

```json
{ "amount": 500, "purpose": "Documentation fee" }
```

For an application payment, the server derives the amount and purpose from the service, and returns the existing
pending or successful payment with `reused: true` when one already exists.

Confirm body:

```json
{ "upiId": "citizen@okhdfcbank" }
```

Confirmation generates a transaction ID, sets `SUCCESS`, stamps `paidAt` and completes matching application due dates.
The response includes `simulated: true`.

Receipt responses are `text/html`, print-friendly, and accept `?print=1` to trigger the browser print dialog.

## Notifications

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/notifications` | Authenticated | Own notifications (latest 100) plus `unread` count |
| GET | `/notifications/manage/all` | Admin | Latest 200 notifications with recipients |
| PATCH | `/notifications/:id/read` | Owner | Mark one read |
| POST | `/notifications/read-all` | Authenticated | Mark all own notifications read |
| POST | `/notifications` | Admin | Send to one user or broadcast |
| DELETE | `/notifications/:id` | Admin | Delete notification |

Send body:

```json
{
  "broadcast": true,
  "type": "GENERAL",
  "title": "Water tariff subsidy window opens",
  "message": "Apply before 30 November to receive the subsidy.",
  "link": "/app/services"
}
```

For a single recipient, set `broadcast: false` and provide `userId`. Broadcasts target all active citizens and return
`{ message, count }`.

## Due dates

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/due-dates` | Authenticated | Own obligations, earliest first |
| GET | `/due-dates/manage/all` | Admin | All obligations with user context |
| POST | `/due-dates` | Admin | Create obligation |
| POST | `/due-dates/run-reminders` | Admin | Run reminder sweep; `?days=7` |
| POST | `/due-dates/remind-me` | Authenticated | Personal 30-day sweep |
| PATCH | `/due-dates/:id/complete` | Owner or admin | Mark complete |
| PATCH | `/due-dates/:id` | Admin | Edit fields or completion state |
| DELETE | `/due-dates/:id` | Admin | Delete obligation |

Create body:

```json
{
  "userId": "cuid",
  "type": "PROPERTY_TAX",
  "title": "Q3 property tax",
  "description": "Municipal assessment for plot 42.",
  "dueDate": "2026-12-15",
  "amount": 4800,
  "referenceId": "AMA-2026-002"
}
```

Types: `PROPERTY_TAX`, `LICENCE_EXPIRY`, `APPLICATION_ACTION`, `PAYMENT_DEADLINE`, `DOCUMENT_EXPIRY`.

Reminder responses: `{ message, sent }`. Reminders only target open obligations with no prior `reminderSentAt` inside the
window.

## Dashboards

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/dashboard` | Authenticated | Citizen dashboard payload |
| GET | `/officer/dashboard` | Officer | Officer workload and recent activity |
| GET | `/admin/dashboard` | Admin | Platform-wide operations overview |

Citizen response keys: `stats`, `upcomingDueDates`, `recentApplications`, `recentActivity`, `recentNotifications`.
Officer response keys: `stats`, `recentApplications`, `recentActivity`.
Admin response keys: `stats`, `statusGroups`, `recentApplications`, `recentActivity`.

## Officer endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/officer/applications` | Officer | Applications assigned to the signed-in officer; optional `status` |

## Admin endpoints

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/admin/citizens` | Admin | Citizen directory; optional `search` |
| PATCH | `/admin/citizens/:id` | Admin | Toggle `isActive` or change `role` |
| GET | `/admin/officers` | Admin | Officer list with assignment counts |
| GET | `/admin/applications` | Admin | All applications; filters `status`, `search` |
| GET | `/admin/payments` | Admin | All payments; optional `status` |
| GET | `/admin/reports` | Admin | Status, payment, revenue and service-demand aggregates |
| GET | `/admin/audit-logs` | Admin | Latest 150 audit entries |

Citizen update body:

```json
{ "isActive": false }
```

or

```json
{ "role": "OFFICER" }
```

Administrators cannot deactivate or change the role of their own account.

Reports response keys: `applicationsByStatus`, `paymentsByStatus`, `servicePopularity`, `revenueByMonth`. Revenue covers
the current month and the previous five months.

## Utility

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Service heartbeat |

```json
{
  "status": "ok",
  "service": "Amaravati One API",
  "timestamp": "2026-11-05T10:00:00.000Z"
}
```

## Example session

```powershell
$login = Invoke-RestMethod -Method Post -Uri http://localhost:4000/api/auth/login `
  -ContentType 'application/json' `
  -Body (@{ email = 'citizen@amaravati.one'; password = 'Citizen@123' } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod http://localhost:4000/api/dashboard -Headers $headers
Invoke-RestMethod http://localhost:4000/api/credentials -Headers $headers
```
