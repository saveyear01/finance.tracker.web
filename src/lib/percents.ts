/**
 * Whole percentages that always add up to exactly 100 — largest remainder,
 * the same rule income splits use: round each share down, then hand the
 * missing points to the shares that lost the most (ties to the first). Plain
 * rounding would show 87.5% + 12.5% as 88% + 13%.
 */
export function wholePercents(cents: number[], totalCents: number): number[] {
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
