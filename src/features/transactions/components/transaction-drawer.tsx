import { useState } from 'react'
import { Loader2, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import { useReverseAction, useTransactionGroup } from '../hooks/use-transactions'
import {
  TYPE_NAMES,
  describe,
  editableActionOf,
  formatActivityDate,
  localToday,
} from '../lib/transaction-meta'
import type { Transaction } from '../types'
import { ActionDrawer } from './action-drawer'

type Step = 'details' | 'confirm-delete' | 'edit'

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/**
 * The action's headline figure. One direction (income, expense, a reversal
 * of either): the signed total. A move or transfer nets to zero, so it shows
 * how much moved, unsigned.
 */
function headline(legs: Transaction[]): { cents: number; signed: boolean } {
  const cents = legs.map((leg) => centsOf(leg.amount))
  if (cents.every((c) => c > 0) || cents.every((c) => c < 0)) {
    return { cents: cents.reduce((sum, c) => sum + c, 0), signed: true }
  }
  return { cents: cents.filter((c) => c > 0).reduce((sum, c) => sum + c, 0), signed: false }
}

/**
 * One activity entry opened up: the whole action it belongs to (every leg of
 * a split income or a transfer, whichever row was tapped), with Edit and
 * Delete.
 *
 * Edit hands over to the action's own drawer, filled in. Delete confirms
 * first, then records a reversal — the original stays in the history, struck
 * through, and the reversal puts its money back. Neither is offered on a
 * reversal, or on an entry already reversed.
 */
export function TransactionDrawer({
  entry,
  onOpenChange,
}: {
  /** The tapped row, or null when the drawer is shut. */
  entry: Transaction | null
  onOpenChange: (open: boolean) => void
}) {
  const groupId = entry?.group_id ?? null
  // The step belongs to the entry it was chosen for, so opening another
  // entry always starts on its details. Closing forgets it too, or reopening
  // the entry just edited would land straight back in the edit drawer.
  const [chosen, setChosen] = useState<{ groupId: string | null; step: Step }>({
    groupId: null,
    step: 'details',
  })
  const step = chosen.groupId === groupId ? chosen.step : 'details'
  const go = (next: Step) => setChosen({ groupId, step: next })
  const dismiss = (open: boolean) => {
    if (!open) setChosen({ groupId: null, step: 'details' })
    onOpenChange(open)
  }

  const group = useTransactionGroup(groupId)
  const reverse = useReverseAction()

  // The tapped row stands in until the whole action has loaded.
  const legs = group.legs.length > 0 ? group.legs : entry ? [entry] : []
  const [first] = legs
  const loaded = group.legs.length > 0
  const action = first ? editableActionOf(first.type) : null
  const reversed = Boolean(first?.reversed_by_group_id)
  // "Expense", "Transfer" — a reversal says what it undid ("Reversed expense").
  const kind = !first
    ? ''
    : first.type === 'reversal'
      ? describe(first).label
      : TYPE_NAMES[first.type]
  const changeable = action !== null && !reversed
  const { cents, signed } = headline(legs)

  const close = () => dismiss(false)
  const remove = () =>
    first &&
    reverse.mutate(
      { group_id: first.group_id, date: localToday() },
      {
        onSuccess: () => {
          toast.success('Deleted. Its money is back where it came from.')
          close()
        },
      },
    )
  const deleteError =
    reverse.isError && reverse.variables?.group_id === groupId ? reverse.error : null

  return (
    <>
      <Drawer open={entry !== null && step !== 'edit'} onOpenChange={dismiss} showSwipeHandle>
        <DrawerContent>
          {first && (
            <>
              <DrawerHeader>
                <DrawerTitle>
                  {step === 'confirm-delete'
                    ? `Delete this ${first.type === 'income_auto_split' ? 'income' : kind.toLowerCase()}?`
                    : (first.note ?? kind)}
                </DrawerTitle>
                <DrawerDescription>
                  {step === 'confirm-delete'
                    ? 'A reversal dated today puts the money back where it was. Both stay in your history.'
                    : // The kind of entry, unless the title already says it.
                      [first.note && kind, formatActivityDate(first.date)]
                        .filter(Boolean)
                        .join(' · ')}
                </DrawerDescription>
              </DrawerHeader>

              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 pt-0">
                <p
                  className={cn(
                    'text-center text-3xl font-semibold tabular-nums',
                    reversed
                      ? 'text-muted-foreground line-through'
                      : signed && (cents > 0 ? 'text-success' : 'text-destructive'),
                  )}
                >
                  {signed && (cents > 0 ? '+' : '−')}
                  {formatMoney(Math.abs(cents) / 100)}
                </p>

                <ul className="divide-y divide-border rounded-xl border border-border bg-card">
                  {legs.map((leg) => (
                    <li key={leg.id} className="flex items-center gap-3 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">
                          {leg.fund_name ?? 'No allocation'}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          {describe(leg).label} · {leg.wallet_name}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-medium tabular-nums">
                        {Number(leg.amount) > 0 ? '+' : '−'}
                        {formatMoney(Math.abs(Number(leg.amount)))}
                      </span>
                    </li>
                  ))}
                </ul>

                {reversed && (
                  <Alert>
                    <AlertDescription>
                      Deleted. A reversal put its money back, so it can't be changed any more.
                    </AlertDescription>
                  </Alert>
                )}
                {first.type === 'reversal' && (
                  <Alert>
                    <AlertDescription>
                      This undid an earlier{' '}
                      {first.reverses_type
                        ? TYPE_NAMES[first.reverses_type].toLowerCase()
                        : 'entry'}
                      . A reversal can't be edited or deleted.
                    </AlertDescription>
                  </Alert>
                )}
                {group.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {getApiErrorMessage(group.error, 'Could not load this entry.')}
                    </AlertDescription>
                  </Alert>
                )}
                {step === 'confirm-delete' && deleteError && (
                  <Alert variant="destructive">
                    <AlertDescription>{getApiErrorMessage(deleteError)}</AlertDescription>
                  </Alert>
                )}
              </div>

              {changeable && (
                <DrawerFooter className="pt-2">
                  {step === 'confirm-delete' ? (
                    <>
                      <Button
                        variant="destructive"
                        size="lg"
                        className="h-11"
                        disabled={reverse.isPending}
                        onClick={remove}
                      >
                        {reverse.isPending && <Loader2 className="animate-spin" />}
                        {reverse.isPending ? 'Deleting…' : 'Delete'}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11"
                        onClick={() => go('details')}
                      >
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* Both wait for the whole action: an edit must start
                          from every leg, not just the row that was tapped. */}
                      <Button
                        size="lg"
                        className="h-11"
                        disabled={!loaded}
                        onClick={() => go('edit')}
                      >
                        <Pencil />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        className="h-11 text-destructive hover:text-destructive"
                        disabled={!loaded}
                        onClick={() => {
                          reverse.reset()
                          go('confirm-delete')
                        }}
                      >
                        <Trash2 />
                        Delete
                      </Button>
                    </>
                  )}
                </DrawerFooter>
              )}
            </>
          )}
        </DrawerContent>
      </Drawer>

      <ActionDrawer
        action={entry !== null && step === 'edit' ? action : null}
        editing={loaded ? group.legs : null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
      />
    </>
  )
}
