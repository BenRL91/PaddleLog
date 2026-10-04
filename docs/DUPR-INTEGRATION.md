# DUPR integration status

Prepared October 2, 2026. Real linking and synchronization are NOT enabled.

Official partner specification reviewed:
https://uat.mydupr.com/api/v3/api-docs/DUPR%20Partner%20APIs

Confirmed API: POST /auth/v1.0/token using server-only x-authorization base64(ClientKey:ClientSecret); result.token and result.expiry. GET /user/v1.0/{id} requires USER::DETAIL and returns the user's DUPR ID, singles/doubles ratings and provisional flags. Official documentation advertises rating-change subscriptions/webhooks. The observed spec lists a UAT server. Production URL, permissions, SSO flow and webhook authentication must be confirmed with DUPR before activation. No undocumented login, scraping, password collection, email matching or arbitrary ID ownership claims.

Implemented server-only adapter: bounded requests, no redirects, token expiry/cache, response validation, verified-link prerequisite, identity mismatch rejection and errors that omit upstream bodies/credentials. This is not wired to a public endpoint because verified SSO linking is unavailable. The adapter accepts a server-selected API base; allowed host names are a restriction, not confirmation of a working production endpoint.

Implemented analytics contracts: separate singles/doubles observations, NR as null, provisional flags, observation timestamps, historical selection without applying current ratings to earlier sessions, 30-day freshness, default-deny commercial rights + purpose-specific consent, minimum 20 distinct players and exclusion of provisional/unknown confidence. Twenty is an initial engineering threshold, not a guarantee against reidentification. No analytics data is transmitted or sold.

Next actions for Ben:
1. Request DUPR partner API access for PaddleLog by LeewayPB (web, iOS, Android), read-only player ratings and user-authorized profile linking. Official support contact: contact@example.invalid; request routing to API partnerships.
2. Describe separately the proposed commercial aggregate paddle/manufacturer analytics use. Request written scope for storing rating history, linking to equipment/session data, retention, derived reports, aggregation, redistribution, attribution and deletion/disconnection obligations.
3. Obtain sandbox and production credentials through secure configuration, not chat; confirm official SSO authorization/code exchange documentation, callback rules, scopes and stable verified player identifier.
4. Obtain webhook authenticity/replay verification documentation, delivery ordering, rate limits, historical rating availability and reliability score definitions.

Proposed web callback to register after DUPR confirms the flow:
https://paddlelog.leewaypb.com/api/integrations/dupr/callback
This route is RESERVED, not implemented or live. Native linking will start in the system browser; choose an approved universal/app-link return strategy after partner flow review. Do not invent iOS/Android client identifiers.

Then implement server-owned connection and immutable rating-history persistence, account-bound single-use state, callback cancellation/error handling, secure credentials, unlink/revocation, account deletion/export, and current-profile sync. Validate against sandbox before enabling Connect DUPR. Never expose partner credentials, client-credential token, or arbitrary lookup endpoints.

Analytics next phase: add session discipline (singles/doubles/mixed/training/unknown); link observed ratings as of the session and version the physical configuration/model taxonomy at the time of usage. Separate logged from estimated time, ownership from actual play, manufacturer specs from user measurements and PaddleLog Verified Specs. No historical backfill using today's rating. Keep raw account-level rows private, implement withdrawal/retention and versioned consent before any manufacturer report. Reports require sampling/bias disclosures and small-cell/differencing review. No fabricated population averages while awaiting real data.
