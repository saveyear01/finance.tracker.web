import type { MouseEvent } from 'react'

/**
 * Whether a click on a clickable table row was on the row itself — not on a
 * button or link inside it (those do their own thing), nor inside a menu
 * that React bubbles up from its portal to the row it was opened from.
 */
export function isRowClick(event: MouseEvent<HTMLElement>): boolean {
  const target = event.target as HTMLElement
  return event.currentTarget.contains(target) && !target.closest('button, a')
}
