import type { Transaction } from '../types'
import { formatActivityDate, localToday } from './transaction-meta'

/** "Today", "Yesterday", or the date — the heading over a day's entries. */
export function dayHeading(isoDate: string): string {
  const today = localToday()
  const [y, m, d] = today.split('-').map(Number)
  const yesterday = new Date(y, m - 1, d - 1)
  const pad = (n: number) => String(n).padStart(2, '0')
  const yesterdayIso = `${yesterday.getFullYear()}-${pad(yesterday.getMonth() + 1)}-${pad(yesterday.getDate())}`

  if (isoDate === today) return 'Today'
  if (isoDate === yesterdayIso) return 'Yesterday'
  return formatActivityDate(isoDate)
}

/** Consecutive entries grouped by day. The API already sorts newest first. */
export function byDay(entries: Transaction[]): Array<{ date: string; entries: Transaction[] }> {
  const groups: Array<{ date: string; entries: Transaction[] }> = []
  for (const entry of entries) {
    const last = groups.at(-1)
    if (last?.date === entry.date) {
      last.entries.push(entry)
    } else {
      groups.push({ date: entry.date, entries: [entry] })
    }
  }
  return groups
}
