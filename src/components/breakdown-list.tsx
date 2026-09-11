import { formatMoney } from '@/lib/money'

export type BreakdownItem = {
  id: string
  label: string
  /** Decimal string, as the API sends it. */
  amount: string
}

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * Whole percentages that always add up to exactly 100 — largest remainder,
 * the same rule income splits use: round each share down, then hand the
 * missing points to the shares that lost the most (ties to the first). Plain
 * rounding would show 87.5% + 12.5% as 88% + 13%.
 */
function wholePercents(cents: number[], totalCents: number): number[] {
  const exact = cents.map((c) => (c * 100) / totalCents)
  const percents = exact.map(Math.floor)
  const missing = 100 - percents.reduce((sum, p) => sum + p, 0)
  exact
    .map((value, index) => ({ lost: value - percents[index], index }))
    .sort((a, b) => b.lost - a.lost || a.index - b.index)
    .slice(0, missing)
    .forEach(({ index }) => (percents[index] += 1))
  return percents
}

/**
 * How a total splits into parts: each part's amount, its share, and a bar
 * of that share. The two sides of the same ledger use it — a wallet's funds,
 * and a fund's wallets — so both read alike.
 *
 * Shares are worked out in integer cents; the bars are drawn from the exact
 * ratio, the labels from `wholePercents`. A real share that rounds to 0%
 * reads "<1%" rather than claiming to be nothing.
 */
export function BreakdownList({
  items,
  empty,
}: {
  /** The parts, in the order to show them (largest first, by convention). */
  items: BreakdownItem[]
  /** What to say when there are no parts. */
  empty: string
}) {
  const totalCents = items.reduce((sum, item) => sum + centsOf(item.amount), 0)

  if (items.length === 0 || totalCents === 0) {
    return <p className="text-sm text-muted-foreground">{empty}</p>
  }

  const cents = items.map((item) => centsOf(item.amount))
  const percents = wholePercents(cents, totalCents)

  return (
    <ul className="space-y-3">
      {items.map((item, index) => {
        const share = percents[index]
        return (
          <li key={item.id} className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate">{item.label}</span>
              <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
                {formatMoney(item.amount)}
                <span className="w-9 text-right text-xs text-muted-foreground">
                  {share === 0 && cents[index] > 0 ? '<1%' : `${share}%`}
                </span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden="true">
              <div
                className="h-full rounded-full bg-primary"
                style={{ width: `${(cents[index] / totalCents) * 100}%` }}
              />
            </div>
          </li>
        )
      })}
    </ul>
  )
}
