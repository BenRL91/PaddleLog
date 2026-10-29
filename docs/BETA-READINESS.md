# Beta readiness — October 5, 2026

## Published changes

Home offers a collapsed first-session guide after paddle setup, while there are no recorded sessions or active timer. It explains pause/switch/finish, past sessions, and Pickle Point imports without starting a timer automatically. The owner beta portal includes a tester setup/checklist. No invitations are sent by this feature.

Settings → Feedback & support includes an editable current screen, description, optional reproduction steps, and a current release identifier. The user reviews and sends an email draft; copying a report supports testers without configured email handlers. Clipboard denial reveals a selectable report. No account IDs or library contents are attached. This is not a server-side feedback inbox.

## Removing the ChatGPT requirement

Current native Sites inspection confirms custom audience with owner and an external visitor, and the hosted non-secret LEEWAY_AUTH_MODE is supabase. Application account authentication already uses LeewayPB/Supabase; the Sites custom audience is an additional outer gate.

A cutover must preserve existing internal account UUIDs, library records, grants, and linked issuer/subject identities. No automatic email-based account merge. Existing testers using only a Sites identity must link their LeewayPB identity before switching.

1. Decide whether beta is invite-only or open registration. tester_access currently grants complimentary Pro; it is not a beta admission allowlist. Turning Pro off must not revoke admission.
2. For invite-only beta, add a separate account admission policy checked on all private data/photo/backup/export APIs and owner routes. Keep paid status and admission independent. Include owner escape/recovery and verified-email pending invitations that bind once.
3. Verify a fresh tester, owner, and existing linked tester can sign in and see only their own records; confirm uninvited/anonymous requests cannot read/write private data. Test signout, expiration, callbacks and multiple devices.
4. Verify configured sign-in providers and production email delivery; Apple availability is separate from removing the ChatGPT gate.
5. Deliberately change the hosting audience from custom to public after the admission/security checks pass. Public hosting allows reaching the sign-in page; private APIs remain account-gated. Preserve authentication configuration and data storage.
6. Verify a visitor without a ChatGPT account can complete the flow. Rollback the outer audience if needed without deleting identities or data.

No audience, auth, infrastructure, or payment changes were made in this release. No production tester/session data was inserted.

## Validation

Automated onboarding, feedback clipboard/email, collection cap, Pro action UI, grants, development Free/Pro, tester access and backend checks. Physical device/email delivery checks remain interactive QA.

## Implemented cutover follow-up

See BETA-ACCESS-CUTOVER.md for the implemented independent admission policy, private endpoint tests and public hosting cutover. Earlier steps above describe the prior v145 state.
