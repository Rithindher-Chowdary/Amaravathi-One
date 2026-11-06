# Testing guide

## Automated checks

Start the stack first:

```powershell
npm run db:up
npm run db:seed
npm run dev
```

In another terminal:

```powershell
npm run test:smoke
```

`scripts/smoke.ps1` accepts `-BaseUrl` and `-WebUrl` if you run on different ports.

### Coverage

| Area | Checks |
| --- | --- |
| Health | `GET /health` |
| Authentication | Sign-in for citizen, officer and administrator accounts |
| Citizen | Credentials, payments, notifications, due dates, dashboard |
| Officer | Dashboard and assigned application list |
| Administrator | Dashboard, citizens, services, applications, payments, due dates, notifications, reports |
| Due dates | Admin completes a citizen obligation; reminder sweep runs |
| Payments | Receipt renders and shows the correct citizen name |
| Frontend | Vite dev server responds and serves the application shell |

The script fails fast on the first error and prints the failing check. It is intentionally narrow: it verifies that each
role's primary endpoints are wired and authorised. Business-rule depth is covered by the manual matrix below.

### Side effects

The smoke script completes one open due date and runs a reminder sweep, which can create notifications and stamp
`reminderSentAt`. Restore the demo dataset afterwards:

```powershell
npm run db:seed
```

### Build validation

```powershell
npm run build
```

This compiles the React application with Vite. Run it before demos and after frontend changes. The build currently
passes with 1672 transformed modules.

## Manual QA matrix

### Public and authentication

| # | Step | Expected |
| --- | --- | --- |
| 1 | Open `/` | Landing page renders with hero, features, service preview and calls to action |
| 2 | Open `/login` and submit an unknown email | Inline error, no session created |
| 3 | Sign in with a citizen account | Redirect to `/app/dashboard` |
| 4 | Sign in as officer | Redirect to `/officer` |
| 5 | Sign in as administrator | Redirect to `/admin` |
| 6 | Visit `/admin` while signed in as citizen | Redirect to the citizen home route |
| 7 | Register a new citizen | Account created, signed in, profile with Andhra Pradesh state |
| 8 | Request a password reset | Demo reset token returned and reset flow succeeds |
| 9 | Open `/app` without a token | Redirect to `/login` |
| 10 | Sign out | Token cleared and protected routes redirect |

### Citizen: services and applications

| # | Step | Expected |
| --- | --- | --- |
| 11 | Browse services and filter by category/search | Only matching active services appear |
| 12 | Open a service | Fee, SLA, eligibility and required documents render |
| 13 | Submit an application | New `AMA-YYYY-NNN` reference, success toast, timeline entry |
| 14 | Check payments after applying to a paid service | A pending fee exists for the new application |
| 15 | Upload a valid PDF or image | Document appears with type and size |
| 16 | Upload an executable or a file over 5 MB | Rejected with a clear message |
| 17 | Open an application with status history | Timeline shows dates, actors and remarks |
| 18 | Open `AMA-2026-004` as Priya | Correction banner, officer remarks and resubmit action |
| 19 | Resubmit after correction | Status returns to Submitted, action reminder completes |
| 20 | Pay a pending fee | Simulated UPI succeeds, transaction ID shown, receipt available |
| 21 | Simulate a payment failure | Status becomes Failed and the citizen is notified |
| 22 | Download a receipt | New tab shows printable receipt with correct citizen and amount |

### Citizen: wallet, notifications and profile

| # | Step | Expected |
| --- | --- | --- |
| 23 | Open the wallet | Credentials grouped by type with status badges |
| 24 | Add a credential | Appears as Pending |
| 25 | Verify the credential | Status becomes Verified and history records the attempt |
| 26 | View an expired credential | Effective status shows Expired |
| 27 | Remove a credential | Confirmation, then removal from list |
| 28 | Open notifications | Unread items highlighted; opening marks read |
| 29 | Use Check due dates | New reminders appear for open obligations |
| 30 | Mark all read | Unread count becomes zero |
| 31 | Edit profile and save | Success toast; header and prefill reflect new name |
| 32 | Verify mobile with OTP `123456` | Verified badge appears |

### Officer

| # | Step | Expected |
| --- | --- | --- |
| 33 | Sign in as `officer@amaravati.one` | Queue contains only applications assigned to K. Srinivas |
| 34 | Open `AMA-2026-001` | Under review, verified document and history visible |
| 35 | Request a correction with remarks | Status changes, citizen notification created, five-day reminder created |
| 36 | Approve a file with remarks | Decision stamped, citizen notified, correction reminder completed |
| 37 | Try to open an unassigned application by URL | Access denied |
| 38 | Open notifications | Officer-specific assignments and status alerts render |

### Administrator

| # | Step | Expected |
| --- | --- | --- |
| 39 | Open the dashboard | Counts, pipeline bars, latest applications and audit activity |
| 40 | Search citizens by name and by email | Correct filtered results |
| 41 | Deactivate a citizen | Badge changes; that citizen can no longer sign in |
| 42 | Reactivate the citizen | Sign-in works again |
| 43 | Create a service | Appears in the admin table and in the public catalogue |
| 44 | Edit a service fee and SLA | Changes reflect immediately |
| 45 | Deactivate and reactivate a service | Hidden from citizens while inactive |
| 46 | Open applications and filter by status | Counts and rows match |
| 47 | Assign an unassigned application | Officer queue updates; officer notified |
| 48 | Review admin payments | Collected, outstanding and failed totals reconcile with rows |
| 49 | Create a due date for a citizen | Appears in admin list and citizen account |
| 50 | Complete a citizen due date from admin | Status changes to Success |
| 51 | Run reminders | Message reports generated reminder count |
| 52 | Broadcast a notification | Every active citizen receives a row; audit records recipient count |
| 53 | Send a single-citizen notification | Only that account sees it |
| 54 | Open reports | Revenue bars, status distribution, payment summary and service demand render |
| 55 | Print report | Browser print preview shows the report content |

## API edge cases

| Case | Expected |
| --- | --- |
| Missing or malformed token | `401` with a session message |
| Deactivated user with a valid token | `401`; client clears the session |
| Citizen reading another citizen's application | `403` |
| Officer reading an unassigned application | `403` |
| Admin updating own role or active flag | `400` |
| Invalid service payload | `400` with field-level `details` |
| Duplicate registration email | `409` |
| Missing service or application ID | `404` |
| Upload over 5 MB | `400` with maximum-size message |
| Payment confirmation on a failed payment | `400` |
| Resubmit when not awaiting correction | `400` |
| Reminder sweep run twice in the window | Second sweep sends zero because `reminderSentAt` is set |

## Responsive and accessibility checks

- Verify layouts at 360 px, 768 px, 1024 px and 1440 px widths.
- Confirm the mobile sidebar opens and closes, and that tables scroll horizontally.
- Tab through the sign-in, application and modal flows; every control must be reachable and visible on focus.
- Confirm modals close on Escape, backdrop click and the close button.
- Check contrast of navy text on off-white surfaces and white text on navy/teal controls.
- Confirm status is never conveyed by colour alone: every badge includes text.

## Troubleshooting

| Symptom | Resolution |
| --- | --- |
| `Can't reach database server` | Run `npm run db:up`; confirm host port 5433 in `server/.env` |
| `Port 5433 already allocated` | Stop the conflicting service or change the compose and env ports |
| API starts but login fails with 401 | Confirm the seed ran and the account exists |
| Frontend calls the wrong API host | Check `client/.env` or `VITE_API_URL` |
| Uploads return 404 after restart | Ensure `server/uploads` exists and the API working directory is `server` |
| Smoke test cannot reach Vite | Start `npm run dev` or pass `-WebUrl` |
| Demo data is messy after testing | Run `npm run db:seed` |
