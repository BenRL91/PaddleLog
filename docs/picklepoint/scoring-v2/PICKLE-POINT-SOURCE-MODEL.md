# Pickle Point actual source model — 2026-10-07

Scope: inspected `src/engine.js`, `src/sessions.js`, `src/app-model.js`, `src/equipment.js`, `src/storage.js`, `src/paddlelog-export.js`, `src/paddlelog-sync.js`, `src/paddlelog-scoring.js`, `web/leeway-auth.js`, and `dist/app.js`. This describes actual code, including the account-storage/player changes in this release, not an assumed PaddleLog model.

## Entities and IDs

| Entity | Actual representation | Stable identity / caveats |
|---|---|---|
| Account library | IndexedDB `account:<Supabase subject>` plus Pickle Point D1 account snapshot | `sourceInstanceId` random UUID v4, retained on saves, backup and cloud restore. Library authorization uses the server-verified Supabase subject, never email. |
| Session | `record.core` plus `names`, `assignments`, usage and optional metadata | `core.id` stable UUID in UI; domain accepts opaque 1–100 character source IDs. `core.ownerId` is literal `local-owner`, NOT a provider identity or authorization. |
| Match | `core.matches[]` | `match.id`; `gamesRequired` 1–5. Contains roster slot IDs, profile, target and winBy; normalized `wins`, `winner`, `status` derive from games. |
| Game | `match.games[]` | `game.config.gameId`; engine version, immutable config, profile, append-only accepted command journal and replay-derived state. |
| Team | `game.config.teams[0/1]` arrays of slot IDs | No independent team entity/ID. Team reference is `(source session, game ID, team index)`. A team's names are not identity. |
| Position | UI creates `${gameId}_${team}_${position}` | Stable roster slot ID; domain matches may reuse the same slots across several games. Reassigning a shared slot changes its participant wherever reused. |
| Saved player | `library.players[]` | `player.id`, display `name`, favorite, lastUsed; optional accountLink. Never merge by name/email. Source scope is `(sourceApp, sourceInstanceId, player.id)`. |
| Guest | `record.names[slot]` with `record.assignments[slot] = null` | No person registry. Guest identity is the source position ID, not a cross-game person ID. A named guest requires no email/account. |
| Usage interval | `record.usageIntervals[]` | Stable `interval.id`, start/end, source paddleId/name and optional explicit physicalPaddleId. |

Session-to-match-to-game arrays define source display order. UI creates a new match for each new game; the pure match container also supports multiple games/best-of results. Match team indices only have consistent competitive meaning while source match teams are consistent.

## Assignments and owner

`record.assignments[slot]` maps a position to a saved player ID or null; `record.names[slot]` stores its displayed name. Assign players now lets users select saved/self-linked players or type a guest name. Setup chips explicitly carry player IDs. Typing a name does not select an existing saved/account-linked player. Voice-created unselected names remain guests; rematch retains explicit selected IDs. Duplicate saved-name creation asks for an explicit saved selection or guest use, never merges identities.

Historically `prefs.selfId` was a user-selected local player for Stats; it was not a verified account link and cannot establish historical participation automatically. New `This is me` saves a `player.accountLink = {provider:'leewaypb', subject, verification:'self-sign-in'}` only after SDK `getUser()` verifies the current non-anonymous account. Only this self-link is currently supported; there is no verified-other-person/accepted-invitation service.

New `record.gameOwners[gameId] = {state:'participating'|'spectating'|'unknown', slotId:position|null}` captures explicit per-game participation. New game setup recognizes a selected verified self player, otherwise unknown. Assign players includes an explicit owner-position/spectating/unknown choice. Older games remain unknown until reviewed. Selecting the Stats player alone does not rewrite historical gameOwners. Paddle role/scoring-only does not prove per-game participation. Owner account identity comes from the scoped library; receiver authorization still comes solely from its authenticated caller.

## Rules, scores and corrections

Engine profiles: `usap-2026-side-out-singles`, `usap-2026-side-out-doubles`, `usap-2026-rally-singles`, `usap-2026-rally-doubles`, `simple-v1`. The regular setup UI offers the first four; simple is a supported domain profile. Side-out awards a point only to the serving team; rally/simple award the rally winner. Target is 1–1000 in domain (UI 1–100); winBy 1–100 (UI 1–10). A game completes when the scoring team reaches target and has the required lead. Engine state is `playing`, `completed`, or `abandoned`; completed engine games always have an established winner, abandoned/playing games do not. The extension maps playing to unfinished.

Accepted commands include RallyWon, UndoRally, RedoRally, FlipView, AbandonGame and ReopenGame; each has stable eventId, UTC command timestamp, expectedRevision and hostEpoch. Replay verifies journal checksums/config. `game.state.headRevision` is the command sequence, NOT a PaddleLog source revision. Undo/redo can change an outcome before finishing the session. Completed-session score correction is not currently exposed in the UI; the paired fixture models a valid hypothetical corrected source snapshot, not an assertion that this UI exists. Completed-session player assignment and time edits are supported.

Match wins count completed game winners; gamesRequired establishes match winner. UI one-game matches normally finish after one completed game. Open matches with abandoned games stay open. Unknown winner/score is supported explicitly in the proposed transport for review/legacy data, but normal validated engine completion does not produce an unknown winner. No winner is guessed from names or missing scores.

## Times and paddle attribution

Session start is new outing creation, end explicit Finish session; these are elapsed timestamps, user-correctable independently of scoring command times. Journal timestamps identify recording/correction commands; they are NOT reliable game bounds or paddle usage. Older games have no recorded start/end. Do not use first/last rally as invented bounds.

This release records `gameTimes[gameId].start` when a new game begins and `end` when its terminal scoring/abandonment command is recorded. Reopening/undo into playing clears end; later completion records a new terminal end. These are elapsed-game markers, not measured paddle time. Legacy games keep null bounds. Changing outing times does not retime games or journals.

Usage is explicit: choose a paddle and Playing to open an interval; pause/switch/finish closes it; interrupted open intervals need review. No selected paddle, scoring-only, or unknown intervals produce no reliable paddle usage. Physical IDs are selected from the authenticated PaddleLog library, not matched by labels. Gaps are excluded play. Corrected session boundaries can intentionally clear reliable intervals to elapsed-only while archiving former timing locally; existing v1 file import then requires review and automatic delivery pauses.

## Revision/deletion/storage

- `library.revision`: local IndexedDB CAS; D1 has an independent account version for whole-library CAS. Neither is source export revision.
- `record.core.revision`: source container changes, supplemented by LocalStore change detection. Not the external receipt revision.
- `record.paddleLogExport`: existing v1 usage/binding-only revision, updatedAt, fingerprint. Scores/names alone do not change it.
- `record.paddleLogScoring`: new v2 complete scoring+usage/binding fingerprint/revision/updatedAt. Separate namespace initialized at 1. Score, roster/name, owner participation, timestamps, usage and physical binding corrections change it. Unrelated preferences/invitations/outbox acknowledgements do not.
- Completed-session Remove game removes that game and its gameTimes/gameOwners; recomputes match result; retains an empty match if necessary. Its newer scoring snapshot omits the game and unreferenced participants. Usage intervals are untouched. No game tombstone/remote request is emitted today.
- Delete session removes the local/account source record and its local delivery entry. It is NOT a PaddleLog retraction. No durable source-session tombstone or retraction operation is implemented.
- Before this release all sessions were device-only even after sign-in. Now non-anonymous LeewayPB sign-in gates new play; account history stores in Pickle Point's own Sites D1 through provider-verified bearer requests. Offline IndexedDB persists every accepted local action first; online foreground account sync backs up the library. A new device restores its source identity/history. No Supabase application tables or shared auth settings change.
- Unsigned legacy `main` library remains local until explicit attachment into an empty account library; no automatic cross-account adoption. Cloud conflicts preserve device and account copies for explicit whole-library review. No automatic multi-device merge. Cloud capacity is <1.8 MB per account snapshot; oversized local data remains safe and exportable.
- Supabase SDK token storage is separate from source data; tokens never enter libraries/backups/exports. Theme is device-local. Paddle display/photo caches are account-scoped and cleared on account change/sign-out. Invitations are ephemeral review UI only, with no email persistence, delivery or linkage. Offline account backup needs the app open on reconnection; an expired sign-in must be refreshed. The old offline cache updates after all old tabs close.
