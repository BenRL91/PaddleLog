# Proposed PaddleLog scoring/participant boundary — integrationVersion 2

**PROPOSAL, NOT ENABLED FOR DELIVERY.** Pickle Point continues sending integrationVersion 1. PaddleLog must implement and explicitly confirm v2 before enabling a new producer outbox. This document changes neither `leewaypb.session-export` schemaVersion 1 nor deployed v1 meanings. Request schema: `paddlelog-sync-v2.schema.json`, referencing unchanged `paddlelog-export-v1.schema.json`. Paired fixtures: `fixtures/scoring-v2/{normal,corrected,deleted}.json`. All IDs/people/physical units in fixtures are synthetic placeholders; never submit them to a real account.

## Exact request shape

```json
{
  "format":"leewaypb.paddlelog-session-sync",
  "integrationVersion":2,
  "operation":"upsert",
  "sessionExport":{"format":"leewaypb.session-export","schemaVersion":1,"sourceApp":"pickle-point","sourceInstanceId":"<persistent UUID v4>","exportedAt":"<UTC milliseconds>","sessions":["<unchanged v1 session records>"]},
  "physicalPaddleReferences":[{"sessionId":"<source session ID>","intervalId":"<source interval ID>","physicalPaddleId":"<explicit owned unit ID>"}],
  "scoringSnapshots":[{
    "sessionId":"<matching v1 session ID>","revision":1,"updatedAt":"<UTC milliseconds>",
    "players":[{"id":"saved_<source ID> or guest_<position ID>","sourcePlayerId":"<saved player ID or guest position ID>","classification":"guest | saved | account-linked","displayName":"<name or null>","accountRef":null}],
    "owner":{"accountRef":{"provider":"leewaypb","subject":"<verified account UUID>"},"participation":[{"gameId":"<ID>","state":"participating | spectating | unknown","participantId":"<player snapshot ID or null>"}]},
    "matches":[{"id":"<ID>","gamesRequired":1,"status":"open | completed","wins":[1,0],"winnerTeam":0,"games":[{
      "id":"<ID>","matchId":"<containing match ID>","discipline":"singles | doubles | unknown","profileId":"<actual source engine profile>","scoringFormat":"side-out | rally | simple","target":11,"winBy":2,
      "teams":[{"index":0,"participantIds":["<snapshot ID>"]},{"index":1,"participantIds":["<snapshot ID>"]}],
      "status":"completed | unfinished | abandoned","score":[11,7],"finalScore":[11,7],"winnerTeam":0,"start":null,"end":null,"timeBasis":"unknown",
      "paddleAssociation":{"status":"unknown","basis":"unknown","coverage":"unknown","intervalIds":[],"physicalPaddleIds":[]}
    }]}]
  }]
}
```

The outline above uses descriptive placeholders/enums; the full JSON fixtures are concrete schema-valid requests. All listed scoring fields are required; unknown names/account references/scores/final scores/winners/timestamps/match wins are explicit null, unknown participation has participantId null. Target/winBy/profile are always known in the actual validated source engine. Teams use game-local index 0/1, not an invented physical team ID. For simple mixed-size teams discipline is unknown. `score` is observed current score; `finalScore` is only a completed outcome (may be null when genuinely unavailable). Unfinished/abandoned outcomes have finalScore/winner null. Completed source sessions only; actual Pickle Point refuses completion with a still-playing game, so unfinished-game projection is available internally but is not delivered by the current completed-session builder.

An account-linked player has non-null `{provider:'leewaypb',subject:<UUID>}`; saved/guest players have null. The current producer can establish only verified self linkage through getUser. An email invitation cannot create this. Participant/owner account references are descriptive source facts; never authorize a request or expose another account. The receiver authenticates its existing current bearer and resolves its own account/beta admission exactly as v1. For primary owner analytics use explicit per-game participation, not matching names, emails, provider subject appearances, equipment role or library preferences. Null owner reference is allowed for honest unknown/legacy descriptive data; this does not make anonymous delivery authorized.

## Complete snapshots and two revision lanes

External session identity remains `(pickle-point, sourceInstanceId, session.id)` inside the receiver's authenticated account. Player identities are source-scoped IDs, guests additionally tied to their position; name equality never merges histories. Game/match identities are source-session-scoped IDs. Complete ordered matches/games and referenced participants replace the previous scoring snapshot on a higher scoring revision. A missing prior game/match/player in **that same session's newer complete snapshot** means removed from its scoring facts, not unchanged. Empty match games is valid after deleting its final game. Null means unknown, not retain old field. Missing required fields is invalid. Missing whole sessions from a batch/export means nothing and never deletion.

**Necessary explicit design choice:** v1 revision stays usage/binding-only. New `scoringSnapshots[].revision` is a separate v2 complete-snapshot revision namespace (starts at 1 even if v1 usage revision is 10). It fingerprints scoring, participants, owner, game times, v1 semantic usage and explicit bindings. This avoids changing deployed v1 semantics, preserves unchanged v1 file bytes/retries, and lets score-only edits increment v2 without synthetic paddle-hour edits. Do not compare the two integers or use a v1 usage receipt to acknowledge v2 scoring. Producer persists both metadata lanes in the same source save and backup/cloud state; completed source facts can be rebuilt and resent after support is confirmed.

Receiver stores an independent compact v2 revision/content digest/baseline alongside existing v1 usage receipts, atomically with the imported record. Same v2 revision and normalized full scoring/usage/binding content is unchanged; different content is explicit 409 REVISION_CONFLICT (bindings may use the existing PADDLE_ASSIGNMENT_CONFLICT). Higher v2 revision reconciles complete source facts and removes omitted game results; lower v2 revision reports stale and changes neither scores nor usage. Keep stable PaddleLog session/game provenance; never append duplicates as counters. Preserve explicit local edits/reflection removal through existing reviewed-conflict paths.

Run v1 usage validation/classification as a **dry run** first, then scoring classification; save both candidates through the existing backup + atomic D1 CAS only if all records are accepted. If the companion v1 usage revision is older than receiver usage, reject the whole v2 packet with `STALE_USAGE_BASELINE`, retryable false, and latestUsageRevision; require a snapshot rebuilt from latest source facts rather than applying obsolete paddle association. If scoring is stale, acknowledge its latest v2 revision without any usage write. A later v1-only usage update preserves stored scores and marks their paddle association awaiting a fresh v2 baseline; it cannot strip scores or masquerade as an empty scoring snapshot. A score-only v2 update with identical v1 usage/bindings must not increment wear or duplicate segments.

Normalize per source session; ignore transport exportedAt and batch/reference order in receipt digests. Preserve match/game array order as recorded source display order, normalize player/reference lookups by IDs. Source snapshot updatedAt and revisions are stable facts on retries. Entire batch remains all-or-nothing. Keep v1 size limits: UTF-8 request <2,000,000 bytes, 1–50 sessions, at most 10,000 bindings; v2 additionally bounds players/matches/games as schema. Producer currently builds one source session at a time and checks combined size. Reject unsupported version as an error, never a successful receipt.

## Proposed v2 result

```json
{"format":"leewaypb.paddlelog-session-sync-result","integrationVersion":2,"libraryVersion":13,"results":[{"sourceSessionId":"source-session-1","paddleLogSessionId":"<existing deterministic local ID>","status":"created","revision":1,"usageRevision":1}]}
```

`revision` acknowledges v2 complete snapshot; `usageRevision` acknowledges unchanged v1 companion. Status created/updated/unchanged/stale; stale reports latest known v2 revision. localEditsPreserved may accompany unchanged. Existing 401 refresh-same-user, 403 access/origin, retryable LIBRARY_CHANGED, review/mapping/limit/network rules remain. Unsupported schema/version is permanent contract error. Pickle Point's current sender rejects non-v1 receipts and even injected v2 outbox bodies before network; it cannot acknowledge unsupported delivery.

No whole-session retract/delete exists. `operation` is strictly upsert and batches nonempty. A future retraction needs a separately agreed explicit versioned operation, strictly newer authoritative revision and durable account-scoped tombstone, preserved in backups and atomically removing matching imported usage/scoring only after review of local edits. Do not infer it from empty matches, omitted source sessions or local source deletion.

## Paddle association and analytics

Only unchanged v1 playIntervals + explicit physical references calculate wear. Never turn session/game elapsed time, scoring-event time, final scores or game count into usage. Association is descriptive for the **owner's game result**, not other players' paddle usage.

Owner spectating => none; unknown owner or missing/invalid bounds => unknown. With known owner participation and valid game bounds, intersect recorded intervals with that elapsed window. Complete continuous coverage by one physical unit => single/complete. Multiple explicit physical units with overlapping recorded intervals => mixed (coverage may be partial). A gap/partial coverage with only one unit => unknown/partial, not an entire result assigned to that unit. intervalIds/physicalPaddleIds list observed overlap hints, not invented usage. Receiver should validate/recompute this from trusted normalized source intervals/bindings and explicit owner positions. Null legacy clocks cannot be substituted with session bounds or first/last rally times.

- **Games played:** owner explicitly participating and game completed; track unknown winner separately. Unfinished/abandoned are excluded from played/result denominator, displayed as recorded incomplete games. Spectating and unknown participation do not count as owner's played games.
- **Win rate:** wins / completed owner-participating games with an established winner; show denominator and excluded unknown outcomes. Never count unknown winner as a loss.
- **Differential:** sum own-team finalScore minus other-team finalScore only where completed, known participation and both final scores known. Report that denominator independently of win-rate denominator.
- **Partners/opponents:** stable source participant IDs on same/other team for eligible games, never names as join keys. Guests do not become cross-game saved people. For saved histories scope by source library; verified account references remain descriptive and must not cause automatic cross-owner identity merging.
- **Paddle results:** single + complete + known owner + established eligible result only. Mixed games get a mixed label, no full win/loss credited to any individual paddle; unknown/partial games remain unattributed. Do not fractionally invent split outcomes. Wear still follows actual intervals even when a game result cannot be associated.
- **Pro:** these aggregate/comparison analytics can be gated using existing PaddleLog Pro entitlements. Basic imported game scores, team/player details, statuses, provenance and unknown/mixed explanations remain readable without Pro. No shared auth or payment changes.

## Current rollout / limitations

Builder/schema/semantic validator/revision metadata and synthetic tests are implemented. No v2 outbox or capability negotiation is enabled; hard default remains v1. Source scoring metadata survives account backup/restore; a receiver-confirmed later change must enqueue each eligible completed session regardless of its v1 delivery receipt, persist exact v2 retry bytes and independently acknowledge scoring revisions. Elapsed-only/unmapped source sessions keep existing reviewed v1 file export; do not send fabricated usage to unlock scores. This proposal does not extend the deployed v1 file import to scores. A later documented scoring file/preview contract would be needed for those legacy records.

Known source UI limits: no completed-session score correction control yet; no verified-other-person linkage service; no authorized invitation delivery; no automatic cloud merge; old game bounds/owner participation remain unknown until explicitly available/reviewed. No live v2 calls, production test sessions or invitations are made. Physical cross-app v2 tests must wait for receiver support; local synthetic tests validate producer and reconciliation semantics, not live PaddleLog behavior.
