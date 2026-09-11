/** One fund's share of every income (`AllocationRuleRead`). */
export type AllocationRule = {
  fund_id: string
  fund_name: string
  /** Whole number, 1–100. */
  percentage: number
}

/**
 * Response of `GET /api/allocation-rules/`. `rules` is empty when there is no
 * allocation (income stays in Unallocated); otherwise it totals exactly 100.
 */
export type Allocation = {
  rules: AllocationRule[]
}

/** Input for `PUT /api/allocation-rules/` — the whole set, in order. */
export type AllocationWrite = {
  rules: Array<{ fund_id: string; percentage: number }>
}
