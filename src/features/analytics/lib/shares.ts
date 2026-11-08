import { wholePercents } from '@/lib/percents'

import type { NoteTotal } from '../types'

/**
 * How many notes get a slice of their own. The pie's palette is seven hues
 * validated for colour-blind separation next to each other (`--series-1`…
 * `--series-7` in index.css); an eighth slice would need a generated hue, so
 * everything past them folds into "Others".
 */
export const PIE_SLOTS = 7

const OTHERS_COLOR = 'var(--series-other)'

/** One note as both views show it: its share, and the colour it wears. */
export type Share = NoteTotal & {
  cents: number
  /** Whole percent; the window's add up to exactly 100. */
  percent: number
  /** Its slice's colour — grey when it is part of "Others". */
  color: string
}

export type Slice = { key: string; label: string; cents: number; percent: number; color: string }

/**
 * The window's notes with their shares and colours, biggest first.
 *
 * The seven biggest NOTED groups get a hue each, in the palette's fixed
 * order. The entries with no note — "Others" — and any notes past the
 * seventh share the grey: they are the one "Others" slice of the pie.
 */
export function sharesOf(notes: NoteTotal[]): Share[] {
  const cents = notes.map((group) => Math.round(Number(group.total) * 100))
  const total = cents.reduce((sum, c) => sum + c, 0)
  const percents = total > 0 ? wholePercents(cents, total) : cents.map(() => 0)

  let hue = 0
  return notes.map((group, index) => {
    const own = group.note !== null && hue < PIE_SLOTS
    if (own) hue += 1
    return {
      ...group,
      cents: cents[index],
      percent: percents[index],
      color: own ? `var(--series-${hue})` : OTHERS_COLOR,
    }
  })
}

/** The pie's slices: a slice per coloured note, then "Others" for the rest. */
export function slicesOf(shares: Share[]): { slices: Slice[]; folded: number } {
  const own = shares.filter((share) => share.color !== OTHERS_COLOR)
  const rest = shares.filter((share) => share.color === OTHERS_COLOR)
  const slices: Slice[] = own.map((share) => ({
    key: share.note ?? '',
    label: share.note ?? '',
    cents: share.cents,
    percent: share.percent,
    color: share.color,
  }))

  if (rest.length > 0) {
    slices.push({
      key: '\u0000others',
      label: 'Others',
      cents: rest.reduce((sum, share) => sum + share.cents, 0),
      percent: rest.reduce((sum, share) => sum + share.percent, 0),
      color: OTHERS_COLOR,
    })
  }
  // Notes folded in beside the no-note expenses — worth saying under the pie.
  return { slices, folded: rest.filter((share) => share.note !== null).length }
}
