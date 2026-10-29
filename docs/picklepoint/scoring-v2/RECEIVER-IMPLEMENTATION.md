# PaddleLog scoring v2 receiver

Implemented 2026-10-07. The vendored proposal/source-model/schema/fixtures describe Pickle Point's handoff; this document and PICKLE-POINT-WORKER-HANDOFF.md describe receiver support. Existing POST /api/integrations/pickle-point/sessions explicitly dispatches integrationVersion 1 or 2. Existing v1 file import and paddle-library endpoints remain unchanged.

## Storage and authorization

No database migrations. Complete scoring is stored on account-library sessions as picklePointScoring {snapshot,usageRevision}. Independent durable receipts are settings.picklePointScoringReceipts with sourceInstanceId, sourceSessionId, stable local sessionId, scoring revision, usageRevision and SHA-256 digest. Both lanes commit together using the existing recovery backup and atomic library CAS. Existing provider-verified identity/account admission, exact-origin allowlist, physical-paddle ownership checks and account-scoped D1 remain in use. Body/player account references never authorize anything or query other accounts.

Older-client saves preserve omitted scoring fields and receipts. Current edits retain scoring. JSON backup/export, restoration and differential record patches retain both metadata lanes. Removing a session retains its receipt to prevent automatic replay restoration. Same revision with different content conflicts; higher scoring snapshots replace arrays; lower snapshots make no usage/scoring changes. Stale companion usage rejects the entire batch. V1-only usage changes retain scores; UI and analytics compare baseline revisions to suspend paddle association until v2 refresh.

## Components

- public/picklepoint-scoring-schema.js: supplied snapshot schema.
- public/picklepoint-scoring-data.js: closed shape/semantic validation, receipts, interval-based association.
- public/picklepoint-scoring-sync.js: independent digest/revision classification wrapping the existing v1 reconciler.
- app/api/integrations/pickle-point/sessions/route.ts: authenticated dispatch and atomic commit.
- public/validate.js and app/api/state/route.ts: stored-state validation and older-client protection.
- public/picklepoint-scoring-ui.js, public/app.js, public/ui-system.css: free session game/team/player display, source status and unknown/mixed explanations; existing session editing preserves scoring.
- public/analytics-ui.js: game results in the existing Pro-authorized insights surface. Separate known-winner and known-score denominators; stable source-library saved-player joins, session/position-scoped guests; no mixed/partial/stale full paddle result attribution.

## Verification

New tests/picklepoint-scoring.mjs covers the fixture trio, all five profiles, strict shapes/privacy/references/results/dates, independent revisions, semantic retry ordering, forks/stale baselines, complete replacement, multi-session all-or-nothing candidates, local edit/removal review, score-only and corrected-duration usage/wear/cost behavior, backup/patch preservation, free display and Pro gate. Expanded tests/picklepoint-integration-backend.mjs exercises actual SQLite/D1-style account APIs, two-user isolation, concurrent CAS retries, failed recovery rollback, v2 receipts, export/restoration and omitted-field older-client protection. Synced-session edit test retains scoring while saving local details.

Regression suites: picklepoint-sync, picklepoint-import, picklepoint-backend, picklepoint-import-ui (UTC), synced-session-edit, backup-ui, session-details, timer-ui-resilience, analytics, beta-admission, backend, collection-cost, maintenance and picklepoint-cors. Production build and application type check are required before publish. Repository-wide tsc includes an existing standalone sign-in handoff source sample with an unresolved relative import; the application check excludes docs, without modifying auth/sample code.

## Limits

V2 sender/outbox must be enabled separately in Pickle Point. No live v2 delivery or physical mobile testing is claimed, and synthetic fixtures were not inserted in production. Scores are read-only source facts in PaddleLog. Old records with unknown owner/time remain honestly unknown; v1 file imports have no scoring extension. No invitation service, participant-email sync, whole-session retract or cross-app identity merge. Existing request/library size caps apply. Aggregate game results are all-time; summary dates do not filter them. Scoring associations describe results, never extra playing hours or causal paddle performance.
