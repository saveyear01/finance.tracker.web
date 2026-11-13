import { Dialog } from '@base-ui/react/dialog'
import {
  ArrowRightLeft,
  CalendarClock,
  CornerDownLeft,
  Download,
  Landmark,
  Minus,
  PieChart,
  Plus,
  Search,
  Shuffle,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  createContext,
  useContext,
  useEffect,
  useId,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { useNewEntry } from '@/components/layouts/new-entry'
import { NAV_ITEMS } from '@/config/navigation'
import { useDebts } from '@/features/debts'
import { fundColors, useFunds } from '@/features/funds'
import type { LedgerAction } from '@/features/transactions'
import { useDueNow } from '@/features/upcoming'
import { useWallets } from '@/features/wallets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

type Command = {
  id: string
  section: 'Actions' | 'Go to'
  label: string
  /** Matched along with the label, never shown. */
  keywords?: string
  hint?: string
  icon: LucideIcon
  iconColor?: string
  run: () => void
}

const PaletteContext = createContext<(() => void) | null>(null)

/** Opens the command palette — the sidebar's search field. */
export function useCommandPalette(): () => void {
  const open = useContext(PaletteContext)
  if (!open) throw new Error('useCommandPalette must be used inside <CommandPaletteProvider>')
  return open
}

/** Whether a key press belongs to a field being typed in. */
export function isTyping(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement | null
  return Boolean(
    target &&
      (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)),
  )
}

/**
 * ⌘K / Ctrl+K from anywhere on a big screen (design/navigation-redesign.html,
 * 2026-11-13): jump to a page, wallet, allocation, bill or debt by name, or
 * start an entry ("Expense from GCash"). A centred search field — the one
 * overlay besides delete confirmations that isn't a drawer, since it is a
 * field to type in rather than a form.
 */
export function CommandPaletteProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen((value) => !value)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <PaletteContext.Provider value={() => setOpen(true)}>
      {children}
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Backdrop className="fixed inset-0 z-50 bg-black/30 transition-opacity duration-150 data-ending-style:opacity-0 data-starting-style:opacity-0 supports-backdrop-filter:backdrop-blur-xs" />
          <Dialog.Viewport className="fixed inset-0 z-50 flex justify-center px-4 pt-[12vh]">
            <Dialog.Popup className="flex h-fit max-h-[70vh] w-full max-w-155 flex-col overflow-hidden card-surface text-card-foreground outline-none transition-[opacity,scale] duration-150 data-ending-style:scale-98 data-ending-style:opacity-0 data-starting-style:scale-98 data-starting-style:opacity-0">
              <Dialog.Title className="sr-only">Search or jump to</Dialog.Title>
              {/* Mounted only while open, so the query starts empty each time. */}
              {open && <Palette onDone={() => setOpen(false)} />}
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </PaletteContext.Provider>
  )
}

const RECORD: { action: LedgerAction; label: string; icon: LucideIcon; from: string }[] = [
  { action: 'expense', label: 'Expense', icon: Minus, from: 'from' },
  { action: 'income', label: 'Income', icon: Plus, from: 'into' },
  { action: 'transfer', label: 'Transfer', icon: ArrowRightLeft, from: 'from' },
  { action: 'reallocation', label: 'Move', icon: Shuffle, from: 'in' },
]

/** Per section, so one long list of wallets can't push everything else off. */
const SECTION_LIMIT = 6

function Palette({ onDone }: { onDone: () => void }) {
  const navigate = useNavigate()
  const { record } = useNewEntry()
  const { wallets } = useWallets()
  const { funds } = useFunds()
  const { debts } = useDebts()
  const { owed } = useDueNow()
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const listId = useId()

  const commands = useMemo<Command[]>(() => {
    const go = (to: string) => () => navigate(to)
    const colors = fundColors(funds)
    const live = wallets.filter((w) => !w.archived_at)
    const list: Command[] = []

    // Actions: the four on their own, then each with a wallet picked — only
    // offered once something is typed, or the list would be all actions.
    for (const { action, label, icon } of RECORD) {
      list.push({
        id: `do-${action}`,
        section: 'Actions',
        label: `New ${label.toLowerCase()}`,
        keywords: 'record add entry',
        icon,
        run: () => record(action),
      })
    }
    if (query.trim()) {
      for (const wallet of live) {
        for (const { action, label, icon, from } of RECORD) {
          if (action === 'reallocation') continue
          list.push({
            id: `do-${action}-${wallet.id}`,
            section: 'Actions',
            label: `${label} ${from} ${wallet.name}`,
            icon,
            run: () => record(action, { walletId: wallet.id }),
          })
        }
      }
    }

    // Pages, then the things that have pages of their own.
    for (const item of NAV_ITEMS) {
      if (item.soon) continue
      list.push({ id: `page-${item.to}`, section: 'Go to', label: item.label, icon: item.icon, run: go(item.to) })
    }
    list.push(
      { id: 'page-split', section: 'Go to', label: 'Income split', keywords: 'profile allocation percentages', icon: PieChart, run: go('/profile/income-split') },
      { id: 'page-export', section: 'Go to', label: 'Export data', keywords: 'profile csv excel download', icon: Download, run: go('/profile/export') },
    )
    for (const wallet of live) {
      list.push({ id: `w-${wallet.id}`, section: 'Go to', label: wallet.name, hint: `Wallet · ${formatMoney(wallet.balance)}`, icon: Wallet, run: go(`/wallets/${wallet.id}`) })
    }
    for (const fund of funds.filter((f) => !f.archived_at)) {
      list.push({ id: `f-${fund.id}`, section: 'Go to', label: fund.name, hint: `Allocation · ${formatMoney(fund.balance)}`, icon: PieChart, iconColor: colors.get(fund.id), run: go(`/allocations/${fund.id}`) })
    }
    for (const occurrence of owed) {
      list.push({ id: `b-${occurrence.expense.id}-${occurrence.due_date}`, section: 'Go to', label: occurrence.expense.name, hint: `Bill · ${formatMoney(occurrence.remaining)} left`, keywords: 'upcoming', icon: CalendarClock, run: go(`/upcoming/${occurrence.expense.id}/${occurrence.due_date}`) })
    }
    for (const debt of debts) {
      list.push({ id: `d-${debt.id}`, section: 'Go to', label: debt.name, hint: `Debt · ${formatMoney(debt.remaining)} left`, keywords: debt.lender ?? '', icon: Landmark, run: go(`/debts/${debt.id}`) })
    }
    return list
  }, [navigate, record, wallets, funds, debts, owed, query])

  const results = useMemo(() => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const matched = commands.filter((c) => {
      const text = `${c.label} ${c.keywords ?? ''} ${c.hint ?? ''}`.toLowerCase()
      return words.every((w) => text.includes(w))
    })
    // With nothing typed: the four actions and the pages only.
    const pool = words.length ? matched : matched.filter((c) => c.section === 'Actions' || c.id.startsWith('page-'))
    const actions = pool.filter((c) => c.section === 'Actions').slice(0, words.length ? SECTION_LIMIT : 4)
    const goTo = pool.filter((c) => c.section === 'Go to').slice(0, words.length ? SECTION_LIMIT : 10)
    return [...actions, ...goTo]
  }, [commands, query])

  const index = Math.min(active, Math.max(0, results.length - 1))
  const run = (command: Command | undefined) => {
    if (!command) return
    onDone()
    command.run()
  }

  return (
    <>
      <div className="flex items-center gap-3 border-b px-4">
        <Search className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <input
          autoFocus
          role="combobox"
          aria-expanded="true"
          aria-controls={listId}
          aria-activedescendant={results[index] ? `${listId}-${results[index].id}` : undefined}
          aria-label="Search or jump to"
          placeholder="Search wallets, allocations, bills, debts…"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setActive((index + 1) % Math.max(1, results.length))
            } else if (event.key === 'ArrowUp') {
              event.preventDefault()
              setActive((index - 1 + results.length) % Math.max(1, results.length))
            } else if (event.key === 'Enter') {
              event.preventDefault()
              run(results[index])
            }
          }}
          className="h-14 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
        <kbd className="rounded-md border px-1.5 text-[0.6875rem] font-semibold text-muted-foreground">esc</kbd>
      </div>

      <ul id={listId} role="listbox" aria-label="Results" className="min-h-0 flex-1 overflow-y-auto p-2">
        {results.length === 0 && (
          <li className="px-3 py-8 text-center text-sm text-muted-foreground">Nothing matches "{query}".</li>
        )}
        {results.map((command, i) => {
          const heading = i === 0 || results[i - 1].section !== command.section
          const Icon = command.icon
          return (
            <li key={command.id} role="none">
              {heading && (
                <div
                  role="presentation"
                  className={cn('px-3 pt-2 pb-1 text-[0.6875rem] font-bold tracking-wider text-muted-foreground uppercase', i > 0 && 'mt-1 border-t pt-3')}
                >
                  {command.section}
                </div>
              )}
              <div
                id={`${listId}-${command.id}`}
                role="option"
                aria-selected={i === index}
                onMouseMove={() => setActive(i)}
                onClick={() => run(command)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm',
                  i === index && 'bg-accent text-accent-foreground',
                )}
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-md bg-muted text-foreground"
                  style={command.iconColor ? { color: command.iconColor } : undefined}
                >
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1 truncate font-medium">{command.label}</span>
                {command.hint && <span className="shrink-0 text-xs text-muted-foreground">{command.hint}</span>}
                {i === index && <CornerDownLeft className="size-3.5 shrink-0 opacity-70" aria-hidden="true" />}
              </div>
            </li>
          )
        })}
      </ul>

      <div className="flex gap-4 border-t px-4 py-2.5 text-xs text-muted-foreground">
        <span>↑↓ to move</span>
        <span>↵ to open</span>
        <span className="ml-auto">N new entry · [ sidebar</span>
      </div>
    </>
  )
}
