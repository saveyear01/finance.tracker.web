import { useState } from 'react'
import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'

import { DatePicker } from '@/components/date-picker'
import { SegmentedControl } from '@/components/segmented-control'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { localToday } from '@/features/transactions'
import { cn } from '@/lib/utils'

import {
  canStepForward,
  daysIn,
  MAX_WINDOW_DAYS,
  rangeLabel,
  stepRange,
  withUnit,
  type AnalyticsRange,
} from '../lib/ranges'

/**
 * Pick the period (redesigned 2026-11-11): Month or Year, stepped back and
 * forth with ‹ ›, or a custom from–to behind the calendar button. Replaces the
 * five preset chips, which could never reach two months back and cut the
 * first chip off at the edge.
 *
 * Forward stops at the period holding today — there is nothing past it yet.
 */
export function PeriodPicker({
  range,
  onChange,
}: {
  range: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
}) {
  const today = localToday()
  const [customOpen, setCustomOpen] = useState(false)
  const forward = canStepForward(range, today)

  return (
    // Two rows: on a phone, three controls side by side left the period's
    // name a few letters wide. From lg there is room, so they make one row —
    // the first row dissolves (`contents`) and Pick dates moves to the end,
    // leaving Month/Year, ‹ name ›, Pick dates.
    <div className="space-y-2 lg:flex lg:items-center lg:gap-2 lg:space-y-0">
      <div className="flex items-center gap-2 lg:contents">
        <SegmentedControl
          label="Period"
          className="h-10 min-w-0 flex-1 lg:w-40 lg:flex-none"
          value={range.unit === 'custom' ? ('' as 'month') : range.unit}
          onChange={(unit) => onChange(withUnit(range, unit, today))}
          options={[
            { value: 'month', label: 'Month' },
            { value: 'year', label: 'Year' },
          ]}
        />
        <Button
          variant="outline"
          className={cn('h-10 shrink-0 rounded-xl px-3 lg:order-last', range.unit === 'custom' && 'border-primary text-primary')}
          aria-pressed={range.unit === 'custom'}
          onClick={() => setCustomOpen(true)}
        >
          <CalendarRange />
          Pick dates
        </Button>
      </div>

      {/* A fixed width at lg, so stepping from May to September doesn't shift the row. */}
      <div className="flex h-11 items-center justify-between rounded-xl border border-border bg-card px-1 lg:h-10 lg:w-64">
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Previous ${range.unit === 'custom' ? 'range' : range.unit}`}
          onClick={() => onChange(stepRange(range, -1))}
        >
          <ChevronLeft />
        </Button>
        <span className="min-w-0 truncate px-1 text-sm font-semibold" aria-live="polite">
          {rangeLabel(range)}
        </span>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Next ${range.unit === 'custom' ? 'range' : range.unit}`}
          disabled={!forward}
          onClick={() => onChange(stepRange(range, 1))}
        >
          <ChevronRight />
        </Button>
      </div>

      <CustomRangeDrawer
        open={customOpen}
        onOpenChange={setCustomOpen}
        range={range}
        onApply={(window) => {
          onChange({ unit: 'custom', window })
          setCustomOpen(false)
        }}
      />
    </div>
  )
}

/**
 * A custom from–to. The two dates can't cross: an end before the start moves
 * the start with it (and the reverse), and a window longer than the API
 * reads (a year) is refused with the reason.
 */
function CustomRangeDrawer({
  open,
  onOpenChange,
  range,
  onApply,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  range: AnalyticsRange
  onApply: (window: AnalyticsRange['window']) => void
}) {
  const [window, setWindow] = useState(range.window)
  const tooLong = daysIn(window) > MAX_WINDOW_DAYS

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        if (next) setWindow(range.window)
        onOpenChange(next)
      }}
      showSwipeHandle
    >
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Pick dates</DrawerTitle>
          <DrawerDescription>Any stretch of up to a year.</DrawerDescription>
        </DrawerHeader>
        <div className="grid gap-3 p-4 sm:grid-cols-2">
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium" aria-hidden="true">
              From
            </p>
            <DatePicker
              label="From"
              compact
              value={window.start}
              onChange={(start) => setWindow({ start, end: start > window.end ? start : window.end })}
            />
          </div>
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm font-medium" aria-hidden="true">
              To
            </p>
            <DatePicker
              label="To"
              compact
              value={window.end}
              onChange={(end) => setWindow({ start: end < window.start ? end : window.start, end })}
            />
          </div>
          {tooLong && (
            <p className="text-sm text-destructive sm:col-span-2">
              That's longer than a year. Pick a shorter range.
            </p>
          )}
        </div>
        <DrawerFooter>
          <Button size="lg" disabled={tooLong} onClick={() => onApply(window)}>
            Show these dates
          </Button>
          <Button size="lg" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
