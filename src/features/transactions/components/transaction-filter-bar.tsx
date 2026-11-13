import { useMemo } from 'react'

import { Picker, type PickerOption } from '@/components/picker'
import { SegmentedControl, type SegmentOption } from '@/components/segmented-control'
import type { Fund } from '@/features/funds'
import type { Wallet } from '@/features/wallets'

import { periodOptions, type ListFilters, type Period } from '../lib/list-filters'
import type { ActionKind } from '../types'
import { NoteSearch } from './note-search'

type TypeChoice = ActionKind | 'all'

// The kinds the table offers, in the UI's words (a reallocation is a Move).
// Adjustments — opening balances, mostly — have no chip of their own; one
// shows only when a link asked for them, so the filter in force is visible.
const TYPE_OPTIONS: SegmentOption<TypeChoice>[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'reallocation', label: 'Move' },
  { value: 'transfer', label: 'Transfer' },
]
const ADJUSTMENT_OPTION: SegmentOption<TypeChoice> = { value: 'adjustment', label: 'Adjustment' }

// Picker's '' is "nothing picked", which shows the placeholder — "All
// wallets". This explicit first row is how to go back to it.
const ALL = '__all__'

function optionsOf(
  items: Array<{ id: string; name: string; archived_at: string | null }>,
  allLabel: string,
): PickerOption[] {
  const active = items.filter((item) => item.archived_at === null)
  const archived = items.filter((item) => item.archived_at !== null)
  return [
    { value: ALL, label: allLabel },
    ...active.map((item) => ({ value: item.id, label: item.name })),
    // Archived ones still have history worth finding.
    ...archived.map((item) => ({ value: item.id, label: item.name, detail: 'Archived' })),
  ]
}

/**
 * The Transactions table's filter bar (design/large-screen.html, rule 4):
 * search notes, the kind of action, a wallet, an allocation and a period —
 * all combined. Large screens only; the phone keeps its feed with just the
 * search.
 */
export function TransactionFilterBar({
  filters,
  onChange,
  wallets,
  funds,
}: {
  filters: ListFilters
  onChange: (change: Partial<ListFilters>) => void
  wallets: Wallet[]
  funds: Fund[]
}) {
  const walletOptions = useMemo(() => optionsOf(wallets, 'All wallets'), [wallets])
  const fundOptions = useMemo(() => optionsOf(funds, 'All allocations'), [funds])
  const typeOptions =
    filters.type === 'adjustment' ? [...TYPE_OPTIONS, ADJUSTMENT_OPTION] : TYPE_OPTIONS
  const periods: PickerOption[] = periodOptions()

  return (
    <div className="flex flex-wrap items-center gap-2" role="search" aria-label="Filter transactions">
      <NoteSearch
        value={filters.q}
        onSearch={(q) => onChange({ q })}
        className="w-60"
      />
      <SegmentedControl
        variant="chips"
        label="Type"
        value={filters.type ?? 'all'}
        onChange={(type) => onChange({ type: type === 'all' ? null : type })}
        options={typeOptions}
      />
      <Picker
        label="Wallet"
        placeholder="All wallets"
        value={filters.wallet}
        onChange={(wallet) => onChange({ wallet: wallet === ALL ? '' : wallet })}
        options={walletOptions}
        className="w-44"
      />
      <Picker
        label="Allocation"
        placeholder="All allocations"
        value={filters.fund}
        onChange={(fund) => onChange({ fund: fund === ALL ? '' : fund })}
        options={fundOptions}
        className="w-48"
      />
      <Picker
        label="Period"
        placeholder="Any time"
        value={filters.period === 'any' ? '' : filters.period}
        onChange={(period) => onChange({ period: (period || 'any') as Period })}
        options={periods}
        className="w-56"
      />
    </div>
  )
}
