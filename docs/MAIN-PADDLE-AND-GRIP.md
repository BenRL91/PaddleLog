# PaddleLog: Main paddle, overgrip and setup images

Visible branding is now PaddleLog by LeewayPB. Existing account IDs, draft keys,
entitlement keys, proposed StoreKit product identifiers and the hosted URL are unchanged.
This avoids treating a display-name change as a new application/account.

Choose Set as main from an expanded paddle. The main paddle has a compact dashboard
card and wear badge, and is the default choice for a new session. The first selection
starts its grip clock now; Settings can backdate the actual installation. Switching
between main paddles does not reset their grip clocks. Replace overgrip asks for
confirmation, sets the installation timestamp to now and keeps all session history.

Wear counts only sessions associated with that paddle after installation. A session
that crosses the installation timestamp is prorated. Saved sessions contribute their full recorded duration, regardless of the current clock.
Editing/deleting/backdating sessions recalculates wear. Default stages:

| Logged hours since installation | Badge | Color |
| --- | --- | --- |
| 0 to under 4 | Brand New | Blue |
| 4 to under 8 | New | Green |
| 8 to under 12 | Used | Yellow |
| 12 to under 16 | Old | Orange |
| 16 and above | Very Old | Red |

Settings permits 0.25–1000 hours per level. The setting and Main paddle selection sync
to the account and round-trip in backups. Wear is an estimate, not a sensor measurement.

Weight setup import currently accepts PNG, JPEG and WebP exports/screenshots. The
supplied Selkirk Boomstik Widebody PNG was visually inspected and is supported.
Compatibility with a native Tuning Lab project file, JSON or PDF is not claimed. Unsupported files get a
clear message rather than guessed parsing. Import stores a separate tuningImageId,
uses the same account-protected image service and preserves original selected image
bytes locally until upload succeeds. Save failure retains the image reference in the
form draft. Pending uploads can be retried or discarded with confirmation.

The setup appears next to the paddle photo when both exist, or alone when no paddle
photo exists. Tap either to open full size. It does not change measured paddle specs
or the text weight setup. One setup diagram is separate from a future Pro photo gallery.

Tests cover stage boundaries/colors, custom intervals, replacement overlap, other-paddle
isolation, JSON/settings merge, Main persistence, failed settings saves, setup image draft
recovery, paired/standalone media and account-scoped setup-image authorization.
Actual iPhone visual QA remains unverified because browser preview was blocked earlier.
