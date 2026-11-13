import type { ReactNode } from 'react'
import { Delete } from 'lucide-react'

import { env } from '@/config/env'
import { useIsCompact } from '@/hooks/use-compact'
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

/** Whatever was typed or pasted, as a valid money string — every character
 * run through the keypad's own rules, so the two can never disagree. */
export function sanitizeAmount(raw: string): string {
  let value = ''
  for (const char of raw.replace(/,/g, '')) {
    if ((KEYS as readonly string[]).includes(char) && char !== 'back') {
      value = pressKey(value, char as Key)
    }
  }
  return value
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
  const compact = useIsCompact()

  // From `lg` (design/large-screen.html rule 5): a big screen has a real
  // keyboard, so the amount is a field you type into, not a keypad.
  if (!compact) {
    return (
      <div>
        <label className="sr-only" htmlFor="amount-field">
          Amount
        </label>
        <div
          className={cn(
            'flex h-16 items-center gap-1 rounded-xl border border-input bg-card px-4 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50',
            invalid && 'border-destructive focus-within:border-destructive',
          )}
        >
          <span className={cn('figure-lg text-muted-foreground', invalid && 'text-destructive')}>
            {symbol}
          </span>
          <input
            id="amount-field"
            // The first thing a form asks for, so it takes the focus.
            autoFocus
            inputMode="decimal"
            autoComplete="off"
            placeholder="0.00"
            aria-invalid={invalid || undefined}
            value={value}
            onChange={(event) => onChange(sanitizeAmount(event.target.value))}
            className={cn(
              'min-w-0 flex-1 bg-transparent figure-lg tabular-nums outline-none placeholder:text-muted-foreground',
              invalid && 'text-destructive',
            )}
          />
        </div>
        {hint && <div className="mt-1.5 text-sm text-muted-foreground">{hint}</div>}
      </div>
    )
  }

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
          'text-center figure-xl',
          value === '' && 'text-muted-foreground',
          invalid && 'text-destructive',
        )}
        aria-live="polite"
      >
        {display(value)}
      </p>
      {hint && <div className="mt-1 text-center text-sm text-muted-foreground">{hint}</div>}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            tabIndex={-1}
            aria-label={key === 'back' ? 'Delete last digit' : key === '.' ? 'Decimal point' : key}
            onClick={() => onChange(pressKey(value, key))}
            className="grid h-12 place-items-center rounded-xl bg-muted text-xl font-semibold tabular-nums transition-colors hover:bg-accent active:bg-accent active:text-accent-foreground"
          >
            {key === 'back' ? <Delete className="size-5 text-muted-foreground" /> : key}
          </button>
        ))}
      </div>
    </div>
  )
}
