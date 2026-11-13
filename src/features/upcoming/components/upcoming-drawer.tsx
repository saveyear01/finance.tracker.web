import { useEffect, useState, type FormEvent, type Ref } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { AmountPad, sanitizeAmount } from '@/components/amount-pad'
import { DatePicker } from '@/components/date-picker'
import { Picker, type PickerOption } from '@/components/picker'
import { SegmentedControl, type SegmentOption } from '@/components/segmented-control'
import { Stepper } from '@/components/stepper'
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
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { env } from '@/config/env'
import { localToday } from '@/features/transactions'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useCreateUpcoming, useUpdateUpcoming } from '../hooks/use-upcoming'
import { readBack } from '../lib/read-back'
import { upcomingSchema, type UpcomingFormValues } from '../schemas/upcoming-schemas'
import type { Recurrence, UpcomingExpense } from '../types'

const STEPS = ['Details', 'Amount']
/** The fields the first step asks for — checked before moving on. */
const DETAILS: (keyof UpcomingFormValues)[] = ['name', 'due_date', 'recurrence', 'whole_month', 'note']

// Short labels: the three share one segmented row, under "Repeats".
const RECURRENCE_OPTIONS: SegmentOption<Recurrence>[] = [
  { value: 'none', label: 'Once' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const SYMBOL =
  new Intl.NumberFormat('en-US', { style: 'currency', currency: env.CURRENCY })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? ''

/**
 * The amount as an ordinary field beside the name, for the one-screen form
 * on a big screen: AmountPad's typed field is a headline that takes the
 * focus, which belongs to the name here. Same sanitising, same string.
 */
function MoneyField({
  id,
  value,
  onChange,
  onBlur,
  inputRef,
  invalid,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  onBlur: () => void
  inputRef: Ref<HTMLInputElement>
  invalid: boolean
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute inset-y-0 left-3 grid place-items-center text-muted-foreground">
        {SYMBOL}
      </span>
      <Input
        id={id}
        ref={inputRef}
        inputMode="decimal"
        autoComplete="off"
        placeholder="0.00"
        className="h-11 pl-7 font-semibold tabular-nums text-base md:text-sm"
        aria-invalid={invalid}
        value={value}
        onChange={(event) => onChange(sanitizeAmount(event.target.value))}
        onBlur={onBlur}
      />
    </div>
  )
}

/**
 * The months a budget can be for, as YYYY-MM-01: a year back (to fix one
 * just past) through two years ahead — and the one it already has, if that
 * lies outside.
 */
function monthOptions(current: string): PickerOption[] {
  const now = new Date()
  const keys = Array.from({ length: 37 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - 12 + index, 1)
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
  })
  const selected = current ? `${current.slice(0, 7)}-01` : ''
  if (selected && !keys.includes(selected)) keys.push(selected)
  return keys.sort().map((key) => {
    const [year, month] = key.split('-').map(Number)
    return {
      value: key,
      label: new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    }
  })
}

/** A stored amount as the keypad would have typed it: "1500", "1500.50". */
function asTyped(amount: string): string {
  const cents = Math.round(Number(amount) * 100)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

function valuesFor(expense: UpcomingExpense | null): UpcomingFormValues {
  return expense
    ? {
        name: expense.name,
        amount: asTyped(expense.amount),
        due_date: expense.due_date,
        recurrence: expense.recurrence,
        whole_month: expense.whole_month,
        note: expense.note ?? '',
      }
    : { name: '', amount: '', due_date: localToday(), recurrence: 'monthly', whole_month: false, note: '' }
}

/**
 * Add a bill, or edit one. On a phone in two steps, so the keypad gets a
 * screen of its own: first what it is and when (name, due date, repeats,
 * note), then how much. From `lg` the amount is typed, so there is no keypad
 * screen to make room for: it is ONE form in a wide panel (decided
 * 2026-11-13) — name and amount paired, then the date and repeats, with the
 * plan read back in words under them. Repeating starts on "Every month"; most bills do. Editing the first
 * due date or the repeat reshapes every due date.
 *
 * "No fixed date" makes it a BUDGET for a whole month (2026-11-13): the date
 * picker becomes a month picker, and it is spent any time in that month.
 */
export function UpcomingDrawer({
  open,
  expense,
  onOpenChange,
}: {
  open: boolean
  /** The bill being edited; null to add one. */
  expense: UpcomingExpense | null
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateUpcoming()
  const update = useUpdateUpcoming()
  const mutation = expense ? update : create
  const compact = useIsCompact()
  const [step, setStep] = useState(0)
  // One form from `lg`, whatever step a phone-width window had reached.
  const oneStep = !compact

  const {
    register,
    control,
    handleSubmit,
    reset,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<UpcomingFormValues>({
    resolver: zodResolver(upcomingSchema),
    defaultValues: valuesFor(null),
  })
  const [amount, dueDate, recurrence, wholeMonth] = useWatch({
    control,
    name: ['amount', 'due_date', 'recurrence', 'whole_month'],
  })
  const plan = readBack(dueDate, recurrence, wholeMonth)

  // The drawer stays mounted between openings; start over each time.
  useEffect(() => {
    if (!open) return
    reset(valuesFor(expense))
    setStep(0)
  }, [open, expense, reset])

  const close = (next: boolean) => {
    if (!next) {
      create.reset()
      update.reset()
    }
    onOpenChange(next)
  }

  const save = handleSubmit((values) => {
    const input = {
      name: values.name,
      amount: values.amount,
      due_date: values.due_date,
      recurrence: values.recurrence,
      whole_month: values.whole_month,
      note: values.note.trim() || undefined,
    }
    const done = {
      onSuccess: () => {
        toast.success(expense ? 'Changes saved.' : `${values.name} added.`)
        close(false)
      },
    }
    if (expense) update.mutate({ id: expense.id, input }, done)
    else create.mutate(input, done)
  })

  // Enter on the phone's first step moves on rather than saving a form whose
  // amount hasn't been asked for yet. The one-step form just saves.
  const onSubmit = async (event: FormEvent) => {
    if (!oneStep && step === 0) {
      event.preventDefault()
      if (await trigger(DETAILS)) setStep(1)
      return
    }
    await save(event)
  }

  const nameField = (
    <div className="space-y-1.5">
      <label htmlFor="upcoming-name" className="text-sm font-medium">
        Name
      </label>
      <Input
        id="upcoming-name"
        // The first field of the one-step form takes the focus; a phone's
        // first step keeps today's behaviour (no keyboard thrown up).
        autoFocus={oneStep}
        placeholder="Rent, Internet, Insurance…"
        autoComplete="off"
        className="h-11 text-base md:text-sm"
        aria-invalid={Boolean(errors.name)}
        {...register('name')}
      />
      <FieldError errors={[errors.name]} />
    </div>
  )

  const whenFields = (
    <div className="space-y-2">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="upcoming-due" className="text-sm font-medium">
            {wholeMonth
              ? recurrence === 'none'
                ? 'Month'
                : 'First month'
              : expense || oneStep
                ? 'First due'
                : 'Due'}
          </label>
          <Controller
            control={control}
            name="due_date"
            render={({ field }) =>
              wholeMonth ? (
                <Picker
                  id="upcoming-due"
                  label="Month"
                  placeholder="Choose a month"
                  value={field.value}
                  onChange={field.onChange}
                  options={monthOptions(field.value)}
                  invalid={Boolean(errors.due_date)}
                />
              ) : (
                <DatePicker
                  id="upcoming-due"
                  value={field.value}
                  onChange={field.onChange}
                  invalid={Boolean(errors.due_date)}
                />
              )
            }
          />
          <FieldError errors={[errors.due_date]} />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium" aria-hidden="true">
            Repeats
          </p>
          <Controller
            control={control}
            name="recurrence"
            render={({ field }) => (
              <SegmentedControl
                label="Repeats"
                value={field.value}
                onChange={field.onChange}
                options={RECURRENCE_OPTIONS}
              />
            )}
          />
        </div>
      </div>
      <Controller
        control={control}
        name="whole_month"
        render={({ field }) => (
          <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-border px-3.5 py-2.5">
            <span className="min-w-0">
              <span className="block text-sm font-medium">No fixed date</span>
              <span className="block text-xs text-muted-foreground">A budget: spend it any time that month.</span>
            </span>
            <Switch
              checked={field.value}
              onCheckedChange={(on: boolean) => {
                field.onChange(on)
                // A budget is the month's: keep the month, drop the day.
                if (on && dueDate) setValue('due_date', `${dueDate.slice(0, 7)}-01`)
              }}
            />
          </label>
        )}
      />
      {/* The plan in words, so a wrong "Monthly" is caught before saving. */}
      {plan && (
        <p className="text-xs text-muted-foreground" aria-live="polite">
          {plan}
        </p>
      )}
    </div>
  )

  const noteField = (
    <div className="space-y-1.5">
      <Input
        placeholder="Add notes…"
        aria-label="Note"
        className="h-11 text-base md:text-sm"
        {...register('note')}
      />
      <FieldError errors={[errors.note]} />
    </div>
  )

  const saveLabel = (
    <>
      {mutation.isPending && <Loader2 className="animate-spin" />}
      {mutation.isPending ? 'Saving…' : expense ? 'Save changes' : 'Add upcoming expense'}
      {!mutation.isPending && amount && ` · ${formatMoney(amount)}`}
    </>
  )

  return (
    <Drawer open={open} onOpenChange={close} showSwipeHandle>
      <DrawerContent size="wide">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{expense ? 'Edit upcoming expense' : 'New upcoming expense'}</DrawerTitle>
            <DrawerDescription>
              {oneStep
                ? 'A bill you expect to pay. It moves no money until you pay it.'
                : step === 0
                  ? 'What is it, and when is it due?'
                  : 'How much is it, usually?'}
            </DrawerDescription>
          </DrawerHeader>

          {!oneStep && (
            <div className="px-4">
              <Stepper steps={STEPS} current={step} />
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 lg:px-6">
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
              </Alert>
            )}

            {oneStep ? (
              <>
                <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-3">
                  {nameField}
                  <div className="space-y-1.5">
                    <label htmlFor="upcoming-amount" className="text-sm font-medium">
                      Amount
                    </label>
                    <Controller
                      control={control}
                      name="amount"
                      render={({ field }) => (
                        <MoneyField
                          id="upcoming-amount"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          // So a failed save focuses it.
                          inputRef={field.ref}
                          invalid={Boolean(errors.amount)}
                        />
                      )}
                    />
                    <FieldError errors={[errors.amount]} />
                  </div>
                </div>
                {whenFields}
                {noteField}
              </>
            ) : step === 0 ? (
              <>
                {nameField}
                {whenFields}
                {noteField}
              </>
            ) : (
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <AmountPad
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.amount)}
                    hint={errors.amount?.message}
                  />
                )}
              />
            )}
          </div>

          {/* Primary action first, nearest the thumb. */}
          <DrawerFooter className="pt-2">
            {oneStep ? (
              <>
                <Button type="submit" size="lg" className="h-11" disabled={mutation.isPending}>
                  {saveLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11"
                  onClick={() => close(false)}
                >
                  Cancel
                </Button>
              </>
            ) : step === 0 ? (
              <Button type="submit" size="lg" className="h-11">
                Next
              </Button>
            ) : (
              <>
                <Button type="submit" size="lg" className="h-11" disabled={mutation.isPending}>
                  {saveLabel}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="h-11"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
              </>
            )}
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
