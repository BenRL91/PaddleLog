# Pickle Point worker: enable scoring v2 delivery

Work ONLY in Pickle Point. PaddleLog has implemented the attached integrationVersion 2 proposal at its existing receiver. No shared-auth, other app, infrastructure, admission or payment changes are required. Keep the working v1 sender and v1 reviewed file-export workflow available. Do not send synthetic fixtures to any production account.

Receiver base: https://paddlelog.leewaypb.com

- POST /api/integrations/pickle-point/sessions accepts v1 and v2.
- Existing authenticated paddle-library/image endpoints are unchanged.
- Use the existing current-user LeewayPB bearer token, account binding and refresh behavior. Exact allowed browser origin remains https://pickle-point.leeohsunshine.chatgpt.site. No token is included in this handoff.
- Request schema: paddlelog-sync-v2.schema.json plus unchanged paddlelog-export-v1.schema.json. Result: paddlelog-sync-v2-result.schema.json. Only explicit upsert is accepted. Session-export schemaVersion stays 1.

Implement a separate durable v2 outbox, enabled now that the receiver supports v2. Enqueue eligible completed sessions even when v1 delivery was already acknowledged. Keep scoring snapshot revision independent of usage revision. Persist exact retry bytes, normalized source identity, both revision lanes and acknowledgments alongside source storage/backup. Do not acknowledge a v2 payload from a v1 receipt.

Successful receipt:

```json
{"format":"leewaypb.paddlelog-session-sync-result","integrationVersion":2,"libraryVersion":13,"results":[{"sourceSessionId":"source-session-1","paddleLogSessionId":"pp-<stable-id>","status":"updated","revision":2,"usageRevision":1,"localEditsPreserved":true}]}
```

Statuses are created/updated/unchanged/stale. revision is the scoring revision, usageRevision is the acknowledged usage lane. localEditsPreserved is optional. For stale scoring, PaddleLog changes neither lane and returns the latest received scoring/usage versions, including a stable local session ID. Missing whole sessions never retract anything.

Retry policy:

- Lost response/network failure: retry the identical payload, not a newly rebuilt snapshot at the same revision.
- 409 LIBRARY_CHANGED with retryable:true: retry the same payload with backoff.
- 401: refresh the same authenticated user's token and retry; never move an outbox between accounts.
- 403: stop and show access/origin issue.
- 409 STALE_USAGE_BASELINE with retryable:false and latestUsageRevision: require source review/rebuild from the current baseline. Do not blindly increment revisions over conflicting facts.
- REVISION_CONFLICT, PADDLE_ASSIGNMENT_CONFLICT, LOCAL_EDITS_REQUIRE_REVIEW, LOCAL_SESSION_REMOVED, SYNC_STATE_REQUIRES_REVIEW, REQUIRES_REVIEW: retain pending delivery and show an actionable review state; no automatic overwrite.
- PADDLE_REFERENCE_REQUIRES_RESOLUTION/REQUIRES_MAPPING: fetch the user's current library and explicitly resolve physical units. Never match by names or create replacement units automatically.
- Contract/privacy/size failures: stop retrying until corrected.

Complete newer snapshots replace games, matches and players for that source session. Normalized retries ignore transport exportedAt and reference/player/owner-participation lookup order; match/game display order remains significant. A usage or binding change requires an appropriately newer usage baseline AND a higher scoring revision. A score-only edit increases scoring revision without inventing usage changes. A later v1-only usage update preserves scores but makes paddle result association await fresh v2 scoring.

Send only source IDs, guest/saved/account-linked display names and optional descriptive account references. Emails, credentials, invitation data and unrecognized sensitive fields are rejected. Owner participation must be explicit per game. Match/game/profile/result relationships and observed paddle associations are checked against recorded intervals; game/session elapsed clocks never create paddle wear. Unknowns stay explicit null/unknown.

No invitation delivery or whole-session retraction contract was added. Do not enable invitations or infer deletion from omissions/empty games. Legacy elapsed/unmapped sessions stay in the existing v1 file review flow; v2 scoring is not a new file-import format.

Before rollout, test your outbox locally against the attached fixture semantics, with no production fixture insertion: score-only corrections, missing games, retries/lost responses, stale/fork handling, multi-game matches, all five profiles, unknown/spectating owner, gaps and switches, and account switching. Then coordinate one deliberately recorded real session: finish a game with explicit owner participation and selected PaddleLog paddles, deliver v2, inspect scores/players and usage in PaddleLog, retry once, and confirm one session with unchanged hours. Report the actual receipt and remaining sender limitations without sharing credentials. Live v2 end-to-end success has not yet been claimed.
