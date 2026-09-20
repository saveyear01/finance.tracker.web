import { useEffect, useMemo } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'

import { AmountPad } from '@/components/amount-pad'
import { DatePicker } from '@/components/date-picker'
import { FormPicker, type PickerOption } from '@/components/form-picker'
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
import { FieldError } from '@/components/ui/field'
import { Switch } from '@/components/ui/switch'
import { useAllocation } from '@/features/allocations'
import { useFunds } from '@/features/funds'
import { useWallets } from '@/features/wallets'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import {
  useEditAction,
  useNoteSuggestions,
  useReallocate,
  useRecordExpense,
  useRecordIncome,
  useTransfer,
} from '../hooks/use-transactions'
import { snapNote } from '../lib/notes'
import { ACTION_META, localToday } from '../lib/transaction-meta'
import { actionSchema, type ActionFormValues } from '../schemas/action-schema'
import { NoteField } from './note-field'
import type {
  AdjustmentInput,
  EditableAction,
  ExpenseInput,
  IncomeInput,
  LedgerAction,
  ReallocationInput,
  Transaction,
  TransferInput,
} from '../types'

/** What the success toast says — the split, when there was one. */
function confirmation(action: LedgerAction, entries: Transaction[]): string {
  const moved = entries.find((entry) => Number(entry.amount) > 0) ?? entries[0]
  const total = formatMoney(
    entries
      .filter((entry) => Number(entry.amount) > 0 || action === 'expense')
      .reduce((sum, entry) => sum + Math.abs(Number(entry.amount)), 0),
  )
  switch (action) {
    case 'income':
      return entries.length > 1
        ? `${total} split: ${entries.map((e) => `${e.fund_name} ${formatMoney(e.amount)}`).join(', ')}`
        : `${total} recorded to ${moved.fund_name}.`
    case 'expense':
      return `Expense of ${total} recorded.`
    case 'reallocation':
      return `Moved ${total} to ${moved.fund_name}.`
    case 'transfer':
      return `Transferred ${total} to ${moved.wallet_name}.`
  }
}

const EDIT_TITLES: Record<EditableAction, string> = {
  income: 'Edit income',
  expense: 'Edit expense',
  reallocation: 'Edit move',
  transfer: 'Edit transfer',
  adjustment: 'Edit adjustment',
}

/** A stored amount as the keypad would have typed it: "1500", "1500.50". */
function asTyped(cents: number): string {
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

const centsOf = (amount: string) => Math.round(Number(amount) * 100)

/** The form, filled in from the legs of the action being edited. */
function editValues(action: EditableAction, legs: Transaction[]): ActionFormValues {
  const [first] = legs
  const out = legs.find((leg) => Number(leg.amount) < 0) ?? first
  const into = legs.find((leg) => Number(leg.amount) > 0) ?? first
  const auto = first.type === 'income_auto_split'
  const blank = {
    action,
    wallet_id: first.wallet_id,
    to_wallet_id: '',
    fund_id: first.fund_id ?? '',
    to_fund_id: '',
    auto_allocate: false,
    amount: asTyped(Math.abs(centsOf(first.amount))),
    note: first.note ?? '',
    date: first.date,
    available_cents: null,
  }

  switch (action) {
    case 'income':
      return {
        ...blank,
        auto_allocate: auto,
        fund_id: auto ? '' : blank.fund_id,
        // A split income's amount is the sum of its legs.
        amount: asTyped(legs.reduce((sum, leg) => sum + centsOf(leg.amount), 0)),
      }
    case 'reallocation':
      return { ...blank, fund_id: out.fund_id ?? '', to_fund_id: into.fund_id ?? '' }
    case 'transfer':
      return { ...blank, wallet_id: out.wallet_id, to_wallet_id: into.wallet_id }
    default:
      return blank
  }
}

/** "Needs 70% · Savings 30%" — an auto-split income's own proportions. */
function splitSummary(legs: Transaction[]): string {
  const total = legs.reduce((sum, leg) => sum + centsOf(leg.amount), 0)
  return legs
    .map((leg) => `${leg.fund_name} ${Math.round((centsOf(leg.amount) / total) * 100)}%`)
    .join(' · ')
}

/**
 * Another feature recording an expense through its own endpoint, with this
 * form as-is — how paying an upcoming expense works. The drawer shows the
 * caller's heading and submit label, starts on its amount, and hands the
 * finished expense to `submit`; the caller's mutation supplies the pending
 * and error state, and closes the drawer when it succeeds.
 */
export type ExpenseVia = {
  title: string
  description: string
  submitLabel: string
  /** The amount to start on, as the keypad would type it ("1500"). */
  amount: string
  /** Shown in the empty note field — what the note defaults to. */
  notePlaceholder?: string
  mutation: { isPending: boolean; isError: boolean; error: unknown; reset: () => void }
  submit: (input: ExpenseInput) => void
}

/**
 * Record income or an expense, move money between funds, or transfer it
 * between wallets — one drawer for all four, since they share the amount
 * keypad, the note and the date, and differ only in which wallets and funds
 * they touch.
 *
 * Sources only offer what can actually be spent: the funds a wallet holds,
 * with how much. The amount is checked against that before submitting; the
 * API checks again and is the authority.
 *
 * With `editing`, the same drawer edits an existing action in place: it
 * opens filled in, saves to the action's own edit endpoint, and reckons
 * what's available as if the action had never happened — an expense of
 * ₱40 from a fund now holding ₱60 may grow to ₱100.
 *
 * With `via` (and `action` 'expense'), it's the expense form for another
 * feature's endpoint — see `ExpenseVia`.
 */
export function ActionDrawer({
  action,
  editing = null,
  via = null,
  onOpenChange,
}: {
  /** The action being recorded or edited, or null when the drawer is shut. */
  action: EditableAction | null
  /** Every leg of the action being edited; null when recording a new one. */
  editing?: Transaction[] | null
  /** Record the expense through someone else's endpoint instead. */
  via?: ExpenseVia | null
  onOpenChange: (open: boolean) => void
}) {
  const open = action !== null
  const recordingMeta = action && action !== 'adjustment' ? ACTION_META[action] : null
  const openingBalance = editing?.[0]?.note === 'Opening balance'
  const title = via
    ? via.title
    : editing
      ? openingBalance
        ? 'Edit opening balance'
        : action && EDIT_TITLES[action]
      : recordingMeta?.title
  const wasAutoSplit = editing?.[0]?.type === 'income_auto_split'

  const { wallets } = useWallets()
  const { funds } = useFunds()
  const { rules } = useAllocation()
  const { suggestions: noteSuggestions } = useNoteSuggestions(action)

  const recordIncome = useRecordIncome()
  const recordExpense = useRecordExpense()
  const reallocate = useReallocate()
  const transfer = useTransfer()
  const editAction = useEditAction()
  const mutation = via
    ? via.mutation
    : editing
      ? editAction
      : action === 'expense'
      ? recordExpense
      : action === 'reallocation'
        ? reallocate
        : action === 'transfer'
          ? transfer
          : recordIncome

  // What can be picked: active wallets and funds — plus, when editing, the
  // ones the action already uses, even if archived since (its note can
  // still be fixed; the API refuses moving money in or out of them).
  const activeWallets = useMemo(() => wallets.filter((w) => w.archived_at === null), [wallets])
  const pickable = useMemo(() => {
    const used = new Set(editing?.flatMap((leg) => [leg.wallet_id, leg.fund_id ?? '']))
    return {
      wallets: wallets.filter((w) => w.archived_at === null || used.has(w.id)),
      funds: funds.filter((f) => f.archived_at === null || used.has(f.id)),
    }
  }, [wallets, funds, editing])

  /**
   * Cents a wallet holds of a fund, from the funds' cached holdings. When
   * editing, without the action's own legs: what the action may use is
   * everything it isn't already accounted for in.
   */
  const heldCents = useMemo(() => {
    const map = new Map<string, number>()
    for (const fund of funds) {
      for (const holding of fund.holdings) {
        map.set(`${holding.wallet_id}:${fund.id}`, centsOf(holding.balance))
      }
    }
    for (const leg of editing ?? []) {
      const key = `${leg.wallet_id}:${leg.fund_id}`
      map.set(key, (map.get(key) ?? 0) - centsOf(leg.amount))
    }
    return map
  }, [funds, editing])

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ActionFormValues>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      action: 'income',
      wallet_id: '',
      to_wallet_id: '',
      fund_id: '',
      to_fund_id: '',
      auto_allocate: false,
      amount: '',
      note: '',
      date: localToday(),
      available_cents: null,
    },
  })

  const walletId = useWatch({ control, name: 'wallet_id' })
  const fundId = useWatch({ control, name: 'fund_id' })
  const autoAllocate = useWatch({ control, name: 'auto_allocate' })
  const amount = useWatch({ control, name: 'amount' })

  // A fresh form each time the drawer opens. The first wallet is picked, and
  // income auto-allocates when an allocation exists — the point of having one.
  // Editing opens on the action as it stands.
  const editingGroup = editing?.[0]?.group_id
  useEffect(() => {
    if (!action) return
    mutation.reset()
    if (editing) {
      reset(editValues(action, editing))
      return
    }
    reset({
      action,
      wallet_id: activeWallets.length === 1 ? activeWallets[0].id : '',
      to_wallet_id: '',
      fund_id: '',
      to_fund_id: '',
      auto_allocate: action === 'income' && rules.length > 0,
      amount: via?.amount ?? '',
      note: '',
      date: localToday(),
      available_cents: null,
    })
    // Deliberately keyed on the action (and the one being edited) alone:
    // re-running when the wallets, rules or `mutation` identity change would
    // wipe what is being typed.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [action, editingGroup, reset])

  // Keep the available amount beside the form, so the schema can check it.
  // An adjustment takes money out only if it was a deduction to begin with.
  const isDebit =
    action !== null &&
    action !== 'income' &&
    !(action === 'adjustment' && editing !== null && Number(editing[0].amount) > 0)
  const available =
    isDebit && walletId && fundId ? (heldCents.get(`${walletId}:${fundId}`) ?? 0) : null
  useEffect(() => {
    setValue('available_cents', available)
  }, [available, setValue])

  // Funds this wallet actually holds — the only sensible sources.
  const heldIn = (wallet: string): PickerOption[] =>
    pickable.funds
      .filter((fund) => (heldCents.get(`${wallet}:${fund.id}`) ?? 0) > 0)
      .map((fund) => ({
        value: fund.id,
        label: fund.name,
        detail: formatMoney((heldCents.get(`${wallet}:${fund.id}`) ?? 0) / 100),
      }))

  const walletOptions: PickerOption[] = pickable.wallets.map((w) => ({ value: w.id, label: w.name }))
  const allFundOptions: PickerOption[] = pickable.funds.map((f) => ({ value: f.id, label: f.name }))

  const onSubmit = handleSubmit((values) => {
    if (!action) return
    const common = {
      amount: values.amount,
      date: values.date,
      // Snapped once more here: submitting from the keypad can send the form
      // without the note field ever blurring.
      note: snapNote(values.note, noteSuggestions) || undefined,
    }
    const done = {
      onSuccess: (entries: Transaction[]) => {
        toast.success(action === 'adjustment' ? 'Saved.' : confirmation(action, entries))
        onOpenChange(false)
      },
    }
    // An edit is the same body, sent to the action's own edit endpoint.
    const saveEdit = (input: IncomeInput | ExpenseInput | ReallocationInput | TransferInput) =>
      editing &&
      editAction.mutate(
        { action, groupId: editing[0].group_id, input },
        {
          onSuccess: () => {
            toast.success('Changes saved.')
            onOpenChange(false)
          },
        },
      )

    if (action === 'income') {
      const input: IncomeInput = values.auto_allocate
        ? { ...common, wallet_id: values.wallet_id, auto_allocate: true }
        : { ...common, wallet_id: values.wallet_id, fund_id: values.fund_id }
      if (editing) saveEdit(input)
      else recordIncome.mutate(input, done)
    } else if (action === 'expense' || action === 'adjustment') {
      const input: ExpenseInput | AdjustmentInput = {
        ...common,
        wallet_id: values.wallet_id,
        fund_id: values.fund_id,
      }
      if (editing) saveEdit(input)
      else if (via) via.submit(input)
      // Only ever edited: nothing records an adjustment from here.
      else if (action === 'expense') recordExpense.mutate(input, done)
    } else if (action === 'reallocation') {
      const input: ReallocationInput = {
        ...common,
        wallet_id: values.wallet_id,
        from_fund_id: values.fund_id,
        to_fund_id: values.to_fund_id,
      }
      if (editing) saveEdit(input)
      else reallocate.mutate(input, done)
    } else {
      const input: TransferInput = {
        ...common,
        from_wallet_id: values.wallet_id,
        to_wallet_id: values.to_wallet_id,
        fund_id: values.fund_id,
      }
      if (editing) saveEdit(input)
      else transfer.mutate(input, done)
    }
  })

  // Picking a different source wallet invalidates the fund picked in it —
  // when the fund list depends on the wallet at all.
  const clearFunds = () => {
    if (!isDebit) return
    setValue('fund_id', '')
    setValue('to_fund_id', '')
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>
              {via
                ? via.description
                : editing
                  ? 'Changes this entry in place. Balances adjust by the difference.'
                  : action === 'income'
                    ? 'Money that came in, and where it goes.'
                    : action === 'expense'
                      ? 'Money spent from one of your allocations.'
                      : action === 'reallocation'
                        ? 'Change what money is for. It stays in the same wallet.'
                        : 'Move money between wallets. It keeps its allocation.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
              </Alert>
            )}

            {activeWallets.length === 0 ? (
              <Alert>
                <AlertDescription>
                  Add a wallet first —{' '}
                  <Link to="/funds?tab=wallets" className="font-medium text-primary hover:underline">
                    go to Wallets
                  </Link>
                  .
                </AlertDescription>
              </Alert>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <FormPicker
                    control={control}
                    name="wallet_id"
                    label={action === 'transfer' ? 'From wallet' : 'Wallet'}
                    placeholder="Choose a wallet"
                    options={walletOptions}
                    error={errors.wallet_id}
                    onPicked={clearFunds}
                  />

                  {action === 'transfer' && (
                    <FormPicker
                      control={control}
                      name="to_wallet_id"
                      label="To wallet"
                      placeholder="Choose a wallet"
                      options={walletOptions.filter((w) => w.value !== walletId)}
                      error={errors.to_wallet_id}
                    />
                  )}

                  {((action === 'income' && !autoAllocate) ||
                    (action === 'adjustment' && !isDebit)) && (
                    <FormPicker
                      control={control}
                      name="fund_id"
                      label="Allocation"
                      placeholder="Choose an allocation"
                      options={allFundOptions}
                      error={errors.fund_id}
                    />
                  )}

                  {(action === 'expense' ||
                    action === 'reallocation' ||
                    action === 'transfer' ||
                    (action === 'adjustment' && isDebit)) && (
                    <FormPicker
                      control={control}
                      name="fund_id"
                      label={action === 'reallocation' ? 'From allocation' : 'Allocation'}
                      placeholder={walletId ? 'Choose an allocation' : 'Choose a wallet first'}
                      options={walletId ? heldIn(walletId) : []}
                      error={errors.fund_id}
                    />
                  )}

                  {action === 'reallocation' && (
                    <FormPicker
                      control={control}
                      name="to_fund_id"
                      label="To allocation"
                      placeholder="Choose an allocation"
                      options={allFundOptions.filter((f) => f.value !== fundId)}
                      error={errors.to_fund_id}
                    />
                  )}
                </div>

                {action === 'income' && (
                  <label className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                    <span className="flex-1">
                      <span className="block text-sm font-medium">Auto-allocate</span>
                      <span className="block text-xs text-muted-foreground">
                        {wasAutoSplit ? (
                          // Re-split in the same proportions as before, not
                          // by today's allocation — say so.
                          `Keeps its split: ${splitSummary(editing ?? [])}`
                        ) : rules.length === 0 ? (
                          <>
                            No income split yet —{' '}
                            <Link
                              to="/profile/income-split"
                              className="font-medium text-primary hover:underline"
                            >
                              set one up
                            </Link>
                          </>
                        ) : (
                          rules.map((rule) => `${rule.fund_name} ${rule.percentage}%`).join(' · ')
                        )}
                      </span>
                    </span>
                    <Controller
                      control={control}
                      name="auto_allocate"
                      render={({ field }) => (
                        <Switch
                          checked={field.value}
                          disabled={rules.length === 0 && !wasAutoSplit}
                          onCheckedChange={(checked) => {
                            field.onChange(checked)
                            if (checked) setValue('fund_id', '')
                          }}
                        />
                      )}
                    />
                  </label>
                )}

                <Controller
                  control={control}
                  name="amount"
                  render={({ field }) => (
                    <AmountPad
                      value={field.value}
                      onChange={field.onChange}
                      invalid={Boolean(errors.amount)}
                      hint={
                        errors.amount?.message ??
                        (available !== null
                          ? `Available: ${formatMoney(available / 100)}`
                          : undefined)
                      }
                    />
                  )}
                />

                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <Controller
                    control={control}
                    name="note"
                    render={({ field }) => (
                      <NoteField
                        action={action}
                        value={field.value}
                        onChange={field.onChange}
                        placeholder={via?.notePlaceholder}
                      />
                    )}
                  />
                  <Controller
                    control={control}
                    name="date"
                    render={({ field }) => (
                      <DatePicker
                        label="Date"
                        compact
                        value={field.value}
                        onChange={field.onChange}
                        invalid={Boolean(errors.date)}
                        className="w-auto"
                      />
                    )}
                  />
                </div>
                <FieldError errors={[errors.note, errors.date]} />
              </>
            )}
          </div>

          <DrawerFooter className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="h-11"
              disabled={mutation.isPending || activeWallets.length === 0}
            >
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {mutation.isPending
                ? 'Saving…'
                : via
                  ? via.submitLabel
                  : editing
                    ? 'Save changes'
                    : recordingMeta?.submit}
              {!mutation.isPending && amount && ` · ${formatMoney(amount)}`}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
