/**
 * The debt form's live preview of what the API will work out — mirrored from
 * `debts.service.flat_interest` and the monthly payment beside it, in integer
 * cents (BigInt, as a principal × rate × months product outgrows 2^53):
 *
 *   interest        = principal × monthly_rate% × tenure_months   (flat, add-on)
 *   monthly_payment = (principal + interest) / tenure_months
 *
 * each rounded to the centavo HALF UP, as the API's `_money` does. Only a
 * preview: the API is the authority, and keeps it in ONE function there.
 */

/** "1500.5" → 150050n; null for blank or anything that isn't an amount. */
function toCents(value: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{0,2}))?$/.exec(value.trim())
  if (!match) return null
  return BigInt(match[1]) * 100n + BigInt((match[2] ?? '').padEnd(2, '0'))
}

/** "1.5" → 1500n thousandths of a percent — the API keeps 3 decimals. */
function toMilliPercent(value: string): bigint | null {
  const match = /^(\d+)(?:\.(\d{0,3}))?$/.exec(value.trim())
  if (!match) return null
  return BigInt(match[1]) * 1000n + BigInt((match[2] ?? '').padEnd(3, '0'))
}

/** n / d rounded half up, for n ≥ 0 and d > 0. */
const divHalfUp = (n: bigint, d: bigint) => (2n * n + d) / (2n * d)

export type InterestPreview = {
  /** Null until it can be worked out: a principal, a rate and a term. */
  interestCents: number | null
  /** Null until there is a principal and a term. */
  monthlyCents: number | null
  /** Why something is still "—", or null once both are filled in. */
  hint: string | null
}

export function interestPreview({
  principal,
  monthlyRate,
  tenureMonths,
}: {
  principal: string
  monthlyRate: string
  tenureMonths: string
}): InterestPreview {
  const principalCents = toCents(principal)
  const months = /^\d+$/.test(tenureMonths.trim()) ? BigInt(tenureMonths.trim()) : null
  const rate = monthlyRate.trim() === '' ? 0n : toMilliPercent(monthlyRate)
  const hasPrincipal = principalCents !== null && principalCents > 0n
  const hasTerm = months !== null && months > 0n

  if (!hasPrincipal) {
    return { interestCents: null, monthlyCents: null, hint: 'Fills in once you enter what you borrowed.' }
  }
  if (!hasTerm) {
    // Open-ended: no number of months to charge for, nor to divide by.
    return {
      interestCents: null,
      monthlyCents: null,
      hint: 'Add a term to work out the interest and what each month costs.',
    }
  }
  if (rate === null) {
    return { interestCents: null, monthlyCents: null, hint: 'Enter the rate as a number, like 1.5.' }
  }

  // principal × (rate / 100 000 as thousandths of a percent) × months.
  const interest = divHalfUp(principalCents * rate * months, 100_000n)
  const monthly = divHalfUp(principalCents + interest, months)
  return {
    interestCents: Number(interest),
    monthlyCents: Number(monthly),
    hint: monthlyRate.trim() === '' ? 'No rate, so no interest.' : null,
  }
}
