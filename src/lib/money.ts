import { env } from '@/config/env'

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: env.CURRENCY,
})

/**
 * Format an amount the API sent as a decimal string ("1500.00").
 *
 * Parsed only to format — `Intl` needs a number — never to do arithmetic.
 * Cents are always shown: a rounded balance is a different number from the
 * one the ledger holds.
 */
export function formatMoney(amount: string | number): string {
  return formatter.format(Number(amount))
}
