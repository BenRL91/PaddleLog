# Pickle Point LeewayPB sign-in handoff

Prepared from PaddleLog v149. Work only in Pickle Point to implement sign-in; these are reference copies, not a new auth service. Do not modify shared Supabase settings, PaddleLog accounts or payments.

## Verified public configuration

Read from PaddleLog's deployed runtime configuration on 2026-10-06:

```env
SUPABASE_URL=https://eclxqfmuqeavwwafbvhu.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_6H_qFkKSN0kqyk67AWaXyQ_UMHipUEd
LEEWAY_WEB_ORIGIN=https://pickle-point.leeohsunshine.chatgpt.site
LEEWAY_AUTH_MODE=supabase
```

The URL and publishable key are public client configuration, not identity credentials. This package contains no user access tokens, refresh tokens or service-role keys. Use the installed PaddleLog SDK version `@supabase/supabase-js@2.117.1` as the compatibility baseline and commit Pickle Point's lockfile.

## Existing code supplied

- `source/web/auth.ts`: browser entry, email OTP, Google/Apple PKCE, callback exchange and verified-user confirmation.
- `source/web/auth-controller.js`: testable login/exchange/controller; `signIn()` hands refresh credentials to a same-origin backend and clears page memory.
- `source/web/auth-storage.js`: PKCE verifier persisted for up to one hour, token storage only in page memory. Same-origin new tabs can complete an email link; other browsers/devices cannot share the verifier.
- `source/web/login-session.js`: existing cookie-session recovery.
- `source/server/web-session.ts`: actual token refresh implementation and Secure, HttpOnly, SameSite=Lax host cookies, plus same-origin mutation check.
- `source/server/session-route.ts`: PaddleLog-specific route reference. Adapt its app account/admission resolution; do not import PaddleLog's identity-map or beta admission as Pickle Point's account system.
- `source/server/config-route.ts`: public config and provider capability lookup reference.
- `source/server/callback-route.ts` and `source/account.html`: callback/login shell reference. The HTML references `/leeway-auth.js`; PaddleLog builds this with Vite from `web/auth.ts`. Bundle these source modules in Pickle Point using its existing build.

PaddleLog linking branches are legacy PaddleLog-only behavior. Pickle Point should use the standalone `mode:'supabase'` flow, omit linking controls/requests, and adapt the PaddleLog UI copy/DOM to Pickle Point. Never call PaddleLog `/api/auth/session` from Pickle Point. Cookie names are host-only: they do not share tokens across these two origins. Signing into PaddleLog does not automatically give Pickle Point a browser session.

## Callback setup

Implement same-origin login at `/leeway-account` and callback at:

`https://pickle-point.leeohsunshine.chatgpt.site/auth/return`

The callback must load the same browser entry and PKCE storage on the **Pickle Point** origin, capture `?code=...`, then exchange with `client.auth.exchangeCodeForSession(code)`. Process query and fragment provider errors safely, clear sensitive URL parameters, and send `Cache-Control: no-store` and `Referrer-Policy: no-referrer`. Do not log callback URLs/codes. Avoid an unrelated redirect that loses the code before the browser entry reads it. Preserve the same canonical origin from initiation through callback; start OAuth in a top-level browser page.

A shared Supabase administrator must verify that the exact callback above is in Authentication → URL Configuration → Redirect URLs. If missing, it requires a separately authorized addition. **This handoff does not change or verify that shared allowlist.** Do not change the shared Site URL, other callbacks, providers, SMTP, templates, client credentials or anonymous sign-in configuration. Explicit `redirectTo`/`emailRedirectTo` is required so the shared default does not send users to another app. Email templates must honor the configured redirect; test the existing template without changing it. Google/Apple provider callback remains `https://eclxqfmuqeavwwafbvhu.supabase.co/auth/v1/callback`; do not replace it with the app callback.

Provider buttons should follow `/auth/v1/settings` public capabilities; configured availability does not prove each provider's end-to-end sign-in works. Email-code verification uses `type:'email'`. Existing shared users should sign in with their established provider; do not merge identities by email in app code or authorize from client-supplied IDs.

## Recommended token-refresh and integration topology

Reuse PaddleLog's existing cookie/backend pattern. The browser exchanges PKCE/OTP, POSTs the refresh token once to Pickle Point's own same-origin session route, then clears page memory. Pickle Point's backend uses `refreshWebSession`, verifies identity, writes rotated access/refresh cookies, and resolves its own account from the verified issuer + subject. Require exact same-origin Origin plus the `x-leeway-session:1` header on mutations. Never send these cookies to PaddleLog.

For PaddleLog calls, a Pickle Point same-origin backend relay should read its own session, renew near expiry/after an expired-token 401 under a per-session refresh lock, persist **both** rotated tokens, and send only `Authorization: Bearer <current user access token>` to PaddleLog. Preserve source IDs/revisions and exact payload bytes on retries. Retry once after refresh; do not keep retrying authorization/admission failures. Keep tokens out of logs, URLs, exports, error bodies and outbox records. Do not use service-role keys. If the relay cannot persist rotated credentials, do not continue with stale credentials.

A direct browser integration is also allowed at the exact origin below, but PaddleLog's HttpOnly cookie implementation cannot supply browser-readable bearer tokens. If choosing an SDK-owned browser session, explicitly implement/approve that different storage model in Pickle Point, enable SDK refresh, use `getSession()` for current token retrieval, subscribe to sign-out/refresh changes, and keep one client/refresh owner. Never treat a cached session user object as server authorization. Do not copy the memory-only PKCE storage and assume it persists a browser session after reload.

## PaddleLog access enabled

PaddleLog `PADDLELOG_PICKLEPOINT_ORIGINS_JSON` now includes:

`https://pickle-point.leeohsunshine.chatgpt.site`

No previous entries were present; no unrelated runtime keys or shared authentication settings were changed. CORS permits only the integration routes, bearer authorization/content-type/if-none-match, and route-specific GET or POST. Cross-origin cookies are not supported. CORS is not authentication or beta admission: every user still needs a valid shared identity and admitted PaddleLog account.

See included `API-INTEGRATION-V1.md` and schema for the full endpoints and payloads. `GET https://paddlelog.leewaypb.com/api/integrations/pickle-point/paddles` reads the authenticated user's stable physical IDs. `POST .../sessions` delivers completed recorded-usage intervals in the versioned integration envelope. Invalid/foreign paddle IDs are rejected. Legacy file import remains available. Do not send unmeasured elapsed time as paddle usage.

## Acceptance checks for Pickle Point

1. Email code and link (same browser/new tab), callback error/cancel, Google and Apple if enabled.
2. Reload recovers own cookie session; expiration rotates both tokens; refresh concurrency is serialized; sign-out clears app session and scoped cached library.
3. No-token and another-user library access rejected; beta admission denial distinct from sign-in failure.
4. Browser preflight from exact origin succeeds; unrelated origin fails. No bearer/session tokens logged or exported.
5. Owned physical paddle selection, same-revision retry, newer revision 60→30/30 reconciliation, invalid paddle rejection, legacy file fallback.
6. No shared auth/payment/other-app edits; no synthetic test sessions inserted into production history.

Reference documentation: https://supabase.com/docs/guides/auth/redirect-urls ; https://supabase.com/docs/reference/javascript/auth-getsession .
