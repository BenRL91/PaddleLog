# Pickle Point scoring/account update validation — 2026-10-07

`npm run build` succeeded. `npm test` passed **143/143**, zero failures/skips. `git diff --check` passed. Bundled Worker smoke verified six app/assets/account/callback routes and anonymous library API rejection (401). New generated SQL contains one bounded account_libraries CREATE TABLE with owner primary key; no production seeds/backfills/runtime schema creation. Final source migration and metadata are published together.

New tests include 15 scoring/contract tests, 7 cloud-library tests and account onboarding DOM integration. Existing regressions cover 120 prior scoring, export, v1 delivery, authentication, offline and UI cases. DOM tests are emulation, not physical Safari/device visual QA.

Coverage:

- Actual source singles/doubles, all five engine profiles including domain simple; multiple games/matches and best-of outcome.
- Guest, saved, verified self-account-linked references; explicit owner participating/spectating/unknown; identical names remain distinct stable IDs.
- Completed, unfinished projection and abandoned games; unknown legacy clocks and explicitly unknown winners/match result. Completed engine games normally always have a known winner; the unknown-winner test is a defensive synthetic transport projection, not a source completion claim.
- Explicit paddle switches yield mixed association; partial/gapped single-paddle coverage remains unknown. No score/game elapsed time becomes wear.
- Strict JSON Schema fixtures/results and runtime relationship/date/ID/reference/result/privacy validation; synthetic normal→correction→deleted-game snapshots preserve source identity and v1 usage revision, increment independent v2 revision.
- Identical retries, stale/newer/same-revision conflicts; source atomic save metadata; owner reassignment and game removal; unchanged v1 file exporter/delivery regressions.
- v2 hard-disabled; injected v2 pending body blocked before network; non-v1 successful response pauses review and cannot acknowledge delivery.
- Ordinary payloads omit email/credential/notes fields; private-name email patterns redact to null. Invitations use ephemeral explicit review→Send action and fail clearly without an authorized service, no delivery or account linkage.
- Provider-verification mocks and real in-memory SQLite with generated D1 schema: two-account isolation, anonymous/cookie-only/foreign library/origin rejection, credential-field rejection, atomic cloud CAS, identical lost-response retry, restore preserving source IDs/revisions, offline scoring recovery, account switch during outbox/cloud request, simultaneous-device review, restore-vs-local-save conflict and oversize preservation.
- Account onboarding DOM: new-play sign-in gate, old local history retained, account restore, explicit invitation preview/send with no email persistence and returning offline play.
- Existing real-user v1 connection behavior was preserved; no live PaddleLog v2 request or production fixture/session/invitation was sent.

Known limitations: receiver v2 not implemented/confirmed; no v2 sender/outbox enabled; no scoring file import extension; elapsed-only/unmapped sessions remain v1 reviewed files; no completed-session score editing UI; no verified-other-player/accepted invitation boundary; no invitation delivery; legacy game times/participation unknown; no whole-session retraction/tombstones; account sync is foreground-only with <1.8 MB library capacity and explicit whole-library conflict replacement rather than merge. A physical sign-in/new-device recovery check and receiver cross-app tests require real user action. Pro analytics implementation is entirely PaddleLog's next task using existing entitlements, with no payment/shared-auth changes.
