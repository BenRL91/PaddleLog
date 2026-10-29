# Large collection UI verification

The collection initially renders 30 summaries. Each open paddle builds its
details once; rerendering refreshes open details from current state. Load more
adds 30 cards, preserves the loaded count during reordering, and focuses the
first newly displayed summary. Search and filters cover the full library.

Usage totals are indexed by physical paddle and cached until the next state
render. They reuse the existing recorded-segment and overlapping-estimate
semantics. Model/filter metadata is cached, with approval checks deferred until
Advanced Filters is opened or an approval filter is selected.

Large native paddle selectors (more than 20 choices) offer search and 30 matching
choices at a time. The native select remains the form source of truth. Compare
retains its existing catalog/collection search. Insights multi-selection adds
search and incremental results without changing hidden selections.

## Synthetic checks

`node tests/large-collection.mjs` creates only in-memory fixtures, using the real
application render functions under happy-dom. No production data is inserted.

| Paddles | Recorded sessions | Initial cards | Initial render | Search |
| --- | --- | --- | --- | --- |
| 100 | 1,200 | 30 | 38 ms | 13 ms |
| 250 | 3,000 | 30 | 39 ms | 13 ms |
| 500 | 6,000 | 30 | 41 ms | 19 ms |

Sample timings are environment-dependent DOM test measurements, not browser
layout, image-load, network, or physical-phone benchmarks. The test also checks
lazy details, Load more, full-library search/reset, and the searchable Home
picker. Additional tests cover mixed-paddle usage, breaks, estimates, revision
and deletion invalidation, filtered multi-selection, disabled controls, backups,
session edits, and reordering.

The collection is incrementally rendered rather than fully virtualized: loading
all cards still grows the DOM. Large session/history screens and deep all-paddle
analytics remain separate candidates for further profiling. Phone Safari/Chrome
and a real large beta account still need visual and interaction verification.
