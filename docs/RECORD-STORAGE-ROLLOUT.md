# Record storage and recovery rollout

## Implemented

Migration 0005 is additive and schema-only. It creates account_libraries and
account-scoped user_paddles, user_sessions, user_maintenance, user_usage_periods,
and user_catalog tables. All keys include the account ID; session and maintenance
lookups have account/paddle indexes. The master catalog and official rules remain
separate from a user's reference entries.

Libraries stay readable in the original account_logs format until the next
successful save. That save splits the validated library without changing IDs,
timestamps, session hours, configuration, settings, or ownership. A canonical
roundtrip comparison must pass before writing. Maintenance is extracted from
paddle records and reconstructed for existing clients and exports.

The original account_logs payload and revision remain untouched after conversion.
Read paths and exports use normalized records once the library header exists.
Account deletion removes both formats and all account-prefixed R2 recovery copies.

Writes compare the account revision and apply a unique commit token in a single
atomic D1 batch. Unchanged records are skipped; competing saves cannot overwrite
records without winning the revision check. Reads check the revision before and
after retrieving rows and retry mixed snapshots. The API still transfers full
libraries and keeps the existing 2 MB request/import cap. Paginated reads and true
per-record network requests are a later scaling step, not part of this release.

## Recovery

Before changing a confirmed library, save its previous confirmed revision under
accounts/<account>/backups/<revision>.json in R2. A backup failure stops the save.
Failed SQL batches roll back the header and all row changes. Failed CAS attempts
cannot change records. Copies retain photo references, not duplicate photo bytes.
Settings > Account > Recovery lists the latest 20 previous revisions and permits
confirmed restore through the normal authorization, photo ownership, tier, and
conflict checks. Recovery is available to Free users. Older recovery copies remain
stored; a retention policy and scheduled pruning are not configured yet.

A device-local pending save contains the account ID, base snapshot, desired
snapshot, and whether it is a full replacement. It is written before a network
save and removed only after confirmation. It can be retried after reopening,
or when connectivity returns with no form open. A conflicting or unauthorized
save is retained for review or explicit discard, never silently replaced by a
second operation. Existing form and photo drafts remain independent.

## Verification and monitoring

Authenticated /api/library-health returns only the current account's counts,
revision, storage format, and calculated lifetime hours. The Settings check exposes
these values without exposing paddle notes, identity tokens, or payment data.
This is an account diagnostic, not a configured production alerting service.

Tests exercise real SQLite migrations, roundtrip preservation, isolated accounts,
CAS races, failed row writes, unchanged-record writes, backup failure, recovery
ownership, session/maintenance counts, and unchanged calculated hours. Frontend
three-way merge supports independent maintenance and weight items; simultaneous
changes to the same item field require review.

## Rollback

Do not deploy the old application directly after normalized saves: it would read
an old account_logs snapshot. The old snapshot is the pre-migration recovery point,
not a current mirror. Prefer restoring a selected revision through the new app.
For engineering rollback, stop writes, export/reconstruct each account's current
normalized library, validate it, then write those current snapshots and revisions
into account_logs before deploying legacy code. Keep new tables until the audit
is complete. Never overwrite a normalized account from an older recovery copy
without the owner's explicit restore instruction.

## Launch gates still external

The current deployment remains owner-private. Native distribution and public
signup need a public authenticated API and an explicit hosting audience/operations
decision. Do not make the site public as part of this migration. Managed Sites
billing, ownership/control, monitoring access, and portability must be confirmed
before treating direct Cloudflare pricing as the app's hosting contract.

Apple Sign-In and real StoreKit purchases still require active Apple enrollment,
App Store Connect products, signing, secure provider configuration, and device
sandbox/TestFlight testing. Existing adapter boundaries are preserved; this
release does not manufacture Apple credentials or enable unverified purchases.

## October 2 follow-up: delta sync and operations

Routine saves now use PATCH /api/state with versioned record changes, including
separate maintenance event updates. Unchanged specifications/history do not travel
in a note edit. Optimistic saves use the last known account revision; only a 409
loads a fresh library and performs a three-way merge. Identical already-saved work
is acknowledged without another write. PUT remains compatible with backups and
older clients. Initial library loads are still full-library reads; pagination and
larger import limits remain separate scaling work.

Migration 0006 adds daily account-scoped health counters. Successful/failed server
save attempts, conflicts, backup/cleanup failures, load failures, and reported draft
storage failures have fixed codes. No arbitrary payloads, notes, ratings, tokens,
or financial details are accepted. Counts cap at 10,000 per code/day and prune old
account counters on activity. Settings refreshes health while that screen is open.
There is no external alerting service or email notification connection in this release.
A network failure that never reaches the server is handled by local pending-save
recovery; server counters cannot reconstruct requests they did not receive.

Recovery retention keeps the latest 20 snapshots, one per recent week (eight weeks),
one per recent month (six calendar months), and the oldest snapshot. Buckets overlap,
so known dated histories retain at most 35 copies. Unknown timestamps are preserved.
Cleanup follows confirmed saves, never runs ahead of backup/commit, and never affects
live paddle/session data or photo objects. A cleanup failure is counted but cannot
turn a confirmed database save into a failed save. The immutable original library
remains separate from R2 cleanup. Account deletion purges all these account-scoped
copies/counters. Backup write checks account status after upload to prevent a late
upload from resurrecting data during deletion.

Photo checks batch newly introduced references and enforce ownership even for the
legacy owner; already confirmed references do not cause thousands of repeated
queries on a routine session or note update.
