# Owner-only test access
Settings → Account → Tester Access (/admin). HTML and API both authenticate server-side and require the existing owner account ID. Email changes never confer admin permissions. POST additionally requires same-origin and the session header. No service-role key is used.

Migration 0007 adds tester_access and tester_access_audit only; it preserves all existing records, identities, subscriptions, and entitlements. Christine's requested test grant is seeded pending verified sign-in, with no expiration. A verified Supabase email allocates this grant to one account only; no libraries or identities are merged. Apple relay emails must be explicitly invited instead if used. The bound account remains stable after email changes.

Grants use source admin_test and key paddlelog_pro. Off revokes only that grant; it does not cancel a paid subscription or force a paid account to Free. Changes are recorded with owner, email, time, and expiration. Tester refresh/reopen fetches current grants. Offline clients may retain an earlier UI snapshot; server writes always recheck current grants.

Private Sites visitor sharing is separate from these app entitlements and cannot currently be managed by the in-app console. Site owner sharing must invite each external viewer. No signup email is sent by the test-grant console. Account deletion removes the entitlement; the invitation stays bound to the deleted ID and requires administrative reissue before another account can claim it.
