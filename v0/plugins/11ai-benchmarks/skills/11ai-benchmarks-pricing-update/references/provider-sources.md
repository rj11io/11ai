# Official provider pricing sources

Use these primary pages as the starting point. Re-open them on every refresh because prices, model IDs, promotions, and tier rules change.

| Provider key | Official source | Catalog cautions |
| --- | --- | --- |
| `anthropic` | <https://platform.claude.com/docs/en/about-claude/pricing> | Input, 5-minute cache writes, 1-hour cache writes, cache reads, and output are separate token classes. Check promotions and their expiry dates. |
| `openai` | <https://developers.openai.com/api/docs/pricing> | Use standard processing rates. Long-context, cache-write, batch, flex, and priority rates require separately attributable usage. |
| `google` | <https://ai.google.dev/gemini-api/docs/pricing> | Prefer text/image/video input when one row separates audio. Note context tiers, cache storage, grounding, and tool charges. |
| `xai` | <https://docs.x.ai/developers/pricing> | Use short-context text rates. Note the per-request long-context threshold, batch discounts, regional differences, and tool charges. |
| `deepseek` | <https://api-docs.deepseek.com/quick_start/pricing> | Map cache-hit to `cachedInput` and cache-miss to `input`. The provider has pre-announced a price increase; check for it on every refresh. |
| `mistral` | <https://mistral.ai/pricing/api/> | Use serverless API text-token rates, not self-deployment or fine-tuning prices. Cached input is published as a flat -90% discount, not per-model prices. |
| `cohere` | <https://cohere.com/pricing> | The provider no longer publishes per-token list prices; the pricing page routes to enterprise quotes. Keep the last publicly verified rates with a note, and do not invent a source. |
| `perplexity` | <https://docs.perplexity.ai/docs/getting-started/pricing> | Token prices may be only one component; disclose request, search, and citation-related charges that the reports cannot derive. |

## Catalog schema

```json
{
  "version": 3,
  "updatedAt": "YYYY-MM-DD",
  "detectedAt": "YYYY-MM-DDTHH:mm:ssZ",
  "comment": "Scope and exclusions.",
  "models": [
    {
      "match": ["specific-model-id*", "documented-alias"],
      "provider": "provider-key",
      "rates": [
        {
          "per1M": { "input": 0, "cachedInput": null, "output": 0 },
          "effectiveDate": "YYYY-MM-DD",
          "sourceUrl": "https://official-provider.example/pricing",
          "verifiedAt": "YYYY-MM-DD",
          "changeType": "temporary-discount",
          "notes": "Material tiers, promotions, and exclusions."
        },
        {
          "per1M": { "input": 0, "cachedInput": null, "output": 0 },
          "detectedAt": "YYYY-MM-DDTHH:mm:ssZ",
          "sourceUrl": "https://official-provider.example/pricing",
          "verifiedAt": "YYYY-MM-DD",
          "changeType": "permanent-change"
        }
      ]
    }
  ]
}
```

Use the compact top-level `per1M` form while only one price is known. Convert to ordered `rates` when a price changes. Only `input` and `output` are mandatory in `per1M`. Include optional keys only when the provider and report inputs support that token class. A period uses an official `effectiveDate` when published; otherwise it requires the first UTC `detectedAt`.

## Review checklist

- Every source URL is HTTPS and provider-owned.
- Every changed rate is visible on an official page on the verification date.
- Specific patterns precede generic wildcard patterns.
- Model patterns do not accidentally cover a differently priced sibling.
- Promotions include an end date and the next known rate.
- Rate periods are strictly ordered, non-overlapping, and retain every prior price.
- Changed prices without an official effective date use their first UTC detection time.
- Unsupported per-request tiers and non-token fees are explicit in `notes`.
- All report catalogs are synchronized and all tests pass.
