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
