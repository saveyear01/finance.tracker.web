import { apiClient, unwrap } from '@/lib/api-client'

import type {
  Occurrence,
  PaymentInput,
  UpcomingExpense,
  UpcomingExpenseInput,
} from '../types'

/**
 * `GET /upcoming-expenses/due/` — bills due in `month` (YYYY-MM), paid or
 * not, soonest first.
 *
 * `through` (YYYY-MM) widens it from one month to a range ending there — the
 * "later" tab's several months. `carryOverdue` adds every unpaid due date
 * before the window: the current month's tab keeps overdue bills in view.
 * `excludeMonthly` drops bills that repeat every month, which over a long
 * window would otherwise bury everything else.
 */
export function listDue({
  month,
  through,
  carryOverdue,
  excludeMonthly,
}: {
  month: string
  through?: string
  carryOverdue?: boolean
  excludeMonthly?: boolean
}): Promise<Occurrence[]> {
  return unwrap(
    apiClient.get<Occurrence[]>('/upcoming-expenses/due/', {
      params: {
        month,
        ...(through && { through }),
        ...(carryOverdue && { carry_overdue: true }),
        ...(excludeMonthly && { exclude_monthly: true }),
      },
    }),
  )
}

/**
 * `GET /upcoming-expenses/{id}/occurrences/{date}/` — one due date in full:
 * where it stands and every payment towards it. 404 if the bill doesn't fall
 * on that day. Fetched on its own so the occurrence's page works from a link
 * or a reload, not only from the list.
 */
export function getOccurrence({
  id,
  dueDate,
}: {
  id: string
  dueDate: string
}): Promise<Occurrence> {
  return unwrap(apiClient.get<Occurrence>(`/upcoming-expenses/${id}/occurrences/${dueDate}/`))
}

/**
 * `GET /upcoming-expenses/pinned/` — the pinned bills' due dates in `month`
 * (YYYY-MM, the user's current month), paid or not, plus earlier ones still
 * owed: the current month's tab cut down to pinned bills. Home's
 * quick-access list, soonest first.
 */
export function listPinned({ month }: { month: string }): Promise<Occurrence[]> {
  return unwrap(apiClient.get<Occurrence[]>('/upcoming-expenses/pinned/', { params: { month } }))
}

/** Pin a bill to Home. Already pinned: nothing changes. */
export function pinUpcoming(id: string): Promise<UpcomingExpense> {
  return unwrap(apiClient.put<UpcomingExpense>(`/upcoming-expenses/${id}/pin/`))
}

/** Take a bill off Home. Not pinned: nothing changes. */
export function unpinUpcoming(id: string): Promise<UpcomingExpense> {
  return unwrap(apiClient.delete<UpcomingExpense>(`/upcoming-expenses/${id}/pin/`))
}

export function createUpcoming(input: UpcomingExpenseInput): Promise<UpcomingExpense> {
  return unwrap(apiClient.post<UpcomingExpense>('/upcoming-expenses/', input))
}

export function updateUpcoming({
  id,
  input,
}: {
  id: string
  input: UpcomingExpenseInput
}): Promise<UpcomingExpense> {
  return unwrap(apiClient.put<UpcomingExpense>(`/upcoming-expenses/${id}/`, input))
}

export function deleteUpcoming(id: string): Promise<void> {
  return unwrap(apiClient.delete<void>(`/upcoming-expenses/${id}/`))
}

/**
 * Pay towards one due date: records a real expense in the ledger and links
 * it. Less than what's left leaves the rest due; more — or paying one
 * already paid — goes over, and `remaining` comes back negative. A 409
 * `insufficient_funds` (with `details.available`) when the fund can't cover
 * it, or `occurrence_skipped`.
 */
export function payUpcoming({
  id,
  input,
}: {
  id: string
  input: PaymentInput
}): Promise<Occurrence> {
  return unwrap(apiClient.post<Occurrence>(`/upcoming-expenses/${id}/payments/`, input))
}

/** Skip an overdue due date (or the rest of a partly paid one). No money
 * moves. `today` is the user's own date — what "overdue" is measured by. */
export function skipUpcoming({
  id,
  dueDate,
  today,
}: {
  id: string
  dueDate: string
  today: string
}): Promise<Occurrence> {
  return unwrap(
    apiClient.post<Occurrence>(`/upcoming-expenses/${id}/skips/`, {
      due_date: dueDate,
      today,
    }),
  )
}

/** Owe a skipped due date again. */
export function undoSkip({ id, dueDate }: { id: string; dueDate: string }): Promise<void> {
  return unwrap(apiClient.delete<void>(`/upcoming-expenses/${id}/skips/${dueDate}/`))
}
