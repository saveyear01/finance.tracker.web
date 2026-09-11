import { z } from 'zod'

/**
 * The allocation form. Percentages are strings while typed (an empty box is
 * not 0), and mirror the API: whole numbers 1–100, each fund once, and a
 * total of exactly 100 — or no rows at all, which clears the allocation.
 */
export const allocationSchema = z
  .object({
    rules: z.array(
      z.object({
        fund_id: z.string().min(1, 'Choose an allocation.'),
        percentage: z
          .string()
          .trim()
          .regex(/^\d+$/, 'Whole numbers only.')
          .refine((value) => Number(value) >= 1 && Number(value) <= 100, 'Between 1 and 100.'),
      }),
    ),
  })
  .superRefine(({ rules }, ctx) => {
    const seen = new Set<string>()
    rules.forEach((rule, index) => {
      if (rule.fund_id && seen.has(rule.fund_id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['rules', index, 'fund_id'],
          message: 'This allocation is already in the list.',
        })
      }
      seen.add(rule.fund_id)
    })

    if (rules.length > 0 && totalOf(rules) !== 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['rules'],
        message: 'Percentages must add up to 100%.',
      })
    }
  })

export type AllocationFormValues = z.infer<typeof allocationSchema>

/** The running total; rows still being typed count as 0. */
export function totalOf(rules: Array<{ percentage: string }>): number {
  return rules.reduce((sum, rule) => {
    const value = Number(rule.percentage)
    return sum + (Number.isInteger(value) ? value : 0)
  }, 0)
}
