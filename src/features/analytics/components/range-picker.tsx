import { DatePicker } from '@/components/date-picker'
import { SegmentedControl } from '@/components/segmented-control'

import {
  PRESET_LABELS,
  PRESETS,
  windowOf,
  type AnalyticsRange,
} from '../lib/ranges'

/**
 * Pick the window: a preset (this month by default), or a custom from–to,
 * as a row of chips.
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
  range: AnalyticsRange
  onChange: (range: AnalyticsRange) => void
}) {
  const { preset, window } = range

  return (
    <div className="space-y-2">
      {/* Chips, not a dropdown: the range in force stays in view, and
          switching is one tap. "Custom" is short here — the dates under it
          say the rest. */}
      <SegmentedControl
        variant="chips"
        label="Time range"
        value={preset}
        onChange={(next) =>
          onChange(
            next === 'custom'
              ? { preset: 'custom', window }
              : { preset: next, window: windowOf(next) },
          )
        }
        options={PRESETS.map((option) => ({
          value: option,
          label: option === 'custom' ? 'Custom' : PRESET_LABELS[option],
        }))}
      />

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
