# Estimated usage — October 1, 2026

Add estimated hours replaces new Add period creation in paddle details. Existing rotation periods remain visible and exported; they never become invented play hours.

An estimate is total play within a fixed start/end window, including any sessions already recorded. Logged session overlap reduces its remaining estimate, floored at zero. Remaining hours are spread uniformly across time not covered by logged sessions. Wear uses only the part after the current component installation. This is an approximation, labeled separately from logged usage. Estimates never advance with the wall clock. Editing/deleting sessions can change the estimated remainder; delete or correct the estimate if the original total is no longer accurate. Overlapping estimate windows for one paddle are rejected.

## Additive data change

The existing JSON session collection accepts an optional numeric estimatedHours discriminator. Normal sessions and old usagePeriods are unchanged. Estimated entries are excluded from session counts/lists and displayed separately in details/timeline. All totals and maintenance use shared sessionUsage. No D1 table migration or data rewrite is required. JSON export/import and three-way merge preserve the field.

Validated state carries usageSchema:1. If saved data contains estimates, the API rejects writes from older clients lacking this marker, preventing older validators from stripping the discriminator and treating a multi-day window as continuous play. Reload such clients before saving. Never roll back this guard while estimates exist.

Local drafts persist before save and survive failed saves; permanent removal occurs after confirmed save. Estimate deletion requires confirmation and does not delete sessions or maintenance.

Automated tests cover calculation boundaries, logged replacement, install overlap, independent reset, stage reversal, overlap/invalid input rejection, merge, JSON roundtrip, form CRUD, draft reload, save/delete failures and cancellation. Device Safari interaction has not been tested in this change.
