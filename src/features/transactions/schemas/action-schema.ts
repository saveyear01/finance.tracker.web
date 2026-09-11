import { z } from 'zod'

import type { EditableAction } from '../types'

/**
 * One form shape for all four actions (and the adjustment, when editing); which fields are required depends on
 * the action. The API is the authority — these rules exist so a mistake is
 * shown next to its field instead of coming back as a 422.
 */
export const actionFormSchema = z.object({
  action: z.enum(['income', 'expense', 'reallocation', 'transfer', 'adjustment']),
  wallet_id: z.string(),
  to_wallet_id: z.string(),
  fund_id: z.string(),
  to_fund_id: z.string(),
  auto_allocate: z.boolean(),
  amount: z.string(),
  note: z.string().max(500, 'Keep the note under 500 characters.'),
  date: z.string().min(1, 'Choose a date.'),
  /**
   * Cents available at the source, or null when the action takes nothing out
   * (income). Filled in by the drawer from the cached fund holdings.
   */
  available_cents: z.number().nullable(),
})

export type ActionFormValues = z.infer<typeof actionFormSchema>

const required = (message: string) => ({ code: z.ZodIssueCode.custom, message })

export const actionSchema = actionFormSchema.superRefine((values, ctx) => {
  const need = (field: keyof ActionFormValues, message: string) => {
    if (!values[field]) ctx.addIssue({ ...required(message), path: [field] })
  }
  const action: EditableAction = values.action

  need('wallet_id', action === 'transfer' ? 'Choose where it comes from.' : 'Choose a wallet.')
  if (action === 'income' && !values.auto_allocate) need('fund_id', 'Choose a fund.')
  if (action === 'expense' || action === 'adjustment') need('fund_id', 'Choose a fund.')
  if (action === 'reallocation') {
    need('fund_id', 'Choose where it comes from.')
    need('to_fund_id', 'Choose where it goes.')
  }
  if (action === 'transfer') {
    need('fund_id', 'Choose which fund is moving.')
    need('to_wallet_id', 'Choose where it goes.')
  }

  const cents = Math.round(Number(values.amount || '0') * 100)
  if (cents <= 0) {
    ctx.addIssue({ ...required('Enter an amount.'), path: ['amount'] })
  } else if (values.available_cents !== null && cents > values.available_cents) {
    ctx.addIssue({ ...required("That's more than is available."), path: ['amount'] })
  }
})
