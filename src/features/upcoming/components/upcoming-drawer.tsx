import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { AmountPad } from '@/components/amount-pad'
import { DatePicker } from '@/components/date-picker'
import { FormPicker, type PickerOption } from '@/components/form-picker'
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
import { localToday } from '@/features/transactions'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useCreateUpcoming, useUpdateUpcoming } from '../hooks/use-upcoming'
import { RECURRENCE_LABELS } from '../lib/upcoming-meta'
import { upcomingSchema, type UpcomingFormValues } from '../schemas/upcoming-schemas'
import type { Recurrence, UpcomingExpense } from '../types'

const STEPS = ['Details', 'Amount']
/** The fields the first step asks for — checked before moving on. */
const DETAILS: (keyof UpcomingFormValues)[] = ['name', 'due_date', 'recurrence', 'note']

const RECURRENCE_OPTIONS: PickerOption[] = (['none', 'monthly', 'yearly'] as Recurrence[]).map(
  (value) => ({ value, label: RECURRENCE_LABELS[value] }),
)

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
        note: expense.note ?? '',
      }
    : { name: '', amount: '', due_date: localToday(), recurrence: 'monthly', note: '' }
}

/**
 * Add a bill, or edit one — in two steps, so the keypad gets a screen of its
 * own: first what it is and when (name, due date, repeats, note), then how
 * much. Repeating starts on "Every month"; most bills do. Editing the first
 * due date or the repeat reshapes every due date.
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
  const [step, setStep] = useState(0)

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<UpcomingFormValues>({
    resolver: zodResolver(upcomingSchema),
    defaultValues: valuesFor(null),
  })
  const amount = useWatch({ control, name: 'amount' })

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

  // Enter on the first step moves on rather than saving a form whose
  // amount hasn't been asked for yet.
  const onSubmit = async (event: FormEvent) => {
    if (step === 0) {
      event.preventDefault()
      if (await trigger(DETAILS)) setStep(1)
      return
    }
    await save(event)
  }

  return (
    <Drawer open={open} onOpenChange={close} showSwipeHandle>
      <DrawerContent>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{expense ? 'Edit upcoming expense' : 'New upcoming expense'}</DrawerTitle>
            <DrawerDescription>
              {step === 0 ? 'What is it, and when is it due?' : 'How much is it, usually?'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4">
            <Stepper steps={STEPS} current={step} />
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {mutation.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
              </Alert>
            )}

            {step === 0 ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="upcoming-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="upcoming-name"
                    placeholder="Rent, Internet, Insurance…"
                    autoComplete="off"
                    className="h-11 text-base md:text-sm"
                    aria-invalid={Boolean(errors.name)}
                    {...register('name')}
                  />
                  <FieldError errors={[errors.name]} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="upcoming-due" className="text-sm font-medium">
                      {expense ? 'First due' : 'Due'}
                    </label>
                    <Controller
                      control={control}
                      name="due_date"
                      render={({ field }) => (
                        <DatePicker
                          id="upcoming-due"
                          value={field.value}
                          onChange={field.onChange}
                          invalid={Boolean(errors.due_date)}
                        />
                      )}
                    />
                    <FieldError errors={[errors.due_date]} />
                  </div>
                  <FormPicker
                    control={control}
                    name="recurrence"
                    label="Repeats"
                    placeholder="Choose"
                    options={RECURRENCE_OPTIONS}
                  />
                </div>

                <div className="space-y-1.5">
                  <Input
                    placeholder="Add notes…"
                    aria-label="Note"
                    className="h-11 text-base md:text-sm"
                    {...register('note')}
                  />
                  <FieldError errors={[errors.note]} />
                </div>
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
            {step === 0 ? (
              <Button type="submit" size="lg" className="h-11">
                Next
              </Button>
            ) : (
              <>
                <Button type="submit" size="lg" className="h-11" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="animate-spin" />}
                  {mutation.isPending ? 'Saving…' : expense ? 'Save changes' : 'Add upcoming expense'}
                  {!mutation.isPending && amount && ` · ${formatMoney(amount)}`}
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
