/**
 * The API's `allocations.service.split_by_weight`, mirrored for the income
 * drawer's live preview — so "Each allocation gets" shows exactly what the
 * ledger will write, to the centavo. The API stays the authority; this only
 * previews it. Keep the two in step (CLAUDE.md invariant 4).
 *
 * Largest remainder, in integer cents:
 * 1. each share is the exact share rounded DOWN to the cent;
 * 2. the cents that left over go one at a time to the largest remainders;
 * 3. ties go to the one listed first (the allocation's `position` order).
 *
 * e.g. 100 cents by 1 : 1 : 1 → 34, 33, 33 (all remainders equal, the first wins).
 */
export function splitByWeight<T>(
  totalCents: number,
  weights: { key: T; weight: number }[],
): { key: T; cents: number }[] {
  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0)
  if (totalCents <= 0 || totalWeight <= 0) return weights.map(({ key }) => ({ key, cents: 0 }))

  // BigInt, like Python's ints: an edit re-splits by the old legs' CENTS as
  // weights, and cents × cents passes 2^53 on a ₱1M income.
  const total = BigInt(totalCents)
  const sumWeights = BigInt(totalWeight)
  const shares = weights.map(({ weight }, index) => {
    const exact = total * BigInt(weight)
    return { index, floor: exact / sumWeights, remainder: exact % sumWeights }
  })

  let leftover = total - shares.reduce((sum, share) => sum + share.floor, 0n)
  // Largest remainder first; among equals, the earlier one.
  const byRemainder = [...shares].sort((a, b) =>
    a.remainder === b.remainder ? a.index - b.index : a.remainder > b.remainder ? -1 : 1,
  )
  for (const share of byRemainder) {
    if (leftover === 0n) break
    share.floor += 1n
    leftover -= 1n
  }

  return weights.map(({ key }, index) => ({ key, cents: Number(shares[index].floor) }))
}
