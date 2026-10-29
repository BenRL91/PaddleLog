# PaddleLog living backlog

Source: Ben's three Apple Reminders screenshots, October 1, 2026. This is a working backlog: additions, corrections and priority changes are expected. Keep stable IDs. An entry is complete only after implementation and validation; existing partial features are not assumed complete. No automatic sync with Apple Reminders is configured.

## Current slice — login and everyday UX

- UX-01: Authenticated users enter the app instead of seeing signup/sign-in again. Implemented; automated session checks pass.
- UX-02: Remove Back to PaddleLog from the login screen. Normal sign-in first; account/provider connection and restore purchases stay in app settings. Implemented.
- UX-03: Launch without prominent multi-app login prompts. Preserve one shared LeewayPB identity underneath. Implemented.
- UX-04: Improve UI spacing, touch targets, forms and mobile wrapping. Initial pass implemented; Settings screens still feel crowded per October 1 feedback. Second pass implemented: 24px form gaps, separated Account action groups, roomier cards and mobile wrapping; continue device review.
- UX-05: Header actions are Add Session and Add Paddle. Implemented; mobile header wraps actions beneath title.

## Next — usage and maintenance

- WEAR-01: Replace Add period with estimated usage hours so consumable wear can include unlogged play. Implemented. Dated editable total-play estimates fill gaps around logged sessions and proportionally inform component wear; old periods remain unchanged. See ESTIMATED-USAGE.md.
- WEAR-02: Full-screen main-paddle screen with details and large quick replacement buttons for overgrip, edge tape and skins. Buttons match wear severity colors. Implemented in the dedicated Main tab; shared details, setup, photo, estimates and history remain available.
- WEAR-03: Badges for all consumables. Implemented on Main for overgrip, edge tape and skin. Unknown installations use a neutral state; colors include text labels.

## Collection and customization

- COL-01: Reorder paddles and favorites. Implemented touch/pointer drag handles, keyboard arrows and expanded Move up/down; account-saved general order plus independent favorite order. Filtered moves preserve hidden slots; Favorites first retains groups.
- COL-02: Separate singles main, doubles main and mixed main paddles. Implemented alongside original general main; Settings assignments and Main role selector.
- COL-03: Collectible label (examples: PE Gold Forza 2s, Gold Ben Johns JOOLA). Implemented: optional collectible flag and edition label, independent of active/archive status.
- COL-04: Color themes and light mode. Implemented: Dark/Light/Match device plus Rally red/Ocean blue/Court green accents in a separate Appearance settings tab. Preferences are device-local and do not modify library records. Semantic wear colors are preserved.
- SETUP-01: Implemented structured added-mass entries, placement sliders and explicit optional baseline. Point-mass balance/swingweight/twistweight estimates remain separate from measured specs.

## Sessions

- SESSION-01: Session image support; optional before/after images. Implemented with three optional photo slots, durable upload recovery and account ownership checks.
- SESSION-02: Ball used, location, indoor/outdoor, weather and net type. Implemented as optional editable session fields.
- SESSION-03: Reuse location defaults or offer autofill; do not silently reuse old weather as current weather. Implemented with explicit Apply defaults, confirmation, and opt-in save/update; weather excluded.

## Catalog and analysis

- CATALOG-01: Primary add-paddle flow selects real current/discontinued models; broad catalog coverage with custom/manual entry always available. Selection workflow implemented: searchable imported variants, shape/thickness identities, explicit Apply, manual fallback and source-labeled reference panel. Comprehensive real-model coverage remains pending verified data sources.
- CATALOG-02: Default images for each paddle. Pending; source/reuse permission required.
- ANALYTICS-01: Graph averages, differences and other comparisons among the user's physical unit, manufacturer specs, JohnKew/reference measurements. Keep provenance and measurement context distinct. First slice implemented: Pro side-by-side specs, usage, feel and setup, plus source-labeled imported reference differences. Aggregate graphs and partner feeds remain pending.
- VERIFIED-01: Link to request/generate PaddleLog Verified Specs through the planned physical measurement service. Pending; not official equipment certification.
- RULES-01: UPA and USAP eligibility display. Review/extend existing Competition Check; independent rulesets, exact configuration and multiple reasons, unknown when evidence is missing.

## Partner data and media

- PARTNER-01: JohnKew integration. Pending permission and supported data access.
- PARTNER-02: Pickleball Studio integration. Pending permission and supported data access.
- PARTNER-03: Pickleball Effect Tuning Lab integration. Existing setup image import is a foundation; broader integration pending permission/access. This does not reinstate a request to scrape PE's reviewer database.
- PARTNER-04: Default Tuning Lab weight-setup images. Pending permission/access.
- MEDIA-01: Reviewer videos. Pending source/embedding plan.
- MEDIA-02: X-rays (possibly from JohnKew). Pending availability and permission.
- MEDIA-03: Slow-motion GIFs/media of deflection, spin RPMs, etc. Pending availability and permission.
- COMMERCE-01: Purchase links with discount codes. Default to Ben's code; user can select integrated reviewers, none, or their own preference. Pending actual affiliate URLs/codes and clear attribution; never invent codes.

## Community and external integrations

- COMMUNITY-01: Optional public collection display/search for other users. Pending; collections remain private unless users opt in.
- DUPR-01: Connect DUPR and show average DUPR of users of each paddle. Pending authorized integration, consent and aggregate privacy/sample-size design. Avoid implying paddle choice causes skill rating.
- HEALTH-01: Integrate sessions with Fitbit, Apple Health, WHOOP, Garmin, etc. Pending platform/API availability and explicit user permissions.

## Separate launch dependencies

Apple Developer enrollment and Sign in with Apple; iOS/Android native validation; StoreKit/Play Billing product setup and sandbox purchases; explicit decision before changing owner-only hosting audience. None are implied completed by backlog intake.

## Pro insights — October 2 update

- ANALYTICS-02: Implemented 12-week/month usage charts, logged/estimated split, most-used paddle ordering, logged session frequency and days tracked through archive.
- ANALYTICS-03: Implemented chronological recorded-spec change trends for static weight, swingweight, twistweight, serve/volley speed. These are saved user entries, not controlled performance tests.
- ANALYTICS-04: Implemented completed consumable installation averages and per-installation logged/estimated usage. Current installations excluded from averages.
- Analytics remain read-only projections of existing records; no migration or data rewrite. Exact active-rotation duration across reactivations remains unavailable because the existing model lacks complete status-transition history. See PRO-INSIGHTS.md.

- CATALOG-03: Implemented import preview with new/update/unchanged counts, duplicate skipping, conflict rejection and explicit save/cancel. Shapes/thickness variants survive JSON backup; stale conflicting imports fail instead of silently overwriting.

## October 2 — everyday usability and product focus

- UX-06: Quick session logging: preselect Main, reuse recent location/ball/setting/net, duration entry and quick buttons. Implemented and tested: session CRUD, draft recovery, midnight-crossing duration changes, invalid durations and recent defaults without weather/photo reuse.
- REL-01: Clear saving, saved, unsaved account changes and failed-save messages; distinguish device draft from cloud save. Implemented; offline drafts remain available and recoverable saves retain existing retry logic.
- UX-07: Simplify forms with expandable measurements, equipment, feel, notes and media sections. Implemented; all fields preserved and full automated suite validated.
- UX-08: Simple first-use guidance: add paddle → set Main → log first session. Implemented; derives progress from saved data, no onboarding account flags.
- OWN-01: Purchase details: date, price/currency, seller and optional private HTTPS receipt link. Implemented; receipt uploads remain a possible future enhancement.
- SUPPORT-01: Feedback/report-a-problem with app version attached. Implemented in Account settings; opens a user-reviewed email draft, sends no records automatically.
- PRO-01: Planned Pro features moved from paywall to separate Account-linked roadmap. Implemented.
- UX-09: Reduced account explanations; app-only scope preserved in paywall, ecosystem details remain under Account. Implemented.
- COMP-01: Explicit partial/unknown coverage, missing model-approval warning, separate violation/unresolved counts and category explanations. Implemented; production data coverage remains incomplete.
- UX-10: Audit duplicate controls/stats and keep collapsed rows compact. Backlog.
- POLICY-01: Consider making basic backup export Free; advanced exports remain potential Pro. Product-owner decision required; no policy change authorized or implemented.

- UX-11: Prevent whole-page vertical overscroll from shifting bottom navigation. Implemented viewport shell with independently scrolling content and safe-area navigation. Ben confirmed scrolling looks good on October 2; keyboard behavior remains device QA.

## DUPR priority — October 2
- Server-only Partner API adapter and rating-history/analytics admission contracts implemented and tested. Not connected to production user accounts.
- Next blocking dependency: DUPR partner credentials, verified SSO documentation and commercial aggregate-use agreement. See DUPR-INTEGRATION.md.
- Next implementation: verified linking, persistent observations, session discipline, consent UI, unlink/export/delete, sandbox end-to-end tests.
- Competition Check expansion deferred per owner request; current results unchanged.

## Model approval badges — October 2
- Competition Check resumed: separate Approved / Unapproved / Not verified model badge, official evidence date/link, visible known setup violations, and collapsible detail audit.
- Reconciled known official brand aliases with exact model number, model name, and thickness: 274 UPA-A matches plus one verified USAP Boomstik Widebody entry. Remaining 295 USAP claims await current verification.
- Privacy direction: prefer concise policy/EULA disclosure over a separate research-enrollment flow. Do not treat this product preference as retroactive consent, commercial DUPR licensing, or replacement for any legally required opt-out/consent. Legal review of actual aggregation and jurisdictions remains a release gate; no data sale enabled.

## Player Profile — October 2
Implemented optional private Settings profile: display name, playing hand, age with as-of date, gender with self-description, country/region/city, and self-reported DUPR ID/ratings with as-of date. Saved in account-scoped settings with validation, CAS conflict protection, device draft recovery, explicit discard/clear, backup inclusion, and account deletion. Old clients preserve profile. No provider verification or commercial sharing implied. Location is free text in this first release; country/region normalization and profile history are follow-up analytics tasks. Age is a dated observation, not a birthday-derived value. Profile input is not consumed by the provider-only analytics pipeline.

## Competition Check expansion — October 2, 2026
Implemented complete displayed USAP (5,367 unique entries) and UPA-A (274 entries) snapshots, with reconciled pagination, exact official-model selection, source-linked model/configuration evidence, USAP/UPA-specific weight and dimension rules, structured weighting checks, and supported OEM surface combinations. Green passing evidence and red violations include text labels; snapshot dates remain visible. See COMPETITION-SNAPSHOT-2026-10-02.md for unresolved certification dates, PIKKL part mapping, physical inspection, and refresh requirements.

## Persistence and launch preparation — October 2, 2026
- DATA-01: Additive record tables, reversible split/join verification, account isolation, atomic CAS, unchanged-record writes, and frozen pre-migration library. Implemented; each existing account converts on its next successful save.
- SYNC-01: Persist complete unfinished saves locally; recover after restart; reconnect retry; explicit discard; independent consumable and weight-item conflict handling. Implemented.
- RECOVERY-01: Previous confirmed saves in R2; Account recovery UI and authenticated counts/hours diagnostic. Implemented. Automated alerts and backup retention/pruning remain open.
- SCALE-01: Paginated reads, per-record network APIs, and larger import limits. Backlog; current full-library transport stays compatible and capped at 2 MB.
- LAUNCH-01: Resolve public authenticated API access, managed hosting billing/control, and production monitoring before public/native launch. External operational decision; current site stays private.
- APPLE-01: Confirm active enrollment, provision provider/products through secure configuration, compile/sign on macOS, and run real sandbox/TestFlight flows. External access still required; purchases remain disabled.

## Sync and operations follow-up — October 2, 2026
- SYNC-02: Versioned record PATCH requests, maintenance-event deltas, optimistic revisions, refresh only on conflict, and no-op acknowledgement. Implemented; initial reads and explicit restore remain full-library transfers.
- OPS-HEALTH-01: Fixed-code daily account counters, private Settings health display, capped event ingestion, and counter pruning on activity. Implemented; external alerts remain an operations integration.
- RECOVERY-02: Latest 20 + eight weeks + six months + oldest copy, cleanup after successful saves, conservative unknown-date handling, and cleanup failures isolated from saved data. Implemented.
- LAUNCH-02: Native CORS boundary and secret-free web/iOS/Android preflight checks. Implemented but native origins remain disabled until shell/public API verification. Current hosting stays owner-only.
- APPLE-02: Live shared Auth settings confirm email/Google enabled and Apple disabled. Apple provider, credentials, signed native build, and real purchases remain externally blocked. See PUBLIC-NATIVE-LAUNCH.md.

## Product tenets experience — October 2
Implemented catalog-first activation, source/measurement separation on new selection, simplified details, Home/History, account-scoped Start/End timer, Settings Data section, setup snapshots, expandable Competition Check evidence, and observed replacement ranges. See PRODUCT-EXPERIENCE-2026-10-02.md for scope, compatibility, QA, and deferred items. Still needed: physical iPhone acceptance, explicit nominal-versus-measured thickness migration, cloud/native active timers, setup comparison, and Apple activation/configuration.

## Home measurement summary — October 2 follow-up
Home now always exposes static weight, length, width, thickness, swingweight, twistweight, and balance point (cm from butt). Personal values take precedence; manufacturer fallback is labeled. Neutral up/down/within indicators compare only manufacturer references, respecting inclusive published ranges and tolerances. Missing comparison data yields no indicator. Verified columns and promotional descriptions are hidden for now; attestation infrastructure is retained. Future service: trusted current-configuration measurements should take precedence, with a warning when setup changes may invalidate them. That future behavior is intentionally not enabled.

## October 3 — current corrections and before-payment work

Supersedes older conflicting entries above. See PREPAYMENT-READINESS-2026-10-03.md.

- Apple enrollment: owner confirmed approved. Provider, store configuration, and native QA remain.
- Full Competition Check: intentionally hidden; only confirmed USAP/UPA-A model badges remain.
- PE Tuning Lab import/scanning: removed at owner's request; no active integration.
- Appearance: ten accents plus Dark/Light/System. Home/card, title-case, drag-handle, and
  refresh-tab refinements shipped. Actual narrow-screen and accessibility review remains.
- POLICY-01: basic backups made Free under the accepted pre-payment cleanup. Photo-inclusive
  portable JSON added with 32 MiB file/20 MiB photo-total limits. Larger streaming backups pending.
- PRO-02: delivered-feature-driven paywall. Canonical paddlelog_pro with legacy grant compatibility;
  proposed Apple IDs now paddlelog.pro.monthly / paddlelog.pro.annual. Purchases disabled.
- RECOVERY-03: device backup acceptance and interrupted-upload orphan cleanup remain open.
- LAUNCH-03: release gates explicitly track device restore, mobile QA, monitoring/recovery,
  and official approval-snapshot review; no external verification gates set by this update.


## October 4 — screenshot intake and next development slice

Source: Ben's IMG_1209(1).png. Only clearly visible entries were transcribed; the obscured top rows need a later check. Existing stable IDs are retained. The duplicate operational HEALTH-01 above is renamed OPS-HEALTH-01 so workout integration keeps HEALTH-01.

| Screenshot request | Backlog ID / current state | Next step |
| --- | --- | --- |
| Reviewer videos | MEDIA-01, pending | Model-specific curated links and attribution; approved embeds where supported. |
| Purchase links / discount codes | COMMERCE-01, pending | Default LeewayPB preference; reviewer, none and custom choices. Owner-supplied real URLs/codes required. |
| Request PaddleLog Verified stats | VERIFIED-01, pending | Define service intake/destination; separate physical-unit measurements from catalog references and official certification. |
| DUPR connection and average rating per model | DUPR-01, adapter only | Authorized provider access, opt-in and minimum sample sizes; never treat self-reported ratings as verified. |
| Public collection / user search | COMMUNITY-01, pending | Opt-in visibility with field controls and revocation; keep private receipts and notes private. |
| Workout app sessions | HEALTH-01, pending | Provider-specific adapters, explicit connection and duplicate-safe import. |
| Default paddle images | CATALOG-02, pending | Authorized image assets with attribution and custom-photo precedence. |
| Default Tuning Lab setup images | PARTNER-04, deferred | October 3 removal remains effective. No PE integration restored by this intake. |
| X-rays | MEDIA-02, pending | Licensed, source-linked model/variant media. |
| Slow-motion deflection / spin media | MEDIA-03, pending | Licensed media with test context; no inferred unit-level performance. |
| Tutorials and tooltips | UX-12, new | Extend existing first-use guidance with contextual explanations for specs, wear and setup. |
| Left/right handedness for analytics | PROFILE-02, field implemented | Optional private right/left/ambidextrous profile already saved; future aggregation requires consent. |
| Pro comparisons of consumable wear between paddles | ANALYTICS-05, implemented | Insights now compares completed replacement hours by paddle, component and recorded product; current installations excluded from averages. Logged/estimated split, sample count and range shown. |
| Surface wear calculations; Lee data | WEAR-04, new, priority | Identify what Lee data measures and its permissions. Define fixed-face versus replaceable-skin baseline, observation history and setup context. Hours alone must not be presented as measured spin loss, remaining lifespan or certification. |

Development order: ANALYTICS-05 completed comparison slice → UX-12 contextual help → WEAR-04 surface observations and validated calculations → curated reviewer media / commerce once assets and actual links are available. Third-party feeds and public/native integrations remain dependency-driven.

ANALYTICS-05 validation: cross-paddle isolation, product separation, completed/current exclusion, zero-hour installs, session edits/deletions, estimated-use residuals, UI escaping, and existing Pro gate. No persistence migration. iPhone visual acceptance remains required.


## October 4 — contextual tutorials and surface-wear decision

Owner direction supersedes the earlier development order: WEAR-04 surface-wear calculations are deferred until JohnKew wear data is available with appropriate permission and usable measurement context. Do not implement a surface-degradation model from playing hours alone. The screenshot's “Lee data” reference is clarified by the owner as JohnKew wear data.

UX-12 implemented: tap-to-expand contextual guides for adding a paddle, main roles, session logging, estimates, measurements, setup, consumable replacement, Pro comparisons, and backups. All nine guides are replayable under Settings → General → Tutorials & tips. Guides beside forms use native details/summary controls, stay closed initially, and do not submit forms or alter records. Consumable and Insights dialogs reuse the same copy. Current tracking remains unchanged.

Validation: tutorial placement and disclosure semantics, absence of form controls in help, existing Insights behavior, maintenance checks and production build. Physical iPhone visual acceptance remains outstanding.


## October 4 — Main and Paddles roles

Implemented the approved screen distinction. Main is everyday use: header Edit paddle, approval badges, Start/Add past session, active timer controls, all three install/replace widgets, recent-session editing, weekly logged usage, and collapsed photo/spec/setup details. Paddles is collection management: searchable cards with thumbnail, roles, approval badges and three neutral-or-wear widgets visible when collapsed; expanded cards have Edit, Use for session, role assignment and four sections (specs/setup, maintenance, history, ownership/notes). Use for session starts or switches a timer without changing Main assignments. Archived/inactive paddles retain history and past-session entry; active-session selection is limited to active paddles. Missing approval data is explicitly unverified. Surface wear remains deferred for JohnKew data.

Validation: new integrated Main/collection DOM and action test covers header editing, collapsed sections, badges/wear, search, inactive handling, session selection/switching without role mutation, and hours after session removal. Production build and related maintenance/analytics checks required before publication; physical iPhone layout review remains user acceptance.


October 4 layout refinement: Add past session uses full button styling; Main's two session actions are full-width with spacing. Approval badges now live inside Main's Photo, measurements & setup disclosure and each paddle's Specs & setup section (including its detail view). Collapsed collection cards keep consumable wear visible. This supersedes the earlier visible-approval-card layout.


October 4 Surface widget: Skin appears only for Reload and PIKKL brands. Other paddles show an informational Surface widget instead on Main and in collection/detail widgets. Exact catalog face material is grouped into Carbon fiber, Fiberglass, Aramid fiber or Hybrid; documented HexGrit, Durable Grit and Diamond Tough names are retained. Unknown and held face materials remain Not recorded, with no brand-only material guesses. Existing skin history is preserved. Surface has no replacement button, wear stage, lifespan estimate or performance-loss calculation; JohnKew wear data remains the dependency. Current catalog material coverage is incomplete. Skin calculations on supported paddles remain existing usage reminders.

- Boomstik Surface correction: source-backed Elongated/Widebody 16mm entries display InfiniGrit (Selkirk) · Durable texture; preserve T700 construction in reference specs and separate Raw Carbon variants. Manufacturer: https://www.selkirk.com/products/selkirk-labs-project-boomstik . No wear calculations added.

### Catalog coverage and customer names — accepted priority
- Always prioritize current paddles, while keeping complete coverage of all 5,536 records as the target. Historical, regional and technical variants remain included.
- Product selector now groups presentation names, separates shape/thickness/version and keeps raw source names and IDs in expandable provenance. Generation and Raw Carbon differences remain distinct. Explicit exact-record choice prevents approval evidence from being merged.
- Manufacturer-source surface enrichment added nine records: two Boomstik approval variants, two ERA Power variants, five original LUXX variants. Original LUXX ProSpin+ must not be relabeled InfiniGrit. Regional Boomstik page currently specifies a different thickness, so its material was not blindly copied into 16mm approval records.
- Coverage report: data/catalog-coverage.json; regenerate with node scripts/catalog-coverage.mjs. All missing records are listed by brand and identity. 70 surface records covered; 5,466 remain. Next batches should prioritize verified current manufacturer products, then archived manufacturer pages and remaining historical models. Do not invent unavailable material or current-product status.
- Advanced surface analysis is planned for Pro after JohnKew wear data and permitted use are available; basic material information remains free.

### Catalog version audit — 2026-10-05
Audited all 5,536 existing reference records and identified 24 families with overlapping customer variant labels. Added 17 manufacturer retail versions: Honolulu J2CR original/Crystal Blue with both 5.5 and 6 inch handles, J3CR/J6CR original/Crystal Blue, Six Zero Coral/Coral Pro in three shapes, Selkirk LUXX 19 mm InfiniGrit Epic/Invikta, and 11SIX24 Hurache-X Power 2. Updated 22 source-backed surface records across Franklin, Friday, Nox, JOOLA, Luzz, Zocker, Ramsports and 11SIX24. Manufacturer choices appear before technical registry entries. Crystal Blue, Aero-Black, GritBite and Double Diamond Tough labels are supported without wear calculations.

Exact original identities and approval payloads are preserved and tested. Manufacturer retail versions have no inferred approval mapping; the badge requests exact official listing confirmation. Honolulu #101/#102 handle mapping, Sypik Triton 6 SFO/SHC and Thrive Project Fury TPB1173/TPB7311 remain unresolved. Other duplicated technical listings remain available with registry identifiers; shared names are insufficient to merge approval evidence. The full audit is data/catalog-variant-audit.json and changes/protected identities are data/catalog-gap-resolution.json. Surface coverage is 109/5,553; remaining 5,444 records are queued, not claimed complete.

### Guided selector and Proton — 2026-10-05
Added dependent shape/thickness/surface-version filters, retail-first default with technical alternatives under Advanced listings, and a confirmation card with source product photo, surface and live model-approval badges. Existing exact technical links stay visible when editing. The “I’m not sure of my version” action saves an explicitly unconfirmed model, preserving physical measurements while preventing a guessed approval result. Product photos currently cover manufacturer-sourced Honolulu retail choices and the ten current Proton variants; other models have an explicit photo-unavailable fallback.

Proton and Proton Sports Inc share one presentation-level brand choice; raw catalog/approval identities are unchanged. Added all ten products from Proton’s current paddle collection: Coyote 15 elongated, Flamingo and Peacock 13/15 elongated/widebody, and Roadrunner 15. The 28 legacy technical records remain available. Series One/Type A/Type B/V2, Series Two and original Series Three still require archived manufacturer specs. Peacock manufacturer text describes roughness-enhanced surface without specifying face material, so it is not guessed as carbon or NanoTac. Snapshot and remaining work: data/proton-catalog-coverage.json.

Validation: guided Honolulu/Proton HappyDOM flows, exact technical edit preservation, uncertain selection, photo/card rendering, unchanged measurements, existing catalog/surface/approval regression tests, production build. Browser preview unavailable in this environment; physical iPhone visual QA remains outstanding.

### Default paddle photos — 2026-10-05
Main, collection thumbnails, paddle details and edit previews now resolve images as uploaded photo → linked catalog photo → generic paddle illustration. Catalog photos are resolved dynamically from the existing model link; they are not copied into user photo IDs or backups. Removing an uploaded photo restores the default. Broken image requests fall back without retry loops. Targeted image-priority/identity/error tests, Main/collection regressions and production build passed. Browser/iPhone visual QA remains outstanding.

### Concise Honolulu labels — 2026-10-05
Crystal Blue surface widget now reads “Crystal Blue Grit.” Owned Honolulu retail paddle titles read “J2CR · Crystal Blue” (or J3CR/J6CR/Original); the smaller subtitle carries Honolulu, thickness and handle length. Nicknames retain priority. Raw model strings, catalog IDs, approval evidence and full reference surface details remain available and unchanged. Compact-label and Main/collection/surface checks passed.

### Catalog-wide concise display — 2026-10-05
All linked catalog paddles now use customer product titles, with shape/thickness/retail handle details in the subtitle. Distinct named surface versions stay in titles where needed (Boomstik · InfiniGrit, Coral Pro · Double Diamond Tough). Known brand aliases are shortened in detail lines; CFS/CAS replace their expanded surface terms in model display. Branded surface widgets use technology names without repeating the brand and material; full source material remains in reference details/tooltips. Selected-family picker options omit the already-selected brand/product. Retail version copy removes redundant Crystal Blue/Original explanations and uses compact inch notation. Generation names and numbered shapes are retained; unknown/custom models stay as entered. Nicknames retain priority. All 5,563 catalog titles validated; guided selector, surface, catalog and stable-identity tests and production build passed. iPhone visual QA remains outstanding.

### Button spacing and Pro affordances — 2026-10-05
Action groups now have 12 px gaps; collection actions have larger touch padding and separation. Compare paddles and Insights share a spaced Pro toolbar with gold PRO pills and visible “PRO features open upgrade options on Free” copy. Accessible labels explain the action before activation. Entitlement refresh updates the hint to included-with-plan for Pro users. Existing click gates and purchase configuration are unchanged. Saving a newly activated paddle above the Free active limit is marked PRO and explained beside Save; ordinary edits remain unmarked. Marker/toolbar, paywall and Main/collection regressions and production build passed. Physical iPhone visual QA remains outstanding.

### Pro value expansion proposal — 2026-10-05
Removed redundant included-in-plan helper lines for Pro members; Free upgrade explanations and PRO badges remain.

Recommended next implementation: turn Comparisons into a decision workspace with photos, focused spec groups, differences-only view, clear measured/reference provenance, missing-data handling and saved comparisons. Support owned-vs-catalog comparisons while preserving exact versions and avoiding unsubstantiated overall winner scores. Upgrade Insights with selectable date ranges, previous-period changes, usage share and an attention summary grounded in recorded installation/replacement history. Show sample sizes and avoid exact lifespan promises.

Additional Pro candidates for user review: named setup experiments with before/after snapshots and session-linked observations; cost-per-playing-hour and consumable spend analysis (basic cost entry remains accessible); bag rotation and singles/doubles role analysis; personal session ratings/condition filters with sufficient-data indicators; shareable collection/setup reports; advanced surface life estimates only after JohnKew data permission and validation. These are proposals, not delivered features or paywall claims. Keep core logging, cloud sync, basic maintenance and data access useful on Free.
