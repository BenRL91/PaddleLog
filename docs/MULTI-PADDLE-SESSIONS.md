# Multi-Paddle Sessions

A session holds overall start/end, notes, venue, ball, conditions, and photos.
Optional `segments` holds ordered, non-overlapping paddle usage intervals:

```json
{
  "id": "session-1",
  "paddleId": "paddle-1",
  "start": "2026-10-04T10:00:00Z",
  "end": "2026-10-04T12:00:00Z",
  "notes": "",
  "segments": [
    {"id": "segment-1", "paddleId": "paddle-1", "start": "2026-10-04T10:00:00Z", "end": "2026-10-04T11:00:00Z"},
    {"id": "segment-2", "paddleId": "paddle-2", "start": "2026-10-04T11:00:00Z", "end": "2026-10-04T12:00:00Z"}
  ]
}
```

`paddleId` remains the first segment's paddle for legacy storage/index compatibility;
usage consumers MUST use `usageSegments` / `usesPaddle` / `sessionUsage`, not this
primary field. Returning to a paddle creates another segment, aggregated in history.
Segment IDs are stable, session-scoped integration anchors for future scoreboard
and workout synchronization. Those integrations are not enabled in this change.

## Persistence and migration

No destructive migration or D1 schema change. Existing sessions without segments
retain their fields and represent one paddle's full interval. The existing
account-scoped session JSON payload, patch sync, backup/import validation, and
recovery copies carry segments. Native shared identity and purchase settings are
unchanged. Older clients cannot correctly allocate segmented sessions; integrations
must adopt this contract before writing these records.

The local account-scoped timer persists segments on every switch; failed storage
keeps the previous timer. End time is persisted before server save, so retrying does
not add usage. Legacy active timers acquire one segment on switch or completion.
Timer persistence remains device-local; cross-device live-timer coordination is
not implemented.

## Usage semantics

Half-open UTC intervals, with millisecond precision. Segments must reference owned
paddles, have unique IDs, positive durations, be chronologically ordered, and fit
within the session. Up to 5,000 segments per session. Estimates remain single-paddle
and cannot also carry segments. Gaps are allowed and contribute no paddle wear.
Elapsed session duration and actual paddle usage are distinct when gaps exist.
Manual editing exposes individual paddle periods; changing overall session bounds
requires keeping those periods within bounds rather than silently redistributing
play. Adding another period splits the last existing period at its midpoint for
explicit user review, never inferring a real paddle switch from an external game.

Wear, installation overlaps, estimate replacement, lifecycle counts, and charts
consume segments. Removing a paddle strips only its periods; other paddles' usage
and shared context remain. A session with no remaining periods is removed.

## QA

Deterministic tests cover legacy compatibility, switches/back switches, immediate
switch, clock reversal, ended-timer retry, JSON reload, isolated component wear,
historical correction/deletion, estimates, validation/ownership, sync/backup
roundtrip, and removal preserving other paddles. DOM integration covers active
picker, reload, failed save/retry, edit preserving exact timestamps, individual
period correction, and session deletion. Browser/device QA is still required for
native keyboard and background behavior; no live scoreboard/workout sync tested.
