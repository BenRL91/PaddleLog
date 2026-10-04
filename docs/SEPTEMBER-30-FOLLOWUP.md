# September 30 follow-up

Purchase date is an optional user-entered calendar date, separate from the automatic
added timestamp. Expanded rows and details now display available dates. Legacy records
without createdAt remain explicitly unknown; editing them does not invent an added date.
Default labels combine brand, model and shape; nicknames override the default.

The feel grid now displays Hollow above Dense, with Stiff on the right. Existing stored
y coordinates remain density values (0 Hollow, 100 Dense), so the displayed position is
inverted without changing the meaning of saved assessments or recovered drafts.

Auth and billing implementation/activation limitations are in LEEWAYPB-AUTH.md and
MONETIZATION.md. Auth mode remains Sites, real purchases remain disabled, and no
external credentials or app-store configuration were created. The identity schema
migration is additive. Provider identity deletion, native secure-store/browser wiring,
public API/webhook hosting, and real-provider tests remain required before activation.
