import type { Fund } from '../types'

const SLOTS = 6
const OTHER = 'var(--series-other)'

/**
 * The colour each allocation wears in the Funds bars (2026-11-11): the
 * Analytics palette, validated for colour-blind separation, given out in the
 * order the API lists the allocations — so a colour follows its allocation,
 * not its rank in any one wallet, and a wallet's bar and an allocation's page
 * agree. Unallocated is the grey, as "Others" is in Analytics; past six,
 * the rest share it too rather than inventing a seventh hue (one failed the
 * check at the ring's close).
 */
export function fundColors(funds: Fund[]): Map<string, string> {
  const colors = new Map<string, string>()
  let slot = 0
  for (const fund of funds) {
    if (fund.is_unallocated || slot >= SLOTS) {
      colors.set(fund.id, OTHER)
      continue
    }
    slot += 1
    colors.set(fund.id, `var(--series-${slot})`)
  }
  return colors
}

export const OTHER_FUND_COLOR = OTHER
