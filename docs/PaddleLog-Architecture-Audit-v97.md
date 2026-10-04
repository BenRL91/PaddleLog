# PaddleLog architecture audit — saved version 97

Audit date: 4 October 2026. Read-only source audit; no implementation, authentication, schema, deployment, payment, or production-data changes. Report creation is the only deliverable change.

Classification: **VERIFIED IMPLEMENTATION** means directly inspected source/configuration or locally reproduced behavior. **AGREED PLAN** means direction in the suite contracts. **PROPOSED** means a recommendation here. **UNKNOWN** means missing evidence. Source verification does not certify production database contents or device behavior.

## A. Verified current architecture

### Source and evidence boundary (items 1, 24)

**VERIFIED IMPLEMENTATION:** clean local checkout `/workspace/scratch/ebe31602b705/paddlelog`, HEAD `fb815afcb4e1d2299ab9b6ee7e71d9b58dfbc8f6`. Read-only Sites `list_site_versions` maps that exact commit to saved version **97**, version ID `appgprj_6abbbd347bdc81918615f7a9852a7a07~appgver_cd5fff8a16888191a3491289a33bff87`, deployment reference `appgdep_6ac1ca9e5dfc81919a18e219e2ebb072`. `get_site` reports current URL `https://paddlelog.leewaypb.com` and latest version 97. No deployment-status or live authenticated behavior test was performed.

**VERIFIED IMPLEMENTATION:** git comparison against version 94 / `bc368e24569e104e5c05db0188d3a1072c4d6346` identifies:

| Saved version | Commit | Source change |
|---|---|---|
| 95 | `cc1e7e3b288ca6a1a3554e4bcbdd679382d775e9` | Multi-paddle segments, switching/editor UI, wear/analytics changes, shared types, documentation and tests; no SQL migration |
| 96 | `d9f88bed5dd4dc7d72a4329644360862816aac52` | Spacing CSS |
| 97 | `fb815afcb4e1d2299ab9b6ee7e71d9b58dfbc8f6` | Owner-only tester console, verified-email test grants, migration 0007 and authorization tests |

**AGREED PLAN:** baseline reviewed in `LeewayPB-Suite-Architecture-Integration-Contracts-v1.1.docx`, including its post-pause refresh. Its version 94 description is historical evidence, superseded by this inspection for session behavior.

### Stack and storage (items 2–3)

**VERIFIED IMPLEMENTATION:** HTML and vanilla browser ES modules are the main product frontend: `app/paddle.html`, `public/app.js`, `public/web-entry.js`. Vinext/Vite handles Next-compatible routes on Cloudflare Workers (`vite.config.ts`, `build/sites-worker.ts`). React/Next dependencies exist but do not describe the main UI accurately by themselves. Backend TypeScript route handlers use D1 SQLite, Drizzle schema/migrations and direct prepared SQL. Capacitor 8.5.2 native shell/adapters are present; completion of distributable native builds is **UNKNOWN**. Dependency evidence: `package.json` (Vinext 1.0.0-beta.5, Vite 8.0.13, Supabase JS ^2.117.1, Drizzle 0.45.2).

**VERIFIED IMPLEMENTATION:** `.openai/hosting.json` declares `DB` and `BUCKET`; `db/store.ts:storage()` returns D1. Relevant tables (`db/schema.ts`, `drizzle/0000`–`0007`):

| Tables | Purpose |
|---|---|
| `leeway_accounts`, `leeway_identities` | Local Leeway UUID/status and issuer+subject mapping |
| `account_libraries` | Library metadata, revision, CAS token and update timestamp |
| `user_paddles`, `user_sessions`, `user_usage_periods`, `user_catalog`, `user_maintenance` | Account-scoped records with JSON payloads, position and optional primary paddle index |
| `account_logs`, `paddle_logs` | Legacy whole-library storage/recovery |
| `account_photos` | Account ownership of R2 image object references |
| `entitlement_grants` | App Pro/test/Apple entitlement state |
| `tester_access`, `tester_access_audit` | Pending/bound test grants and owner actions |
| `health_counters` | Account/day operational counters |

**VERIFIED IMPLEMENTATION:** `lib/server/library.ts:splitLibrary/joinLibrary/readLibrary/saveLibrary` splits collections into records; session segments remain nested JSON inside `user_sessions.payload`. `user_usage_periods` are date-based paddle lifecycle periods, **not** timed paddle-use segments. Maintenance is extracted from paddle payloads. R2 stores photos and revision recovery copies (`lib/server/recovery.ts`, `app/api/photos/route.ts`). The old `account_logs` row is retained as pre-migration recovery. Actual migration application and binding identifiers are **UNKNOWN**; no production SQL was executed.

### Authentication and account resolution (items 4–5)

**VERIFIED IMPLEMENTATION:** `account.ts:account()` selects Supabase when `LEEWAY_AUTH_MODE==='supabase'`, otherwise supports Sites identity. `external-identity.ts:verifiedExternalIdentity()` calls configured Supabase `auth.getUser(token)` for each authenticated request, rejects anonymous identities, and constructs issuer from configured HTTPS URL. It accepts bearer auth or the HttpOnly access cookie, not caller-supplied email/account claims.

**VERIFIED IMPLEMENTATION:** web OAuth/email uses PKCE (`web/auth.ts`, `web/auth-controller.js`); `/auth/return` serves the auth page. `/api/auth/session` exchanges/refreshed provider sessions into `__Host-leeway-access` and `__Host-leeway-refresh` Secure/HttpOnly/SameSite=Lax cookies (`web-session.ts`). Same-origin mutation checks exist. `sign-in-methods.ts:beginMethodLink/completeMethodLink` links Apple/Google to the existing Supabase user and verifies unchanged subject. Native `createLeewayAuth` requires supplied secure storage, system browser and allowlisted callback; runtime wiring remains **UNKNOWN**.

**VERIFIED IMPLEMENTATION:** `identity-map.ts:externalAccount()` resolves `(issuer, Supabase user ID)` through `leeway_identities` to a D1 Leeway UUID. First resolution atomically inserts a random UUID account and mapping if absent. `linkExternalIdentity()` preserves an existing local account and rejects mappings already owned elsewhere. Email is not an account merge key. Sites fallback creates accounts from trusted Sites subject and has a hashed owner recovery path.

**VERIFIED IMPLEMENTATION:** `/api/auth/account` returns the resolved UUID. It is an app-authenticated account helper, not a separately extracted suite resolver: `account()` can provision mappings and claim tester grants. **UNKNOWN:** current production auth mode/secrets, redirect allowlist, provider/manual-linking configuration and Apple expiry; user reports of successful sign-in were not substituted for runtime inspection.

### Membership, roles, admin and Pro (item 6)

**VERIFIED IMPLEMENTATION:** no generic app-membership/role/grant table exists in inspected schema. Backend library authorization uses resolved account ownership/status. Sites independently gates access: `get_site` reports custom audience, owner and one external viewer. These hosting permissions are separate from Pro. Absence of an app membership gate means successful shared authentication can provision a PaddleLog account wherever the hosting/runtime permits requests.

**VERIFIED IMPLEMENTATION:** tester admin is a fixed local owner UUID check (`test-access.ts:OWNER_ACCOUNT_ID`, `/api/admin/testers:owner`, `app/admin/route.ts`), with server authorization and same-origin mutation checks. Pending email grants bind only after provider-confirmed email; they do not merge libraries. Revocation/expiration and audit records are implemented; hosting invitation management is separate.

**VERIFIED IMPLEMENTATION:** `grantsFor` loads account grants; `public/entitlements.js:hasEntitlement` checks start/end/revocation and recognizes `paddlelog_pro`, legacy `paddlelife_pro`, **and `leeway_all_access`**. `billing-config.js` sets purchases disabled, free basic export, three free active paddles, and implemented feature flags. `/api/state` enforces `authorizePaddleChange`; this is not solely a UI paywall. Apple verifier/sync validates ownership, product, bundle and environment and uses unique provider reference with signed-time ordering (`apple-verifier.ts`, `apple-sync.ts`). Production purchase enablement/credentials and actual paid grants are **UNKNOWN**.

### Sessions, IDs and provenance (items 7–12)

**VERIFIED IMPLEMENTATION:** multi-paddle sessions **are implemented**. One saved session has overall `id,paddleId,start,end,notes`, context/photo fields, and optional `segments:[{id,paddleId,start,end}]`. The primary paddle is the first segment's paddle; it is not the authority for all usage. Legacy sessions without segments imply one full start/end interval (`session-segments.js:usageSegments`, `shared/equipment-contracts.ts`). Estimates remain single-paddle with `estimatedHours`.

**VERIFIED IMPLEMENTATION:** timer switching closes the previous segment and opens the next at one timestamp (`switchTimerPaddle`); zero-duration switches replace the empty segment. `finishTimer` preserves an already-recorded end on retry. Account-scoped localStorage saves the active timer on each switch; unfinished timers are device-local and contribute no saved wear. Ended timers become saved sessions via `/api/state`.

**VERIFIED IMPLEMENTATION:** `app.js:uid()` uses `crypto.randomUUID()` with timestamp/random fallback for paddles, sessions, date-based usage periods and normal segment creation. Legacy timer conversion uses `<session-id>-initial`. `validate()` requires globally distinct IDs across paddles/sessions/usagePeriods matching `[a-zA-Z0-9_-]{1,100}`. Segment IDs use the same format and are unique **within their session**, not globally. Server accepts these strings, not UUIDs exclusively. Foreign paddle references must exist in the authenticated account library. `normalizeSegments()` enforces 1–5,000 segments, positive duration, ordered non-overlap within session bounds, and primary paddle consistency. Gaps are allowed. UTC ISO timestamps are generated by UI; validation accepts parseable strings rather than enforcing UTC suffix or storing timezone metadata.

**VERIFIED IMPLEMENTATION:** no session support for `sourceApp`, `sourceSessionId`, `sourceRevision`, `operationId`, external interval ID or linked Pickle Point game/session IDs. `validate()` constructs a session allowlist and `normalizeSegments()` reconstructs four fields; unknown provenance is silently discarded. `applyChanges()` rejects unknown patch-envelope keys and unsafe property names, but unknown ordinary record fields may reach `validate()` and then disappear. Unknown fields are not uniformly rejected/preserved throughout the library: some nested paddle configuration/measurement objects are retained more broadly. JSON persistence itself can serialize arbitrary payloads, but the supported API validates first.

### CRUD, wear and overlap (items 13–16)

**VERIFIED IMPLEMENTATION:** UI session add/edit reconstructs the record with retained ID and exposed segments/context. Delete removes the session; `persist()` validates/merges and patches. Segment editing preserves timestamp precision and permits gaps. Paddle deletion removes only its segments, retains other paddles' segments, resets primary reference, or removes a now-empty session (`withoutPaddle`, `app.js:saveSession/deleteSession` and delete-paddle action). Totals recalculate from current records.

**VERIFIED IMPLEMENTATION:** `maintenance.js:sessionUsage()` sums per-paddle segment intersection durations. `componentWear()` derives overgrip, edge tape and skin hours since latest installation event; remove means no installed wear. Each component's event/interval is independent; legacy undated overgrip uses unknown-baseline fallback. Saved future endpoints count fully; live timer is not a counter. Replacement-cycle analytics and setup usage use the same session projections (`analytics.js:maintenanceCycles`, `app.js:setupMarkup`). Other modifications/measurements have history, not a general independent wear-counter system.

**VERIFIED IMPLEMENTATION:** separately recorded overlapping sessions/segments **double-count**; validation only prevents overlaps within one segmented session and overlapping estimates for the same paddle. `estimateContribution()` subtracts logged contribution and allocates remaining estimates over uncovered time; its covered-range union does not deduplicate recorded usage. Deleting recorded usage may cause a covering estimate to fill the gap. This is existing estimate semantics, not external conflict resolution.

### Compatibility, sync and deletion (items 17–19)

**VERIFIED IMPLEMENTATION:** legacy unsegmented sessions remain readable, version 1/2 imports normalize to version 2 / `usageSchema:1`. Normalized library migration verifies reversible split/join. Existing API preserves selected newer paddle/settings/session-context fields during old snapshot saves and rejects certain pre-estimate clients (`/api/state`). It **does not preserve or gate missing segments**. A pre-segment full snapshot can pass current revision and flatten segmented usage into the primary paddle's full session. Old clients also render/compute segmented data incorrectly. Unrelated modern field patches preserve segments server-side, but old whole-snapshot writes are unsafe.

**VERIFIED IMPLEMENTATION:** library-wide integer revision CAS, atomic D1 guarded batch and token protect writes (`saveLibrary`); `readLibrary` checks revision before/after reads. PATCH accepts field changes; PUT accepts snapshots. Client `persist()` retries up to three CAS conflicts after reloading latest; `mergeChanges/mergeRecord` three-way merges independent fields/records, rejects concurrent same-field edits and edits to remotely deleted records. Segment arrays are atomic conflict fields, not per-segment merges. Pending base/desired states are stored locally and retried; lost-response timer retry reuses saved IDs. No source revision/idempotency ledger or multi-app journal/outbox exists.

**VERIFIED IMPLEMENTATION:** deletion removes rows without durable session tombstones. Local merge can detect deletion relative to a retained base, but a fresh upsert with a deleted ID can recreate it. Recovery backups are not suppression. `/api/account DELETE` marks account deleting, purges R2/data/grants, then deletes local mappings/account; Supabase user remains. It does not purge tester access/audit in the inspected deletion list; retained tester binding and owner UUID lifecycle deserve review. This endpoint would be hazardous if PaddleLog's local account table became a shared suite registry unchanged.

### API, deep links and environments (items 20–22)

**VERIFIED IMPLEMENTATION:** `/api/state` GET/PUT/PATCH is the current general library API. `/api/auth/account` resolves an app account. There is no scoped Pickle Point equipment/usage API, external grant model, source-aware upsert/delete, or conflict resolution route. The browser's `read_paddle_log` tool reads whole saved state locally and is not a suitable least-privilege integration API.

**VERIFIED IMPLEMENTATION:** web auth routes `/leeway-account`, `/auth/return`, `/account`, native `appUrlOpen` dispatch and exact auth callback validation exist. No session-specific URL/deep-link handler was found in app routes or UI query handling. **UNKNOWN:** OS registered links and deployed native acceptance behavior.

**VERIFIED IMPLEMENTATION:** Vite config has local Miniflare bindings, placeholder D1 ID and preview mocks; scripts start local Wrangler persistence. Apple verification explicitly distinguishes Sandbox/Production. **UNKNOWN:** separately provisioned staging deployment/stores/Auth callbacks/secrets, production binding IDs and promotion gates. One tracked hosting project does not prove complete dev/staging/production isolation.

### Local verification

**VERIFIED IMPLEMENTATION:** this audit ran and passed `tests/multi-paddle-sessions.mjs`, `multi-paddle-ui.mjs`, `record-sync.mjs`, and `tester-access.mjs`. These are local deterministic/DOM/source checks, not production/device certification. An ephemeral in-memory probe confirmed provenance stripping, two distinct overlapping one-hour p1 records producing two p1 hours, and removing segments changing allocation from p1=1/p2=1 to p1=2/p2=0. No source test files were added; no build/deployment was run.

## B. Contract mismatches (item 23)

| Classification | Finding against suite contract |
|---|---|
| VERIFIED IMPLEMENTATION | Version 94 single-paddle finding is obsolete; ADR-007 should record version 95 implementation, while keeping old-client safety open |
| VERIFIED IMPLEMENTATION | Source provenance/version fields are dropped; ADR-012 remains unresolved |
| VERIFIED IMPLEMENTATION | No source-key uniqueness, monotonic source revisions or retry operation receipts |
| VERIFIED IMPLEMENTATION | Recorded overlap adds wear; no manual/other-source review gate |
| VERIFIED IMPLEMENTATION | No durable suppression/tombstones or explicit local-override ownership |
| VERIFIED IMPLEMENTATION | Mapping remains inside PaddleLog; resolver is not an extracted side-effect-minimal suite service |
| VERIFIED IMPLEMENTATION | Shared authentication can provision app account without explicit app membership; hosting access is a separate gate |
| VERIFIED IMPLEMENTATION | `leeway_all_access` already grants Pro in code although future suite bundle is not approved; actual issuance UNKNOWN |
| UNKNOWN | Staging isolation, actual production migration state, scoped integration consent/revocation operational design |

## C. Smallest backward-compatible migrations/API changes

All recommendations here are **PROPOSED**, not implemented or approved migrations. Keep the existing session/segments payload and wear projection; avoid replacing the entire model or adding another wear counter.

1. Add a server-owned source-link sidecar keyed uniquely by `(account_id,source_app,source_session_id,interval_id)`. Store accepted local session/segment mapping, contract version, source revision/raw candidate, accepted/pending-conflict/suppressed status, and explicit PaddleLog override fields. Add source-session revision state if messages describe the complete outing. Preserve source game IDs as context, not local identity. One outing can map to one or multiple accepted sessions.
2. Add operation receipts keyed by owner/producer/operation ID, with request digest and durable response. Identical retries return the prior acknowledgment; changed payload under the same key is rejected. Same source revision with different content conflicts; stale revision is rejected; higher revisions update only non-overridden linked fields. Revision/tombstone checks must cover delayed updates to any interval.
3. Add explicit owner-bound integration grants/scopes (minimum equipment read, usage write/suppress) and a versioned integration API. Resolve owner server-side; authenticate producer/grant as well as user. Shared Supabase sign-in alone must not grant full library writes.
4. Atomically commit source status/receipts and accepted session updates using the same library CAS boundary. External adapters must never bypass library revision tracking by writing `user_sessions` directly. Keep pending overlaps outside accepted sessions so they contribute no wear. Same-owner/same-paddle comparisons must inspect every nested accepted segment, exclude the candidate's own prior mapping, and treat touching endpoints as non-overlap. Existing primary-paddle SQL index is insufficient alone.
5. Route local edits/deletes of linked usage through override/suppression logic. Suppression survives higher source revisions until explicit user restore; source deletion must not erase unrelated/manual records or silent local overrides. Add old-client capability/schema guards before allowing segment/source-bearing snapshot replacement; preserve sidecar authority during backups, reset/import and recovery. Merely allowing optional JSON provenance fields is insufficient.

**PROPOSED API surface:** equipment projection, usage upsert, usage suppress/delete, conflict resolve and acknowledgment/status. Use the suite v1 envelope with stable source/interval IDs, monotonic revisions, operation key and UTC endpoints. Define incremental versus complete-snapshot semantics before coding; missing intervals in a snapshot must not silently mean deletion without that contract.

**PROPOSED identity boundary:** approve ADR-006 and preserve current Leeway UUIDs. Initially a narrow resolver can delegate to the authoritative mapping; no new app should independently mint a competing suite UUID. Extraction requires deletion/membership separation rather than copying PaddleLog's account DELETE semantics.

## D. Risks and integration readiness

| Proposed capability | Classification of current state | Risk/gap |
|---|---|---|
| Stable source session IDs | VERIFIED IMPLEMENTATION: absent | New IDs on retry create duplicate usage |
| Stable paddle interval IDs | VERIFIED IMPLEMENTATION: local session-scoped segment IDs exist | External composite identity/uniqueness absent |
| Timed switching | VERIFIED IMPLEMENTATION: present | Device clock reversal rejected; live timer device-local |
| Idempotent upsert/retries | VERIFIED IMPLEMENTATION: local CAS/ID retry only | Not source-aware effective-once acceptance |
| Source revisions | VERIFIED IMPLEMENTATION: absent | Library revision is not source revision |
| Overlap/manual conflict review | VERIFIED IMPLEMENTATION: absent across records | Accepted duplicates inflate wear |
| Suppression/tombstones | VERIFIED IMPLEMENTATION: absent | Retry can resurrect local deletion |
| PaddleLog-only overrides | VERIFIED IMPLEMENTATION: absent | Source refresh cannot safely preserve local choices |
| Wear from accepted PaddleLog usage | VERIFIED IMPLEMENTATION: saved session projection exists | Must keep pending/rejected candidates out; define estimate policy |

**PROPOSED risk controls:** do not enable integration writes before source keys, receipts, revisions, grants, suppression and overlap tests pass. Do not silently merge timestamps or globally deduplicate existing manual sessions. Clarify estimates in imported intervals and explicit resolution behavior. Protect old clients before rollout. Maintain the 2 MB state-request/5,000-segment limits when designing batching; broad library reads and JSON-index limitations may become expensive.

## E. Recommended next implementation order

All steps are **PROPOSED** and require a later implementation authorization.

1. Update coordinator evidence and ADR-007 for current multi-paddle implementation; close neither ADR-006 nor ADR-012 yet.
2. Approve account-resolution/membership/deletion boundary and precise source usage v1 semantics, including consent, overrides, suppression and estimate behavior.
3. Protect legacy snapshot/old-client segment preservation; add regressions before new integrations.
4. Provision/verify isolated staging; add sidecar source state, receipts and grants with migration/rollback plan.
5. Implement scoped equipment and atomic source usage API with stale/reordered/replayed operations, manual overlap and suppression tests.
6. Add conflict/source/override UI and backup/deletion handling; integrate Pickle Point durable outbox using stable IDs.
7. Run cross-app staging tests, including account switching, paddle deletion, source correction, manual conflicts, revocation and lost responses, then seek production-write authorization.

## F. Evidence still missing

**UNKNOWN:** production D1 migration ledger/table contents, runtime bindings/auth/purchase flags, Supabase provider/callback/manual-linking settings, current grants/subscription state, device timer/background/clock behavior, native secure-storage and callback wiring, staging resources, hosting/backend access consistency, and current Pickle Point producer/outbox implementation. These require targeted read-only evidence from the respective systems/workers; no claims are made from conversation reports alone. No current third-app code was audited here.

## G. Coordinator handoff

**VERIFIED IMPLEMENTATION:** PaddleLog v97 / `fb815afcb4e1d2299ab9b6ee7e71d9b58dfbc8f6` now supports timed multi-paddle sessions introduced in v95, with per-paddle wear and legacy single-paddle reads. Mapping still lives in PaddleLog D1. Library CAS/three-way merge exists, but external provenance is stripped, cross-session overlap double-counts, no source idempotency/revisions/suppression/overrides exist, and old full snapshots can lose segments. Tester admin/Pro arrived in v97; app membership and suite resolver are not extracted. Keep Pickle Point writes gated. Smallest safe extension: retain current session segments, add server-owned source-state/operation/grant sidecars and scoped atomic APIs, protect old clients, and accept external usage only after overlap resolution. No implementation or production changes were performed.
