# Game results and reusable players

Play → Results and Paddle insights expose the same Pro results view: local date ranges, preceding equal-length calendar period, singles/doubles, scoring format, session setting and physical-paddle selection. Unknown outcomes remain counted as played but excluded from win rate. Only completed games with explicit owner participation are eligible. Margins require final scores; close games have an absolute margin ≤2. Winning/losing margins use known outcomes and scores. Every statistic shows its sample denominator.

Dates use recorded game start, falling back to session start. Calendar date boundaries use device time. Mixed-paddle results can appear in selected-paddle dashboard totals but are always separate from single-paddle profiles. Incomplete/stale associations remain unassigned. Game records never create playing hours: profiles use the existing usage calculation, and session reflections are date/setting/paddle filtered, independently of game format.

Setup experiment phases come only from explicit links on session reflections. Results require a complete single-paddle association to that experiment's paddle. Conditions and sample sizes are displayed alongside the existing ratings. This is descriptive evidence, not a causal model or rating estimate.

Free manual game entry now supports `playerIds`, an optional two-team array of IDs/null matching the existing `teams` name arrays. Stable reusable players live in account settings `savedPlayers`: `{id, displayName, archived}`. Names in old game snapshots stay intact; selection controls identity. Saving a name does not associate other matching names. Guests stay scoped to their source session/game identity. Pickle Point player identities remain source-library scoped and are not joined to PaddleLog players by name. No emails/invites are added.

Player edits and creations remain in the session draft until Save session. Renames/archives preserve IDs and historical associations; concurrent edits conflict explicitly. Existing backup, record-patch, authenticated state storage and validation handle these additive fields. No database migration or Pickle Point contract change is needed. The five-paddle Free limit is unchanged.

Validation: results-dashboard, manual-games, picklepoint-scoring, pro-workspace, analytics, session-details, synced-session-edit, record-sync, tutorials, and Pro feature-list suites. Synthetic fixtures only.

## Focused Insights views

Insights now opens on Overview, with recent play, maintenance attention and collapsed play-over-time and equipment-change detail. Performance reuses the Play Results view with its own date/game filters, reflections and collapsed tables. Equipment contains all-time lifecycle, measurements, replacement comparisons/history and Main-paddle periods, each collapsed by default. Experiments shows selected-paddle snapshots/results and hands off to the existing editor. Paddle selection applies across the four views; opening from Home selects that paddle and returns to Overview.

Full cost analysis is only in Costs, with a multiselect; the Insights shortcut carries its paddle selection into that view. The relevant navigation, selected-paddle cost totals, keyboard tabs, filter retention and experiment editor handoff are covered by `tests/insight-views.mjs`.
