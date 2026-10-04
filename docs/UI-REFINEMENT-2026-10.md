# Mobile UI refinement — October 2026

## Implemented
- Shared compact stylesheet: typography, spacing, buttons, metric tiles, status chips, sheets, sticky form actions, navigation, and overflow menus.
- Home prioritizes the main paddle, with compact Add, contextual Start Session, quiet detail/check actions, and totals after the paddle. Seven measurements remain visible per the owner's earlier explicit request.
- Secondary tabs show their own heading without Home branding, totals, or persistent success copy.
- Zero-library Home suppresses role selectors, totals, and empty paddle content.
- Settings uses a vertical root list and back navigation. Profile, Appearance, Data & Backup, Account, and General are drill-in destinations.
- Backup controls precede reference catalog management disclosure.
- Session/History edit/delete actions use overflow disclosures. Manual creation is Add past session; exact end time is optional disclosure after duration.
- Detail uses identity chips, compact metrics, structured setup rows, a Competition status entry, and a meaningful date-added display.
- Competition results precede rule metadata. Model matching, sources, rules, and existing evidence remain available.
- Maintenance shares Cancel/Save, shorter copy, optional interval/notes, preset-populated identity, and collapsed manual identity for known skins. Explicit Save draft & close remains in optional details; X/Cancel discard that maintenance draft.
- Pro leads with existing insight benefits and centralized prices; complete feature list is disclosed below pricing. No new paywalls or purchase activation.

## Preserved
No data migration, catalog-ID changes, approval/rule edits, pricing changes, entitlement changes, or calculation rewrite. Existing persistence, confirmations, manual records, drafts, and advanced fields remain. The Home recent-session/week metric now scopes to the displayed paddle. Date-added display accepts the existing timestamp format.

## Verification
- Full existing 56-file automated regression suite passed after UI changes, covering persistence, drafts, sessions, wear, rules, catalog, photos, entitlements, account isolation, and identity.
- Isolated browser review at 393×852 and 320×852. Visually inspected Home, Settings, and empty onboarding; DOM/layout checks for narrow width and fixed navigation.
- Exercised all bottom destinations; Settings root/back, Profile, Appearance live theme selection, Backup, and Account.
- Edited a session from 2h to 1h; saved list reflected the new end/duration. Started/ended a timer; deleted the disposable session via History overflow and confirmation. Manual session X cancel checked.
- Selected PIKKL Pro preset, confirmed collapsed populated identity fields, saved installation, and observed Brand New/0h independently of 6h overgrip/lifetime usage.
- Competition check showed exact-model uncertainty plus recorded setup issues before rule details.
- Free Pro dialog showed annual/monthly centralized prices, selection, disabled purchases, and dismissal. Annual price and purchase control were within the 320px first viewport.
- Review runs use development-only in-memory fixtures; no production records are changed and review routes are excluded from production.

## Limits / next pass
This is not exhaustive manual certification of every requested state. Automated tests cover broader rule, wear, and account matrices. Real iPhone keyboard, Safari photo picker, VoiceOver, native safe areas, and every maintenance removal/replacement permutation still need device QA. Approved/delisted model permutations were regression-tested rather than all manually viewed. No new four-way compliance summary was invented; existing model/setup results and detailed physical/event evidence were retained. Existing manual-record draft footers remain where changing semantics would risk data loss. Further polish can unify those explicit-draft controls and shorten legacy advanced/admin copy.
