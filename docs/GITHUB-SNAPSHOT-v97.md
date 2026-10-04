# GitHub source snapshot — PaddleLog v97

Imported for LeewayPB suite architecture planning on 2026-10-04.

- Source commit: `fb815afcb4e1d2299ab9b6ee7e71d9b58dfbc8f6` (Sites saved version 97).
- Destination: private `BenRL91/PaddleLog`, branch `main`.
- This is a sanitized source snapshot, not a deployment or a migration execution. Original Git history is not imported.
- Includes application code, reference data, migrations, tests, native scaffolding, configuration examples and documentation. No production database or user-uploaded photos were exported.
- Email values, owner/tester account identifiers, tester seed identifiers and the legacy owner hash were replaced with placeholders. Email-shaped reference-data fields and test fixtures were also affected by the broad sanitization.
- Omitted tracked Python bytecode: `scripts/__pycache__/update-amateur-rules-2026-10-02.cpython-312.pyc`.
- Added the prior architecture audit as supporting documentation; its reported validation belongs to that prior audit, not this upload. It references suite contracts v1.1; reconcile against later suite contracts before planning changes.
- The import was verified by comparing GitHub file paths and blob hashes with the intended sanitized snapshot. Application tests/builds were not rerun for this transfer. Placeholder substitutions can affect authentication, owner/tester access, contact links, reference data and test expectations. Review/configure those values before deployment or interpreting test failures.
- Existing Sites deployment, shared authentication, production data and payment configuration were not changed by this import.

## Files changed by sanitization

- `app/admin/admin.html`
- `app/paddle.html`
- `data/catalog-coverage-audit.json`
- `data/official-approval-lists-2026-10-02.json`
- `data/research/competition-2026-10-02/conflict-report.csv`
- `data/research/competition-2026-10-02/evidence.csv`
- `data/research/competition-2026-10-02/unresolved.csv`
- `docs/DUPR-INTEGRATION.md`
- `drizzle/0004_owner_pro_testing.sql`
- `drizzle/0007_mature_ulik.sql`
- `lib/server/account.ts`
- `lib/server/test-access.ts`
- `public/competition-data.json`
- `public/privacy.html`
- `public/reference-catalog.json`
- `public/support.js`
- `tests/auth-storage.mjs`
- `tests/backend.mjs`
- `tests/owner-pro.mjs`
- `tests/ownership-ux.mjs`
- `tests/tester-access.mjs`
- `tests/web-auth.mjs`

The added architecture audit also has email, UUID and 64-character hash values replaced where present.
