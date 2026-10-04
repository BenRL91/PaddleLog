# Shared LeewayPB connection — September 30, 2026

## Applied

Only the existing Supabase project `eclxqfmuqeavwwafbvhu` is used. Runtime configuration
contains its public URL/publishable key. LEEWAY_AUTH_MODE remains `sites`, preserving the
private outer ChatGPT sign-in and current D1/R2 records. No database migration to Supabase.

A read-only live GET to `/auth/v1/settings` returned HTTP 200 with email enabled,
anonymous disabled, and Google/Apple disabled. No verification email was sent and no
real Supabase user was created by the agent. Real user sign-in/link completion is still
untested until the owner completes the flow.

Settings > Account opens `/leeway-account`. Email OTP, PKCE callback, provider buttons
conditioned on real settings, verified-account confirmation, and explicit linking are
implemented. The server checks both identities and the expected current PaddleLog UUID;
conflicts never transfer records or grants. Page-memory-only web tokens, tab-scoped PKCE
verifier, URL cleanup, no-referrer responses, and no-store configuration are used.

## Supabase URL Configuration — set now

Site URL:
https://paddle-log-ben.leeohsunshine.chatgpt.site

Redirect URL:
https://paddle-log-ben.leeohsunshine.chatgpt.site/auth/return

Optional local development redirect (only if running locally on port 3000):
http://localhost:3000/auth/return

Local `.env` uses http://localhost:3000 as LEEWAY_WEB_ORIGIN; production uses the private
site origin. Local Sites authentication still requires the supported local identity setup.
Do not add broad wildcard redirects. The Sites-owned `/callback` route is not used.

## Email templates and testing

Under Authentication > Email Templates, include `{{ .Token }}` in the Magic Link email
(and Confirm signup if that template is used by the configured flow). Preserve any
existing confirmation link. Example text: "Your LeewayPB sign-in code: {{ .Token }}".
The app accepts a code from the email; this avoids cross-tab/browser PKCE problems.
No passwords or privileged secrets are required. A sign-in email is sent only when the
user clicks Send sign-in email. Default Supabase email delivery may restrict recipients;
configure production SMTP and verify its sender before broader testing.

Then open /leeway-account, request an email, enter the code, check the displayed identity,
and explicitly click Link this account to my PaddleLog library. Paddles and account UUID
must remain unchanged. Try an existing shared LeewayPB identity first if one exists.

## Domain and native proposal — not registered or applied

Owner reports purchase of leewaypb.com. Proposed app host: paddlelog.leewaypb.com.
Eventual Site URL: https://paddlelog.leewaypb.com once HTTPS hosting/DNS are live.
Eventual web callback: https://paddlelog.leewaypb.com/auth/return.
Proposed iOS bundle and Android package ID: com.leewaypb.paddlelog.
Prefer associated HTTPS links for native callbacks:
- iOS: https://paddlelog.leewaypb.com/auth/ios
- Android: https://paddlelog.leewaypb.com/auth/android
These are proposals, not implemented routes. Require native callback allowlists, Apple
Team ID + AASA, Android signing fingerprint + assetlinks.json, OS secure storage and a
public authenticated API. Do not add them to Supabase yet. Existing paddlelog://auth/return
is a development proposal only; no arbitrary app identifier was registered this turn.

## Provider dashboard configuration still required

Google: OAuth consent/branding and a Web OAuth client. Authorized redirect:
https://eclxqfmuqeavwwafbvhu.supabase.co/auth/v1/callback
Enter its client ID and secret directly in Supabase. Configure native clients only after
registered bundle/package/signing details and the selected native flow are finalized.

Apple: Developer membership, registered App ID + Sign in with Apple, Services ID for web,
allowed domain eclxqfmuqeavwwafbvhu.supabase.co, return URL identical to the Google callback
above, Team ID/Key ID and .p8 key entered directly in Supabase. Review identity grouping
across future apps and key rotation. Credentials are not requested in chat.

PaddleLog does not merge accounts by email. Supabase itself documents automatic linking
of provider identities with the same verified email. Manual linking being enabled does
not mean automatic linking is disabled. Review that provider behavior before enabling
OAuth if strict explicit-only provider linking is a business requirement.

## Tested

Automated SDK/controller/SQLite tests: invalid and anonymous identity rejection,
provider-separated keys, duplicate identity idempotence, preserved owner UUID/library,
conflicting account rejection, explicit link confirmation, changed-account/cross-site
rejection, code failure/retry, callback exchange, disabled providers and duplicate taps.
Full regression suite, TypeScript, native and production builds. No real email receipt,
real OAuth login, native app callback, or iPhone browser QA is claimed.

Sources checked:
https://supabase.com/docs/guides/auth/auth-email-passwordless
https://supabase.com/docs/guides/auth/auth-identity-linking
https://supabase.com/docs/guides/auth/social-login/auth-google
https://supabase.com/docs/guides/auth/social-login/auth-apple

## PKCE cross-tab fix — September 30 evening

Root cause: the web adapter persisted the PKCE verifier in sessionStorage, which is
isolated per tab. Email clients commonly open a new tab, leaving exchangeCodeForSession
without its proof. The adapter now stores only the verifier in account-scoped localStorage
with a one-hour expiry, and removes it when the SDK consumes it. Access/refresh tokens
remain in page memory. Legacy original-tab requests can migrate their verifier. Different
browsers/devices still cannot share the proof; the UI explains fresh-email or OTP recovery.
Only the latest requested link should be used. No SSR session/cookie architecture is
introduced: this is a client-only identity linking flow under the existing Sites session.

Regression test uses two actual Supabase SDK clients with separate session memory and
shared verifier storage against a simulated provider exchange; no real email was sent.

## Full web sign-in (October 2026)

`LEEWAY_AUTH_MODE=supabase` now supports browser sign-in independently of the application’s former Sites identity. `/api/auth/config` exposes only public provider configuration in this mode. After OTP or OAuth verification, the browser submits the refresh proof to the same-origin session endpoint. The server exchanges it with the configured Supabase project and stores access/refresh tokens in Secure, HttpOnly, SameSite=Lax, host-only cookies. Tokens never enter localStorage. The existing issuer/subject mapping selects the original internal account UUID; no email matching or paddle migration occurs.

`public/web-entry.js` renews sessions before loading data, on resume, and after an API 401. A failed renewal leaves drafts intact. Every data request carries its original account binding so a tab cannot silently write to another account after a sign-in change. Sign-out clears both cookies and notifies other tabs. History restoration reloads authentication. Local drafts remain scoped to the existing internal account ID. Native bootstrap remains separate.

No new tables or data migrations. Rollback: set `LEEWAY_AUTH_MODE=sites` and redeploy; the original library/identity mapping remains intact. Production still has the owner-only Sites access gate. A second device must pass that gate as the owner and then sign in to the same LeewayPB identity. General customer access requires a deliberate hosting audience change after multi-user live QA; this release does not change sharing.

Tests: existing full suite, real SDK refresh with mocked provider, cookie flags, rotation/restart, explicit signout, CSRF denial, anonymous rejection, outage preservation, existing-library selection, expired-request retry in a DOM harness, and stale-tab account rejection. Live Google/email and physical second-device checks require the owner’s interactive sign-in. No Apple or payment activation is included.

## Custom domain cutover

Production web origin is https://paddlelog.leewaypb.com. Its exact Supabase redirect allowlist entry is https://paddlelog.leewaypb.com/auth/return (owner confirmed added). Keep the old ChatGPT-site callback while old flows finish. New sign-ins from the old hostname move to the configured origin before generating PKCE proof. Already-issued callbacks finish on their original origin. Google’s provider callback remains the existing Supabase /auth/v1/callback URL.

Cookies and unfinished local drafts are hostname-specific; saved cloud records retain the same account mapping. No local draft is deleted or silently transferred. Finish outstanding drafts on the old hostname before moving. Set Supabase Site URL to the new HTTPS origin as a dashboard follow-up. Owner-only hosting audience is unchanged.

## Connected sign-in methods

Settings → Account → Manage sign-in methods opens `/account`. The authenticated `/api/auth/methods` endpoint reads the current Supabase user's identities; no client-supplied email determines identity. Available Google/Apple methods are linked with the official SDK `linkIdentity`, explicit confirmation, current application account binding, and PKCE proof stored in a short-lived HttpOnly host-only cookie. The callback verifies the original subject and the returned subject are the same and that the requested provider is present before accepting the new session. It never merges application libraries. Existing connected methods cannot be linked again. Unlinking and email-address changes are deliberately outside this addition to avoid accidentally removing a user's only working method.

Cancellation clears the pending proof. Signing out also clears it. Expired requests and conflicting identities show a recoverable error. Apple stays unavailable until its provider configuration is enabled. Supabase's own automatic identity-linking policy still applies to provider authentication; application code never merges records based on email.

Validation includes actual SDK PKCE linking against mocked provider responses, same-subject completion, changed-account rejection before code exchange, provider error, existing method, malformed/expired proof, and DOM tests for method display, confirmation cancellation, and disabled Apple. Live addition of a not-yet-linked provider still requires the user's interactive OAuth consent; Apple cannot be tested until configured.

Google OAuth requests now include `prompt=select_account` for web/native sign-in and explicit identity linking. This asks Google to display account choice instead of silently reusing its session. Apple options and application account ownership are unchanged. Regression checks cover the outgoing Google parameter, PKCE, linking subject verification and provider isolation.
