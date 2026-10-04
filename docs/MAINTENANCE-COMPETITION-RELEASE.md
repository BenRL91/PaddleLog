# PaddleLog maintenance and Competition Check — 2026-09-30

## Findings and repair
The old Set Main handler silently initialized overgripInstalledAt to the current time.
Previously logged or newly entered historical sessions before that time were correctly
excluded mathematically but unexpectedly excluded for the user. The detail modal was
also outside renderAll, so a visible detail badge could remain stale after session CRUD.
No evidence of a separate drifting wear counter was found. The old calculation already
used session intersections. The repair removes Main's implicit installation, makes the
installation baseline visible/correctable and refreshes open detail without stealing focus.
Unknown legacy installation dates are labeled; existing dates are not silently backdated.

## Shared maintenance model
Per-paddle maintenance events record kind, install/remove, timestamp, product/manufacturer/
variant, interval and notes. Current installation is the most recent event at the evaluated
time. Hours are the sum of valid matching session intersections after that installation,
using the full saved session end time, with no wall-clock cutoff. Invalid/reversed sessions do not contribute. Editing/deleting
sessions can move wear forward or backward. Replacement never edits sessions or another
component's history. Removal records an event, not deletion of history. Corrections edit
an existing record. History is shown in Maintenance and in the shared timeline.

Overgrip default remains 4h/stage; existing user settings survive. Edge tape defaults to 8h,
independent of overgrip. Reload, PIKKL, PIKKL Pro Skins and custom presets have editable 8h
initial skin intervals. These are PaddleLog tracking estimates, NOT researched product
lifespan claims. Each installation has its own interval. Every component uses Brand New,
New, Used, Old, Very Old, with blue/green/yellow/orange/red badges. Wear is not a legality test.

Forms retain account-scoped local drafts, keep failed-save values, prevent duplicate saves,
and confirm replacement/removal/correction. Reopen the same component to resume its draft.

## Non-destructive JSON migration
No D1 table is replaced. Existing per-account JSON remains version 2 with additive
paddle.maintenance, paddle.configuration.modifications, and settings.edgeTapeHoursPerLevel.
An existing overgripInstalledAt becomes one deterministic legacy installation. Normalization
is idempotent, performed on read in the client and confirmed saves; sessions, photos, notes,
measurement history, legacy timestamp and configured intervals survive. Account CAS and
three-way merging remain. Concurrent changes to maintenance history conflict explicitly
rather than dropping events. Old clients omitting new fields are preserved by the server.
A superseded old client that still edits overgripInstalledAt cannot update the new history;
refresh old tabs before changing maintenance. Imports retain the added fields.

## Competition architecture
The evaluator consumes physical configuration, ruleset, authoritative approval records,
exact skin-combination approvals, and separately supplied trusted measurement attestations.
It returns ELIGIBLE, NOT_ELIGIBLE, CONDITIONAL, NEEDS_VERIFICATION, or UNKNOWN with arrays
of issues split into model/configuration/physical/rules categories, plus code, rule, source,
verification date, affected component, numeric limits/deltas and measurement provenance.
All requested reason codes are registered in public/competition.js. Only supported rules
emit determinations; codes are not evidence by themselves. Unknown membership is not a
negative approval record. Stale rules are not silently evaluated as current.

Brand mismatch is recorded as crossBrand, never intrinsically illegal. Only an explicit
prohibition can emit CROSS_BRAND_CONFIGURATION_NOT_ALLOWED. Exact combination matching
uses model identity (brand/model/shape/thickness), skin manufacturer/product/variant and
ruleset/version; matching brand names alone proves nothing. Model-number support is in
the contract for a future authoritative catalog. Skin removal impact is simulated only
for a proven, removable violation; it reports remaining issues, not a guarantee of eligibility.

User measurements stay user-entered. Only the authenticated /api/competition backend can
supply PaddleLog Verified Specs from a matching unit/configuration attestation; user imports
cannot promote themselves. Manufacturer/reference provenance is represented in the shared
contract; the existing editable spec fields remain user inputs. Physical measurement is
never presented as governing-body certification. Surface condition and added-weight
placement need future structured data/inspection; free text never proves compliance.

## Verified official source extracts
- USAP Equipment Standards Manual (January 2025), official published PDF, accessed 2026-09-30:
  https://equipment.usapickleball.org/docs/Equipment-Standards-Manual.pdf
  §§2.E.3–2.E.6: overall length <=17 in, combined length/width <=24 in; no weight maximum;
  alteration provisions include OEM replacement faces and retain conformity requirements.
  Only the limited dimension and configuration checks described above are encoded.
- UPA-A 2026 certification page, accessed 2026-09-30:
  https://upaa.unitedpickleball.com/paddle-testing/2026-upa-a-certification/
  Professional PPA/MLP require UPA-A approval; amateur play accepts the UPA-A path or current
  USAP approval. Exact stamp/model-number inspection remains outside current coverage.
- CNPL 2026 online rules §4.1, accessed 2026-09-30: https://cnpl.ca/rules
  USAP approval plus testing at EACH current event; prior event testing does not carry over.

USAP, PPA Pro, MLP Pro, UPA Amateur and CNPL have PARTIAL coverage. APP and Custom are
UNKNOWN pending authoritative event-specific verification; no independent APP rules are
invented. The 2026 USAP full rulebook and UPA technical PDF could not be fully retrieved
here; comprehensive current rules are not claimed. No real model or skin approvals have
been imported. No production result is currently Eligible. The default rules review period
is 30 days (an internal freshness policy); approvals also expire from cache after 30 days.
Effective/end/superseded metadata is supported; an unconfirmed effective date remains null.

## Maintaining backend data
/api/competition reads administrator-managed R2 competition/published.json, falling back
to public/competition-data.json. Shared rules and approvals are distinct arrays. Trusted
unit attestations come from verified-specs/<internal account ID>.json, never user upload
routes. There is no public writer/admin UI yet. This allows future rules updates without
shipping a UI release. Server failures return unavailable; the UI shows verification needed.
Administrators must validate provenance, scope, dates and source versions before publication.
Synthetic approved/prohibited fixtures exist ONLY in tests.

## Verification and remaining work
Tests cover all three wear clocks, thresholds, downward/upward corrections, deletion,
replacement isolation, lifetime preservation, partial sessions, invalid sessions, JSON
roundtrip/migration and conflicts. DOM simulation exercises actual maintenance forms,
presets, confirmation cancellation, failed saves/draft retries and competition selection.
A full app DOM integration reproduces and verifies open-detail refresh after session CRUD.
Eligibility fixtures test approval unknown/rejected/expired/delisted, exact/cross-brand skin
combinations, simultaneous limits, exact boundaries, trusted vs user measurements, stale/
superseded rules, event testing, distinct rulesets and skin-removal impact.

Actual iPhone/Safari and native device visual QA remain outstanding. Chrome on the user's
phone successfully uploaded images; the original picker reload was not reproduced here.
Shared Apple/Google/email authentication still needs the separate LeewayPB auth integration
and external provider setup. Store billing remains disabled. Next: official approval ingestion,
complete event rule verification, trusted measurement-service publishing, then device beta.
