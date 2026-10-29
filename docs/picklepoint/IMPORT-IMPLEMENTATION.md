# Pickle Point import in PaddleLog

Implemented against the supplied deployed v1 contract, schema, report, and synthetic fixtures. No exporter, authentication, infrastructure, payments, or audience changes are required.

## Walkthrough

Sessions → Import from Pickle Point → choose one or more JSON export parts → inspect counts and source records → map source labels to physical paddles → select each new session or update → review paddle assignments → Confirm import.

Every row defaults to Skip. Recorded intervals retain their exact UTC boundaries, switches and gaps. Elapsed-only / unknown sessions have blank manual interval controls: enter play start/end and paddle for each interval, then explicitly confirm the entered usage. Controls display the device timezone; source sessions show their recorded timezone. Archived/inactive paddles and apparent overlapping play require separate acknowledgements. Cancel discards preview and performs no writes.

Updates can replace source usage, notes and conditions, or replace usage while keeping local notes/conditions. Local edits and reflection removal require acknowledgement. Photos stay. Unchanged imports do not touch local edits; stale revisions and equal-revision forks cannot be applied. No missing record is treated as deletion. Source-provenance badges appear in the session list.

## Persistence and identity

`picklePoint` on the session contains the normalized source snapshot, source library UUID, the applied local projection and import time. The source snapshot stays separate from local edits. A canonical sorted-key representation compares source payloads, independent of file order/name or envelope export time. Source session revisions and source updatedAt remain part of source content.

New local session IDs are SHA-256-derived from the source tuple. Existing local IDs are retained for reviewed updates. Session provenance is unique within each current user library. Source mappings live in account-scoped settings; a source UUID is never an authentication credential. Server account binding, current-user queries, atomic CAS saves, recovery backups and conflict handling remain the existing authoritative path. A newer importer schema marker prevents obsolete clients from stripping source provenance. Normal session editing preserves provenance; backups and recovery include it.

All usage remains in standard PaddleLog session segments. There are no independent import counters. Total hours, estimated-usage reconciliation, overgrip/edge tape/skin wear and all per-hour cost calculations use their existing projections.

## Contract and application limits

No v1 wire fields were reinterpreted. Structural validation matches the provided JSON Schema, implemented explicitly in the shared validator rather than adding a third-party runtime dependency. Additional validation checks real UTC calendar instants, UUID v4, IANA timezone/aliases, safe positive revisions, identifiers, positive durations, session bounds, order/nonoverlap and duplicate identifiers. Optional absent/null paddle references normalize to an unassigned reference requiring explicit mapping. The source snapshot retains original context `environment: unknown`; the local session represents it using the existing empty/unspecified environment value.

Application limits beyond the wire schema are reported as errors: maximum 20 files per selection; each file strictly below 2,000,000 UTF-8 bytes; maximum 10,000 sessions per part and 5,000 intervals per session; source labels up to 2,000 characters, notes up to 10,000, context fields up to 1,000. A candidate library at/above 1,900,000 bytes is blocked with guidance to select fewer records, respecting the existing save request limit. Schema-valid records exceeding application limits are not silently truncated. Session preview is paginated in groups of 25. Repeated/out-of-order parts use their highest revision; competing contents at that revision are conflicts.

## Limitations

- File-based import only; no automatic synchronization.
- No unassigned history record is added: the existing session model requires positive usage and a physical paddle. Elapsed-only sessions stay in preview / are skipped until the user supplies play intervals.
- Overlaps are flagged, not automatically merged. A deliberate acknowledgement permits them and therefore can increase usage if the user accepts duplicate play. Existing estimates remain subject to their normal logged-time reconciliation.
- Equal-revision conflicting source content and lower revisions require correction/re-export in Pickle Point; the importer does not rewrite source revisions.
- The exporter reports its own single-browser-library ownership limitation. PaddleLog scopes imports to its authenticated current user; it cannot verify who originally played sessions in a user-selected file.
- Restoring a backup remains a separate, explicitly destructive library replacement. A locally deleted imported session may be offered as New if intentionally selected for import again.
- Physical iPhone/Android and desktop browser interaction have not been tested. Automated DOM coverage is not physical-device QA.

## Verification

- `node tests/picklepoint-import.mjs`: all supplied synthetic fixtures; identity and normalized equality; repeats; source updates, stale/fork revisions; local edits; mappings and missing paddles; gaps, midnight/timezone aliases; elapsed-only confirmation; split/out-of-order files; malformed/schema/resource errors; archived paddles; overlaps; backup/patch roundtrips; merge conflicts; normal wear and costs.
- `TZ=UTC node tests/picklepoint-import-ui.mjs`: preview and cancel without writes; mapping and mapping review; confirmed saving; failure/retry; repeats; elapsed input; overlap acknowledgement; account switching; invalid files; text escaping.
- `node tests/picklepoint-backend.mjs`: real SQLite/D1-style API account isolation; independent same-source identity in two accounts; mismatched account rejection; obsolete-client protection; local edits; source revision replacement and CAS race; exported provenance.
- Existing relevant backend, maintenance-cost, collection-cost, shared-expense, workspace, portable-backup and session-segment suites are run separately; results recorded in the user handoff.

All fixtures are test data. No synthetic sessions were imported into production.
