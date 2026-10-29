# PaddleLog ↔ Pickle Point integration: PaddleLog boundary v1

PaddleLog beta base URL: `https://paddlelog.leewaypb.com`.

PaddleLog owns physical paddles, metadata, maintenance and usage history. Pickle Point owns source scoring/session records. This change adds a narrow authenticated library read and completed-session delivery boundary **only in PaddleLog**. The deployed `leewaypb.session-export` schemaVersion 1 is unchanged.

## Authentication and access

Every actual integration call requires `Authorization: Bearer <current LeewayPB user access token>` from the existing shared Supabase identity. PaddleLog reuses its provider-verified identity resolver, internal account mapping, beta admission and active-account checks. Cookie-only, ChatGPT/Sites-only and anonymous callers cannot use these endpoints. No user ID or email in a request authorizes access. Do not send service-role keys. Tokens do not appear in responses, provenance, URLs or backups.

All library/record/photo queries use the resolved PaddleLog account. D1 is the application database; Supabase is authentication only. Existing account-scoped D1 queries and atomic compare-and-swap saves provide ownership isolation; no Supabase tables/RLS/auth settings are changed. The API does not attest that a payload was signed by Pickle Point: an authenticated user can submit their own history, as with manual imports.

Server relay: Pickle Point can call PaddleLog with the requesting user's current bearer token and no browser `Origin` header. Do not use a global background service credential to impersonate users. Do not log user tokens or forward PaddleLog cookies.

Direct cross-origin browser calls are closed by default. A PaddleLog-only runtime setting, `PADDLELOG_PICKLEPOINT_ORIGINS_JSON`, can opt in the **confirmed exact HTTPS Pickle Point origin(s)**. No origin was guessed or enabled in this release. The owner must confirm/set that value before direct browser calls work. This setting applies only under `/api/integrations/pickle-point/`. Existing explicitly enabled native shell origins are also accepted. CORS permits GET for library/image, POST for sessions, Authorization/Content-Type/If-None-Match headers, and no credentials/wildcards. Preflight OPTIONS exposes no account data and needs no token; actual requests always need one. Other apps' API CORS behavior is unchanged.

## 1. Library: getMyPaddles

`GET /api/integrations/pickle-point/paddles`

```json
{
  "format": "leewaypb.paddle-library",
  "schemaVersion": 1,
  "libraryVersion": 12,
  "paddles": [{
    "physicalPaddleId": "physical-123",
    "nickname": "Blue paddle",
    "brand": "Example",
    "model": "Example 16 mm",
    "status": "active",
    "isMain": true,
    "isFavorite": true,
    "image": null,
    "version": "sha256-of-selection-display-fields"
  }]
}
```

- The ID is the existing physical unit ID, never a catalog model ID and never derived from an email. Renaming, changing Main or archiving does not change it.
- All owned active, inactive and archived paddles are returned. Pickle Point should normally offer active units for live selection; archived units remain available for historical references.
- No private paddle notes, session history, expenses, measurements, maintenance, account ID, email or authentication data are included.
- `libraryVersion` is the existing account library revision; it may change for unrelated library edits. Each paddle `version` hashes its display fields including its current photo reference. The authenticated, account-scoped ETag supports `If-None-Match` → 304. Keep caches scoped to the current signed-in user and clear them on sign-out/account changes. Responses are private/no-store to prevent intermediary sharing.
- An owned uploaded primary image produces `image: {"href":"/api/integrations/pickle-point/paddles/image?physicalPaddleId=physical-123","requiresAuthorization":true}`. Resolve the relative URL against the PaddleLog base and fetch with the same bearer token, then display a temporary blob URL. Never put the token in an image URL. The endpoint reuses existing owner-checked photo storage. It returns 404 for a missing/deleted/foreign paddle or absent uploaded photo. These are original images, not generated thumbnails; use a local illustration when image is null. Shared catalog imagery is not replicated by this boundary.

## 2. Completed session delivery

`POST /api/integrations/pickle-point/sessions`

`Content-Type: application/json`

The versioned transport wraps the unchanged export. It does **not** add unsupported fields to v1 source intervals:

```json
{
  "format": "leewaypb.paddlelog-session-sync",
  "integrationVersion": 1,
  "operation": "upsert",
  "sessionExport": {
    "format": "leewaypb.session-export",
    "schemaVersion": 1,
    "sourceApp": "pickle-point",
    "sourceInstanceId": "c7b6215c-9b23-4a33-9ae7-d7c5a44ee625",
    "exportedAt": "2026-10-05T12:00:00.000Z",
    "sessions": [{
      "id": "source-session-1",
      "revision": 1,
      "updatedAt": "2026-10-05T11:00:00.000Z",
      "status": "completed",
      "start": "2026-10-05T10:00:00.000Z",
      "end": "2026-10-05T11:30:00.000Z",
      "timeBasis": "recorded-play",
      "playIntervals": [{
        "id": "interval-1",
        "start": "2026-10-05T10:00:00.000Z",
        "end": "2026-10-05T11:00:00.000Z",
        "paddleRef": {"id":"source-paddle-1","label":"Blue paddle"}
      }]
    }]
  },
  "physicalPaddleReferences": [{
    "sessionId": "source-session-1",
    "intervalId": "interval-1",
    "physicalPaddleId": "physical-123"
  }]
}
```

See `paddlelog-sync-v1.schema.json` and the paired synthetic fixtures `sync-revision-1.json` / `sync-revision-2.json`. Those fixture physical IDs are placeholders for local tests; do not deliver fixtures to a user's production account.

Limits: UTF-8 request <2,000,000 bytes, 1–50 source sessions, at most 10,000 physical references. Every interval must have exactly one reference. Unknown envelope/reference fields, duplicate source sessions/intervals/references, malformed dates, overlapping source intervals and unsupported operations are rejected. Existing validation requires completed sessions, positive safe source revisions and real UTC instants with milliseconds. Automatic delivery requires `recorded-play`; elapsed-only/unknown or missing bindings require reviewed file import. No elapsed duration or default paddle is substituted for usage.

`paddleRef` remains Pickle Point's optional v1 label identity; explicit physical bindings take precedence and are resolved **per interval**, even when two intervals share a legacy source label. They do not create physical paddles or overwrite saved legacy mappings. Existing owned archived/inactive units are valid for historical use. A missing/deleted/foreign physical ID is a generic unresolved reference error, with no disclosure about another user's library.

A batch is all-or-nothing. One conflict or unresolved record prevents every record in that request from being written. Split batches to isolate an item requiring review; do not silently discard it.

Success:

```json
{
  "format": "leewaypb.paddlelog-session-sync-result",
  "integrationVersion": 1,
  "libraryVersion": 13,
  "results": [{
    "sourceSessionId": "source-session-1",
    "paddleLogSessionId": "pp-deterministic-source-hash",
    "status": "created",
    "revision": 1
  }]
}
```

Results are `created`, `updated`, `unchanged`, or `stale`. A stale result reports the latest known source revision and does not write older data. Unchanged results may include `localEditsPreserved: true`. An unchanged retry normally leaves the library revision unchanged; first API contact with an already file-imported record can save a delivery receipt without changing usage. The transport export timestamp and batch order are not source identity/content.

## Identity, revisions, and atomicity

External identity is `['pickle-point', sourceInstanceId, session.id]`, scoped inside the authenticated PaddleLog account. Existing deterministic local IDs and the file import classifier/reconciler are reused. Pickle Point must retain the same sourceInstanceId and session ID used by its file exporter. Never generate new IDs per delivery or retry.

- Same identity/revision and normalized source content/physical bindings: no duplicate session or usage.
- Same revision, different source content **or physical bindings**: 409 `REVISION_CONFLICT` / `PADDLE_ASSIGNMENT_CONFLICT`. Increment the source session revision when paddle assignment or usage changes.
- Higher revision: replace the imported session's source fields and segments, retaining the same PaddleLog session ID. Unrelated PaddleLog records, physical paddles, maintenance, photos and applicable reflections are preserved. Usage-derived calculations read the corrected session log; no independent hour counter is incremented.
- Lower revision: acknowledged stale without overwriting the newer source representation.
- Local PaddleLog edits or reflection removal: explicit review error. Use the existing file preview to acknowledge what should be replaced. An unchanged retry preserves local edits. Pickle Point remains authoritative for source facts; automatic transport does not silently erase local work.
- Overlap with another logged session: review error to avoid counting the same play twice across manual/file/API channels. Do not keep automatically retrying a permanent conflict.

Before any write, the receiver reads a consistent account library snapshot, validates the candidate, writes the previous recovery copy through existing storage, and uses the existing atomic D1 CAS batch. A concurrent library commit returns 409 `LIBRARY_CHANGED`, `retryable:true`; retry the identical delivery after backoff. The next attempt reevaluates duplicates/revisions against the latest library. Backup/write failures fail closed and are safe to retry. Candidate libraries must remain below the existing file import/backup working limit (1,900,000 UTF-8 bytes) to preserve restore usability.

Account library metadata retains compact source revision/content/reference digests under `settings.picklePointSyncReceipts`. This is an account-scoped receipt ledger, not another paddle database. It participates in the same atomic save and survives collection JSON export/import/backup. It keeps retries from recreating a previously received session that the user deleted locally (`LOCAL_SESSION_REMOVED` → reviewed file import). Existing older clients cannot accidentally strip receipts or delivery provenance when saving. Restoring an older backup can intentionally roll receipt/history state back; outbox retry then follows that restored state. Do not treat collection backup as a source deletion signal.

Provenance: `session.picklePoint` keeps sourceApp, sourceInstanceId, normalized v1 snapshot, applied baseline, importedAt and optional `delivery` (`file-import` / `api-sync`). Older provenance without delivery is displayed as file import; manual sessions have no Pickle Point provenance. API updates are labeled Synced from Pickle Point in Sessions. A first unchanged API delivery of a file import keeps its file provenance; an applied source update becomes api-sync. PaddleLog has no outgoing session delivery path, so this implementation creates no sync loop. Normal PaddleLog backups retain provenance; they are not Pickle Point source-session exports.

## Errors and outbox handling

Error body: `error`, usually `code`, optional `sourceSessionId`, and `retryable`. General existing authorization/service errors retain PaddleLog's standard `error` response.

| HTTP / code | Pickle Point action |
| --- | --- |
| 200 created/updated/unchanged | Acknowledge that revision; keep source ownership and mapping IDs |
| 200 stale | Stop retrying this older revision; deliver latest source revision if necessary |
| 401 | Refresh current user's sign-in; do not switch identities to deliver |
| 403 | Beta admission or origin not enabled; show access/connectivity issue |
| 409 LIBRARY_CHANGED, retryable true | Retry identical request after backoff |
| 409 REVISION_CONFLICT / PADDLE_ASSIGNMENT_CONFLICT | Correct source content/bindings and increment revision, or review file import |
| 409 LOCAL_EDITS_REQUIRE_REVIEW / LOCAL_SESSION_REMOVED / SYNC_STATE_REQUIRES_REVIEW / REQUIRES_REVIEW | Pause that record and offer reviewed file import; do not retry endlessly |
| 422 REQUIRES_MAPPING / PADDLE_REFERENCE_REQUIRES_RESOLUTION | Ask user to resolve physical selection or export for file import |
| 400/413/415 | Fix contract, size or Content-Type; split oversized batches; LIBRARY_LIMIT needs user storage resolution |
| 503/network/timeout | Retain outbox, back off and retry identical revision; server may have committed before the response was lost |

Do not acknowledge a failed batch as delivered. Show actionable per-record resolution, not silent fallback by brand/model/nickname. Refresh the library when a reference becomes unavailable. Never retry a user's outbox under another signed-in user's bearer token.

## Explicit retraction proposal (not implemented)

Integration v1 only accepts upsert; DELETE, `operation: retract/delete`, empty sessions and status changes are not interpreted as removal. There is no destructive endpoint in this release.

A future **integrationVersion 2** should use a distinct `operation:"retract"` message with `sourceApp`, `sourceInstanceId`, `sessionId`, strictly newer `revision`, `updatedAt`, and an explicit reason. Keep schemaVersion 1 export meaning intact. Its account-scoped durable tombstone must be atomic with removal of the matching imported usage, retained in backups, and preserved even when the session row is removed. Equal tombstone retries must be no-ops, older upserts rejected stale, equal-revision fork/delete disagreements explicit conflicts, and newer restoration require an explicit restore operation/decision rather than a casual upsert. Locally edited sessions should require review. Manual/unrelated records and paddle metadata must never be deleted. Both apps must agree and test this contract before implementation.

## Pickle Point implementation required

1. Add an explicit PaddleLog connection/selection flow using the existing same-user LeewayPB session; retrieve getMyPaddles and cache per authenticated identity. No second authoritative physical-paddle database.
2. Save returned physicalPaddleId on source usage intervals, retaining v1 legacy paddleRef for file export compatibility. Build the companion physicalPaddleReferences array at delivery time.
3. Record actual intervals and gaps/paddle changes; never substitute elapsed time or guess a paddle. Prompt source revision increments for every semantic usage/binding correction.
4. Persist a per-user completed-session outbox. Reuse sourceInstanceId/session.id/revision from its existing v1 exporter. Retry after network loss, token refresh and restart under the same user; apply the response/error rules above. Local source facts remain in Pickle Point.
5. Use a server relay with the user's bearer token, or confirm the exact browser origin so the PaddleLog-only allowlist can be enabled. Do not change shared auth or use privileged service credentials for user data.
6. Keep existing single/batch file exports for unresolved/legacy sessions and reviewed conflict resolution. Do not send received PaddleLog history as new Pickle Point source sessions.
7. Test two different users, account switch mid-outbox, stale cached paddles, deletion/archival, retries, revision splits, lost responses and offline restart. Automatic live end-to-end sync is not complete until these Pickle Point changes are deployed.

## Components, migrations and tests

- New routes: library, owned image, completed sessions under `app/api/integrations/pickle-point/`.
- New helpers: `public/picklepoint-sync.js`, `lib/server/picklepoint-integration.ts`, `lib/server/picklepoint-cors.mjs`.
- Reused/extended: `public/picklepoint-data.js` (optional delivery and internal explicit interval bindings), `public/validate.js` (receipts), `app/api/state/route.ts` (older-client preservation), `public/app.js` (source label), `build/sites-worker.ts` (only integration CORS), `.env.example` (closed allowlist).
- **No SQL migration:** existing account library metadata/session payload storage supports the additions. Existing schema, migration files and generated metadata are untouched. No seeds or production test sessions.
- New tests: `picklepoint-sync.mjs`, `picklepoint-integration-backend.mjs`, `picklepoint-cors.mjs`.
- Existing relevant regressions: Pickle Point file domain/backend/UTC preview UI; manual session details/timer; record/backup restore; shared expenses; wear; existing account/beta isolation. Physical device and cross-app live tests require the Pickle Point worker implementation.
