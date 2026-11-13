import { ChevronRight } from 'lucide-react'
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { PayDebtDrawer, useDebts, type Debt } from '@/features/debts'
import { ACTION_META, ActionDrawer, type LedgerAction } from '@/features/transactions'
import { PayDrawer, useDueNow, whenText, type Occurrence } from '@/features/upcoming'
import { useWallets } from '@/features/wallets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

const ACTIONS: LedgerAction[] = ['income', 'expense', 'reallocation', 'transfer']

type Preset = { walletId?: string; fundId?: string } | null

type NewEntry = {
  /** Opens the sheet: the four actions, then what's due. */
  openSheet: () => void
  /** Skips the sheet: straight to one action's form (the command palette). */
  record: (action: LedgerAction, preset?: Preset) => void
}

const NewEntryContext = createContext<NewEntry | null>(null)

export function useNewEntry(): NewEntry {
  const value = useContext(NewEntryContext)
  if (!value) throw new Error('useNewEntry must be used inside <NewEntryProvider>')
  return value
}

/**
 * "New entry" from anywhere (design/navigation-redesign.html, 2026-11-13) —
 * the phone's + beside the pill, the sidebar's button, the N key and the
 * command palette all open it. It records nothing itself: each choice opens
 * the existing `ActionDrawer`, `PayDrawer` or `PayDebtDrawer`, so the ledger
 * forms stay the only way money is recorded.
 */
export function NewEntryProvider({ children }: { children: ReactNode }) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [action, setAction] = useState<LedgerAction | null>(null)
  const [preset, setPreset] = useState<Preset>(null)
  const [bill, setBill] = useState<Occurrence | null>(null)
  const [debt, setDebt] = useState<Debt | null>(null)

  const record = useCallback((next: LedgerAction, nextPreset: Preset = null) => {
    setSheetOpen(false)
    setPreset(nextPreset)
    setAction(next)
  }, [])
  const value = useMemo<NewEntry>(() => ({ openSheet: () => setSheetOpen(true), record }), [record])

  return (
    <NewEntryContext.Provider value={value}>
      {children}
      <NewEntrySheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onAction={(next) => record(next)}
        onPayBill={(occurrence) => {
          setSheetOpen(false)
          setBill(occurrence)
        }}
        onPayDebt={(next) => {
          setSheetOpen(false)
          setDebt(next)
        }}
      />
      <ActionDrawer
        action={action}
        preset={preset}
        onOpenChange={(open) => {
          if (!open) setAction(null)
        }}
      />
      <PayDrawer occurrence={bill} onOpenChange={(open) => !open && setBill(null)} />
      <PayDebtDrawer debt={debt} onOpenChange={(open) => !open && setDebt(null)} />
    </NewEntryContext.Provider>
  )
}

/** At most this many bills and debts under "Pay something due". */
const DUE_LIMIT = 3

function NewEntrySheet({
  open,
  onOpenChange,
  onAction,
  onPayBill,
  onPayDebt,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAction: (action: LedgerAction) => void
  onPayBill: (occurrence: Occurrence) => void
  onPayDebt: (debt: Debt) => void
}) {
  const { wallets } = useWallets()
  const { owed, today } = useDueNow()
  const { debts } = useDebts()
  // With no wallet there's nowhere to record into; every form would say so.
  const noWallet = wallets.length === 0

  // Bills first (they have a date), then open debts with a payment due
  // soonest, to the limit.
  const dueDebts = debts
    .filter((d) => d.status === 'open' && d.schedule?.next_due)
    .sort((a, b) => (a.schedule?.next_due ?? '').localeCompare(b.schedule?.next_due ?? ''))
  const bills = owed.slice(0, DUE_LIMIT)
  const debtRows = dueDebts.slice(0, Math.max(0, DUE_LIMIT - bills.length))

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>New entry</DrawerTitle>
          <DrawerDescription className={cn(!noWallet && 'sr-only')}>
            {noWallet ? 'Add a wallet first — it is where money is recorded.' : 'What would you like to record?'}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-5 overflow-y-auto px-4 pb-6">
          <ul className={cn('grid grid-cols-4 gap-2', noWallet && 'opacity-45')}>
            {ACTIONS.map((kind) => {
              const { label, icon: Icon } = ACTION_META[kind]
              return (
                <li key={kind}>
                  <button
                    type="button"
                    disabled={noWallet}
                    onClick={() => onAction(kind)}
                    className="group flex w-full flex-col items-center gap-1.5 rounded-xl py-1 text-xs font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <span className="grid size-14 place-items-center rounded-full bg-accent text-accent-foreground transition-colors group-enabled:group-hover:bg-primary group-enabled:group-hover:text-primary-foreground">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    {label}
                  </button>
                </li>
              )
            })}
          </ul>

          {!noWallet && (bills.length > 0 || debtRows.length > 0) && (
            <section aria-labelledby="new-entry-due" className="space-y-2">
              <h3
                id="new-entry-due"
                className="text-xs font-semibold tracking-wider text-muted-foreground uppercase"
              >
                Pay something due
              </h3>
              <ul className="space-y-2">
                {bills.map((occurrence) => {
                  const overdue = occurrence.due_date < today
                  return (
                    <li key={`${occurrence.expense.id}-${occurrence.due_date}`}>
                      <DueButton
                        name={occurrence.expense.name}
                        detail={`${whenText(occurrence, today)} · ${formatMoney(occurrence.remaining)}`}
                        urgent={overdue}
                        onClick={() => onPayBill(occurrence)}
                      />
                    </li>
                  )
                })}
                {debtRows.map((d) => (
                  <li key={d.id}>
                    <DueButton
                      name={d.name}
                      detail={
                        d.monthly_payment
                          ? `Debt · ${formatMoney(d.monthly_payment)} a month`
                          : `Debt · ${formatMoney(d.remaining)} left`
                      }
                      urgent={Number(d.schedule?.behind ?? 0) > 0}
                      onClick={() => onPayDebt(d)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  )
}

function DueButton({
  name,
  detail,
  urgent,
  onClick,
}: {
  name: string
  detail: string
  urgent: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card-row flex w-full items-center gap-3 px-3 py-2.5 text-left"
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{name}</span>
        <span className={cn('block text-xs text-muted-foreground', urgent && 'text-destructive')}>
          {detail}
        </span>
      </span>
      <span className="text-xs font-semibold text-primary">Pay</span>
      <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
    </button>
  )
}
