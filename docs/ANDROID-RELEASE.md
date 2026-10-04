# PaddleLog Android / Google Play readiness

Android and iOS use the same HTML, application modules, API, accounts and provider-independent
`paddlelife_pro` entitlement. No second application database or duplicated UI is needed.
The installed Android Capacitor runtime matches iOS/core version 8.5.2.

## Implemented
- Shared native asset build; `pnpm native:android` adds/syncs the Android project after a real identifier is supplied.
- Platform routing prevents Android from invoking the Apple purchase plugin.
- Google purchase/restore coordinator, proposed centralized Play product/base-plan mapping,
  pending/cancelled handling, duplicate-tap guard and mandatory server verification boundary.
- Google entitlement source type. Existing expiration behavior preserves all user data.
- Shared camera, share, haptic, connectivity and resume integration points.

## Not yet implemented / release blockers
This is preparation, not a signed AAB or a finished Google Play Billing integration.
The Kotlin Play Billing bridge, Google API verifier, notification endpoint and secure native
auth adapter still require implementation/configuration. Purchasing remains disabled.
No Android emulator/device or Gradle build has been verified in this environment.

## Owner configuration
1. Create/verify the Google Play developer account and create PaddleLog in Play Console.
2. Choose a permanent Android package name and Apple bundle ID. Set `PADDLELOG_APP_ID`
   separately for each target; do not change a published package ID. No ID has been invented.
3. Supply the shared LeewayPB Supabase project URL and publishable key. Configure Apple,
   Google and email sign-in and native redirect/deep-link allowlists. Keep provider secrets
   on the server. Users should use their existing LeewayPB sign-in method/account.
4. Configure a public, authenticated API with JWT account mapping. The current private
   ChatGPT Sites sign-in is not a public mobile-app authentication provider.
5. Create proposed subscription `paddlelog_pro` with auto-renewing base plans `monthly`
   ($1.99 USD/month target) and `annual` ($14.99 USD/year target). Configure availability
   and local prices in Play Console. ProductDetails prices/eligible offer tokens must be
   authoritative. These identifiers are proposed and may be changed before launch.
6. Enable Android Publisher API; grant a server service account appropriate app access.
   Put credentials in secure server configuration, never native assets or chat/source files.
7. Implement the Play Billing bridge against `GoogleBillingBridge`; normalize products for
   the shared paywall and use Google-specific purchase disclosures/manage-subscription link.
   Query purchases on resume and restore. Pending purchases grant nothing.
8. Implement `GoogleVerifier`: call purchases.subscriptionsv2.get server-side with the token;
   verify package, allowed product/base plan, account binding, current state/expiry; bind
   tokens uniquely, process linked/replaced tokens, persist entitlement atomically, then
   acknowledge. Handle grace, hold, cancellation through paid term, expiry and revocation.
   Never accept a client assertion of Pro status. Never log purchase tokens.
9. Add authenticated Google RTDN ingress and periodic reconciliation. Notification messages
   trigger an authoritative API refresh; they do not grant access directly.
10. On an Android build machine run `pnpm install`, set `PADDLELOG_APP_ID` and
    `VITE_API_ORIGIN`, run `pnpm native:android`, then open native/android in Android Studio.
    Implement secure Keystore token storage; validate back navigation, keyboard, safe areas,
    photo picker, app suspension, offline recovery and deep links on real devices.
11. Configure release signing/upload key and Play App Signing; generate a signed Android App
    Bundle. Keep signing material out of source. Upload to internal testing first.
12. Add license testers and test both plans, cancellation, failure, pending purchase, restore,
    renewal, grace/hold, expiration, reinstall, account switching and cross-platform entitlement
    sync. Reconcile server state before enabling purchases. Test that data never disappears.
13. Complete store listing, screenshots, privacy policy, data safety, content rating, account
    deletion web/app flows and review credentials. Verify current target SDK and testing
    requirements in your own Play Console before production submission.

Google Play and Apple are separate store releases. A web publication does not publish either
native binary. Both can use one LeewayPB account and entitlement ecosystem.
