# Demo script

A 12 to 15 minute walkthrough for judges or stakeholders. It shows one citizen journey end to end, the officer
decision loop and the administrator control plane.

## Before the demo

```powershell
cd D:\AmaravathiOne
npm run db:up
npm run db:seed
npm run dev
```

Checklist:

- API health responds at `http://localhost:4000/api/health`.
- Web app opens at `http://localhost:5173`.
- You are signed out, or using a private window.
- Browser zoom is 100 percent and the window is at least 1280 px wide.
- Demo accounts are open in a note: citizen `citizen@amaravati.one` / `Citizen@123`, officer
  `officer@amaravati.one` / `Officer@123`, admin `admin@amaravati.one` / `Admin@123`.

If anything drifts during rehearsal, run `npm run db:seed` and sign in again. The seed restores the exact dataset below.

## Seeded story

| Reference | Citizen | Service | Status | Officer |
| --- | --- | --- | --- | --- |
| `AMA-2026-001` | A. Ravi Teja | Property Tax Clearance | Under review | K. Srinivas |
| `AMA-2026-002` | A. Ravi Teja | Trade Licence | Submitted | P. Lakshmi |
| `AMA-2026-003` | A. Ravi Teja | Birth Certificate | Approved | K. Srinivas |
| `AMA-2026-004` | K. Priya | New Water Connection | Correction requested | P. Lakshmi |

## Scene 1: The promise (1 minute)

1. Open the landing page.
2. Point out the single front door for services, wallet, payments and reminders.
3. State the design goal: citizens should not need to know which department owns a service.
4. Sign in as the citizen.

Talk track: "Amaravati One is one identity, one wallet and one status trail across APCRDA services. Every integration in
this prototype is clearly simulated, but the workflow, permissions and audit trail are real."

## Scene 2: Citizen dashboard (1 minute)

1. Show open applications, approved services, wallet credentials, pending fees, upcoming due dates and unread alerts.
2. Point out the next-best-action cards and recent activity.
3. Open Applications and show the three seeded references with different statuses.

## Scene 3: Pay a fee through simulated UPI (2 minutes)

1. Open `AMA-2026-001` and read the timeline: submitted, documents verified, under review.
2. Open Payments.
3. Choose the pending Trade Licence fee and select Pay now.
4. Show the UPI sheet, keep the demo UPI ID, and complete the payment.
5. Download the receipt in the new tab and point out the transaction ID and simulation disclaimer.
6. Return to the application list; the fee is now settled and the audit trail is richer.

Talk track: "In production this is a UPI collect request with a provider callback. The rest of the flow, including
receipts and reconciliation, is already shaped the same way."

## Scene 4: Wallet and proactive nudges (2 minutes)

1. Open the wallet and show Aadhaar, DigiLocker, property, licence and document records.
2. Add an Income Certificate, then verify it. Show the verification history and the sandbox notice.
3. Point out an expiring credential and how status is derived from validity dates.
4. Open Notifications; show payment, status, due-date and broadcast alerts.
5. Use Check due dates to generate a reminder for an open obligation.

Talk track: "The wallet is the retention loop. Once credentials and deadlines live here, citizens return without needing
to remember which office to call."

## Scene 5: Officer decision (2 minutes)

1. Sign out and sign in as `officer@amaravati.one`.
2. Show that the queue contains only K. Srinivas's assigned files.
3. Open `AMA-2026-001`, review the verified document and history.
4. Add a remark and move the file to Approved.
5. Show the officer dashboard counters and recent decisions updating.

Talk track: "Permissions are enforced at the object level. An officer cannot browse another officer's queue even by
guessing a URL, and every decision is written to the audit log."

## Scene 6: Administrator control plane (3 minutes)

1. Sign out and sign in as the administrator.
2. Walk the dashboard: citizens, officers, application pipeline, collections outstanding and recent audit activity.
3. Open Applications, filter by status, and assign `AMA-2026-002` to an officer.
4. Open Due Dates, create a property tax reminder for A. Ravi Teja, then run the seven-day reminder job.
5. Open Notifications and broadcast a short announcement, for example a service camp this Saturday.
6. Open Reports and show revenue trend, payment status, workflow distribution and service demand.
7. Mention that the audit log records privileged actions including broadcasts and assignments.

Talk track: "The administrator is not editing spreadsheets. They are operating a live queue with revenue and service
demand in the same view."

## Scene 7: Citizen sees the loop close (1 minute)

1. Sign back in as the citizen.
2. Show the notification badge and the approval, due-date reminder and broadcast.
3. Open the approved application and point out the officer remark and decision date.
4. Return to the dashboard and show the updated due date.

Talk track: "This is the whole loop: apply, pay, track, get nudged, receive a decision, and keep the verified record in
the wallet."

## Scene 8: Reset and close

```powershell
npm run db:seed
```

Close with the scope that is production-shaped versus simulated:

- Real: role-based access, workflow rules, audit trail, reminders, receipts, reporting.
- Simulated: UPI, Aadhaar, DigiLocker, OTP.
- Next: live provider adapters, object storage, durable job scheduling, Telugu localisation and accessibility hardening.

## Fallbacks

| Problem | Recovery |
| --- | --- |
| Demo data changed | Run `npm run db:seed` and sign in again |
| Payment already completed | Open Payments and show the receipt, or create a new application for a paid service |
| Application already approved | Use `AMA-2026-002` for the officer decision instead |
| Docker is unavailable | Use a local PostgreSQL 16 instance and point `DATABASE_URL` at it, then migrate and seed |
| Port 5433 is busy | Stop the conflicting service or change the compose and env port together |
| Browser session is stale | Sign out, clear the site data for localhost, sign in again |
