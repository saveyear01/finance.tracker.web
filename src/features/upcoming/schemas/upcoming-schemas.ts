import { z } from 'zod'

const cents = (amount: string) => Math.round(Number(amount || '0') * 100)

/** Adding or editing a bill. The API is the authority; this shows mistakes
 * next to their field instead of as a 422. */
export const upcomingSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Give it a name.')
      .max(100, 'Keep the name under 100 characters.'),
    amount: z.string(),
    due_date: z.string().min(1, 'Choose when it is due.'),
    recurrence: z.enum(['none', 'monthly', 'yearly']),
    note: z.string().max(500, 'Keep the note under 500 characters.'),
  })
  .superRefine((values, ctx) => {
    if (cents(values.amount) <= 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Enter an amount.', path: ['amount'] })
    }
  })

export type UpcomingFormValues = z.infer<typeof upcomingSchema>
