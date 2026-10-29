# Invite-only beta cutover — October 5, 2026

## Admission and account safety

PaddleLog uses existing Supabase verified identities and D1 account mappings. The fixed owner UUID is exempt from beta admission, preserving owner recovery. Every private library/photo/export/backup/health/entitlement/owner API runs the shared account guard; in Supabase mode it now requires an admitted beta account. No metadata claim, caller email, client account ID or paid grant grants admission.

Migration 0008 adds independent `admitted` flags to existing tester records and audit entries. The constant default preserves admission for existing tester records. Complimentary Pro enabled/expiration settings retain their existing meaning. No dataset backfill, identity merge or library transfer occurs.

A pending invitation binds atomically to the first authenticated account with that provider-verified email, even for Free testers. A bound invitation does not follow email changes or email reuse. Blocking admission stops private API access without deleting saved data; restoring it returns the same records. Older owner clients that omit admission can change Pro without unblocking admission. Owner controls remain server-authorized and same-origin confirmed. Audit captures both settings.

Web session establishment/renewal checks admission before issuing session cookies. A denial clears app session cookies and lets the sign-in page offer another account. Every data request also checks current admission, including existing-cookie and native-bearer requests. Requests that encounter provider/storage outages fail closed. Revoked users still retain authenticated account-deletion capability through the existing deletion endpoint; this exception cannot read a library.

The shared Supabase project, sign-in providers, payment configuration, and other LeewayPB apps are unchanged. Creating a Supabase identity does not itself grant PaddleLog beta admission. No invitation emails are sent by the portal. Production synthetic fixtures are not inserted.

## Owner operation

Open Settings → Account → Beta management (or /admin after signing in).
Add verified sign-in emails; set Beta access Allowed or Blocked separately from complimentary Pro. Share https://paddlelog.leewaypb.com directly. Apple Hide My Email requires the verified relay email. Admission does not expire when complimentary Pro expires. To withdraw beta access, set Beta access Blocked.

## Hosting cutover

Publish account-gated code and schema with the existing custom audience first. Then change Sites audience to public: the public shell/sign-in page has no private records, and the application admission policy protects private APIs. Keep audience restoration to custom available as an emergency outer-gate rollback; leave account mappings and saved data intact.

Live read-only checks before cutover: owner linked to fixed existing UUID, current Supabase mode, external settings HTTP 200, email/Google/Apple enabled, anonymous disabled. The existing provider configuration is not a completed user sign-in test. No credentials or live authentication tokens were captured. Email delivery/SMTP and completed OAuth/physical second-device checks remain tester actions. Supabase default SMTP restricts recipients to project-team addresses unless custom SMTP is configured; Google offers an independent configured sign-in path. No shared SMTP changes are made here.

## Pricing during beta

Prices, billing-period choices, purchase/restore controls and Apple renewal copy are hidden while purchasing is disabled. Pro badges explain feature access and direct testers to request complimentary Pro. Paid plans remain undecided. Internal tentative product configuration is retained for compatibility and is not displayed or activated.

## Validation

Real SQLite admission checks across private endpoints; owner original UUID/library preservation; invited Free; unverified email; email reuse; revocation/reactivation; independent Pro; old-owner-client behavior; concurrent first claims; portal controls/audit; SDK cookie refresh and denial; provider verification; CSRF; account isolation; native auth; existing backend/import tests; pricing-free Pro UI and disabled purchase path. Fixtures are synthetic and local. Physical sign-in and email delivery are not claimed.
