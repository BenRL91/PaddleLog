# Beta tools and timer resilience

Implemented four beta priorities: pause-aware resilient sessions; cost-of-play explanations; catalog corrections from paddle details; account-scoped feedback with owner triage.

## Walkthrough

- Home → Start session → Pause for break / Resume play. Switch the paddle while paused without allocating usage. Recorded time excludes pauses. Lock/reopen refreshes from stored timestamps, not tick counts. A failed final save retains the finished session ID, segments and original end time for retry.
- Collection Insights → Cost of play → How these costs are calculated. Expenses includes Shared supplies and facility costs. A $24/12 pack allocates $2 per installation; collection purchase cash totals include the pack once, while paddle subsets include consumed allocations. Facility-only uses collection hours; estimates and currencies retain existing semantics.
- Paddles → Specs & setup → Report incorrect catalog info. The report includes the displayed catalog reference and specs, never physical paddle ID, nickname, private notes or photos. Reports do not automatically modify catalog data.
- Settings → Feedback → Submit report. Failed submissions keep an account-bound device draft; unchanged retries use one report ID. My reports lists latest 50 reports, status, owner response and fix version. Email/copy remains available.
- Beta management → Feedback inbox. Owner-only status filtering, paged reports and search of current page; Open, Reviewing, Planned, Fixed, Closed. Fixed requires a fix version. Responses are reporter-visible. Revision checks reject stale owner updates while retaining entered text.

## Storage and access

Schema-only migration 0009 adds feedback_reports and indexes. No test data is seeded. Reports are guarded by the existing beta admission and account binding, and account deletion removes only that account's reports. Fixed owner UUID controls administration. Existing backup, importer, payments, shared authentication and public shell/invite-only app access remain unchanged. Feedback is operational support data, not part of collection backups.

Timer timestamps and drafts remain device-local. Web Locks serialize timer changes where supported; fallback performs optimistic storage checks. Changed/corrupt timer records are not silently overwritten. Saved-timer reconciliation compares usage segments, not merely the session envelope.

## Validation

New tests: timer-resilience, timer-ui-resilience, feedback-backend, feedback-submit-ui. Existing relevant tests passed: ownership-ux, beta-feedback, product-activation, session-details, multi-paddle-sessions, session-filters, backend, beta-admission, backup-ui, picklepoint-import, picklepoint-backend, shared-expenses, shared-expenses-ui, maintenance-costs, collection-cost, pro-workspace, pro-feature-list. TypeScript no-emit and JS syntax checks passed before packaging.

An attempted older equipment-integration fixture failed before exercising its assertions because its manual import harness lacks installFormFeedback; it predates current app imports. The current dynamic-import timer UI test covers actual start, pause, reopen, failed end, retry, wear hours and duplicate protection. No synthetic fixtures were inserted into production.

## Remaining device checks / limitations

Physical iPhone/Safari phone lock, process termination and airplane-mode checks remain manual QA; no claim of physical testing. Storage clearing removes device-local timers/drafts. Active timers do not transfer between devices. Unpaused time is treated as play: users must pause for breaks. Feedback submissions need connectivity; there are no attachments or automatic email notifications. Status updates appear when My reports is reopened. Inbox search applies to the displayed page. Catalog reports require owner review and a later catalog update.
