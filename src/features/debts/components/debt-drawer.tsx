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

import { useCreateDebt, useUpdateDebt } from '../hooks/use-debts'
import { RATE_KIND_LABELS } from '../lib/debt-meta'
import { debtSchema, type DebtFormValues } from '../schemas/debt-schemas'
import type { Debt, RateKind } from '../types'

const STEPS = ['Details', 'Amount']
/** The fields the first step asks for — checked before moving on. */
const DETAILS: (keyof DebtFormValues)[] = [
  'name',
  'lender',
  'opened_on',
  'tenure_months',
  'rate_kind',
  'monthly_rate',
  'note',
]

const RATE_KIND_OPTIONS: PickerOption[] = (['fixed', 'variable'] as RateKind[]).map((value) => ({
  value,
  label: RATE_KIND_LABELS[value],
}))

/** A stored amount as the keypad would have typed it: "1500", "1500.50". */
function asTyped(amount: string): string {
  const cents = Math.round(Number(amount) * 100)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

function valuesFor(debt: Debt | null): DebtFormValues {
  return debt
    ? {
        name: debt.name,
        lender: debt.lender ?? '',
        principal: asTyped(debt.principal),
        minimum_payment: debt.minimum_payment ? asTyped(debt.minimum_payment) : '',
        opened_on: debt.opened_on,
        tenure_months: debt.tenure_months === null ? '' : String(debt.tenure_months),
        rate_kind: debt.rate_kind,
        // Editing never rewrites the rate history; the field isn't shown on
        // an existing debt, and this value is never sent.
        monthly_rate: debt.current_rate ? String(Number(debt.current_rate)) : '',
        note: debt.note ?? '',
      }
    : {
        name: '',
        lender: '',
        principal: '',
        minimum_payment: '',
        opened_on: localToday(),
        tenure_months: '',
        rate_kind: 'fixed',
        monthly_rate: '',
        note: '',
      }
}

/**
 * Add a debt, or edit one — in two steps, so the keypad gets a screen of its
 * own: first what it is (name, lender, when it started, how its rate
 * behaves), then how much was borrowed.
 *
 * Adding a debt moves no money: it records what is owed. If the borrowed
 * cash landed in a wallet, that is income, logged on its own.
 *
 * The rate is asked for once, when the debt is added — it opens the rate
 * history. Editing a debt leaves that history alone (it is changed under
 * Interest), so a rename can never quietly rewrite what an old payment was
 * made under.
 *
 * Rate and term are both optional, and both are needed for interest: it is
 * flat, so the monthly rate is multiplied by the number of months. Leave the
 * rate out for interest-free debt, the term out for a card. What a lender
 * bills on an open-ended debt is added to it as a charge instead.
 */
export function DebtDrawer({
  open,
  debt,
  onOpenChange,
}: {
  open: boolean
  /** The debt being edited; null to add one. */
  debt: Debt | null
  onOpenChange: (open: boolean) => void
}) {
  const create = useCreateDebt()
  const update = useUpdateDebt()
  const mutation = debt ? update : create
  const [step, setStep] = useState(0)

  const {
    register,
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors },
  } = useForm<DebtFormValues>({
    resolver: zodResolver(debtSchema),
    defaultValues: valuesFor(null),
  })
  const principal = useWatch({ control, name: 'principal' })

  // The drawer stays mounted between openings; start over each time.
  useEffect(() => {
    if (!open) return
    reset(valuesFor(debt))
    setStep(0)
  }, [open, debt, reset])

  const close = (next: boolean) => {
    if (!next) {
      create.reset()
      update.reset()
    }
    onOpenChange(next)
  }

  const save = handleSubmit((values) => {
    const shared = {
      name: values.name,
      lender: values.lender.trim() || undefined,
      principal: values.principal,
      minimum_payment: values.minimum_payment.trim() || undefined,
      opened_on: values.opened_on,
      tenure_months: values.tenure_months.trim() ? Number(values.tenure_months) : undefined,
      rate_kind: values.rate_kind,
      note: values.note.trim() || undefined,
    }
    const done = {
      onSuccess: () => {
        toast.success(debt ? 'Changes saved.' : `${values.name} added.`)
        close(false)
      },
    }
    if (debt) update.mutate({ id: debt.id, input: shared }, done)
    else
      create.mutate(
        // Blank means interest-free: no rate is recorded at all, rather
        // than a zero one standing in for one nobody set.
        { ...shared, monthly_rate: values.monthly_rate.trim() || undefined },
        done,
      )
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
            <DrawerTitle>{debt ? 'Edit debt' : 'New debt'}</DrawerTitle>
            <DrawerDescription>
              {step === 0
                ? 'Who do you owe, and on what terms?'
                : 'How much did you borrow to begin with?'}
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
                  <label htmlFor="debt-name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input
                    id="debt-name"
                    placeholder="Car loan, Credit card…"
                    autoComplete="off"
                    className="h-11 text-base md:text-sm"
                    aria-invalid={Boolean(errors.name)}
                    {...register('name')}
                  />
                  <FieldError errors={[errors.name]} />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="debt-lender" className="text-sm font-medium">
                    Lender <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    id="debt-lender"
                    placeholder="BPI, a friend…"
                    autoComplete="off"
                    className="h-11 text-base md:text-sm"
                    aria-invalid={Boolean(errors.lender)}
                    {...register('lender')}
                  />
                  <FieldError errors={[errors.lender]} />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label htmlFor="debt-opened" className="text-sm font-medium">
                      Started
                    </label>
                    <Controller
                      control={control}
                      name="opened_on"
                      render={({ field }) => (
                        <DatePicker
                          id="debt-opened"
                          value={field.value}
                          onChange={field.onChange}
                          invalid={Boolean(errors.opened_on)}
                        />
                      )}
                    />
                    <FieldError errors={[errors.opened_on]} />
                  </div>
                  <FormPicker
                    control={control}
                    name="rate_kind"
                    label="Interest"
                    placeholder="Choose"
                    options={RATE_KIND_OPTIONS}
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {/* On an existing debt the rate lives in its history, which
                      this form must not rewrite — it is changed under
                      Interest. The term stays editable either way. */}
                  {!debt && (
                    <div className="space-y-1.5">
                      <label htmlFor="debt-rate" className="text-sm font-medium">
                        Rate <span className="text-muted-foreground">(% a month)</span>
                      </label>
                      <Input
                        id="debt-rate"
                        type="text"
                        inputMode="decimal"
                        placeholder="None"
                        autoComplete="off"
                        className="h-11 text-base md:text-sm"
                        aria-invalid={Boolean(errors.monthly_rate)}
                        {...register('monthly_rate')}
                      />
                      <FieldError errors={[errors.monthly_rate]} />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <label htmlFor="debt-term" className="text-sm font-medium">
                      Term <span className="text-muted-foreground">(months)</span>
                    </label>
                    <Input
                      id="debt-term"
                      type="text"
                      inputMode="numeric"
                      placeholder="Open-ended"
                      autoComplete="off"
                      className="h-11 text-base md:text-sm"
                      aria-invalid={Boolean(errors.tenure_months)}
                      {...register('tenure_months')}
                    />
                    <FieldError errors={[errors.tenure_months]} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="debt-minimum" className="text-sm font-medium">
                    Minimum payment <span className="text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    id="debt-minimum"
                    type="text"
                    inputMode="decimal"
                    placeholder="What's asked each period"
                    autoComplete="off"
                    className="h-11 text-base md:text-sm"
                    aria-invalid={Boolean(errors.minimum_payment)}
                    {...register('minimum_payment')}
                  />
                  <FieldError errors={[errors.minimum_payment]} />
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
                name="principal"
                render={({ field }) => (
                  <AmountPad
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.principal)}
                    hint={errors.principal?.message ?? 'What you borrowed, before any fees.'}
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
                  {mutation.isPending ? 'Saving…' : debt ? 'Save changes' : 'Add debt'}
                  {!mutation.isPending && principal && ` · ${formatMoney(principal)}`}
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
