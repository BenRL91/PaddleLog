# Collection organization — October 1, 2026

Favorites can be reordered with Move up/down in the expanded Favorites rows. The saved order applies to the Favorites filter, and to favorites-first lists/selectors. Turning favorites-first off retains original collection ordering outside the Favorites filter. Unfavoriting does not delete a paddle or its history.

The original mainPaddleId remains the general main. Optional singlesMainPaddleId, doublesMainPaddleId and mixedMainPaddleId in account settings point at physical paddle IDs. One paddle may fill multiple roles. The Main role selector only changes the viewed role; assignments save in Settings or via Set as [role] main in the collection. Session creation prefills the currently selected role. Switching roles does not reinstall consumables. Archived role paddles remain visible and labeled Archived until reassigned.

Paddle records add collectible (boolean) and collectibleLabel (up to 200 characters). Labels are user-entered, not verified rarity or value. Collectible status does not affect active-paddle limits, archive state, sessions, or wear.

All changes are additive JSON fields in existing account_logs; no table migration or bulk rewrite. Missing fields default to null/false/empty, preserving the general main. The server preserves new fields absent from older clients. Deletion removes dangling role/order references; archives preserve them. Existing three-way merge protects concurrent edits and allows separate role edits to merge. Exports include all fields; imports validate types/references.

Test coverage: role selection/assignment and session prefill, installation preservation, collectible draft/save, favorite movement/reload/failure/boundaries, JSON roundtrip, reference validation, concurrent role merge, deletion cleanup and old-client server preservation. Full regression suite and type check pass. Native/web build validates packaging, not device behavior; iPhone/Android visual and native testing remains external.
