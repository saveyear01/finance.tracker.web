import { Cell, Pie, PieChart } from 'recharts'

import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { formatMoney } from '@/lib/money'

import { slicesOf, type Share, type Slice } from '../lib/shares'

// Colours come from each slice, not from the config; the container still
// wants one.
const config = {} satisfies ChartConfig

/** "₱24.6K" — the donut's centre is for scale; exact figures are in the rows. */
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/** On hover: the value leads, the note and its share follow. */
function SliceTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null
  return (
    <div className="grid min-w-32 gap-1 rounded-lg border border-input bg-popover px-2.5 py-1.5 text-xs">
      <span className="font-semibold text-foreground tabular-nums">
        {formatMoney(slice.cents / 100)}
      </span>
      <span className="flex items-center gap-1.5 text-muted-foreground">
        <span className="h-0.5 w-3 rounded-full" style={{ backgroundColor: slice.color }} />
        {slice.label} · {slice.percent}%
      </span>
    </div>
  )
}

/**
 * The window's money by note, as a donut with the total in its centre: a
 * slice per note for the six biggest, then one grey "Others" — the entries
 * with no note, and any notes past the sixth.
 *
 * Slices are parted by a 2px gap in the card's colour, so two neighbours
 * never run together. The rows beside and under it name every slice with its
 * amount and share, so nothing here is told by colour alone.
 *
 * Hidden from assistive tech, and kept out of the tab order: the rows are the
 * accessible version of these figures, in full. Recharts' own accessibility
 * layer would add a focusable, outline-less `application` whose arrow keys
 * only drive axis charts — a dead tab stop on a donut.
 */
export function NotePie({ shares, caption }: { shares: Share[]; caption: string }) {
  const { slices } = slicesOf(shares)
  const total = shares.reduce((sum, share) => sum + share.cents, 0)

  return (
    <div className="relative size-34 shrink-0" aria-hidden="true">
      <ChartContainer config={config} className="aspect-square size-full">
        <PieChart accessibilityLayer={false}>
          <ChartTooltip cursor={false} content={<SliceTooltip />} />
          <Pie
            data={slices}
            dataKey="cents"
            nameKey="label"
            innerRadius="66%"
            outerRadius="100%"
            stroke="var(--card)"
            strokeWidth={2}
            startAngle={90}
            endAngle={-270}
            isAnimationActive={false}
          >
            {slices.map((slice) => (
              <Cell key={slice.key} fill={slice.color} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <div className="pointer-events-none absolute inset-0 grid place-content-center text-center">
        <span className="text-[15px] font-bold tabular-nums">₱{compact.format(total / 100)}</span>
        <span className="text-[11px] text-muted-foreground">{caption}</span>
      </div>
    </div>
  )
}
