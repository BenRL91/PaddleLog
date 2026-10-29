# PaddleLog for iOS and Android

A React Native + Expo SDK 57 client alongside the existing web application. These screens render native controls, not the existing HTML inside a WebView. The deployed web client, API, D1/R2 data, physical paddle IDs, identity mapping, and Pickle Point sync endpoints remain unchanged.

## Run

From this directory (it has its own pinned package graph):

```sh
pnpm install --frozen-lockfile
cp .env.example .env
pnpm start
# With the platform SDK installed:
pnpm ios
pnpm android
```

Use an Expo development build, not Expo Go, for the registered `paddlelog://` callback. Bundle IDs in app.config.ts are proposals until confirmed against the registered store identifiers. Do not change an existing registered identifier to match this example.

## Implemented native flows

- System light/dark appearance using LeewayPB red and gold; five native tabs.
- Home paddle selector, Main indicator, edit, full details, maintenance, summary and image watermark.
- Virtualized searchable paddle library, active/archive/favorite filtering, catalog selection, personalization-first editing, Main history updates, favorite/archive actions.
- Timestamped timer with pause/resume, paddle switching, device persistence and stable save identity. Pause time never becomes paddle usage. Ending retries do not create a second session.
- Session accordions and action menus; manual past sessions; editable location/name/notes; ratings for each used paddle; manual guest players and games alongside read-only imported facts.
- Collection expenses, supply packs, remaining-quantity adjustments and cent-based cost allocation. Maintenance installs require saved stock; deleting an erroneous installation restores prior history-derived wear and removes its allocation.
- Server-derived plan information; server-enforced Free limit remains five physical paddles across all statuses. Native purchases are disabled.
- Basic Pro results, paddle summary and collection cost views reuse the existing domain functions.
- Native Supabase password sign-in and system-browser Apple/Google PKCE integration; refresh lifetime tied to app state. Chunked Keychain/Keystore auth storage avoids per-item token size limits. No bearer token is stored in AsyncStorage or sent in a URL.
- Account-scoped form drafts, timer and pending PATCH recovery. Revision conflicts stop writes; changes from another device are never silently overwritten.

## Reuse and data safety

`src/domain.js` imports the existing pure `public/` modules. There is no new paddle database or alternative importer contract. `src/api.js` sends the same bearer-authenticated `/api/state` GET/PATCH and `/api/entitlements` calls used by the existing native/API boundary. PATCH is computed from the original records; fields unknown to the native UI are retained. Library ownership is resolved by the server from the authenticated identity, not a request-supplied user ID.

Auth configuration accepts only publishable Supabase values. Never add service-role keys, store signing keys, provider client secrets or session tokens to this package. The bundled `.env.example` contains the already-public project values.

## Deliberate remaining parity work

This is the first native implementation, **not full web feature parity or an App Store release**.

| Area | Remaining work |
| --- | --- |
| Identity | Register exact native callback with the existing identity owner; confirm Apple/Google provider behavior on devices, recovery and cold-start callbacks. No shared-auth settings were modified. |
| Paddle details | Native photo capture/upload, full measurements/weight setup, approval detail, advanced shape/brand filters, reorder and destructive paddle deletion; maintenance edit/remove flow beyond erroneous-record deletion. |
| Play | Saved-player management, editing existing manual games, all custom scoring targets, file-import preview/mapping, historical estimated-use entry, complete journal UI. Imported facts and receipts are retained. |
| Pro | Full date/paddle/discipline/format selectors, previous-period comparisons, partner/opponent history, close games, setup experiments and advanced equipment analysis. Existing calculations remain shared for subsequent screens. |
| Costs | Full paddle-vs-general scope filtering, per-paddle expense editor, supply correction rules and native receipt attachments. |
| Portability | Native portable backup/photo export and file restore/import. Existing web workflows stay available via Settings. |
| Stores | Registered identifiers, signing, store-compliant purchase bridge, restore/subscription/account-deletion UI, privacy disclosures, real iOS/Android accessibility and keyboard QA. |
| Connectivity | Conflict review/merge UI and offline confirmed-library cache. Pending writes and timers persist, but this client requires a successful authenticated initial library load. |

The native client does not send notifications, email invitations, health data or new sessions back to Pickle Point. It does not add a workout/Watch implementation. No production sessions or synthetic fixtures were inserted while building it.

## Verification

```sh
pnpm test
pnpm typecheck
pnpm exec prettier --check src index.ts app.config.ts metro.config.cjs tests
pnpm exec expo export --platform ios --platform android
```

JavaScript bundle export checks Metro and native module resolution; it does **not** compile Swift/Kotlin, produce a signed IPA/APK, prove device auth, or test purchase flows. CI checks this package independently from the existing web-source sync PR, whose older test failures remain separate.

## Before TestFlight/internal Android distribution

1. Confirm registered iOS/Android identifiers and identity redirect `paddlelog://auth/return` with the shared identity owner; prefer verified universal/app links for a hardened public rollout.
2. Build development clients on macOS/Xcode and Android SDK and verify sign-in, logout/account change, refresh, photos, lost-network saves, restart/resume, conflicts and accessible navigation with separate test accounts.
3. Complete the parity items needed for beta, store disclosures, native account deletion and purchase/restore paths. Keep payment activation disabled until verified.
4. Use the repository's PR/CI process. Do not republish the website as a way to release a native app.
