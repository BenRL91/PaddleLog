# Manual results and Costs

PaddleLog-owned sessions can carry optional manualGames, version 1, with up to
200 games. Each game records stable ID, discipline, scoring format, target,
win-by, status, two name-only teams, optional scores, owner team, and an optional
physical paddle selected explicitly for the entire game. The paddle must belong
to the library and occur in that session's usage records. No emails/invitations,
account linking, game clocks or rally events are inferred. Unknown scores remain
unknown; unfinished games do not enter win/loss analytics. Results never add hours.

Validation, record patches and backup import/export preserve manualGames. A null
value explicitly clears the results. Older whole-state clients that omit the
field retain its saved value. Removing a physical paddle clears that game's
result attribution while preserving any surviving shared session. No migration:
records use the existing authenticated per-account JSON session payloads.

Pickle Point sessions keep source-owned scoring snapshots; manualGames cannot
replace those scores. Its contract, sync semantics and receipts are unchanged.
Manual results adapt to the existing result display and Pro analytics; names
remain session/game-scoped guest identities and are never merged by spelling.

Bottom navigation: Home, Paddles, Play, Costs, Settings. Play includes the existing
Sessions and History views. Costs reuses the existing expense editor/records,
adds a shared-pack Supplies view and separately gated Pro Cost of play analysis.
Insights still supports costs for a selected paddle set. No payments or auth
settings were changed.

Verification: manual-games, costs-workspace, navigation-refresh, product-activation,
picklepoint-scoring, picklepoint-integration-backend, picklepoint-sync,
shared-expenses-ui, collection-workspace, main-collection and portable-backup tests.

## Games added to imported sessions

PaddleLog `manualGames` may supplement a Pickle Point session. They remain local records: the source snapshot and scoring metadata are not edited. Display and analytics read the two sources independently, including independent stale-source paddle attribution. The editor warns users to enter only missing games; no fuzzy cross-source game matching is attempted. Entering the same game in both sources counts it twice.

File/API source revisions retain manual game records. If corrected usage no longer includes an assigned physical paddle, reconciliation clears only that local game's paddle association, preserving names and scores. Game records never add usage time. Backup and record patches retain both sources.
