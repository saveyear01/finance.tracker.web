import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import { formatMoney } from '@/lib/money'

import { bucketsOf } from '../lib/buckets'
import type { DaySpending } from '../types'

const config = {
  spent: { label: 'Spent', color: 'var(--primary)' },
} satisfies ChartConfig

/** "₱1.2K" — the axis is for scale; exact figures are in the tooltip. */
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

/**
 * What one note cost per day (or per month) across the window — one series,
 * so no legend: the page's heading names it.
 *
 * Every day of the window is a slot, zero days included, so a gap reads as
 * "nothing spent", not as missing data. Bars are capped at 24px and rounded
 * only at the top, growing from one baseline; the grid is horizontal and
 * faint. Hovering or tapping a bar shows that day exactly; the entries under
 * the chart are the same figures as a list, for anyone not using a pointer.
 */
export function DailyChart({ days }: { days: DaySpending[] }) {
  const { buckets, monthly } = bucketsOf(days)

  return (
    <ChartContainer
      config={config}
      className="aspect-auto h-52 w-full"
      role="img"
      aria-label={`Spending per ${monthly ? 'month' : 'day'}`}
    >
      <BarChart data={buckets} margin={{ top: 8, right: 0, bottom: 0, left: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis
          dataKey="tick"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={12}
          interval="preserveStartEnd"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          width={40}
          tickFormatter={(value: number) => compact.format(value)}
        />
        <ChartTooltip
          cursor={{ fill: 'var(--muted)', opacity: 0.6 }}
          content={
            <ChartTooltipContent
              hideIndicator
              labelFormatter={(_, payload) => payload[0]?.payload.title}
              formatter={(value) => (
                <span className="font-semibold text-foreground tabular-nums">
                  {formatMoney(Number(value))}
                </span>
              )}
            />
          }
        />
        <Bar dataKey="spent" fill="var(--color-spent)" radius={[4, 4, 0, 0]} maxBarSize={24} />
      </BarChart>
    </ChartContainer>
  )
}
