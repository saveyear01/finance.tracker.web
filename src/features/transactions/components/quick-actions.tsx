import { cn } from '@/lib/utils'

import { ACTION_META } from '../lib/transaction-meta'
import type { LedgerAction } from '../types'

const ACTIONS: LedgerAction[] = ['income', 'expense', 'reallocation', 'transfer']

/**
 * The round quick actions of the design reference — Income / Expense / Move /
 * Transfer — for a dark card: Home's balance card, and a wallet's own page,
 * where each opens with that wallet already picked.
 *
 * `disabled` dims them all: with no wallet there's nowhere to record into
 * (Home's first run), and every one of the forms would only say so.
 */
export function QuickActions({
  onAction,
  disabled = false,
  className,
}: {
  onAction: (action: LedgerAction) => void
  disabled?: boolean
  className?: string
}) {
  return (
    <ul className={cn('grid grid-cols-4 gap-2', disabled && 'opacity-45', className)}>
      {ACTIONS.map((action) => {
        const { label, icon: Icon } = ACTION_META[action]
        return (
          <li key={action}>
            <button
              type="button"
              onClick={() => onAction(action)}
              disabled={disabled}
              className="group flex w-full flex-col items-center gap-1.5 rounded-xl py-1 text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <span className="grid size-11 place-items-center rounded-full bg-secondary-foreground/15 transition-colors group-enabled:group-hover:bg-secondary-foreground/25">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              {label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
