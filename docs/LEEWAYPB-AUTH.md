# One LeewayPB account across products

Recommended provider: **one shared Supabase Auth project**, initially used for identity
only. Keep the existing PaddleLog D1/R2 records until a deliberate migration is justified.
Apple, Google and email are sign-in methods; they are not separate subscription systems.

The intended screen:

**Sign in to LeewayPB**
Use your account across PaddleLog and future LeewayPB apps.

Continue with Apple
Continue with Google
Continue with email

**Already use another LeewayPB app? Use the same sign-in method and account you used there.**
If you used Apple with Hide My Email, choose Continue with Apple again. A matching-looking
email address alone is not proof that two accounts should merge. Offer **Link another
sign-in method** from the signed-in Account screen, with provider reauthentication.

For email, start with a one-time code or magic link. Password sign-in can be added if
wanted. Native email-link callbacks and expiration/retry behavior must be tested.

## What Ben needs to do

1. Create a Supabase organization for LeewayPB and one project, for example `leewaypb-auth`.
   Use an account/organization you own. Do not make a new Auth project for each future app.
2. Share the project URL/reference and publishable key (public configuration). Configure
   trusted redirect URLs per Web/native application; avoid production wildcard redirects.
3. Enable Apple using your Apple Developer team. Configure the registered App ID and
   required Sign in with Apple Services ID, return URLs, key and domain association.
   Add future apps to the intended Apple identity grouping as appropriate, and test that
   they resolve to the same account. Store private keys only in provider/server settings.
4. Enable Google: create an OAuth consent screen and credentials in your Google Cloud
   project, add Supabase's exact callback, and create required native iOS client settings
   for the registered bundle ID. Test authorized domains and account selection.
5. Enable email sign-in and configure production SMTP, sender/domain verification, email
   templates and delivery limits. Decide between code/magic link and optional passwords.
6. Provide the verified app/API domains and approved iOS callback/universal-link scheme.
   A branded auth domain can make the cross-app relationship clearer; domain ownership
   and DNS setup are external tasks, not identifiers to guess in code.

## Integration work after project configuration

- Use official provider SDK flows, native Apple/Google or an external browser + PKCE.
- Validate JWT signature, issuer, audience and expiry server-side with the provider's
  published signing keys. Do not trust the client UUID or a decoded token alone.
- Map verified issuer + subject to a stable internal LeewayPB account UUID. Entitlements
  and PaddleLog data attach to that UUID. Never use email as a record ownership key.
- Link this existing private owner account while both identities are authenticated; keep
  its UUID so paddle data, scoped drafts and appAccountToken remain consistent.
- Use iOS Keychain for refresh tokens; no service-role key or private token in the app.
- Add secure sign-out, token refresh/revocation, account deletion and provider token
  revocation as applicable. Keep unfinished drafts scoped to the original account.
- Handle Apple private-relay aliases and deliberate identity linking. Explain duplicate
  account conflicts and provide a verified support flow instead of auto-moving paid access.
- Test the same account across two test clients before adding another LeewayPB product.

The current private Web deployment continues to use ChatGPT sign-in. Apple/Google/email
buttons are not displayed as working until this real provider configuration exists.
Supabase account creation, paid-plan selection, domains and Apple/Google credentials
have not been invented or provisioned. Check current provider pricing for the expected
user count; this recommendation does not assume authentication will remain cost-free.

References:
https://supabase.com/docs/guides/auth
https://supabase.com/docs/guides/auth/social-login/auth-apple
https://supabase.com/docs/guides/auth/social-login/auth-google
https://supabase.com/docs/guides/auth/auth-identity-linking
https://supabase.com/docs/guides/auth/redirect-urls

## Implemented September 30, 2026 — activation still blocked

- `lib/server/external-identity.ts` uses the official Supabase SDK `getUser(token)` on
  the trusted configured HTTPS provider, rather than decoding a client JWT. Rejects
  missing/invalid/anonymous identities. Verification outages fail closed.
- `LEEWAY_AUTH_MODE=sites` (or unset) preserves this private site's existing sign-in.
  `LEEWAY_AUTH_MODE=supabase` requires a verified Bearer token on every account API;
  it never falls back to Sites headers. Use only on an independently protected public
  app API after CORS, provider deletion/revocation and rate limits are completed.
- Migration 0003 adds `leeway_identities` (issuer + subject → stable internal UUID).
  No existing account, library, draft key or grant is moved. No email-based merging.
- POST `/api/auth/link` is an owner-migration boundary requiring an authenticated Sites
  session AND a verified new-provider Bearer token, plus explicit link confirmation.
  Conflicts fail without moving data. GET `/api/auth/account` returns the internal UUID.
  The linking screen still needs wiring after the real provider is available.
- `native/leeway-auth.ts` provides Apple/Google PKCE, email link/code, refresh lifecycle,
  exact callback matching and internal account lookup. SecureTokenStore and the system
  browser are mandatory injected adapters. There is no browser storage fallback.
  It is not wired into the distributed native bootstrap until real OS secure storage,
  app links, provider configuration, sign-in UI and deletion flow are tested.
- Local SDK/SQLite tests cover provider verification rejection, account isolation,
  dual-identity linking, conflicts and PKCE. They do not prove real Apple/Google login.

### First information needed from Ben

Create one Supabase Auth project owned by LeewayPB; provide its HTTPS project URL and
publishable key. Those are public settings. Keep service-role/admin keys and Apple .p8
keys out of chat and client code. Then configure Google, Apple and verified email SMTP
in the provider dashboard. We still need the intended API domain and registered native
bundle/package IDs before generating production callback configuration.

Do not switch this owner-private Sites deployment to public just to make native sign-in
work. Its outer ChatGPT access gate remains; native API and store webhook ingress need
an explicit hosting/domain decision. Supabase account deletion/revocation must be added
before activating shared login: deleting PaddleLog data alone does not delete an identity
that may also belong to other LeewayPB products.
