-- Owner-requested administrative Pro access for the existing library account.
-- Exact identity binding; never grant by matching an email or to every legacy user.
-- No expiry, charge, subscription or library mutation. Revocation uses revoked_at.
INSERT OR IGNORE INTO entitlement_grants
(id, account_id, key, source, source_ref, starts_at, ends_at, revoked_at, verified_at, metadata)
SELECT 'owner-pro-testing-20261002', a.id, 'paddlelife_pro', 'admin',
'owner-pro-testing-20261002', 1790816400000, NULL, NULL, 1790816400000,
'{"purpose":"Owner-authorized Pro feature testing","billing":"none"}'
FROM leeway_accounts a
WHERE a.id = '00000000-0000-4000-8000-000000000001' AND a.status = 'active'
AND EXISTS (SELECT 1 FROM leeway_identities i WHERE i.account_id=a.id
AND i.issuer='https://eclxqfmuqeavwwafbvhu.supabase.co/auth/v1'
AND i.subject='00000000-0000-4000-8000-000000000001');
