import { DatePicker } from '@/components/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  PRESET_LABELS,
  PRESETS,
  windowOf,
  type RangePreset,
  type SpendingRange,
} from '../lib/ranges'

/**
 * Pick the window: a preset (this month by default), or a custom from–to.
 * Choosing "Custom range" starts from the window already shown, so it is a
 * tweak of what you were looking at rather than a blank form.
 *
 * The two dates can't cross: an end before the start moves the start with it
 * (and the reverse), so every window the picker produces is a valid one.
 */
export function RangePicker({
  range,
  onChange,
}: {
  range: SpendingRange
  onChange: (range: SpendingRange) => void
}) {
  const { preset, window } = range

  return (
    <div className="space-y-2">
      <Select
        value={preset}
        onValueChange={(value) => {
          const next = value as RangePreset
          onChange(
            next === 'custom'
              ? { preset: 'custom', window }
              : { preset: next, window: windowOf(next) },
          )
        }}
      >
        <SelectTrigger className="h-11! w-full bg-card text-base md:text-sm" aria-label="Time range">
          <SelectValue>{(value) => PRESET_LABELS[value as RangePreset]}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {PRESETS.map((option) => (
            <SelectItem key={option} value={option}>
              {PRESET_LABELS[option]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {preset === 'custom' && (
        <div className="grid grid-cols-2 gap-2">
          <DatePicker
            compact
            label="From"
            value={window.start}
            onChange={(start) =>
              onChange({
                preset: 'custom',
                window: { start, end: start > window.end ? start : window.end },
              })
            }
          />
          <DatePicker
            compact
            label="To"
            value={window.end}
            onChange={(end) =>
              onChange({
                preset: 'custom',
                window: { start: end < window.start ? end : window.start, end },
              })
            }
          />
        </div>
      )}
    </div>
  )
}
