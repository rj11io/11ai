---
name: 11ai-benchmarks-pricing-update
description: "Refresh and preserve the time-versioned token-pricing history used by the 11ai LLM cost reports from official AI-lab sources, synchronize the project, global, and single-thread copies, and validate their schemas, rate periods, resolver, and equality. Use when model prices, discounts, effective dates, aliases, providers, or pricing caveats have changed, when historical-rate backfill is requested, or when adding pricing support for another AI lab."
---

# 11ai Benchmarks Pricing Update

Maintain one provider-verified catalog and keep every 11ai cost-report skill on the same rates.

This is the only skill allowed to research official prices and modify the bundled pricing catalogs. Reporting skills consume their bundled copy directly, leave unmatched models unpriced, and link here for a catalog update; they must not create or use local pricing overrides.

## Workflow

1. Read [`references/provider-sources.md`](references/provider-sources.md) completely before researching or editing.
2. Browse every official provider page relevant to the requested update. Use primary provider documentation only; do not use pricing aggregators or search-result snippets as the final authority.
3. Compare the official pages with [`references/pricing.json`](references/pricing.json). Also search official rate cards, announcements, and changelogs for historical rates requested by reports that used an earliest-available fallback. Record:
   - standard real-time text input, cached-input, output, and supported cache-write prices in USD per 1M tokens;
   - exact model IDs and aliases;
   - explicit official effective dates when the provider publishes them, otherwise the first UTC detection timestamp;
   - detection and verification timestamps or dates;
   - material exclusions or tier rules in `notes`.
4. Edit the canonical catalog file directly. Preserve every prior price period. Convert a compact single-rate model to ordered `rates` when its first change is observed, append the new period, and never overwrite the former rate. Keep specific match patterns before broader wildcards because matching is first-match-wins.
5. Synchronize the three bundled report catalogs:

   ```bash
   node 11ai-benchmarks-pricing-update/scripts/sync-pricing-catalog.mjs --write
   ```

6. Validate catalog structure and synchronization:

   ```bash
   node 11ai-benchmarks-pricing-update/scripts/sync-pricing-catalog.mjs
   ```

   Both commands resolve the catalogs from the script's own location, so any working directory works. `--write` mutates the sibling report skills' bundled copies: run it in the source repository, not inside an installed plugin cache.

7. Run all three report-skill test suites and validate this skill and the enclosing plugin.
8. Summarize providers and rates changed, limitations retained, validation performed, and links to the official pages consulted.

## Pricing rules

- Store numeric rates in `per1M`; use `null` only when a token class can exist but no supported rate is available.
- Require `input` and `output` for every model entry. Optional supported keys are `cachedInput`, `cacheRead`, `cacheWrite5m`, and `cacheWrite1h`.
- Record temporary promotional pricing and its published successor as separate ordered rate periods. If no successor is published, refresh before the promotion ends.
- Do not infer a long-context tier from a thread's aggregate token count. Provider tiers are normally applied per request, while report inputs may aggregate many requests. Keep the standard tier and disclose the excluded tier unless the analyzers gain per-request attribution.
- Do not mix batch, priority, regional, tool, request, grounding, storage, audio, image, video, subscription, enterprise, or negotiated charges into text-token rates. Describe material exclusions in `notes`.
- Preserve aliases for current billable model IDs only. Avoid pricing deprecated aliases unless the provider explicitly documents their billing redirect.
- Set top-level `updatedAt` and each changed rate's `verifiedAt` to the date actually checked.
- Use `effectiveDate` only for an official provider date. When none is published, omit it and set `detectedAt` to the first UTC instant the changed official price was observed.
- When usage predates the earliest catalog period, search official historical sources before accepting the report fallback. If no official historical rate can be found, retain the earliest-available fallback and document the search limitation.
- Treat rate periods as inclusive at their effective start and exclusive at the next period's start.

## Catalog ownership

The canonical catalog is [`references/pricing.json`](references/pricing.json). The synchronization script writes byte-equivalent copies to:

- `../11ai-benchmarks-project/references/pricing.json`
- `../11ai-benchmarks-machine/references/pricing.json`
- `../11ai-benchmarks-single-thread/references/pricing.json`

The same script also synchronizes the temporal pricing resolver used by the three analyzers. Treat catalog or resolver divergence as a validation failure.

After synchronization, regenerate any affected reports. Existing reports remain immutable historical artifacts; regenerated reports may change when newly verified historical periods replace a previously disclosed fallback.
