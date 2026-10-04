# Session details — October 1, 2026

Sessions add optional ball, location, environment (indoor/outdoor), weather and netType text fields, plus photoId/beforePhotoId/afterPhotoId. Start/end timestamps remain the only logged-session duration inputs. Conditions and photos do not affect wear.

Session, before and after photo slots use the existing private upload API. References must belong to the signed-in account; all three slots are checked server-side. Images are original supported JPEG/PNG/WebP files up to 6 MB; no canvas decoding. Pending files use the existing IndexedDB queue with account + session + slot keys. Text and uploaded references are saved to local drafts. Picker interruption can restore the session form. Failed uploads can be retried or explicitly discarded; Save is blocked while known pending photos exist. Double Save is guarded across asynchronous queue checks. Removing references does not destroy stored images, allowing older backups to retain references; account deletion purges account photos.

Settings.locations contains up to 500 named defaults: name, ball, environment, netType. Names are unique case-insensitively. The session form can save/update defaults with the session, or apply them after explicit confirmation. Weather, notes, timestamps and photos never enter defaults. Location changes do not alter historical sessions. Concurrent location list edits use existing conflict detection rather than silent overwrite.

Account settings now display the server-verified signed-in email when available. An empty collection directs users to check that email before recreating data; no cross-account detection or automatic merging is performed.

All schema changes are additive in existing JSON account_logs. No table migration or bulk rewrite. Old records normalize to blank optional fields. The server preserves new fields omitted by old clients. JSON export/import preserves new fields and rejects invalid references/types.

Automated coverage includes session create/edit/delete, all new field/draft values, upload failure/retry/recovery, failed save, double Save, location defaults confirmation/weather exclusion, email display, JSON roundtrip and cross-account photo rejection for all slots. Existing regression tests and native/web builds pass. Real iPhone photo-picker/resume and Android device validation remain to be performed.
