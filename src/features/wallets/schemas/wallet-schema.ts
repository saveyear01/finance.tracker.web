import { z } from 'zod'

import { WALLET_TYPES } from '../types'

/** Digits with up to two decimal places — the API's `decimal_places=2`. */
const AMOUNT = /^\d+(\.\d{1,2})?$/

export const walletSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required.')
    .max(100, 'Name must be 100 characters or fewer.'),
  // Constrained to the same list the API accepts, so an invalid choice is a
  // form error rather than a 422.
  type: z.enum(WALLET_TYPES, {
    errorMap: () => ({ message: 'Choose a type.' }),
  }),
  // Create only. Blank means nothing is in the wallet yet, and is sent as "0".
  // No commas or currency symbols — "1,500" is ambiguous across locales, and
  // guessing wrong would record the wrong amount of money.
  opening_balance: z
    .string()
    .trim()
    .refine(
      (value) => value === '' || AMOUNT.test(value),
      'Enter an amount like 1500 or 1500.50, without commas.',
    ),
})

export type WalletFormValues = z.infer<typeof walletSchema>
