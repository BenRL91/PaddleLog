# Public web and native launch — October 2, 2026

## Confirmed runtime

The existing hosted configuration uses LEEWAY_AUTH_MODE=supabase and
LEEWAY_WEB_ORIGIN=https://paddlelog.leewaypb.com, with the owner's shared Supabase
Auth project eclxqfmuqeavwwafbvhu. Application data remains in the existing D1/R2
resources. No new Supabase project or application database was created.
The hosting audience remains owner-only. There are no Apple billing values in the
hosted environment. A code or web publication cannot activate Apple enrollment.

## Completed in this update

- Routine API PATCH requests carry only record/field changes, including separate
  maintenance events. Full PUT remains for import/recovery and older clients.
- Verified tokens and server-side account mapping protect state, photographs,
  recovery, operational metrics, and entitlements. Cookie writes keep CSRF checks.
- Optional native CORS handles PATCH and other API preflights using an explicit
  origin allowlist, bearer-only access, and no cookie credential/wildcard permission.
  It is disabled unless LEEWAY_NATIVE_ORIGINS_JSON is configured. No outer hosting
  bypass credential can be shipped in a native application.
- scripts/release-preflight.mjs reports web/iOS/Android release gates without
  printing secrets. Its verification flags must only be set after actual checks.

## Public web sequence

1. Confirm production hosting audience, billing/quotas, resource control, monitoring
   access, backup support, and an exit/portability path with the managed host.
   Direct Cloudflare pricing is not proof of the managed Sites contract.
2. Finalize public-facing privacy/terms, retention obligations, legal operator
   details, and deletion of the shared identity where requested. The app currently
   deletes PaddleLog records, not the cross-product Supabase identity. Shared-account
   deletion needs a secure server-side administrative implementation and explicit
   scope across LeewayPB products; never put its privileged key in client code/chat.
3. Verify the Supabase Site URL is https://paddlelog.leewaypb.com and allow exactly
   https://paddlelog.leewaypb.com/auth/return. Keep the existing chatgpt.site callback
   only while it is actively used. Local development can separately allow
   http://localhost:3000/auth/return. No broad wildcard redirects.
4. Change the hosting audience only as an explicit launch step. Then test signed-out
   access in a fresh browser: the app must reach LeewayPB sign-in without requiring
   ChatGPT. Test email and Google, recovery, isolated accounts, and all mutations.
5. Set the preflight evidence flags only after passing: PADDLELOG_PUBLIC_ACCESS_VERIFIED,
   PADDLELOG_HOSTING_OPERATIONS_CONFIRMED, and PADDLELOG_POLICY_REVIEWED. These flags
   are release tooling evidence; they do not grant access or change running auth.

## Apple setup once enrollment is active

Proposed identifier, not registered or permanently configured here:
com.leewaypb.paddlelog (also proposed Android package). Confirm it before generating
platform projects; set PADDLELOG_APP_ID and server APPLE_BUNDLE_ID consistently.

- Enable Sign in with Apple on the primary App ID. Create an associated web Services
  ID; proposed com.leewaypb.auth, because the identity is shared across LeewayPB apps.
- Supabase's Apple OAuth return URL for the existing project:
  https://eclxqfmuqeavwwafbvhu.supabase.co/auth/v1/callback
  Register its domain eclxqfmuqeavwwafbvhu.supabase.co for the web OAuth configuration.
  The app callback is a separate URL: https://paddlelog.leewaypb.com/auth/return.
- Configure the Apple provider in Supabase using the registered identifiers, Team ID,
  Key ID, and generated client-secret JWT. Keep the .p8 signing key secure. Web OAuth
  secrets require rotation within Apple's validity limit (at most six months).
- Native callback proposal: paddlelog://auth/return; register exact callbacks only
  after the chosen shell/link strategy is confirmed. Prefer associated HTTPS links
  where platform setup permits. Never merge Apple relay-email accounts by email.

The current central purchase product proposals remain:
paddlelog.pro.monthly ($1.99/month target) and
paddlelog.pro.annual ($14.99/year target). These are the current proposed identifiers. They have not been created by this tool.
Create them in one PaddleLog Pro auto-renewable subscription group, with consistent
subscription access levels. Store prices remain authoritative. Do not create the
future ecosystem all-access subscription as either of these individual-app products.

Complete paid-app agreements, tax/banking details, product descriptions, localized
prices, and review information. Provide non-secret identifiers after setup. Configure
APPLE_ISSUER_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY through secure hosting secrets,
not chat, source, or client configuration. See MONETIZATION.md for verifier trust
roots, environment, notifications, and activation gates.

## Native work still required before TestFlight/Play

- Generate projects only after registered identifiers are final.
- Wire the real secure token store (Keychain/Keystore) and system browser into
  native/leeway-auth.ts. The bootstrap currently requires an injected auth adapter;
  a web build passing does not mean native sign-in is operational.
- Implement native bearer-authenticated image downloads/object URLs and native
  sign-out/deletion transport; ordinary img URLs do not acquire an Authorization
  header from the fetch wrapper. Keep tokens out of URLs/localStorage/Preferences.
- Configure VITE_API_ORIGIN to the verified public authenticated HTTPS origin.
- Register/compile the supplied StoreKit bridge in Xcode and Google billing bridge
  in Android Studio. Configure store notifications and real transaction verification.
- Run device tests for auth, restart/resume, photos, offline recovery, purchase,
  cancellation, restore, expiry, and account changes. Complete privacy manifests,
  permission descriptions, accessibility, and store disclosures.
- Only then enable APPLE_BILLING_ENABLED and billingConfig.purchasesEnabled.
  An iOS signed archive/TestFlight upload needs macOS/Xcode and signing access.

Official references reviewed:
https://supabase.com/docs/guides/auth/social-login/auth-apple
https://developer.apple.com/sign-in-with-apple/
https://developer.apple.com/help/app-store-connect/manage-subscriptions/set-up-auto-renewable-subscriptions/
