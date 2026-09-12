import { apiClient, unwrap } from '@/lib/api-client'

import type {
  Debt,
  DebtChargeInput,
  DebtCreateInput,
  DebtPaymentInput,
  DebtRateInput,
  DebtUpdateInput,
} from '../types'

/** `GET /debts/` — every debt of the household, still-owed ones first. */
export function listDebts(): Promise<Debt[]> {
  return unwrap(apiClient.get<Debt[]>('/debts/'))
}

/** `GET /debts/{id}/` — one debt with its rates, charges and payments. */
export function getDebt(id: string): Promise<Debt> {
  return unwrap(apiClient.get<Debt>(`/debts/${id}/`))
}

export function createDebt(input: DebtCreateInput): Promise<Debt> {
  return unwrap(apiClient.post<Debt>('/debts/', input))
}

export function updateDebt({ id, input }: { id: string; input: DebtUpdateInput }): Promise<Debt> {
  return unwrap(apiClient.put<Debt>(`/debts/${id}/`, input))
}

export function deleteDebt(id: string): Promise<void> {
  return unwrap(apiClient.delete<void>(`/debts/${id}/`))
}

/**
 * Pay towards a debt: records a real expense in the ledger and links it.
 * What's left comes down by what was paid. A 409 `insufficient_funds` (with
 * `details.available`) when the fund can't cover it, or `debt_paid_off`.
 */
export function payDebt({ id, input }: { id: string; input: DebtPaymentInput }): Promise<Debt> {
  return unwrap(apiClient.post<Debt>(`/debts/${id}/payments/`, input))
}

/** Add to what a debt owes — a fee, billed interest, a restructure. No
 * money moves, so nothing is written to the ledger. */
export function addCharge({ id, input }: { id: string; input: DebtChargeInput }): Promise<Debt> {
  return unwrap(apiClient.post<Debt>(`/debts/${id}/charges/`, input))
}

export function updateCharge({
  id,
  chargeId,
  input,
}: {
  id: string
  chargeId: string
  input: DebtChargeInput
}): Promise<Debt> {
  return unwrap(apiClient.put<Debt>(`/debts/${id}/charges/${chargeId}/`, input))
}

export function deleteCharge({ id, chargeId }: { id: string; chargeId: string }): Promise<Debt> {
  return unwrap(apiClient.delete<Debt>(`/debts/${id}/charges/${chargeId}/`))
}

/** Record a rate change. Variable-rate debts only — a fixed one keeps the
 * single rate it has (409 `debt_rate_fixed`); change that one instead. */
export function addRate({ id, input }: { id: string; input: DebtRateInput }): Promise<Debt> {
  return unwrap(apiClient.post<Debt>(`/debts/${id}/rates/`, input))
}

export function updateRate({
  id,
  rateId,
  input,
}: {
  id: string
  rateId: string
  input: DebtRateInput
}): Promise<Debt> {
  return unwrap(apiClient.put<Debt>(`/debts/${id}/rates/${rateId}/`, input))
}

/** Drop a rate change. The last rate can't go (409 `debt_rate_last`). */
export function deleteRate({ id, rateId }: { id: string; rateId: string }): Promise<Debt> {
  return unwrap(apiClient.delete<Debt>(`/debts/${id}/rates/${rateId}/`))
}
