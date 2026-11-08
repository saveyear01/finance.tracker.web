import { Cell, Pie, PieChart } from 'recharts'

import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart'
import { formatMoney } from '@/lib/money'

import { slicesOf, type Share, type Slice } from '../lib/shares'

// Colours come from each slice, not from the config; the container still
// wants one.
const config = {} satisfies ChartConfig

/** On hover: the value leads, the note and its share follow. */
function SliceTooltip({ active, payload }: { active?: boolean; payload?: { payload: Slice }[] }) {
  const slice = payload?.[0]?.payload
  if (!active || !slice) return null
  return (
    <div className="grid min-w-32 gap-1 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl">
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
 * The window's money by note, as a donut: a slice per note for the seven
 * biggest, then one grey "Others" — the entries with no note, and any
 * notes past the seventh.
 *
 * Slices are parted by a 2px gap in the card's colour, so two neighbours
 * never run together. The legend under it (`NoteRows`) names every slice
 * with its amount and share, so nothing here is told by colour alone.
 */
export function NotePie({ shares }: { shares: Share[] }) {
  const { slices, folded } = slicesOf(shares)

  return (
    <div className="space-y-1">
      <ChartContainer
        config={config}
        className="mx-auto aspect-square h-56"
        role="img"
        aria-label="Share per note"
      >
        <PieChart>
          <ChartTooltip cursor={false} content={<SliceTooltip />} />
          <Pie
            data={slices}
            dataKey="cents"
            nameKey="label"
            innerRadius="58%"
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
      {folded > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          Others includes {folded} smaller {folded === 1 ? 'note' : 'notes'}.
        </p>
      )}
    </div>
  )
}
