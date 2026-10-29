# Native integration status

This is a shared-client shell preparation, not a signed or functional App Store build.
The existing HTML, styles and modules are copied by `node native/prepare.mjs`. Production
Web uses shared LeewayPB Supabase identity and HttpOnly session cookies, with the
current owner-only Sites hosting gate outside the application. Native must use a configured external-browser OIDC
PKCE sign-in flow and a server JWT verifier; do not spoof Sites identity headers or ship
cookies/refresh tokens in JavaScript/localStorage. Store refresh tokens in iOS Keychain.
The bootstrap intentionally blocks launch until the auth adapter and HTTPS API origin exist.
Photos currently use cookie-authenticated URLs: implement authenticated blob downloads/object
URLs in the native transport before enabling the shell. Native sign-out/deletion must call
AuthAdapter instead of the Web sign-out redirect. These are launch blockers, not optional polish.

On a Mac after choosing the real bundle identifier:
1. Run `pnpm install --frozen-lockfile` at the repository root. Capacitor 8.5.2 and the
   native plugins are installed and pinned in pnpm-lock.yaml.
2. Configure OIDC issuer/client, callback/universal link, Keychain adapter and API CORS allowlist.
3. Set `PADDLELOG_APP_ID` to the registered bundle ID, `VITE_API_ORIGIN` to the authenticated API.
4. Run `pnpm native:build` at the root, then `cd native`, `pnpm exec cap add ios`,
   and `pnpm exec cap sync ios`. Commit the generated iOS project after identifiers are final.
5. Register a Capacitor plugin for StoreKitBoundary.swift; connect the shared PurchaseProvider.
6. Subscribe to Transaction.updates, forward signed transactions to the verifier, finish only
   after server acknowledgment. Add pending, cancelled, restore and subscription-management UI.
7. Add only used Camera/Photo Library purpose strings. Audit plugin privacy manifests and
   required-reason APIs (Preferences/UserDefaults included). Do not add push permissions until
   APNs, opt-in purpose and notification flows are implemented.
8. `npx cap open ios`; configure signing, build and test using the release checklist.

Never ship remote server.url, placeholder products, a client-only entitlement grant or the
unconfigured bootstrap. App Store credentials are not needed for Web deployment.


## October 2 release preparation

Run `node scripts/release-preflight.mjs ios` or `android` from the repository root
with securely configured environment values. It outputs only ready/blocked gate
names, never configuration values or private keys. Verification flags are evidence
of completed human/device checks, not a substitute for those checks or store review.

The server now supports opt-in native CORS with exact origins and bearer tokens:
`LEEWAY_NATIVE_ORIGINS_JSON=["capacitor://localhost","https://localhost"]` for the
intended default iOS/Android shells. Verify actual generated shell origins before
enabling this. Cookie credentials and wildcard origins are never allowed. The
private outer hosting gate still prevents native/public access; CORS is not a bypass.
See docs/PUBLIC-NATIVE-LAUNCH.md for the full externally blocked launch sequence.

## Planned Watch workouts and Pickle Point connection (October 5)

Requested experience: starting PaddleLog play on iPhone can launch its paired Watch
companion, which runs a HealthKit workout. Watch controls start/pause/resume/end and
selects the current physical paddle. This is planned, not implemented or enabled.
A native watchOS companion, HealthKit permissions/entitlements, an iPhone bridge,
and physical paired-device testing are required after the native launch blockers.

Use one authoritative play-session identifier and timestamped paddle segments.
Persist command identifiers and acknowledgments so retries/reconnection cannot
create a duplicate session/workout. Paused workout time needs an explicit policy
for paddle usage; do not silently count it as play. Keep the Watch functional when
phone connectivity drops, then reconcile device events and session ownership.
Paddle switches should receive haptic/visual acknowledgment before being treated
as confirmed. Cache the permitted active-paddle list for offline controls.

For a future Pickle Point connection, link its game/match records to the play-session
identifier without copying all account data or running a second workout. One app
owns the workout; each app owns its domain records. Workout mirroring connects
paired companion apps and does not automatically synchronize separate app products.
Cross-app linking needs an explicit authenticated contract, opt-in and duplicate
prevention. Health permission and session synchronization remain separate concerns;
do not upload health samples merely because a workout is linked.

Apple references:
- https://developer.apple.com/documentation/healthkit/building-a-multidevice-workout-app
- https://developer.apple.com/documentation/healthkit/hkhealthstore/startwatchapp(with:completion:)

Suggested sequence: native auth/build readiness → Watch workout and session controls
→ paddle-switch recovery/device tests → Pickle Point linking. No deadline is committed.
