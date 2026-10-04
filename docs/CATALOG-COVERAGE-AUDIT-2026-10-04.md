# Approved-List Catalog Reconciliation

The approval database already contained complete checked list snapshots, but the dropdown catalog was a partial seed. The audit reconciles the existing October 2, 2026 snapshot, including an individually rechecked October 3 USAP entry. It does not claim a fresh October 4 crawl: the live USAP list timed out during this task. UPA-A's official list page remained accessible.

## Coverage

| Item | Before | After |
| --- | ---: | ---: |
| Selectable reference records | 553 | 5,536 |
| Distinct displayed brand names | 160 | 1,364 |
| Vatic Pro reference records | 12 | 38 |
| USAP approved entries represented | Partial | 5,367 / 5,367 |
| UPA-A approved entries represented | Complete seed | 274 / 274 |

4,983 reference entries were added. Multiple official list rows can refer to the same exact reference identity, so official entry counts differ from selectable model counts. All original 553 reference records retain their IDs and complete record contents; the audit stores fingerprints proving this. Existing reference records without current approval-list matches remain available.

## Evidence and Matching

Sources:
- USAP: https://equipment.usapickleball.org/paddle-list/
- UPA-A: https://upaa.unitedpickleball.com/approved-paddles/

Only independently verified official snapshot rows can drive reconciliation. List completeness, counts, unique entry IDs, and official source hosts are checked. Exact brand/model/thickness/model-number identities are reused; existing verified links are retained when identity-compatible. Missing thickness and known thickness remain separate in new matching. Model numbers distinguish revisions when supplied. Similar names and generations are not fuzzy-merged.

Six incompatible older automatic links were retired and recorded in `data/catalog-coverage-audit.json`; exact official references now represent those source rows. For example, HYPER and HYPER+ are not silently treated as the same reference. Neither the old reference ID nor a user's physical paddle record is deleted or rewritten. Official statuses, sources, dates, rules, and measurements are unchanged; a fingerprint excludes only the intentionally reconciled `catalogIds` relationship.

New entries contain source-backed identity and known thickness only. Shape, dimensions, performance measurements, and manufacturer specifications are not fabricated. Missing fields remain unspecified. Official source metadata stays separate from personal measurements, sessions, maintenance, and photos.

## Repeatable Workflow

`node scripts/reconcile-approved-catalog.mjs` writes an audit report without changing application data files. Add `--apply` to update the shared reference catalog and approval-to-reference links. Repeating reconciliation is idempotent. Obtain, validate, and review a fresh complete official snapshot with the existing approval-refresh workflow before claiming newer list coverage.

No D1 migration or account-data update is required. The catalog remains a shared reference asset. Brand-first search keeps model lists scoped; every approved snapshot entry is selectable. For ambiguous labels, an official listing source is shown only when needed to distinguish choices.

## Verification

- Every one of the 5,641 approved snapshot rows has a selectable exact reference and passes the model approval evaluator.
- All 38 Vatic entries are represented, including Prism Flash 16mm, Alchemy 13.5mm, and V-Sol Pro Bloom 16mm.
- Original reference fingerprints and official evidence fingerprint remain unchanged.
- Reconciliation is idempotent, rejects incomplete lists, and separates unspecified thickness, known thickness, and model-number revisions.
- Catalog selector, enrichment, activation, and editor integration checks run against the expanded catalog.

Browser/iPhone visual QA was unavailable in this environment. Manufacturer-spec enrichment for the newly exposed models remains a separate task.
