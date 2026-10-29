# Pickle Point → PaddleLog integration v1
> 2026-10-07: deployed v1 wire contract remains unchanged. Account-backed Pickle Point storage and the disabled scoring v2 proposal are documented in PICKLE-POINT-ACCOUNT-STORAGE.md, PICKLE-POINT-SOURCE-MODEL.md and PADDLELOG-SCORING-V2.md. Earlier device-only storage descriptions describe the original milestone.


Receiver: `https://paddlelog.leewaypb.com`. See [the receiver boundary](PADDLELOG-BOUNDARY-V1.md), [transport schema](paddlelog-sync-v1.schema.json) and unchanged [file schema](paddlelog-export-v1.schema.json).

## Authentication and topology

This implementation chooses the direct browser option explicitly permitted by the handoff. Pickle Point remains a static, local-first Sites app; no relay, database, service credential, shared authentication setting, payment or PaddleLog change is made. The handoff confirms PaddleLog enabled the exact origin `https://pickle-point.leeohsunshine.chatgpt.site`. The owner confirmed adding `https://pickle-point.leeohsunshine.chatgpt.site/auth/return` to Supabase redirects.

The pinned Supabase JS SDK 2.117.1 is the sole owner of persistent browser authentication storage, automatic token refresh and SDK cross-tab refresh locking. This differs from the receiver's recommended HttpOnly backend cookie storage: tokens are SDK-managed in this origin's browser storage, readable by this app's JavaScript, rather than server cookies. The browser sign-in page explains that it remembers the session. They are never copied into the scoring library, outbox, exports, backups, image URLs, error messages or logs. No service-role key is used. Code and provider errors are removed from the callback URL immediately; the callback has no-referrer and no-store policies. Only email, Google and Apple are exposed; provider buttons follow Supabase public settings. Anonymous sessions are rejected. Signing in does not merge identities by email.

Every integration request obtains the current user's access token from the SDK, checks it belongs to the expected queue owner, and sends it only as `Authorization: Bearer …` to the fixed PaddleLog integration base. Cross-origin cookies are omitted. A 401 causes one same-user refresh/retry. PaddleLog verifies identity and authorizes all remote access; cached browser session identity is used solely for selecting device-local storage, not remote authorization. No Supabase data tables are used.

## Local identity, migration and selection

IndexedDB stores each library under `account:<Supabase subject>` and the unconnected library under the existing `main` key. Each account's library has its own persistent random sourceInstanceId. Existing history is **not** silently assigned to the first sign-in. Settings offers an explicit, confirmed move of the unconnected library into an empty signed-in library, preserving original sourceInstanceId, source session/interval IDs and export revisions. The old unconnected slot is replaced with an empty library with a new identity; history is not copied into another account. Merging two nonempty libraries is intentionally unavailable. Ordinary saves cannot replace an existing sourceInstanceId or reassign a library/outbox owner.

PaddleLog is authoritative for physical paddles. Its response is a per-user display cache, not a second writable physical-paddle database. Cache fields are allowlisted, support account ETags and are cleared on sign-out/account switch. Active units are offered for new live selections; all owned statuses are offered for explicit historical interval mapping. The cache can be read offline after restart, but may be stale. Missing/deleted units pause delivery for resolution. No unit is selected by a matching name, model, favorite or Main flag. Selected source paddle hints retain stable local IDs and human-readable labels. Uploaded images are fetched using authorization and displayed using temporary blob URLs; these URLs are revoked on account change. Missing imagery uses the existing local icon.

## Recording, revisions and transport

Actual playing intervals continue to be recorded only when the user explicitly selects a paddle and chooses Playing. Pause closes an interval; resume and paddle switches start new stable intervals. Interrupted open intervals require an actual end-time review. There is no elapsed-time substitution. Every source interval retains its v1 paddleRef label identity and an optional internal physicalPaddleId.

The v1 file export fields and meaning are unchanged. Export revision fingerprints now also include internal physical bindings whenever present, as required by integration v1; changing or clearing a binding increases the **same** source revision used by files and delivery. Existing unbound fingerprints remain byte-identical and do not bump merely because the new app loads them. No physical ID or companion field is added to v1 playIntervals.

Delivery uses exactly:

```json
{
  "format": "leewaypb.paddlelog-session-sync",
  "integrationVersion": 1,
  "operation": "upsert",
  "sessionExport": "the unchanged v1 envelope object",
  "physicalPaddleReferences": [
    {"sessionId":"stable-source-id","intervalId":"stable-interval-id","physicalPaddleId":"explicit-owned-physical-unit"}
  ]
}
```

The string above is explanatory; real payloads contain the envelope object. See `fixtures/sync-revision-1.json` and `sync-revision-2.json` for complete machine-readable examples. Their physical IDs are synthetic placeholders and must not be sent to production accounts.

## Durable outbox and outcomes

Connecting explicitly enables automatic completed-session delivery. A pending snapshot and its exact serialized UTF-8 body are saved in the **same atomic IndexedDB transaction** as source facts/revision changes. Entries are owned by that account and library. One session per request isolates conflicts and satisfies the receiver's 1–50 session limit. Each request has at most 10,000 references and is strictly under 2,000,000 bytes; a source session is never divided or truncated. Unfinished, invalid, elapsed-only or unresolved records cannot be delivered and receive actionable review/file-import status.

While the app is open, completion/edit commits, restart, online events and periodic wakes process the queue. Browser delivery locks serialize cooperating tabs where available; receiver idempotency protects retries where unavailable. Network loss, timeout, 5xx, or explicit retryable LIBRARY_CHANGED keep the identical body with bounded exponential backoff. A response lost after commit is retried unchanged. Successful created/updated/unchanged/stale results are validated before acknowledgment; stale stops the older revision. An edit during IO creates a higher-revision snapshot; the earlier response cannot acknowledge or discard it. Failed batches are never acknowledged.

Final 401 pauses until sign-in/token refresh or explicit retry; 403 pauses with access guidance. Mapping errors request refreshed physical selection. Revision/local-edit/removal/overlap conflicts pause for reviewed file import and never loop indefinitely. Library storage-limit errors point to PaddleLog. File exports remain available individually and in date/all-session batches. Score/rally journals, players, notes, photos, health and credentials are excluded from delivery by the existing allowlisted exporter.

Sign-out/account changes abort IO, stop voice, clear dialog previews/images/caches, switch the local library and leave the former user's queue intact. Every token retrieval, request, response and queue-save boundary checks the owner again. No queue is processed under another user's token. Pausing or deleting a source session cancels pending local delivery only: v1 has no retraction/deletion operation and never infers deletion from missing records. Already delivered PaddleLog usage needs separate reviewed correction/removal there.

## Verification and limits

Automated tests cover exact retries, revisions/bindings, single/multiple units with the same legacy label, breaks/midnight/timezones, unavailable timing, size splitting, two-user storage isolation, explicit adoption, account switch during IO, source edits during delivery, lost responses/offline restart, CAS backoff, reviewed conflicts, stale receipts, ETags, photo authorization, cache clearing and the connected UI flow. Public Supabase settings were read successfully and reported email/Google/Apple enabled and anonymous users disabled. The unchanged scoring, voice, storage, file exporter and offline suites are included in regression verification.

Tests use fake IndexedDB, synthetic users/paddles, DOM emulation and mocked integration responses. They do not prove physical-device rendering, real email templates/provider redirects, production admission or a live authenticated cross-app commit. No synthetic sessions have been inserted into production. The owner must test actual sign-in and one real session before live end-to-end integration is considered verified. Callback route rewrite/header files are packaged for the existing static hosting workflow.

Final verification on 2026-10-06: `npm run build` succeeded; `npm test` passed **117/117** (zero failures); `git diff --check` passed. Full output is committed in `test-results.txt`. Ajv 8.17.1 with ajv-formats 3.0.1 validates the paired fixtures and producer payloads against the supplied Draft 2020-12 schema; rejection cases cover additional fields, unsupported operations and oversized batch counts.

Delivery is foreground only, not guaranteed OS background delivery. Closing the app retains its outbox; reopening resumes it under the same account. Scoring history remains device-local, not cross-device cloud sync. Clear-browser-data removes local libraries, outbox and SDK sign-in; keep backups. Existing backup export is intact and includes source identities, revisions and pending outbox, but there is still no backup restore UI. Session-time correction that clears recorded usage remains elapsed-only and cannot automatically retract previously delivered PaddleLog usage.

Official auth references: https://supabase.com/docs/guides/auth/sessions/pkce-flow ; https://supabase.com/docs/reference/javascript/auth-getsession ; https://supabase.com/docs/reference/javascript/auth-onauthstatechange .
