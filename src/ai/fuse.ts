import type { LoadExtract } from '@/lib/normalize'
import { findWarnings } from '@/lib/normalize'

export interface FusedResult {
  extract: LoadExtract
  confidence: Record<keyof LoadExtract, number>
  warnings: string[]
}

export function fuse(
  ...results: Array<{ data?: LoadExtract | undefined } | undefined>
): FusedResult {
  const keys: (keyof LoadExtract)[] = [
    'distanceMi',
    'offerFlat',
    'weightLbs',
    'widthFt',
    'heightFt',
    'stops',
    'tarp',
    'jobsite',
    'itemType',
    'pickupAt'
  ]
  const extract: LoadExtract = {}
  const confidence: Record<keyof LoadExtract, number> = {
    distanceMi: 0,
    offerFlat: 0,
    weightLbs: 0,
    widthFt: 0,
    heightFt: 0,
    stops: 0,
    tarp: 0,
    jobsite: 0,
    itemType: 0,
    pickupAt: 0
  }
  keys.forEach((k) => {
    const values = results
      .map((r) => r?.data?.[k])
      .filter((v) => v !== undefined)
    if (values.length === 0) return
    extract[k] = values[0] as any
    confidence[k] = values.length === 1 ? 0.6 : values.every((v) => v === values[0]) ? 1 : 0.4
  })
  const warnings = findWarnings(extract)
  return { extract, confidence, warnings }
}

