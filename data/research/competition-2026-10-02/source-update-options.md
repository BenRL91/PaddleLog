# PaddleLog equipment eligibility — source/update options

Checked: 2026-10-02

## Recommended source hierarchy

1. **USA Pickleball Approved Paddle List** — https://equipment.usapickleball.org/view/paddle-list/
   - Treat the live list/individual entry pages as the authority for current USAP model status.
   - The public interface is a paginated/searchable HTML database. No documented public JSON/CSV API was located in this research pass.
   - Do not interpret a failed text search as a prohibition. Resolve exact brand/model/model-number identity and confirm the current entry.
   - Also monitor the **Compliance Report** (https://equipment.usapickleball.org/compliance/) and official equipment news for removals, investigations, relistings, and future-effective changes.

2. **USA Pickleball rules and Equipment Standards Manual**
   - Rules hub: https://usapickleball.org/rules/
   - Equipment Standards Manual: https://equipment.usapickleball.org/docs/Equipment-Standards-Manual.pdf
   - Spin implementation notice: https://usapickleball.org/usap-news/equipment-news/update-regarding-the-usa-pickleball-spin-rate-test-and-implementation-timeline/
   - The technical standards and notices can change independently of the annual rulebook. Store rule version/effective date and source URL, not just a boolean.

3. **UPA-A Certified Paddles List** — https://upaa.unitedpickleball.com/approved-paddles/
   - Current searchable HTML list contains brand, model, model number, thickness, added date, and a visual Blackout-only indicator.
   - No documented public API/CSV feed was located in this pass.
   - Capture the Blackout icon explicitly; ordinary text extraction can lose it.
   - Recompute a *derived* 24-month expiration from certification date only when clearly labeled as derived; verify the live list before Competition Check.

4. **UPA-A Paddle Rules / certification guidance**
   - Rules 26.4: https://upaa.unitedpickleball.com/wp-content/uploads/2026/04/UPA-A-Paddle-Rules-26.4.pdf
   - 2026 certification: https://upaa.unitedpickleball.com/paddle-testing/2026-upa-a-certification/
   - Poll for version changes and preserve prior versions with effective/end dates.

5. **CNPL rules** — https://cnpl.ca/rules
   - Current official rules page exposes a version number and publication date. Version 1.09 requires USAP approval plus event testing.
   - Store the CNPL rule version separately from USAP approval because event testing is an additional eligibility gate.

6. **APP**
   - APP Next rules: https://www.theapp.global/rules/app-next-rules
   - Collegiate announcement: https://www.theapp.global/news/college-pickleball-2025
   - No current 2026 APP Tour-wide equipment policy/feed was verified in this pass. Keep APP Tour eligibility as `RULES_NEED_VERIFICATION` until an official current rulebook/event instruction is obtained.

## Suggested sync behavior

- **Daily**: USAP Approved Paddle List, USAP Compliance Report, UPA-A Approved Paddle List.
- **Daily during event weeks / weekly otherwise**: official equipment-news/notices from USAP and UPA-A.
- **Weekly**: CNPL rules version page and APP rules/event player instructions.
- On any status change, append an immutable approval event (`approved`, `under_investigation`, `removed`, `relisted`, `expired`, `blackout_only`, etc.) instead of deleting history.
- Exact identity key should include organization + brand + model + model number + thickness + any governing-body revision/configuration identifier.
- Never propagate approval across thickness, shape, surface, handle, edge design, revision, or other structural variants without explicit governing-body evidence.

## API/feed status

No documented public machine-readable API or official downloadable complete paddle-list feed was located for USAP or UPA-A in this pass. Their public searchable HTML databases are the authoritative update surfaces found. UPA-A publishes downloadable paddle-rule PDFs; USAP publishes its Equipment Standards Manual and rule resources. CNPL publishes versioned rules on its official site. APP requires further source discovery for a current tour-wide equipment policy.
