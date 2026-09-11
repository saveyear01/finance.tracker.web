import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Minus,
  Plus,
  Shuffle,
  SlidersHorizontal,
  Undo2,
  type LucideIcon,
} from 'lucide-react'

import type { EditableAction, LedgerAction, Transaction, TransactionType } from '../types'

/**
 * The four actions, as the balance card and the drawers name them. One place,
 * so the card button and the drawer it opens can never disagree.
 */
export const ACTION_META: Record<
  LedgerAction,
  { label: string; title: string; icon: LucideIcon; submit: string }
> = {
  income: { label: 'Income', title: 'Record income', icon: Plus, submit: 'Record income' },
  expense: { label: 'Expense', title: 'Record expense', icon: Minus, submit: 'Record expense' },
  reallocation: {
    label: 'Move',
    title: 'Move between allocations',
    icon: Shuffle,
    submit: 'Move money',
  },
  transfer: {
    label: 'Transfer',
    title: 'Transfer between wallets',
    icon: ArrowLeftRight,
    submit: 'Transfer',
  },
}

/** What a whole action of each type is called — the details drawer's heading. */
export const TYPE_NAMES: Record<TransactionType, string> = {
  income: 'Income',
  income_auto_split: 'Income (auto)',
  expense: 'Expense',
  reallocation: 'Move between allocations',
  transfer: 'Transfer',
  manual_adjustment: 'Adjustment',
  reversal: 'Reversal',
}

/**
 * The form an entry of this type is edited in — null for a reversal, which
 * only exists to undo its original and is never edited itself.
 */
export function editableActionOf(type: TransactionType): EditableAction | null {
  switch (type) {
    case 'income':
    case 'income_auto_split':
      return 'income'
    case 'manual_adjustment':
      return 'adjustment'
    case 'reversal':
      return null
    default:
      return type
  }
}

/**
 * What one activity row is called and drawn with. Moves and transfers have
 * two legs; each leg says which way it went, so "Moved out" and "Moved in"
 * read as a pair.
 */
export function describe(entry: Transaction): { label: string; icon: LucideIcon } {
  const incoming = Number(entry.amount) > 0

  switch (entry.type) {
    case 'income':
      return { label: 'Income', icon: ArrowDownLeft }
    case 'income_auto_split':
      return { label: 'Income (auto)', icon: ArrowDownLeft }
    case 'expense':
      return { label: 'Expense', icon: ArrowUpRight }
    case 'reallocation':
      return { label: incoming ? 'Moved in' : 'Moved out', icon: Shuffle }
    case 'transfer':
      return { label: incoming ? 'Transfer in' : 'Transfer out', icon: ArrowLeftRight }
    case 'manual_adjustment':
      return { label: 'Adjustment', icon: SlidersHorizontal }
    case 'reversal':
      return {
        label: entry.reverses_type
          ? `Reversed ${TYPE_NAMES[entry.reverses_type].toLowerCase()}`
          : 'Reversal',
        icon: Undo2,
      }
  }
}

/** "Sep 11" — the year only when it is not this year. */
export function formatActivityDate(isoDate: string): string {
  // Parsed as a local date: `new Date('2026-09-11')` would be UTC midnight,
  // which is the day before anywhere west of Greenwich.
  const [year, month, day] = isoDate.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    ...(year !== new Date().getFullYear() && { year: 'numeric' }),
  })
}

/** Today as YYYY-MM-DD in the user's own timezone — what "today" means to them. */
export function localToday(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
