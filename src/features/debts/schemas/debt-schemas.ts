import { z } from 'zod'

const cents = (amount: string) => Math.round(Number(amount || '0') * 100)

/** Adding or editing a debt. The API is the authority; this shows mistakes
 * next to their field instead of as a 422. */
export const debtSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Give it a name.')
      .max(100, 'Keep the name under 100 characters.'),
    lender: z.string().max(100, 'Keep the lender under 100 characters.'),
    principal: z.string(),
    /** Blank means there is no minimum — it is optional. */
    minimum_payment: z.string(),
    opened_on: z.string().min(1, 'Choose when it started.'),
    rate_kind: z.enum(['fixed', 'variable']),
    /** Blank means interest-free — no rate is recorded at all. */
    monthly_rate: z.string(),
    /** Blank means open-ended: no term, so no interest can be worked out. */
    tenure_months: z.string(),
    note: z.string().max(500, 'Keep the note under 500 characters.'),
  })
  .superRefine((values, ctx) => {
    if (cents(values.principal) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter what you borrowed.',
        path: ['principal'],
      })
    }
    if (values.minimum_payment.trim() !== '' && cents(values.minimum_payment) <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Leave it blank if there is no minimum.',
        path: ['minimum_payment'],
      })
    }
    if (values.monthly_rate.trim() !== '') {
      const rate = Number(values.monthly_rate)
      if (Number.isNaN(rate) || rate < 0 || rate > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a monthly rate between 0 and 100.',
          path: ['monthly_rate'],
        })
      }
    }
    if (values.tenure_months.trim() !== '') {
      const months = Number(values.tenure_months)
      if (!Number.isInteger(months) || months < 1 || months > 1200) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a whole number of months.',
          path: ['tenure_months'],
        })
      }
    }
  })

export type DebtFormValues = z.infer<typeof debtSchema>

/** A rate change: what it became, and the day it took effect. */
export const rateSchema = z.object({
  monthly_rate: z
    .string()
    .min(1, 'Enter a rate.')
    .refine((value) => {
      const rate = Number(value)
      return !Number.isNaN(rate) && rate >= 0 && rate <= 100
    }, 'Enter a monthly rate between 0 and 100.'),
  effective_from: z.string().min(1, 'Choose when it took effect.'),
})

export type RateFormValues = z.infer<typeof rateSchema>

/** Something added to the debt — a fee, billed interest, a restructure. */
export const chargeSchema = z
  .object({
    amount: z.string(),
    charged_on: z.string().min(1, 'Choose when it was added.'),
    note: z.string().max(500, 'Keep the note under 500 characters.'),
  })
  .superRefine((values, ctx) => {
    if (cents(values.amount) <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter an amount.', path: ['amount'] })
    }
  })

export type ChargeFormValues = z.infer<typeof chargeSchema>
