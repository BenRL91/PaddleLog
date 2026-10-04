# USAP and UPA-A Competition Check — October 2, 2026

## Scope and provenance

The official list snapshot is independent of the reference catalog and physical user paddles. Importing it creates no owned paddles and changes no sessions, maintenance events, or measurements. Exact catalog matches are attached where unambiguous. Users can confirm a same-brand official entry inside Competition Check; this identification remains user-supplied, and is invalidated by changing the paddle's model identity.

`data/official-approval-lists-2026-10-02.json` preserves source URLs, row identities, counts, retrieval dates, and page hashes. `scripts/import-official-approval-lists.py` checks every page, the advertised total, and unique entry counts before claiming completeness. The public USAP pagination repeats ten entries at date boundaries; the supplementary model-name sort is used to reconcile the unique records. Missing optional dates remain null. Public listing membership is not a physical inspection or an assertion about every possible skin.

## Official rule sources

- USAP 2026 rulebook §3.D: https://usapickleball.org/docs/rules/USAP-Official-Rulebook.pdf
- USAP equipment standards: https://equipment.usapickleball.org/docs/Equipment-Standards-Manual.pdf
- USAP aftermarket-weight clarification: https://usapickleball.org/ref-notices/aftermarket-paddle-weights-and-aftermarket-grip-aids/
- USAP approved list: https://equipment.usapickleball.org/paddle-list/
- USAP compliance notices: https://equipment.usapickleball.org/compliance/
- UPA-A Specifications v26.6, July 28, 2026: https://upaa.unitedpickleball.com/wp-content/uploads/2026/07/UPA-A-Paddle-Specifications-and-Testing-Requirements-V26.6-7.28.26.pdf
- UPA-A approved list: https://upaa.unitedpickleball.com/approved-paddles/
- UPA-A delistings: https://upaa.unitedpickleball.com/de-listed-paddles/

The updated professional specification resolves the previously stored generic-rulebook/pro-policy ambiguity for PPA and MLP professional competition. Other rulesets retain their previous scope.

## Implemented checks

- Model approval is independent of recorded configuration.
- Dimension ceilings; USAP's absence of a weight/thickness ceiling; UPA-A's configured weight and thickness rules.
- Passing numerical checks are green, violations red, and unresolved conditions amber, with text labels and source references.
- UPA-A perimeter tape and handle/butt weight methods; recorded sliders are treated as adjustable components. Free-text methods remain unresolved.
- Weight calculations use a recorded baseline plus structured added weights when available. They do not add weights a second time to a possibly already-configured static-weight measurement.
- Known OEM surface combinations use a base approval ID, product, variant, ruleset, and version. Reload RLD-1 and PIKKL Sport evidence combines governing-body model approval, the OEM-face rule, and manufacturer product identification. Manufacturer marketing alone never creates model approval.
- UPA-A removable-surface restriction; USAP PIKKL Pro Skin use on non-PIKKL units is classified against the OEM-face restriction. PIKKL-on-PIKKL Pro Skin combinations without exact part identification remain unresolved due to distinct official assembly codes.
- Model appearance/blackout evidence, physical condition, installation quality, and event inspections remain separate from passing recorded measurements.
- A 30-day freshness window still fails closed. The visible snapshot date does not assert there were no changes since retrieval.

## Remaining evidence limits

1. Public lists do not provide a complete machine-readable skin compatibility matrix. Generic product names cannot identify every approved OEM configuration. The PIKKL PRSKHP14-HP14 and PRSKVP16-VP16 entries require manufacturer part mapping before auto-approval of a generic Pro Skin installation.
2. UPA-A's list added date is not asserted to be the initial certification date. Do not invent a 24-month expiry from that date. Confirm initial certification/renewal metadata with UPA-A.
3. UPA-A §1.1 uses a 24 mm maximum while §3.1.3 uses a strict less-than boundary. Exactly 24 mm is flagged for clarification rather than assigned an unsupported verdict.
4. Blackout/appearance, certification markings, local event procedures, surface roughness, gloss, spin, deflection, and physical damage need evidence beyond user-entered specifications. A PaddleLog calculation is not event clearance.
5. No universal negative approval is inferred from fuzzy or missing model matches. Explicit delistings and governing-body prohibitions support red results.
6. The snapshot is not an automatic synchronization service. Source changes after October 2 are not reflected until a reviewed update is published.

## Migration and ownership

No destructive migration. `configuration.approvalReferences` is optional, account-scoped, included in backups, and preserved by server-side writes from older clients. It stores an official entry identifier and the model fingerprint, not an approval boolean. Clearing an individual reference uses null. Existing accounts, equipment, and session data remain intact.
