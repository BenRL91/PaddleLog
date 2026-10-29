# Pickle Point → PaddleLog session export v1

## Decisions and clarifications (before implementation)

The proposed envelope and time semantics are unchanged. `paddleRef` is concretely `{id, label}`: both strings, source-local mapping hints, never physical PaddleLog IDs. All emitted instants use `YYYY-MM-DDTHH:mm:ss.sssZ`.

Privacy: this exporter omits optional notes and context, as well as titles, rosters, scores and all other session fields. Free-text notes/location can contain opponent identities or contact details. Paddle labels are the only exported human-entered text; the preview lists these for review. Labels containing email-like text cause their session to be skipped as invalid. Other private information in user-authored labels cannot be identified reliably; users must review labels before sharing. Export-relevant changes therefore mean boundaries, stored timezone, status, interval IDs/times and source paddle IDs/labels. Changes to omitted fields do not increase the export revision.

Ownership limitation: the existing app is a single browser-local library, protected by the owner-private Sites audience. It has no signed-in account ID in its data model; `local-owner` is an opaque local scope, not authentication. Only records with exactly that owner are eligible. No shared authentication or infrastructure is changed. This does NOT establish account isolation on a shared browser or a future multi-user site; account-bound storage must precede that rollout. Backups from another person must not be loaded into this library.

A missing OR empty interval list exports `session-elapsed` with null intervals, conservatively: current empty lists do not prove zero play. Nonempty invalid lists cause the whole session to be skipped; they are never repaired, truncated or downgraded. Zero-length intervals are invalid. A completed session containing unfinished games is invalid; abandoned games do not themselves invalidate a completed outing. No score timing is used.

## Exact wire contract

UTF-8 JSON object, no additional fields, described by `paddlelog-export-v1.schema.json` (JSON Schema Draft 2020-12). Required envelope keys:

| Key | Value |
| --- | --- |
| format | `leewaypb.session-export` |
| schemaVersion | integer `1` |
| sourceApp | `pickle-point` |
| sourceInstanceId | random UUID persisted with the entire source library |
| exportedAt | UTC ISO timestamp |
| sessions | array of completed session objects |

Required session keys: `id` (stable nonempty source ID), `revision` (positive safe integer), `updatedAt` (UTC timestamp), `status` (`completed`), `start`, `end` (UTC timestamps, end strictly after start), `timeBasis`, `playIntervals`. Optional: `timezone` (IANA display timezone), `notes` (string), `context` (object containing optional string `location`, `ball`, `weather`, `netType`, and optional `environment`: `indoor|outdoor|unknown`). This producer omits notes/context.

`timeBasis=recorded-play` requires a nonempty interval array. Each interval has required stable `id`, UTC `start`, UTC `end`, and optional `paddleRef` (null or `{id,label}`). This producer always emits paddleRef. IDs are unique within the session. Intervals must have positive duration, appear in chronological order, not overlap, and lie wholly inside session boundaries. Gaps count as excluded time. Adjacent intervals are never merged, preserving explicit paddle switches. Sum only interval durations for recorded play; never infer additional usage from gaps, scoring or session elapsed time.

`timeBasis=session-elapsed|unknown` requires `playIntervals:null`. Current producer emits session-elapsed when intervals are unavailable; unknown is reserved as allowed by the proposal. PaddleLog must require reviewed usage confirmation/editing before assigning wear for these records.

## Identity, revisions and backup

Deduplicate using `(sourceApp, sourceInstanceId, session.id)`. An unchanged snapshot preserves ID, revision and updatedAt. A higher revision requires a reviewed update; never silently overwrite importer edits. Equal revisions with different payloads are conflicts, not safe updates. Missing sessions are never deletion commands.

The library UUID and per-session `paddleLogExport` metadata persist atomically in the same IndexedDB state as the session. Legacy libraries are migrated once before export/backup. Export revision starts at 1 at migration/first save and increments on every persisted change to the export projection, independently of scoring revisions. updatedAt is the UTC time that projection was persisted (migration time for legacy records). Exporting does not increment it. Backup JSON includes identity and metadata unchanged; any future restore must preserve these fields. There is currently no restore UI. Restoring an older backup can rewind revision history, and divergent restored copies can produce conflicts: importer must refuse lower revisions and flag equal-revision/different-content snapshots for review. Do not treat restored forks as automatic sync.

## Selection, privacy and splitting

All completed sessions or inclusive start-date range. Range is evaluated in the explicit display timezone captured when opening the export dialog (shown there), not by UTC date or overlapping-session logic. Crossing midnight does not split sessions. Session timezone is preserved, never rewritten to the current device timezone. Ranges require both dates.

Preview reports included count, elapsed-only count, and skipped counts (unfinished/discarded, invalid, outside range, other owner, oversized). Only allowlisted fields are serialized, never source object spreads. Tokens, email fields, players/opponents, voice, photos, health, scoring data and physical paddle IDs are excluded. Users must keep private information out of custom paddle labels. No network requests or automatic PaddleLog writes.

Each compact JSON file is strictly smaller than 2,000,000 UTF-8 bytes, independently valid with the same envelope identity and export timestamp. A session is never split across files. A single session too large for a file is skipped and reported. Duplicate session IDs in a library are all skipped as invalid. Filenames: `pickle-point-for-paddlelog-<UTC date>-<UUID>-part-<n>-of-<total>.json`. Each file has its own Download button, avoiding mobile multiple-download blocking, and Share when Web Share file support exists. Import support in PaddleLog is being implemented separately.

## Validation beyond JSON Schema

Importer must additionally validate real calendar timestamps and IANA timezones, end > start, interval order/bounds/nonoverlap, interval and session ID uniqueness, UTF-8 file size, safe revision integers, and content conflicts. JSON Schema cannot express these cross-field invariants. Unknown schema versions must be rejected or explicitly supported. Do not infer paddle mapping from matching model labels.
