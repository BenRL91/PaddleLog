# Native verification — 2026-10-29

Source baseline: deployed PaddleLog v228, source commit `17793fadf07491f19788b25f899ebab23ac33fb6`; GitHub sanitized sync baseline `423ac8352b5fe3e0163ce01396e775a0d1cbfd69`.

- Eight focused client/domain tests pass: secure token persistence and replacement failure; account-scoped storage; bearer-only transport and refresh; revision conflicts and minimal patches; pause/resume/switch timing; supply allocation and erroneous maintenance removal; independent paddle ratings and manual-game usage isolation; lost-acknowledgment recovery after server normalization.
- Strict TypeScript check passes.
- Expo SDK compatibility check passes with TypeScript 6.0.3 and SDK 57's supported React/React Native versions.
- iOS and Android Hermes JavaScript bundles export successfully.
- Native dependency resolution retains the seven-day release-age policy. No policy exemptions were added.
- The web runtime, authentication settings, payments, database schema, production records, integration origins and production deployment were not changed.

Not verified: signed native compilation, simulator/device interactions, production sign-in and callback admission, camera access, offline cold start, accessibility on devices, store billing, TestFlight/Play distribution. No end-to-end production account mutation was performed.

This is a reviewed starting implementation, not a feature-complete replacement or store-ready app. See README.md for the explicit parity backlog. Existing web snapshot test/lint failures are not fixed or disabled by this PR.
