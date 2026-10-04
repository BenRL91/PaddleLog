# Before taking payments — October 3, 2026

This is the current implementation checkpoint. It supersedes conflicting older release
notes. Purchases remain disabled; hosting remains owner-only. No store products,
permanent bundle IDs, credentials, or public audience were configured in this change.

## Completed

- Free authenticated personal backup export. Pro expiry cannot prevent downloading it.
- Optional photo-inclusive JSON, with one copy per unique referenced image. Includes
  paddle, session/before/after, and retained legacy setup images without restoring the
  removed Tuning Lab feature. Existing records-only JSON remains accepted.
- Full metadata/reference/photo-hash validation before uploads. Restore requires explicit
  replacement confirmation. Uploaded images receive new destination-account IDs; records
  are saved only after uploads complete, using existing revision checks and recovery.
- Failed downloads produce no incomplete export; failed uploads leave existing library
  records untouched. Failed permanent saves retain the ordinary pending-save recovery.
- Pro benefit list derives from delivered feature flags. Backup is Free; comparisons,
  usage/lifecycle insights, measurement trends, consumable history analysis, and unlimited
  active paddles remain Pro. No unsupported native or Competition Check claim was added.
- Canonical entitlement: paddlelog_pro. Existing paddlelife_pro grants remain accepted
  with the same expiration/revocation behavior. No grant rows or user records migrated.
  leeway_all_access still grants this app's Pro, while coach_pro does not.
- Proposed Apple products: paddlelog.pro.monthly and paddlelog.pro.annual. Targets remain
  $1.99/month and $14.99/year. These are not registered Apple products. If any earlier
  proposed product was created externally, reconcile it before activating billing.
- Release preflight now includes explicit evidence gates for device backup/restore,
  mobile QA, monitoring/recovery, and approval-snapshot review. No gate marked passed
  merely because a local test or build passed.

## Limits and follow-ups

- Portable files: 32 MiB maximum; combined image bytes 20 MiB; each image 6 MiB.
  Records retain the current approximately 2 MB library limit. Large-library streaming
  archives and pagination remain backlog. Larger collections can use records-only
  export plus individual photo downloads for now.
- Exports contain confirmed saved records, not unfinished forms or active local timers.
- Free restores still obey the three-active-paddle rule. Existing over-limit libraries
  stay editable/exportable; a restore that newly activates more than the limit is blocked
  before uploading images. This policy must be disclosed, not called unrestricted restore.
- An interrupted image import may leave unattached destination-account uploads. It never
  exposes another account's images. Account deletion purges these; dedicated timed orphan
  cleanup remains operational follow-up. Source file remains reusable for retry.
- On-device Safari file download, Files/photo selection, backgrounding, and memory-pressure
  acceptance remain required. DOM tests are not actual iPhone QA.
- Shared LeewayPB identity deletion and final public legal text remain unfinished. Preview
  wording remains explicit. Do not enable commercial data sharing from broad policy text.

## Approval-data release procedure

1. Retrieve all pages of official USAP and UPA-A approval lists, plus applicable delistings.
   Save actual source/retrieval dates and counts; do not refresh a date without rechecking.
2. Use scripts/refresh-approval-snapshot.mjs candidate.json to stage a count-checked diff.
3. Review additions, removals, conditions, exact variant identities, and catalog links.
   Missing entries remain needs-verification, not automatically unapproved. Preserve
   manually verified model links when reconciling candidate records.
4. Run approval and catalog tests. Apply the reviewed candidate with --apply, and publish.
5. Record release reviewer/date. Review before each release and at least every 30 days
   while badges are offered. No unattended scraping or scheduled update was enabled.
6. Full configuration Competition Check remains deferred. Only confirmed model badges
   are shown; this does not guarantee any individual paddle passes event inspection.

## Remaining gates, in order

1. Confirm managed hosting public-access capability, cost/quotas, monitoring, backups,
   and portability. Verify independent customer sign-in; audience change needs owner
   launch authorization. Nothing in this release makes the private API publicly reachable.
2. Apple enrollment is approved per owner. Confirm/register com.leewaypb.paddlelog or the
   owner's chosen identifier, create app record, and configure shared Sign in with Apple.
   Secure credentials go into provider/server secret settings, never chat or client code.
3. Finish native secure token storage/browser callbacks, authenticated photos, deletion,
   and lifecycle behavior. Compile and sign with Xcode; validate on real devices.
4. Complete paid-app agreements, tax/banking, the two auto-renewable products in one
   PaddleLog Pro subscription group, and public signature-verified server notifications.
5. Test real Sandbox products, purchase/cancel/pending/restore, renewals, grace/expiry,
   refund/revocation, account ownership, and out-of-order notifications. Validate deployed
   cryptographic verification and notification delivery. Add reconciliation/alerts.
6. Finalize privacy, terms/EULA, retention, support, shared identity deletion, store privacy
   disclosures, and reviewer access. Finish TestFlight acceptance before production sales.
7. Android separately needs its Kotlin billing bridge, credential-provider/API wiring,
   RTDN, signing, Play Console products, license testers, and device QA.

## Validation this pass

Automated portable backup, DOM restore, entitlement compatibility, Free export/ownership,
paid feature gating, purchase UI failure states, existing activation, and release gates.
Production/native asset builds do not establish native device or real payment readiness.
