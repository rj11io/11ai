# Official provider pricing sources

Use these primary pages as the starting point. Re-open them on every refresh because prices, model IDs, promotions, and tier rules change.

| Provider key | Official source | Catalog cautions |
| --- | --- | --- |
| `anthropic` | <https://platform.claude.com/docs/en/about-claude/pricing> | Input, 5-minute cache writes, 1-hour cache writes, cache reads, and output are separate token classes. Check promotions and their expiry dates. |
| `openai` | <https://developers.openai.com/api/docs/pricing> | Use standard processing rates. Long-context, cache-write, batch, flex, and priority rates require separately attributable usage. |
| `google` | <https://ai.google.dev/gemini-api/docs/pricing> | Prefer text/image/video input when one row separates audio. Note context tiers, cache storage, grounding, and tool charges. |
| `xai` | <https://docs.x.ai/developers/pricing> | Use short-context text rates. Note the per-request long-context threshold, batch discounts, regional differences, and tool charges. |
| `deepseek` | <https://api-docs.deepseek.com/quick_start/pricing> | Map cache-hit to `cachedInput` and cache-miss to `input`. |
| `mistral` | <https://mistral.ai/pricing/api/> | Use serverless API text-token rates, not self-deployment or fine-tuning prices. |
| `cohere` | <https://docs.cohere.com/docs/command-a> | Verify the exact dated model ID. Do not assign paid rates to free-preview or Model Vault-only variants without a published price. |
| `perplexity` | <https://docs.perplexity.ai/docs/getting-started/pricing> | Token prices may be only one component; disclose request, search, and citation-related charges that the reports cannot derive. |

## Catalog schema

```json
{
  "version": 2,
  "updatedAt": "YYYY-MM-DD",
  "comment": "Scope and exclusions.",
  "models": [
    {
      "match": ["specific-model-id*", "documented-alias"],
      "provider": "provider-key",
      "per1M": {
        "input": 0,
        "cachedInput": null,
        "output": 0,
        "cacheWrite5m": 0,
        "cacheWrite1h": 0,
        "cacheRead": 0
      },
      "effectiveDate": "YYYY-MM-DD",
      "sourceUrl": "https://official-provider.example/pricing",
      "verifiedAt": "YYYY-MM-DD",
      "notes": "Material tiers, promotions, and exclusions."
    }
  ]
}
```

Only `input` and `output` are mandatory in `per1M`. Include optional keys only when the provider and report inputs support that token class.

## Review checklist

- Every source URL is HTTPS and provider-owned.
- Every changed rate is visible on an official page on the verification date.
- Specific patterns precede generic wildcard patterns.
- Model patterns do not accidentally cover a differently priced sibling.
- Promotions include an end date and the next known rate.
- Unsupported per-request tiers and non-token fees are explicit in `notes`.
- All report catalogs are synchronized and all tests pass.
