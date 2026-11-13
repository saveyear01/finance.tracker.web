import { formatMoney } from '@/lib/money'

import type { Transaction } from '../types'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)
const pair = (leg: Transaction) => `${leg.wallet_name} · ${leg.fund_name ?? 'No allocation'}`
const money = (cents: number) => formatMoney(Math.abs(cents) / 100)

/**
 * What deleting an action does to the balances, in one sentence — the
 * reverse of each leg: money a leg took out goes back, money it put in comes
 * out. Read from the legs themselves, so it holds for every kind of action
 * (a split income, a move, an old reversal) without a case per type.
 *
 * "₱2,140.00 goes back to BDO · Necessity."
 * "₱42,000.00 comes out of BDO: Necessity ₱21,000.00, Savings ₱12,600.00."
 * "₱500.00 goes back to BDO · Necessity from GCash · Necessity."
 */
export function deleteEffect(legs: Transaction[]): string {
  const out = legs.filter((leg) => centsOf(leg.amount) < 0)
  const into = legs.filter((leg) => centsOf(leg.amount) > 0)
  const total = (some: Transaction[]) => some.reduce((sum, leg) => sum + centsOf(leg.amount), 0)

  // A move or a transfer: one side gets back what the other gives up.
  if (out.length > 0 && into.length > 0) {
    return `${money(total(into))} goes back to ${out.map(pair).join(', ')} from ${into
      .map(pair)
      .join(', ')}.`
  }
  if (out.length > 0) {
    return `${money(total(out))} goes back to ${out.map(pair).join(', ')}.`
  }
  if (into.length === 1) {
    return `${money(total(into))} comes out of ${pair(into[0])}.`
  }
  // A split income: one wallet, several allocations — name each share.
  const wallets = new Set(into.map((leg) => leg.wallet_name))
  const shares = into
    .map((leg) =>
      wallets.size === 1
        ? `${leg.fund_name ?? 'No allocation'} ${money(centsOf(leg.amount))}`
        : `${pair(leg)} ${money(centsOf(leg.amount))}`,
    )
    .join(', ')
  return wallets.size === 1
    ? `${money(total(into))} comes out of ${into[0].wallet_name}: ${shares}.`
    : `${money(total(into))} comes out of ${shares}.`
}
