# PaddleLog architecture and audit — September 29, 2026

Billing update: MONETIZATION.md supersedes this audit’s original no-paywall status.
Free now permits three active paddles; JSON export is Pro. Purchases remain disabled.

## What was found

The existing product is a functioning vanilla HTML/ES-module application served by a
Vinext route on Cloudflare Workers through ChatGPT Sites. D1 stores JSON; R2 stores
photos. The private Sites gate authenticates the owner. React is scaffold infrastructure,
not the application UI. Rewriting it would increase regression risk without solving saving.

Working features retained: collapsed native details/summary accordions, paddle CRUD,
Shape, photos, favorites/filter/sort, paddle picker, session CRUD, lifecycle periods,
hours and shared timeline, catalog CSV/JSON import, manual entry, JSON backup/restore,
explicit in-app confirmations, decimal inputs and three-way conflict merging.

Risks found: one shared database row, photos without per-account ownership, one global
browser draft key, photo bytes lost before upload, no account-deletion path, no explicit
entitlement boundary, no native build or billing boundary. Prior VM tests did not prove
browser/iPhone behavior. Data limit is 2 MB per account snapshot.

## Implemented architecture

Web -> trusted Sites identity adapter -> internal UUID account -> account-scoped D1
snapshot + owned R2 objects. All data APIs authenticate independently of the outer site
gate. UUIDs are suitable for Apple's appAccountToken and are independent of subscription
providers. Sites subjects remain site-specific; they must not be treated as global Leeway IDs.
A future OIDC identity adapter must map verified issuer + subject to the same account,
using an authenticated linking flow. Never auto-link identities merely by email.

The legacy owner migration is guarded by a hash of the owner email verified during the
audit and supplied by trusted Sites authentication. It is not first-visitor claiming.
It preserves the legacy row until account deletion. Existing photos remain readable only
by that owner. New photos carry account ownership and account-prefixed object keys.

Account deletion marks the account deleting, prevents writes, purges photo prefixes,
then atomically removes account records, grants and the owner's legacy data. Failed
purges can be retried from the app. This deletes PaddleLog data, not the ChatGPT account.
Hosting backup/log retention must be established before a public retention promise.

Drafts: synchronous per-field local text persistence; scoped by UUID; explicit server
Save; timeout/transient retries; stable IDs and compare-and-swap revisions; three-way
merge and conflict feedback; local draft removal only after acknowledgment. Close is
blocked if local draft storage fails; unload is warned during unsafe work. Beforeunload
is best effort on iOS, so persistence happens before that event. Pending originals use
IndexedDB, survive failed upload, and must be retried or explicitly discarded before
saving a paddle. Browser storage may be evicted or cleared; it is not a cloud backup.

The app keeps account snapshots as the compatibility write contract to avoid a risky
rewrite. This is account isolation, not a fully normalized analytics database. Before
large multi-user launch, migrate through a versioned repository to indexed paddle,
session, period, measurement and model tables; retain the export/import contract and
revision/idempotency semantics. Paginate sessions and add change cursors at that point.

## Model boundaries

`public/catalog.js`: Brand -> Model -> model metadata, deterministic IDs for the
account-imported namespace. `modelId` is optional on a physical paddle. Manual entries
remain valid; measured fields never get overwritten by a catalog refresh. Introduce a
separate canonical-provider namespace and external IDs for licensed catalog sync.

Physical paddle: all prior fields plus static weight (oz), started/retired dates, inactive
status, replacement paddle ID, optional model reference and measurement snapshots.
Snapshots capture changes to measured performance/setup with timestamps. Sessions keep
absolute ISO start/end (hours derive from their duration). Usage periods represent
rotation intervals, not hours; multiple periods remain supported. Removed predecessor
IDs may remain as historical references. Analytics UI is intentionally unchanged.

`shared/contracts.ts`: auth, secure storage, native capabilities, entitlements, purchase
provider and server transaction verification contracts. `public/entitlements.js` answers
access from active grants regardless of origin. `entitlement_grants` has provider-source
references for idempotent ingestion; no client endpoint creates grants and no paywall
is enabled. Only a trusted verified transaction/admin service may write grants.

## Native and security boundaries

`native/` builds the same HTML/modules into local packaged assets. Capacitor and plugins
are installed. Native bootstrap intentionally refuses an unconfigured auth/API setup.
Web cookies are not a supported native authentication strategy. Backend JWT verification,
OIDC PKCE sign-in, Keychain token storage, CORS, native photo transport, and native account
navigation still need implementation against the selected real identity provider.
Camera, share, haptic, lifecycle, network and deep-link adapters are prepared; they are
not yet complete product flows. Push is a contract only. No secrets are in client code.

StoreKit Swift boundary supports product lookup, purchase outcomes, current-entitlement
restore and deferred finishing. It is not compiled or registered as a Capacitor plugin.
Server verification and notifications are not deployed. The purchase coordinator never
finishes a transaction or reports completion before a successful server acknowledgment.
Do not sell subscriptions with this scaffold alone.

## Verification limits

Run `pnpm test`, `pnpm exec tsc --noEmit`, `pnpm native:build`, and the Sites build.
Tests cover real SQLite migrations/queries plus VM form logic and mocked storage.
They are not Safari interaction or device tests. The available browser preview was
blocked by its security policy; no alternative was used to bypass that restriction.
Actual iPhone layout/keyboard/camera QA and native Xcode compilation remain release gates.
There is no service worker/offline cold-start cache; online initial load is still required.
