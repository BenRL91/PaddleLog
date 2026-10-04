# Competition evidence intake — October 2, 2026

Preserved the seven submitted research files under data/research/competition-2026-10-02. No paddle, session, owner, or maintenance records were migrated or changed.

570 submitted approval observations were normalized. 219 UPA-A observations match the independently retrieved official list on brand, model, printed model number and thickness. 351 observations are retained as importedClaim and cannot authorize eligibility. Verification dates supplied by research are not treated as independent verification. Absence of a match is not rejection.

The official snapshot in data/upa-official-snapshot-2026-10-02.json preserves extracted rows, retrieval date, source and missing icon metadata. Reproduce with python scripts/integrate-competition-research.py, then run tests. This is a reviewed snapshot, not live synchronization. Re-review approvals within 30 days; retain previous snapshots for audit. The existing admin-only competition/published.json backend override remains supported.

Confirmed official sources:
- USAP Equipment Standards Manual, January 2025 revision 3.0: length 17 inches, combined length plus width 24 inches including accessories; no universal weight maximum; OEM replacement faces permitted as a category subject to all standards. https://equipment.usapickleball.org/docs/Equipment-Standards-Manual.pdf
- UPA-A 2026 certification guidance: professional UPA-A listing/stamp/model-number requirements; amateur USAP or UPA-A paths. https://upaa.unitedpickleball.com/paddle-testing/2026-upa-a-certification/
- UPA-A current approved-list exact rows. Blackout Only icon cannot be inferred from text extraction. https://upaa.unitedpickleball.com/approved-paddles/
- CNPL version 1.09, published June 22, 2026, section 4.1: USAP approval plus testing at each current event. https://cnpl.ca/rules

Remaining gaps:
- Independently verify USAP current entries and whether the Facolos removal notice has subsequently been superseded. Imported removal cannot override a current independently verified record.
- Verify UPA-A per-row Blackout Only icons, physical finish, stamps and printed model numbers. No implicit false value for missing metadata.
- Reconcile reported UPA-A general rulebook versus professional certification guidance conflict; no fabricated precedence. Detailed 26.4 PDF supplied by research returned 404; its proposed numeric limits were not activated.
- APP current division/event rules and exact Reload/PIKKL/PIKKL Pro paddle + skin configuration approvals remain unavailable.
- Recent USAP notices are preserved as research pending independent verification, not silently activated.

Matching uses stable catalog model ID plus exact normalized brand/model, separate from the physical unit's thickness measurement. Existing exact modelKey fixtures/backend records remain supported. Each organization resolves to its latest authoritative observation; delisting wins equal-date conflicts. Imported claims cannot grant or revoke approval. Approved model evidence is displayed separately from configuration/physical eligibility. Partial rules, conflicts, stale data and missing blackout metadata continue to require verification.

Tests cover catalog identity with changed measured thickness, wrong-brand ID rejection, imported claims, later/equal-date delisting, conflicting rule guidance, blackout uncertainty, existing competition cases and maintenance UI. No exact skin approval records were manufactured.
