# PaddleLog release readiness

September 29, 2026. This is a substantial Web reliability/architecture upgrade, not a
claim of App Store compliance or a TestFlight-ready binary.

## Owner decisions and access needed

- Apple Developer Program membership; authorized App Store Connect access; Mac/Xcode
  and signing access. No password, private key or certificate should go in this repo.
- Final registered bundle identifier, developer team, app record, subscription group,
  product identifiers, pricing, regions, billing periods and free trial decisions.
- Select the shared LeewayPB identity provider and provide its configured issuer/client
  settings through server configuration. Decide whether native Apple sign-in plus Web
  OIDC are offered. Implement verified account linking before expanding to other apps.
- Legal operator/contact, privacy policy/support URLs, retention policy, terms/EULA,
  export/backup policy and support process. Current privacy notice is private-preview
  information, not finalized public legal documentation.
- Approve actual Free/Pro limits before any enforcement. No features were paywalled.

## Engineering gates before TestFlight

1. Keep the private Web deployment and export a backup. Confirm the owner migration on
   the real account. Keep a database rollback backup; don't drop legacy data on release.
2. Configure OIDC external-browser Authorization Code + PKCE, native callback/universal
   links, server issuer/audience/signature/expiry verification and authenticated identity
   linking. Implement Keychain refresh-token storage and revoked-session behavior.
   The current Sites adapter remains Web-only; do not forward or fake trusted headers.
3. Finish native transport: HTTPS API allowlist/CORS, authenticated photo blob downloads,
   native sign-out/account deletion/export/share, token refresh and resume refresh.
   Preserve drafts through authentication expiration and account changes.
4. Run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm exec tsc --noEmit`,
   `pnpm native:build`. Set the real `PADDLELIFE_APP_ID` and `VITE_API_ORIGIN` before the
   native build. From `native`, run `pnpm exec cap add ios`, `pnpm exec cap sync ios`,
   and `pnpm exec cap open ios`. Commit generated native sources after configuration.
5. Configure signing team, bundle ID and app version/build in Xcode. Check current Apple
   required SDK/toolchain on upload day. Current Capacitor docs require Xcode 26+ and
   iOS 15+; dependencies and the target device matrix must agree.
6. If monetization is included: register StoreKit plugin, implement Transaction.updates,
   product/paywall disclosures, purchase pending/cancel/error handling, Restore Purchases
   and subscription management. Bind each purchase to the internal account UUID.
7. Implement a server Apple JWS verifier with trusted certificate validation, app bundle,
   environment/product allowlists, account token binding, signed dates, expiry/refund/
   revocation checks. Reject ownership reassignment. Deduplicate transaction/event IDs.
   Configure App Store Server API credentials as server secrets and V2 notifications.
   Reconcile renewals, grace/billing retry, expiration, refunds, family sharing policy,
   upgrades/downgrades and app relaunch. Finish StoreKit transactions only after durable
   server acknowledgment. Never trust a client Boolean or store receipt in logs.
8. Add purpose strings only for actually used camera/photo access. Verify plugin privacy
   manifests, required-reason APIs, data collection declarations and entitlements. Push
   stays disabled unless APNs and useful opt-in functionality are implemented.
9. Real iPhone Safari + native QA (small and large screens, keyboard and safe areas):
   add/edit/delete paddle; every tab; two usage periods; sessions create/edit/delete;
   total hours/timeline; favorite/filter/sort; dropdown; accordion; catalog manual/import;
   JSON export/import/malformed input; photo upload/retry/discard; refresh/reopen.
10. Failure matrix on device: airplane mode during save, suspend/kill mid-draft and mid-photo,
    storage unavailable/full, duplicate Save taps, lost acknowledgment, concurrent edits,
    failed session deletion, auth expiry, sign-out/account switch with draft, account deletion
    mid-purge/retry, network resume, VoiceOver/large text, dark UI contrast. Browser tests
    were blocked in this environment and have not been substituted by VM tests.
11. Complete security/privacy review: tenant isolation against live adapters, CSRF/CORS,
    request/rate limits, bounded uploads, operational monitoring without personal content,
    restore drill, photo-inclusive export, deletion from backups/retention, legal policy.
    Current snapshots are capped at 2 MB; normalize/paginate before large scale usage.
12. On Mac run simulator/device tests and StoreKit local configuration tests. Archive a
    Release build in Xcode, Validate App, then Distribute App -> App Store Connect -> Upload.

## TestFlight steps

1. Create the App Store Connect app with the identical registered bundle ID and correct
   platform, name and primary language. Complete agreements/tax/banking for paid products.
2. Upload the signed archive, wait for processing, resolve signing/privacy manifest errors
   and answer export-compliance questions based on actual encryption use.
3. Add internal testers, assign the processed build and test real account/cloud flows.
4. For external testing, enter beta description, feedback contact, review contact and a
   working review account/instructions; submit the build for Beta App Review as required.
5. Test sandbox purchases/restore across devices, renewals/expiry/refunds and deletion.
   Gather crash and feedback results. Resolve release blockers before expanding testers.

## App Store submission steps

1. Finish public support URL, privacy-policy URL, terms/EULA, screenshots for required
   display sizes, description/keywords, age rating, category and accessibility information.
2. Complete App Privacy answers from the actual app and all SDKs: identity/account data,
   user content/photos, diagnostics, tracking/advertising (do not assume 'none' without audit).
3. Confirm in-app account deletion is discoverable and functional; explain that deletion
   does not cancel Apple subscriptions and provide subscription management. If using
   Sign in with Apple, revoke its tokens during deletion. Finalize retention exceptions.
4. Configure subscription products and group, durations/prices/localizations, review
   screenshots and disclosures. Submit initial in-app purchases with the app as required.
   Restore purchases must work for the signed-in owner without granting another account.
5. Verify current App Review Guidelines, especially minimum functionality (4.2), purchases
   and subscriptions (3.1), privacy/account deletion (5.1), login services and regional rules.
   A useful native experience is required; packaging a URL alone does not establish eligibility.
6. Choose the tested build, complete review notes/demo access, attach purchases, select
   release method, submit for review. Monitor messages, resolve issues, then release.
   Approval cannot be guaranteed by code inspection.

## Recommended Free / Pro boundaries (proposal only)

Free: manual specs, basic photos, favorites, session CRUD, hours, lifecycle dates, all
reliability/draft protections, account deletion and personal data export. Consider 3–5
paddles for new accounts, with existing libraries grandfathered and always editable/exportable.

Pro: unlimited new paddles, richer history/analytics, comparisons, measurement trends,
advanced filters, multiple photos, enhanced backup and future enthusiast tools. Keep
basic cross-device recovery available where economically feasible; don't charge to recover
existing data. Never lock account deletion or make personal data portability contingent
on payment. Entitlements can come from Apple, Web, lifetime, promotions or Leeway all-access.

## Authoritative references to recheck at submission

- https://developer.apple.com/app-store/review/guidelines/
- https://developer.apple.com/support/offering-account-deletion-in-your-app/
- https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- https://developer.apple.com/help/app-store-connect/manage-builds/upload-builds/
- https://developer.apple.com/help/app-store-connect/test-a-beta-version/testflight-overview/
- https://developer.apple.com/documentation/storekit/
- https://capacitorjs.com/docs/ios
- https://capacitorjs.com/docs/apis/preferences
