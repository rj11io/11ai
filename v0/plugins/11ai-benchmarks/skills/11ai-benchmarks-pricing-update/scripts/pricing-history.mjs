const parseTime = (value) => {
  if (!value) return null
  const time = new Date(value).getTime()
  return Number.isFinite(time) ? time : null
}

const asIso = (time) => Number.isFinite(time) ? new Date(time).toISOString() : null

const globRegex = (pattern) => new RegExp("^" + String(pattern).split("*").map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + "$", "i")

function effectiveTime(catalog, rate) {
  return parseTime(rate.effectiveDate) ?? parseTime(rate.detectedAt) ?? parseTime(catalog.detectedAt) ?? parseTime(rate.verifiedAt)
}

function rateVersions(catalog, entry) {
  const rates = Array.isArray(entry.rates) ? entry.rates : [entry]
  return rates.map((rate, index) => ({
    ...rate,
    _index: index,
    _effectiveTime: effectiveTime(catalog, rate),
    _dateBasis: rate.effectiveDate ? "official" : "detected",
  })).sort((a, b) => a._effectiveTime - b._effectiveTime)
}

export function findPricingEntry(catalog, provider, model) {
  return (catalog.models ?? []).find((entry) => (!entry.provider || entry.provider === provider) && (entry.match ?? []).some((pattern) => globRegex(pattern).test(model ?? ""))) ?? null
}

export function resolveHistoricalPrice(catalog, { provider, model, startedAt = null, finishedAt = null, attributedAt = null, now = new Date().toISOString() }) {
  const entry = findPricingEntry(catalog, provider, model)
  if (!entry) return null
  const versions = rateVersions(catalog, entry)
  if (!versions.length || versions.some((rate) => !Number.isFinite(rate._effectiveTime))) return null

  const startTime = parseTime(startedAt)
  const finishTime = parseTime(finishedAt)
  const attributedTime = parseTime(attributedAt) ?? finishTime ?? startTime
  const nowTime = parseTime(now) ?? Date.now()
  let selectionTime = attributedTime
  let temporalStatus = "effective-period"

  if (!Number.isFinite(selectionTime)) {
    selectionTime = nowTime
    temporalStatus = "latest-available-fallback"
  }

  let selectedIndex = -1
  for (let index = 0; index < versions.length; index += 1) {
    if (versions[index]._effectiveTime <= selectionTime) selectedIndex = index
  }
  if (selectedIndex < 0) {
    selectedIndex = 0
    temporalStatus = "earliest-available-fallback"
  }

  const crossedBoundary = Number.isFinite(startTime) && Number.isFinite(finishTime) && versions.some((rate, index) => index > 0 && rate._effectiveTime > startTime && rate._effectiveTime <= finishTime)
  if (crossedBoundary && temporalStatus === "effective-period") temporalStatus = "main-price-boundary-fallback"

  const rate = versions[selectedIndex]
  const next = versions[selectedIndex + 1]
  return {
    entry,
    rate,
    temporalStatus,
    crossedBoundary,
    attributedAt: asIso(attributedTime),
    effectiveFrom: asIso(rate._effectiveTime),
    effectiveTo: next ? asIso(next._effectiveTime) : null,
    dateBasis: rate._dateBasis,
  }
}

export function pricingAgeDays(rate, now = new Date().toISOString()) {
  const verified = parseTime(rate?.verifiedAt)
  const current = parseTime(now)
  return Number.isFinite(verified) && Number.isFinite(current) ? Math.max(0, (current - verified) / 86400000) : null
}

export const TEMPORAL_PRICING_STATUSES = [
  "effective-period",
  "main-price-boundary-fallback",
  "earliest-available-fallback",
  "latest-available-fallback",
]
