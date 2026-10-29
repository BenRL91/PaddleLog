# PaddleLog real-world UX verification

Use a temporary test paddle and test sessions. Save a records backup before testing restores. Purchases remain unavailable; this pass does not enable payments.

## Everyday use
- [ ] Home: Start session, Add past session and Insights are comfortably tappable; Insights has a PRO tag.
- [ ] View all paddle details: modal centers with no clipped edges; scrolling reaches the bottom and Close stays reachable.
- [ ] Details: Favorite toggles and survives reload; Arrange paddle and Insights do not appear here.
- [ ] Starting opens the dedicated Session screen. Back to Home hides timer details; Return to session resumes the same timer. Ending keeps optional rating/details on the Session screen, and Done returns to a clean Home.
- [ ] Start a timer, wait at least 30 seconds with the paddle selector focused, and confirm it remains usable.
- [ ] Switch paddles twice, end once, and verify each paddle receives its own usage time.
- [ ] Background the app, return, and verify the same timer continues.
- [ ] End while offline: the end time remains fixed, Retry is clear, reconnecting saves one session.
- [ ] Add/edit/delete a past test session; verify usage and wear recalculate.

## Maintenance and tools
- [ ] Main maintenance buttons show Install, Set up or Replace clearly.
- [ ] A routine installation saves directly; correction/removal still asks for confirmation.
- [ ] Close maintenance with X/Escape; reopen and verify draft recovery. Discard draft removes the draft.
- [ ] Add a cost, retry a failed save, and confirm only one linked expense exists.
- [ ] Expense and experiment-baseline drafts survive reload and remain isolated between accounts.
- [ ] Edit existing experiment notes, reload/reopen, and verify they recover. Save/discard behaves correctly.
- [ ] Comparison tables scroll sideways on narrow screens without scrolling the whole page sideways.
- [ ] Insights clearly distinguishes summary dates, chart periods and all-time records.
- [ ] Free PRO controls open upgrade options; enabled Pro controls open their feature.

## Navigation, readability and accessibility
- [ ] Each tab retains scroll position; Settings returns to its previous section and position.
- [ ] Empty search/filter results offer a working Show all paddles action.
- [ ] Onboarding adds a paddle and leads to Home; personalization is optional.
- [ ] iPhone Safari: portrait/landscape, keyboard open, native dropdowns, dates and photo picker.
- [ ] Desktop: keyboard-only navigation, visible focus, dialog Tab cycling, Escape and focus restoration.
- [ ] VoiceOver: current tab, dialog names, input labels/errors, favorite state and Pro expectations are understandable.
- [ ] Timer minute updates do not repeatedly interrupt VoiceOver.
- [ ] 200% text enlargement and a narrow 320 CSS px viewport remain usable without clipped controls.
- [ ] Dark/light/system themes and all accents have readable badges, placeholders and disabled controls.
- [ ] Reduced-motion preference is respected.

## Account, photos and recovery
- [ ] Email-code sign-in works across tabs using the newest email; cancellation and retry are clear.
- [ ] Expired sign-in preserves device drafts and gives an actionable recovery message.
- [ ] Provider selection, connected methods and unavailable providers are understandable.
- [ ] iPhone photo selection/reload restores pending work; failed uploads can retry.
- [ ] Export records and export with photos produce usable downloads.
- [ ] Restore cancellation leaves data unchanged; invalid backups explain the problem.
- [ ] Restore a test backup and verify photos, usage, maintenance and expenses.

## How to report a problem
Record device/browser, theme, action, expected result and actual result. Include a screenshot or short recording when layout or focus is involved. Mark each item Pass, Fail or Not tested.

## Verification limits
Automated checks cover relevant source/DOM behavior, calculations, persistence and recovery paths. Physical iPhone Safari, VoiceOver, screen enlargement, live identity-provider handoffs and every foreground/background color pairing still require real-world verification. This is not a WCAG compliance certification.

## Collection and Insights group selection
- [ ] Collection tabs: swipe the tab bar on iPhone; each view fits without whole-page horizontal scrolling.
- [ ] Keyboard arrows move tab focus without opening a feature or upgrade screen; Enter activates the focused tab.
- [ ] Advanced Filters: combine brand, shape and approval; clear filters and verify all paddles return.
- [ ] Hylongated appears for Hybrid and Elongated; a plain Hybrid appears only for Hybrid.
- [ ] History: search notes/location/product, filter paddle and event, set dates, reverse order, and clear.
- [ ] Insights: open the Paddles selector, deselect one paddle, and verify combined hours and costs exclude it.
- [ ] Select two paddles used in one session; their combined usage counts each recorded segment once.
- [ ] Clear Insights selection: show a selection prompt, never silently switch to all paddles.
- [ ] Select all; add another paddle and verify it joins the all-paddles scope.
- [ ] Background refresh keeps selected checkboxes and current checkbox focus intact.
- [ ] Home Insights opens with that paddle selected; the collection Insights view remains usable afterward.
- [ ] VoiceOver reads checkbox labels/states, selected scope, date errors and named share-of-play meters.

Automated source and interaction checks cover labeled form controls, dialog names, primary-button contrast across ten accents, picker focus, navigation restoration, selection calculations, and manual keyboard tab activation. These checks do not replace visual, iOS or assistive-technology verification.

## Session polish and Sessions filters
- [ ] Running timer shows hours/minutes and start time; Home and Sessions both say Return to session.
- [ ] Switch paddles: confirmation appears and Usage by paddle shows the recorded split.
- [ ] Keep the paddle selector focused or usage breakdown expanded through a timer tick; both remain usable.
- [ ] End session: Done returns Home; optional details and ratings remain on the completion screen.
- [ ] Save while offline, then retry after reconnecting: one session with the original end time and segments.
- [ ] Sessions search covers paddle names, notes, location and ball. Combine paddle, setting and dates.
- [ ] A session spanning midnight matches either date; a multi-paddle session matches either paddle.
- [ ] Clear a no-match Sessions result and verify the list returns without changing saved sessions.

## Recovery and owner Development mode (v136)
- End a multi-paddle timer offline, reopen, and retry unsynced changes. Confirm the original end time, one saved session, accurate paddle hours, and no leftover timer.
- Verify editing shows unsaved device-draft feedback; failed paddle and maintenance saves preserve entries and explain the failure near the form.
- Under Settings → Account → Development, select Pro off and test upgrade prompts, then Pro on and test Insights/Compare/Experiments. Restore Use actual plan when finished.
- Confirm the selected test plan persists after reopening and is invisible to non-owner accounts. Subscriptions and tester grants remain unchanged.

## Free collection cap (v138)
- In Development Free mode, verify the fifth paddle saves; a sixth shows Pro before saving, even when archived or inactive.
- Archive/reactivate existing paddles: count stays unchanged. Delete a paddle: a slot becomes available when total is below five.
- Existing collections above five stay editable, including status changes; new additions require Pro. Backup restore uses the same policy.

## Mobile accessibility and Insights guidance (v139)
- Enlarge Safari text and zoom: check Home actions, collection filters/view controls, list cards, Insights metrics and all edit forms for clipped labels or horizontal page overflow.
- With Insights inline, open paddle editing; confirm Escape closes the edit form and Tab stays within it. Check the same flow with an external keyboard and VoiceOver.
- Test Add measurement, Add purchase price, Add past session, Record overgrip installation and Rate most recent session from Insights. Confirm the correct selected paddle/session opens, Insights closes, and fields remain interactive.
- Open forms with the iPhone keyboard visible; scroll to every field and Save/Cancel control. Check dialogs in portrait and landscape.
- These checks remain real-device verification; automated checks do not certify accessibility compliance.
