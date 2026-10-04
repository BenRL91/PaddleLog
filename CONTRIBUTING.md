# Contributing to PaddleLog

PaddleLog is independently releasable within the LeewayPB suite.

## Branch and pull-request workflow

- Keep main releasable. Do not use it for routine development.
- Create a short-lived feat/, fix/, or arch/ branch.
- Open a pull request for every change.
- CI must pass before merge.
- Prefer squash merge unless preserving multiple commits has a clear reason.
- A merge to main is a release candidate, not authorization to deploy production.

## Local verification

Use the repository's pinned pnpm toolchain:

    pnpm install --frozen-lockfile
    pnpm test
    pnpm lint
    pnpm build

The GitHub v97 import is sanitized. Restore/configure environment-specific placeholders through approved secret/configuration mechanisms; do not commit production secrets or private identifiers.

## Suite-impacting changes

Before changing identity, membership, entitlements, cross-app APIs, source usage semantics, deletion, synchronization, or shared behavior:

1. Review the current LeewayPB Suite Architecture & Integration Contracts.
2. Identify affected apps and ADRs.
3. Prefer backward-compatible/versioned contracts.
4. Define staging tests, migration, rollback, and old-client behavior.
5. After implementation, record the decision and affected apps.

PaddleLog remains authoritative for accepted paddle usage and wear. Other apps must not write wear counters or bypass PaddleLog's server persistence/CAS boundary.
