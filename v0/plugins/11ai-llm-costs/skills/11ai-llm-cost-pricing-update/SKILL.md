---
name: 11ai-llm-cost-pricing-update
description: Refresh the canonical token-pricing catalog used by the 11ai LLM cost reports from official AI-lab sources, synchronize the project, global, and single-thread copies, and validate their schemas and equality. Use when model prices, model aliases, pricing dates, providers, or pricing caveats have changed, or when adding pricing support for another AI lab.
---

# 11ai LLM Cost Pricing Update

Maintain one provider-verified catalog and keep every 11ai cost-report skill on the same rates.

## Workflow

1. Read [`references/provider-sources.md`](references/provider-sources.md) completely before researching or editing.
2. Browse every official provider page relevant to the requested update. Use primary provider documentation only; do not use pricing aggregators or search-result snippets as the final authority.
3. Compare the official pages with [`references/pricing.json`](references/pricing.json). Record:
   - standard real-time text input, cached-input, output, and supported cache-write prices in USD per 1M tokens;
   - exact model IDs and aliases;
   - effective dates when the provider publishes them;
   - verification date;
   - material exclusions or tier rules in `notes`.
4. Update the canonical catalog with `apply_patch`. Keep specific match patterns before broader wildcards because matching is first-match-wins.
5. Synchronize the three bundled report catalogs:

   ```bash
   node scripts/sync-pricing-catalog.mjs --write
   ```

6. Validate catalog structure and synchronization:

   ```bash
   node scripts/sync-pricing-catalog.mjs
   ```

7. Run all three report-skill test suites and validate this skill and the enclosing plugin.
8. Summarize providers and rates changed, limitations retained, validation performed, and links to the official pages consulted.

## Pricing rules

- Store numeric rates in `per1M`; use `null` only when a token class can exist but no supported rate is available.
- Require `input` and `output` for every model entry. Optional supported keys are `cachedInput`, `cacheRead`, `cacheWrite5m`, and `cacheWrite1h`.
- Do not collapse temporary promotional pricing into a permanent entry. State its end date and successor rates in `notes`, then schedule or recommend a refresh.
- Do not infer a long-context tier from a thread's aggregate token count. Provider tiers are normally applied per request, while report inputs may aggregate many requests. Keep the standard tier and disclose the excluded tier unless the analyzers gain per-request attribution.
- Do not mix batch, priority, regional, tool, request, grounding, storage, audio, image, video, subscription, enterprise, or negotiated charges into text-token rates. Describe material exclusions in `notes`.
- Preserve aliases for current billable model IDs only. Avoid pricing deprecated aliases unless the provider explicitly documents their billing redirect.
- Set top-level `updatedAt` and each changed entry's `verifiedAt` to the date actually checked.
- Never invent an `effectiveDate`; omit it when the provider does not publish one.

## Catalog ownership

The canonical catalog is [`references/pricing.json`](references/pricing.json). The synchronization script writes byte-equivalent copies to:

- `../11ai-llm-cost-project/references/pricing.json`
- `../11ai-llm-cost-global/references/pricing.json`
- `../11ai-llm-cost-single-thread/references/pricing.json`

Treat divergence as a validation failure.
