# Manufacturer catalog images

The 2026-10-07 reviewed batch is in data/catalog-images-2026-10-07.json.
Each entry binds an image to an existing reference ID, expected brand and model.
It records the manufacturer product page, original CDN URL, credit, check date,
product and selected variant. Shared front photos for handle/thickness options
are explicitly marked as representative and must not be used as measurements.

Apply with node scripts/apply-catalog-images.mjs. Application is repeatable and
changes only the image field; no catalog identities, specs, approval evidence,
user paddles or user uploads are changed. Run node tests/catalog-images.mjs and
node tests/paddle-image.mjs, plus existing catalog gap/name checks before publishing.

For the next batch: retrieve manufacturer product records, verify generation,
shape and thickness options, review actual image contents, prefer clean whole
paddle front photos, and check that images load/decode. Produce explicit ID-bound
patches rather than adding runtime fuzzy name matching. Record provenance and
update the coverage report. Manufacturer product-family URLs alone are not enough:
some old catalog source URLs point to a different numbered CRBN product.

Display uses the manufacturer's CDN with a 900px size request. Missing or broken
images fall back through the existing image resolver. User uploaded photos remain
first priority. No third-party review imagery or lab data is copied.

Coverage is partial: 216 of 5,563 records now have images. See
data/catalog-image-coverage-2026-10-07.json for every brand's coverage. Approval-only,
ambiguous and unavailable historical products remain unresolved. Preserve those
records and identify their precise product generation before assigning imagery.

The 2026-10-08 batch adds four visually reviewed Vatic Pro front photos: Tour Flash LH, Tour Elongated, Tour Bloom and Pro Flash SH. Apply with node scripts/apply-catalog-images.mjs data/catalog-images-2026-10-08.json. Coverage is now 220 of 5,563. The Tour SH featured image shows a conflicting handle, so it is deliberately unresolved; spec graphics were also rejected.
