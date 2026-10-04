# PaddleLog product experience — October 2, 2026

## Implemented

- Catalog-first Add Paddle: searchable catalog brands, dependent models, exact variants only when needed, and optional fields collapsed. Manual entry remains available. Model IDs link physical units to reference rows; catalog imports still do not create owned paddles.
- Fixed reference measurement copying: choosing a model no longer copies published weight, dimensions, speed, swingweight, or twistweight into measured fields. Shape and nominal thickness still identify the selected configuration. Existing values are preserved and explicitly described as possibly containing earlier autofill.
- Saved creation opens paddle details, with optional weight, nickname, photo, and setup actions. First paddle becomes Main. Zero-library welcome offers Add my paddle and Explore first, without a subscription prompt.
- Detail hierarchy: identity/media, usage/session counts, setup summary, Reference/Mine/Verified, collapsed advanced fields/history, maintenance, and Competition Check. Unknown metrics are omitted or marked unknown.
- Verified values are selected only from the existing authenticated attestation feed, matching physical unit, configuration fingerprint, units, date, and trusted verification source. No user import can establish verification. The service/admin fulfillment workflow is still external.
- Start/End session timer stores an account-scoped device record with stable session ID and start/end timestamps. Background/reload reconstructs elapsed time from timestamps. End saves through the normal conflict-aware save path. Failed retries keep the original end and cannot duplicate the session. Manual session editing, photos, locations, and ball selection remain.
- Home now shows Main, this week's logged usage, last session, and maintenance actions. Main is relabeled Home; Timeline becomes History. History adds added/archive and measurement/setup events. Data/catalog/backup are in their own Settings section.
- New configuration changes record setup snapshots and dates. Hours since the latest recorded setup derive from authoritative session data; any legacy estimates remain explicitly estimates. Existing setup history is not fabricated.
- Competition Check preserves USAP, UPA-A Professional, and UPA Amateur. Model and setup badges lead; exact-model matching, sources, and detailed evidence are expandable. Existing rule/approval snapshots are unchanged; stale/unknown results remain uncertain.
- Pro wear insights describe a user's actual replacement-hour range after at least two completed, nonzero cycles. Condition/product differences remain explicit. Core wear tracking and Competition Check remain free, including existing reasons and evidence.

## Boundaries and compatibility

No database migration or destructive backfill. Optional setupHistory is stored in the existing configuration JSON with validation. Old records, model references, approval references, measurements, and legacy usage periods remain. Closed usage periods remain in advanced history and never add play hours. Existing estimated session records remain compatible and are not silently removed.

Free: up to three active paddles, main/favorites, specs, notes, basic photo, sessions/timer, usage, wear, history, cloud sync, and existing Competition Check. Pro: unlimited active paddles, existing comparison, charts, lifecycle/performance/replacement insights, and JSON export. No new evidence paywall. Central pricing remains authoritative; planned $1.99 monthly / $14.99 annual, annual default. Real payments remain disabled pending Apple setup.

## Validation and limitations

Automated DOM and backend tests cover zero-library catalog/manual activation, filtered variants, reference isolation, drafts/cancel, session CRUD, timer reload/failure/retry, historical wear recalculation, Competition Check fixtures, Free/Pro behavior, exports/imports, account boundaries, and record persistence. Tests do not establish physical iPhone rendering or Safari picker/background behavior.

Manual browser/iPhone QA was not completed in this environment: the required managed-preview control-browser capability was not available. No ten-second completion-time claim is made. Safe-area, modal scrolling, button sizing, and fixed navigation declarations are retained; test on a physical iPhone before a public release.

Active timers are device-local; completing a session syncs it. They do not run across devices, and clearing browser storage loses an uncompleted timer. No new native background service or notification capability is claimed.

Nominal catalog thickness remains the existing configuration-selection field; legacy records cannot reliably distinguish earlier reference autofill from actual user measurement. These values are preserved and labeled recorded, not physically verified. A future explicit measured-thickness/provenance migration should be reviewed separately.

No new governing-body research or certification claims were added. Existing snapshot coverage/freshness limits still apply. Balance-point unit measurement entry, full setup-to-setup comparison, multi-photo Pro, batch editing, session singles/doubles/surface fields, and a verified-service fulfillment UI remain deferred. Existing tuning-image and weight-estimate features remain available.

## Next iteration

Physical iPhone acceptance testing of catalog selection, optional sections, photo picking, and timer background/reopen; then dedicated measured-versus-nominal dimension fields and setup comparison from the newly recorded snapshots. Apple sign-in, StoreKit sandbox purchases, and public launch remain external release gates.
