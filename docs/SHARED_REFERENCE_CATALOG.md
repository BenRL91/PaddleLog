# Shared PaddleLog reference catalog

Seed file: `public/reference-catalog.json`, supplied by the owner October 2, 2026. Schema: `paddlelog.reference-catalog.v1`. It contains 552 records and 160 distinct brands. This is explicitly a partial seed, not an exhaustive historical dataset.

## Storage and ownership

The original supplied JSON remains in source history. The current asset is enriched through reviewed ID-bound batches and copied into Capacitor's local assets by the existing native preparation script. It is never inserted into `account_logs.payload`, does not consume a user's active-paddle quota or snapshot budget, and is shared by all application users. No user database migration or record write is required. The existing personal catalog importer remains available for manual/custom source records. Future updates replace this independently versioned reference asset; stable source IDs must remain stable. A later admin ingestion endpoint can serve the same schema without changing the UI or physical-paddle storage.

`normalizeSharedCatalog` builds UI rows from this separate source and retains the complete original record under `referenceRecord`, including source metadata, model numbers, extra material/handle specifications and supplied approval claims. It exposes compatible source-labeled spec values but never turns supplied approval claims into authoritative Competition Check evidence.

## Quality audit

- IDs: 552 unique, no duplicate IDs.
- 12 ambiguous brand/model/shape/thickness groups have distinct model numbers; all records retained. Selector labels show model numbers only where otherwise identical variants need disambiguation. Implicit name-only lookup never guesses an ambiguous physical unit's model. Explicit selection uses source ID.
- 439 records lack shape after three reviewed manufacturer batches. Missing shapes remain unknown.
- 65 records now have non-null detailed specifications (3 supplied plus 62 enriched). Other dimensions, weights and performance values remain unknown.
- Source approvals are claims from the supplied file. They are preserved, not reverified during this integration and not published into trusted competition approvals.
- Units follow the schema's explicitly named staticWeightOz and the current app's inch/mm/kg·cm² measurement conventions for compatible values. Extra source fields remain in original JSON and are not silently discarded or presented as user measurements.

## UI and links

Brand/model dropdowns and searchable model-number/shape/thickness variants combine shared references with personal models. Explicit model selection fills brand/model/shape/thickness and available numerical reference values into empty fields. Existing physical measurements, notes, and photos remain untouched. Published ranges are shown as ranges and never converted to a made-up average. Saving writes stable `plref_*` into the physical paddle's existing `modelId`. Explicit shared links survive changes to user-measured thickness/shape as long as brand/model are unchanged. Existing legacy model links are not migrated automatically. Drafts preserve explicit selection in `catalogModelId`; editing and reopening a linked unit restores it. Manual entry remains available.

Loading failure does not block account records or manual entry; settings show a retry action. Backups contain the owned unit's model ID and personal catalog, not duplicate copies of the shared catalog. Missing/renamed reference IDs must never erase a physical paddle.

## Verification

`tests/shared-catalog.mjs` checks all records, identity uniqueness, retained original metadata, unknown values, ambiguity, source labels, physical-data isolation, dropdown selection and backup link preservation. Existing catalog workflow tests remain compatible. No user data is changed to install this seed dataset.


## Manufacturer enrichment batch — October 2, 2026

Reviewed batch: `data/reference-enrichment-2026-10-02.json`; repeatable application: `node scripts/enrich-reference-catalog.mjs`. Exact IDs, expected brand/model/model number and existing values are checked before enrichment. Conflicting values abort without writing. Every added reference retains source URL, check date, as-sold configuration and average/tolerance metadata. Model IDs, names, model numbers and supplied approvals are unchanged.

Coverage: 10 JOOLA Pro IV/Agassi/Graf records, 2 standard Boomstik records, 4 ERA records (two existing catalog brands), 2 OMNI records and 7 Vatic PRISM/Saga records. No reviewer measurements, images or marketing copy imported.

Ranges (Selkirk static weight) remain `staticWeightOzRange: {min,max}`; no midpoint fills the physical-paddle form. Published swing/twist averages are labeled as manufacturer averages with supplied tolerances. Handle/material metadata appears with reference details, not as new user measurements.

Unresolved: JOOLA Magnus IV with G3 model number; Boomstik no-MOI and raw-carbon configurations; conflicting Vatic long-handle dimensions; remaining catalog records without official detailed sources. Existing supplied approval claims remain separate from trusted Competition Check data. This enrichment performs no user database migration and updates no saved paddle/session records.

Current supported published specs are reference data, not PaddleLog Verified Specs. Numeric reference defaults require confirmation against the user's physical unit.


## Second manufacturer batch — 2026-10-02

30 additional exact catalog records: CRBN 12 (TFB/TFG/TFW 1–4), PIKKL 2 (Hurricane Pro 14mm, Vantage Pro 16mm), Engage 7 (Axiom elongated/widebody 14/16mm, X2 elongated/widebody, Pro1 Innovation 15.2mm), Six Zero 3 (Ruby Pro RKD, Black Opal RCD, Boulder Opal RCS), 11SIX24 6 (four Jelly Bean 2 shapes, Pegasus/Vapor Power 2).

Every patch in `data/reference-enrichment-2026-10-02.json` has a manufacturer source URL, checked date, exact expected identity, and field-level averages/ranges. Manufacturer source pages are linked in the app. Approval records and all 552 stable identities remain unchanged; no account or physical-paddle records are migrated.

Range support now validates and displays swingweight, twistweight, width and grip circumference as well as static weight. No midpoint is guessed or autofilled. Nonempty user measurements are preserved. Numeric dimensions and published scalar specifications fill only empty inputs.

CRBN's TFBP identifiers, PIKKL X models, Hurache-X Power 2 Pro, unresolved Coral Pro revisions and Ultre Power 2 remain unfilled pending exact source confirmation. Malformed Jelly Bean 2 weight ranges remain unknown. Six Zero tapered widths remain ranges; conflicting Ruby core text is not imported. Boulder surface variants share the documented physical values, without assigning a surface or certification. Manufacturer specs are references, not PaddleLog Verified measurements or official eligibility evidence.

Validation: all 55 enriched variant selections/autofill flows, stable identity/approval checksum, idempotent enrichment, conflict rejection, malformed range rejection, excluded ambiguous variants and preservation of entered measurements.

Implicit lookup treats missing variant metadata as uncertainty. A known-shape record and an unknown-shape sibling still require explicit source-ID selection; labels disclose their model numbers.

## Unit-to-reference comparison

`public/reference-comparison.js` supplies one read-only comparison renderer for paddle detail, Main, and the existing Pro paddle comparison dialog. It resolves explicit `modelId` first, respects brand/model binding, and fails closed for ambiguous implicit variants. The Pro dialog now receives the combined shared/personal catalog instead of only the personal catalog.

Scalar differences are unit minus source, with source averages and tolerances disclosed. Published ranges show distance to the nearest boundary only when outside, or “Within published range.” No midpoint or percentage advantage is fabricated. Missing, zero and nonfinite inputs are handled explicitly. The responsive cards include source URL, date, reference origin and configuration notes; recorded unit values may have been autofilled and are never labeled verified. No account writes, schema migrations, or new paywalls are involved. Successful catalog load refreshes visible detail and Main comparisons.


## Reviewed Chat batch — 2026-10-02

Original six research files and integration decisions retained in `data/research/chat-2026-10-02/`. Of 17 proposed patches, 7 add specs to previously empty records: Agassi Pro 14mm, Diadem BluCore Hybrid 16mm/Pro 14mm/Pro 16mm, Gearbox GX2 Power Hybrid 16mm/Pressure X 8E/Pro Ultimate Power 14mm elongated. Exact source product pages were independently retrieved. Current Gearbox pages additionally support GX2 face material and Pressure X face/core materials. Pressure X is advertised to ship October 7, 2026; no claim of shipping availability is made. Ten patches overlap existing records and do not replace existing material wording or variant identities. Verified Ruby face material is added; conflicting core wording is held.

Three DBD scalar widths are corrected to manufacturer's tapered ranges. Old widths are retained in the integration report and source history. Disputed DBD swing/twist/grip/weight values and Ruby swing/twist remain in raw source records, with `specMetadata.pendingVerificationFields` excluding them from normalized numeric reference values and catalog extra details. These require manufacturer clarification on conflicting tables, edition mapping or units/method. This changes reference presentation only; no physical-unit, session, photo or account data is written. No approval records changed.

Four candidate Gearbox models remain separate, without permanent IDs or dropdown insertion. Reviewer candidates remain licensing leads; no reviewer measurements imported.
