# PaddleLog

**A personal equipment journal for pickleball players.**

PaddleLog brings paddle collections, playing sessions, maintenance and equipment costs into one place. It connects the details of a physical paddle to its history on court, helping players compare setups and understand how their equipment changes over time.

[Architecture](docs/ARCHITECTURE.md) · [Session model](docs/MULTI-PADDLE-SESSIONS.md) · [Integration contract](docs/picklepoint/API-INTEGRATION-V1.md) · [Contributing](CONTRIBUTING.md)

## Product capabilities

- Organize physical paddles with catalog references, photos, setup details and lifecycle history.
- Record sessions and attribute playing time across multiple paddles.
- Track maintenance, supplies and shared expenses alongside equipment usage.
- Import Pickle Point sessions through a defined, versioned integration.
- Review collection insights and preserve data through portable backups.

## Engineering highlights

| Concern | Approach | Explore |
| --- | --- | --- |
| Reliable editing | Revision checks, local drafts and conflict handling | [Architecture](docs/ARCHITECTURE.md) |
| Equipment ownership | Physical paddles remain distinct from catalog models | [Catalog model](docs/SHARED_REFERENCE_CATALOG.md) |
| Cross-app data | Explicit source contracts and receiver validation | [Import implementation](docs/picklepoint/IMPORT-IMPLEMENTATION.md) |
| Multiple paddles per session | Usage attribution and session detail modeling | [Multi-paddle sessions](docs/MULTI-PADDLE-SESSIONS.md) |
| Regression coverage | Domain, persistence and UI-oriented checks | [Tests](tests) |

The application UI uses HTML and JavaScript modules, served through Vinext on Cloudflare Workers. The repository also contains TypeScript server code, D1 persistence, R2 photo storage, Drizzle migrations and a Capacitor native project. React dependencies are part of the framework scaffold; they do not describe the main application UI.

## Development

Use Node.js **22.13 or later** and the package manager pinned in [package.json](package.json): **pnpm 11.25.0**.

```sh
pnpm install --frozen-lockfile
pnpm test
pnpm lint
pnpm build
```

For development, run `pnpm dev`. Environment-specific identity, storage and hosting configuration is required for connected features. See [Contributing](CONTRIBUTING.md), [authentication](docs/LEEWAYPB-AUTH.md) and [native setup](native/README.md).

## Repository guide

| Path | Contents |
| --- | --- |
| `app/` | Web entry point and server routes |
| `public/` | Product UI modules and assets |
| `web/` | Browser authentication components |
| `db/`, `drizzle/` | Database schema and migrations |
| `native/` | Capacitor packaging and adapters |
| `tests/` | Automated regression checks |
| `docs/` | Architecture, contracts and release notes |

## Release status

Active development with controlled beta access. Native packaging is not a claim of App Store availability. Historical architecture notes describe their dated snapshots; consult newer release notes and the checked-out source for current behavior. Automated checks do not replace physical-device testing.

Changes follow pull requests and CI. Merging source does not authorize production deployment or live payments.

## Related projects

| Project | Responsibility |
| --- | --- |
| [PaddleLog](https://github.com/BenRL91/PaddleLog) | Equipment, maintenance and usage history |
| [Pickle Point](https://github.com/BenRL91/Pickle-Point) | Scoring, games and sessions |
| [Leeway Coaching](https://github.com/BenRL91/Leeway-Coaching) | Booking and breakdown fulfillment |
| [Leeway Replay](https://github.com/BenRL91/Leeway-Replay) | Private video reviews and discussion |
| [Leeway Common](https://github.com/BenRL91/Leeway-Common) | Shared notification components and service |

Each repository has its own release lifecycle. Shared identity does not grant access to another app's private data.
