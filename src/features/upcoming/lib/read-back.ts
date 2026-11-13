import type { Recurrence } from '../types'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** 1 → "1st", 22 → "22nd", 13 → "13th". */
function ordinal(day: number): string {
  const teen = day % 100 >= 11 && day % 100 <= 13
  const suffix = teen ? 'th' : ({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[day % 10]
  return `${day}${suffix ?? 'th'}`
}

/**
 * The bill's plan read back in words, under the date and Repeats fields —
 * "Then every month on the 15th." — so the choice is checked before saving.
 * Mirrors how the API computes later due dates: monthly is anchored to the
 * first date's day (the 31st falls back to a shorter month's last day), and
 * yearly keeps the date (29 Feb → 28 Feb in a common year). Null with no date.
 */
export function readBack(dueDate: string, recurrence: Recurrence): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dueDate)
  if (!match) return null
  const month = MONTHS[Number(match[2]) - 1]
  const day = Number(match[3])
  if (!month) return null

  switch (recurrence) {
    case 'none':
      return `Once, on ${month} ${day}.`
    case 'monthly':
      return day > 28
        ? `Then every month on the ${ordinal(day)}, or the last day of a shorter month.`
        : `Then every month on the ${ordinal(day)}.`
    case 'yearly':
      return month === 'Feb' && day === 29
        ? 'Then every year on Feb 29, or Feb 28 when there is none.'
        : `Then every year on ${month} ${day}.`
  }
}
