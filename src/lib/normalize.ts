import { z } from "zod"

export const coerce = (value: unknown): number | undefined => {
  if (typeof value === "number" && !Number.isNaN(value)) return value
  if (typeof value !== "string") return undefined
  const cleaned = value.replace(/[^0-9.-]/g, "")
  const num = parseFloat(cleaned)
  return Number.isNaN(num) ? undefined : num
}

const numeric = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === undefined || v === null ? undefined : coerce(v)),
    z.number().min(min).max(max)
  )

export const LoadExtractSchema = z.object({
  distanceMi: numeric(0, 100000).optional(),
  offerFlat: numeric(0, 1_000_000).optional(),
  weightLbs: numeric(0, 200_000).optional(),
  widthFt: numeric(0, 20).optional(),
  heightFt: numeric(0, 20).optional(),
  stops: numeric(0, 100).optional(),
  tarp: z.coerce.boolean().optional(),
  jobsite: z.coerce.boolean().optional(),
  itemType: z.string().optional(),
  pickupAt: z.coerce.date().optional(),
  detentionPay: numeric(0, 10_000).optional(),
  lumperPay: numeric(0, 5_000).optional(),
  layoverPay: numeric(0, 5_000).optional(),
  hazmatPay: numeric(0, 10_000).optional(),
})

export type LoadExtract = z.infer<typeof LoadExtractSchema>

export const validateAndNormalize = (input: unknown) => {
  const result = LoadExtractSchema.safeParse(input)
  if (result.success) return { data: result.data }
  return { issues: result.error.issues }
}

export const findWarnings = (extract: LoadExtract): string[] => {
  const warnings: string[] = []
  
  // Weight warnings
  if (extract.weightLbs && extract.weightLbs > 80000) warnings.push("Overweight load - may require permits")
  if (extract.weightLbs && extract.weightLbs < 100) warnings.push("Unusually light load - verify weight")
  
  // Dimension warnings  
  if (extract.widthFt && extract.widthFt > 8.5) warnings.push("Overwidth load - may require permits")
  if (extract.heightFt && extract.heightFt > 13.5) warnings.push("Overheight load - may require permits")
  
  // Distance warnings
  if (extract.distanceMi && extract.distanceMi > 2500) warnings.push("Very long haul - verify miles")
  if (extract.distanceMi && extract.distanceMi < 10) warnings.push("Very short haul - verify miles")
  
  // Rate warnings
  if (extract.offerFlat && extract.distanceMi) {
    const rpm = extract.offerFlat / extract.distanceMi
    if (rpm < 1.0) warnings.push("Low RPM - below $1.00 per mile")
    if (rpm > 10.0) warnings.push("Very high RPM - verify rate")
  }
  
  // Accessorial warnings
  if (extract.detentionPay && extract.detentionPay > 2000) warnings.push("High detention pay - verify amount")
  if (extract.lumperPay && extract.lumperPay > 1000) warnings.push("High lumper fee - verify amount")
  if (extract.layoverPay && extract.layoverPay > 1000) warnings.push("High layover pay - verify amount")
  if (extract.hazmatPay && extract.hazmatPay > 2000) warnings.push("High hazmat premium - verify amount")
  
  return warnings
}

