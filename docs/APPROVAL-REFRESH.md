# Official approval refresh and library validation

## Owner library audit

Read-only inspection of account_logs found a single account row, revision 78. The database tool truncates its JSON payload, so a complete saved-library review could not be performed through that tool. The complete readable paddle records were GoSports Wooden (archived) and Head Radical Elite (archived).

GoSports Wooden has no confirmed exact reference match in the snapshot; result stays Not verified. Head Radical Elite has two approved USAP entries (usap-3421 and usap-808), so the ambiguous manual record stays Not verified until the owner identifies the printed official entry. Either exact selection grants base-model approval; it does not establish physical setup compliance. No records were changed or matched on the owner's behalf. The existing Boomstik catalog identity regression also passes, but that is not a read of the owner's current Boomstik configuration.

Competition Check now contains an expandable Check all paddles overview for the current ruleset, using the signed-in library already loaded by the application. It includes archived paddles, separate model results, setup issues, and explanations. Switching rulesets recalculates the overview. Exact listing selectors support both USAP and UPA-A under amateur rules.

## Trusted manual workflow

1. Fetch complete official USAP paginated pages into a scratch directory (1.html through N.html) and the official UPA-A table into a scratch HTML file. Sources: https://equipment.usapickleball.org/paddle-list/ and https://upaa.unitedpickleball.com/approved-paddles/ . The live USAP list previously repeated entries at date boundaries; if unique totals do not reconcile, obtain supplementary pages from a separately sorted complete list. Never label a partial cache complete.
2. Parse without altering application data:

```sh
python scripts/import-official-approval-lists.py /tmp/usap-pages /tmp/upa-list.html /tmp/usap-supplemental --retrieved-at YYYY-MM-DD --output /tmp/approval-candidate.json
```

Omit the supplemental directory when unnecessary. Use the actual fetch date, not the date this code runs. The parser fails on missing pages, pagination changes, unexpected row counts, and unique-total mismatches. It does not infer certification expiry from a list-added date.

3. Stage and review:

```sh
node scripts/refresh-approval-snapshot.mjs /tmp/approval-candidate.json
```

Review data/approval-refresh-YYYY-MM-DD-changes.json and the staged candidate. The report lists additions, removed entries, changed approval states, identifiers, conditions, and dimensions. Trusted official hostnames, complete list counts, unique identifiers, recent dates, and verified evidence are required. Older/future candidates fail without changing production definitions.

4. Apply after review:

```sh
node scripts/refresh-approval-snapshot.mjs /tmp/approval-candidate.json --apply
```

A previous-definition backup is preserved before atomic replacement. Removed entries become needsVerification, retaining their exact identity and a missing-snapshot warning. An absent entry is not fabricated as an official delisting. Official negative states already known remain negative. Rules, exact surface combinations, and verified measurements are preserved. This command never touches paddle/session/account storage.

5. Run node tests/approval-refresh.mjs, node tests/model-approval.mjs, node tests/competition-expanded.mjs, and node tests/equipment-ui.mjs; build and publish using the existing Sites workflow. If a trusted competition/published.json R2 override is in use, its admin publication must be refreshed as well: bundled updates do not supersede that override. No automatic R2 writer or scheduled task has been added.

## Freshness

The UI displays the snapshot date and days until its 30-day review deadline. Model approval already rejects stale records and expired rules. No update timestamp is advanced merely because the app opened. A replay of the October 2 snapshot produced zero additions, removals, or changes; no claim of a newly fetched complete live snapshot is made.

## Remaining operational work

A scheduled fetch/review/publish integration is not configured. The official sites' layout can change; parsers intentionally stop rather than publish incomplete evidence. Keep raw responses/hashes for each retrieval and review model/condition changes before deployment. Obtain UPA-A amateur scope clarification separately. Exact physical-unit inspection cannot be automated by approval-list refresh.


## Model Badges — October 4, 2026

Home and paddle details display USAP and UPA-A model statuses independently. Exact positive listings display green Model Approved; explicit rejection or absence from a complete, fresh official-list snapshot displays red Model Unapproved. Each badge displays its checked date. This is model-list membership, not a verdict on the user's modified physical unit. Full Competition Check remains hidden.

Negative list inference requires complete official-list metadata, a valid HTTPS source, an exact declared row count, unique row IDs, independently verified rows from that source, a fresh snapshot and row dates, and identified model/variant information. Unresolved same-name variants, similar spelling, stale evidence, and incomplete downloads remain Verification Required. Imported claims cannot establish negative list evidence. No approval data, reference IDs, or user records were migrated.
