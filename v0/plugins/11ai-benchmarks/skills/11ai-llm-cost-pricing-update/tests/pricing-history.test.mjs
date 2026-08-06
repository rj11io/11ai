import assert from "node:assert/strict"
import test from "node:test"
import { resolveHistoricalPrice } from "../scripts/pricing-history.mjs"

const catalog = {
  version: 3,
  detectedAt: "2026-01-01T12:00:00Z",
  models: [{
    provider: "openai",
    match: ["temporal-model*"],
    rates: [
      { effectiveDate: "2026-01-01", verifiedAt: "2026-01-01", sourceUrl: "https://openai.com/api/pricing/", per1M: { input: 1, output: 2 } },
      { effectiveDate: "2026-02-01", verifiedAt: "2026-01-20", sourceUrl: "https://openai.com/api/pricing/", per1M: { input: 0.5, output: 1 }, changeType: "temporary-discount" },
      { effectiveDate: "2026-03-01", verifiedAt: "2026-01-20", sourceUrl: "https://openai.com/api/pricing/", per1M: { input: 2, output: 4 }, changeType: "promotion-successor" },
    ],
  }],
}

test("selects the price period effective at the thread attribution date", () => {
  const result = resolveHistoricalPrice(catalog, { provider: "openai", model: "temporal-model-1", startedAt: "2026-02-10T10:00:00Z", finishedAt: "2026-02-10T10:05:00Z" })
  assert.equal(result.rate.per1M.input, 0.5)
  assert.equal(result.temporalStatus, "effective-period")
  assert.equal(result.effectiveFrom, "2026-02-01T00:00:00.000Z")
  assert.equal(result.effectiveTo, "2026-03-01T00:00:00.000Z")
  assert.equal(result.dateBasis, "official")
})

test("uses the main price at the finish date when an aggregated thread crosses a boundary", () => {
  const result = resolveHistoricalPrice(catalog, { provider: "openai", model: "temporal-model-1", startedAt: "2026-01-31T23:59:00Z", finishedAt: "2026-02-01T00:01:00Z" })
  assert.equal(result.rate.per1M.input, 0.5)
  assert.equal(result.temporalStatus, "main-price-boundary-fallback")
  assert.equal(result.crossedBoundary, true)
})

test("uses the earliest available rate when usage predates known history", () => {
  const result = resolveHistoricalPrice(catalog, { provider: "openai", model: "temporal-model-1", finishedAt: "2025-12-01T00:00:00Z" })
  assert.equal(result.rate.per1M.input, 1)
  assert.equal(result.temporalStatus, "earliest-available-fallback")
})

test("uses the latest rate active at report time when usage is undated", () => {
  const result = resolveHistoricalPrice(catalog, { provider: "openai", model: "temporal-model-1", now: "2026-02-15T00:00:00Z" })
  assert.equal(result.rate.per1M.input, 0.5)
  assert.equal(result.temporalStatus, "latest-available-fallback")
})

test("uses detected time when an official effective date is unavailable", () => {
  const detectedCatalog = {
    version: 3,
    detectedAt: "2026-01-01T00:00:00Z",
    models: [{ provider: "openai", match: ["detected-model"], rates: [
      { detectedAt: "2026-01-10T12:00:00Z", verifiedAt: "2026-01-10", sourceUrl: "https://openai.com/api/pricing/", per1M: { input: 3, output: 6 } },
      { detectedAt: "2026-02-10T12:00:00Z", verifiedAt: "2026-02-10", sourceUrl: "https://openai.com/api/pricing/", per1M: { input: 2, output: 4 } },
    ] }],
  }
  const result = resolveHistoricalPrice(detectedCatalog, { provider: "openai", model: "detected-model", finishedAt: "2026-02-11T00:00:00Z" })
  assert.equal(result.rate.per1M.input, 2)
  assert.equal(result.dateBasis, "detected")
})
