import type { ReactNode } from 'react'
import { Delete } from 'lucide-react'

import { env } from '@/config/env'
import { cn } from '@/lib/utils'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const
type Key = (typeof KEYS)[number]

/** Whole pesos before the point — 999 trillion, far past any real balance. */
const MAX_WHOLE_DIGITS = 15

/**
 * Apply one key to the amount being typed. Keeps it a valid money string at
 * every step: one decimal point, at most two decimals, no leading zeros.
 */
export function pressKey(value: string, key: Key): string {
  if (key === 'back') {
    return value.slice(0, -1)
  }
  if (key === '.') {
    if (value.includes('.')) return value
    return value === '' ? '0.' : `${value}.`
  }

  const [whole, decimals] = value.split('.')
  if (decimals !== undefined) {
    return decimals.length >= 2 ? value : value + key
  }
  if (whole === '0') {
    return key // "0" then "5" is 5, not 05
  }
  return whole.length >= MAX_WHOLE_DIGITS ? value : value + key
}

const symbol =
  new Intl.NumberFormat('en-US', { style: 'currency', currency: env.CURRENCY })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? ''

/** "12345.6" → "₱12,345.6" — grouped, but exactly as typed after the point. */
function display(value: string): string {
  if (value === '') return `${symbol}0`
  const [whole, decimals] = value.split('.')
  const grouped = Number(whole || '0').toLocaleString('en-US')
  return `${symbol}${grouped}${decimals !== undefined ? `.${decimals}` : ''}`
}

/**
 * The amount entry of the design reference: a big figure and a phone-style
 * keypad. Typing is only ever through the keys (or the keyboard's digits on
 * desktop), so there is no free-text input to validate after the fact.
 */
export function AmountPad({
  value,
  onChange,
  invalid,
  hint,
}: {
  value: string
  onChange: (next: string) => void
  invalid?: boolean
  /** A line under the figure — the available balance, or an error. */
  hint?: ReactNode
}) {
  return (
    <div
      // Focusable so desktop users can type digits, "." and Backspace.
      tabIndex={0}
      role="group"
      aria-label="Amount"
      className="rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      onKeyDown={(event) => {
        const key: Key | null =
          event.key === 'Backspace'
            ? 'back'
            : (KEYS as readonly string[]).includes(event.key)
              ? (event.key as Key)
              : null
        if (key) {
          event.preventDefault()
          onChange(pressKey(value, key))
        }
      }}
    >
      <p
        className={cn(
          'text-center text-4xl font-semibold tabular-nums',
          value === '' && 'text-muted-foreground',
          invalid && 'text-destructive',
        )}
        aria-live="polite"
      >
        {display(value)}
      </p>
      {hint && <div className="mt-1 text-center text-sm text-muted-foreground">{hint}</div>}

      <div className="mt-3 grid grid-cols-3 gap-1">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            tabIndex={-1}
            aria-label={key === 'back' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key}
            onClick={() => onChange(pressKey(value, key))}
            className="grid h-12 place-items-center rounded-xl text-xl font-medium transition-colors hover:bg-accent active:bg-accent"
          >
            {key === 'back' ? <Delete className="size-5 text-destructive" /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}
