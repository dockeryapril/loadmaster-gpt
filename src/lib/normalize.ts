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
})

export type LoadExtract = z.infer<typeof LoadExtractSchema>

export const validateAndNormalize = (input: unknown) => {
  const result = LoadExtractSchema.safeParse(input)
  if (result.success) return { data: result.data }
  return { issues: result.error.issues }
}

export const findWarnings = (extract: LoadExtract): string[] => {
  const warnings: string[] = []
  if (extract.weightLbs && extract.weightLbs > 80000) warnings.push("Overweight load")
  if (extract.widthFt && extract.widthFt > 8.5) warnings.push("Overwidth load")
  if (extract.heightFt && extract.heightFt > 13.5) warnings.push("Overheight load")
  return warnings
}

