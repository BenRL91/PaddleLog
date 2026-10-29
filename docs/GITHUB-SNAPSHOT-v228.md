# Deployed PaddleLog source snapshot — v228

Recovered on 2026-10-29 from the currently deployed Sites version 228 (deployed 2026-10-18).

- Source commit: `17793fadf07491f19788b25f899ebab23ac33fb6`
- Live application: https://paddlelog.leewaypb.com
- Prior GitHub main: `654246dbc6c5240914bb0930746dc6b31190b8bc`

This sync preserves GitHub history, contribution documentation, PR template, CI workflow, lint baseline and bounded test runner. It does not publish or modify the live application, runtime configuration, databases, authentication, payments, or other apps.

As with the v97 snapshot, private owner/tester seed identifiers, seed emails, and the legacy owner hash are placeholders. The backend test harness substitutes the hash of its synthetic owner email only in memory. Production identifiers must be configured through the approved private deployment process; do not deploy the placeholder seeds to an existing production database. Public catalog/manufacturer evidence is retained verbatim. Generated Python bytecode is omitted.

The application source and catalog assets otherwise reflect the deployed revision. Deployment does not imply all historical tests pass. Verification results and any existing failures are recorded in the sync PR rather than silently disabling checks or changing deployed behavior.
