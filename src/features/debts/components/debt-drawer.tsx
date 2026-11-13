import { useEffect, useState, type FormEvent, type ReactNode, type Ref } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { AmountPad, sanitizeAmount } from '@/components/amount-pad'
import { DatePicker } from '@/components/date-picker'
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
import { env } from '@/config/env'
import { localToday } from '@/features/transactions'
import { useIsCompact } from '@/hooks/use-compact'
import { getApiErrorMessage } from '@/lib/api-client'
import { formatMoney } from '@/lib/money'

import { useCreateDebt, useUpdateDebt } from '../hooks/use-debts'
import { interestPreview } from '../lib/interest-preview'
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

// Short labels: they share one segmented row, under the "Interest" label.
const RATE_KIND_OPTIONS: SegmentOption<RateKind>[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'variable', label: 'Variable' },
]

const SYMBOL =
  new Intl.NumberFormat('en-US', { style: 'currency', currency: env.CURRENCY })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? ''

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
        // an existing debt, and this value is never sent — it only feeds
        // the preview, which is worked out from the rate in force.
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

/** A small uppercase heading over a group of fields (the wide panel). */
function GroupHeading({ children }: { children: ReactNode }) {
  return (
    <p className="pt-1 text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
      {children}
    </p>
  )
}

/**
 * The borrowed amount as an ordinary field, for the one-screen form on a big
 * screen: AmountPad's typed field is a headline that takes the focus, which
 * belongs to the name here. Same sanitising, so the value is the same string.
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
 * The flat interest and the monthly payment, worked out as the fields are
 * filled in — the API's own formula (`lib/interest-preview`), so what shows
 * here is what the debt's page will say once it's saved.
 */
function InterestPreviewCard({
  principal,
  monthlyRate,
  tenureMonths,
  editing,
}: {
  principal: string
  monthlyRate: string
  tenureMonths: string
  editing: boolean
}) {
  const preview = interestPreview({ principal, monthlyRate, tenureMonths })
  const months = /^\d+$/.test(tenureMonths.trim()) ? Number(tenureMonths) : null
  const show = (cents: number | null) => (cents === null ? '—' : formatMoney(cents / 100))

  return (
    <div className="space-y-1.5 rounded-xl border border-border bg-background px-3.5 py-2.5">
      <dl className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-sm">
        <dt className="text-muted-foreground">
          {months ? `Interest over ${months} ${months === 1 ? 'month' : 'months'}` : 'Interest'}
        </dt>
        <dd className="text-right font-semibold tabular-nums">{show(preview.interestCents)}</dd>
        <dt className="text-muted-foreground">Each month</dt>
        <dd className="text-right font-semibold tabular-nums">{show(preview.monthlyCents)}</dd>
      </dl>
      {(preview.hint || editing) && (
        <p className="text-xs text-muted-foreground">
          {preview.hint ?? 'At the rate in force now. Change it under Interest.'}
        </p>
      )}
    </div>
  )
}

/**
 * Add a debt, or edit one. On a phone, in two steps, so the keypad gets a
 * screen of its own: first what it is (name, lender, when it started, how
 * its rate behaves), then how much was borrowed. From `lg` the amount is a
 * typed field, so it is ONE form in a wide panel, its fields grouped — what
 * it is, the money, the terms — with short ones paired.
 *
 * Both show a live preview of the flat interest and the monthly payment.
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
  const compact = useIsCompact()
  const [step, setStep] = useState(0)
  // One form from `lg`, whatever step a phone-width window had reached.
  const oneStep = !compact

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
  const [principal, monthlyRate, tenureMonths] = useWatch({
    control,
    name: ['principal', 'monthly_rate', 'tenure_months'],
  })

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

  // --- the fields, laid out below per screen size --------------------------

  const nameField = (
    <div className="space-y-1.5">
      <label htmlFor="debt-name" className="text-sm font-medium">
        Name
      </label>
      <Input
        id="debt-name"
        // The first field of the one-step form takes the focus; a phone's
        // first step keeps today's behaviour (no keyboard thrown up).
        autoFocus={oneStep}
        placeholder="Car loan, Credit card…"
        autoComplete="off"
        className="h-11 text-base md:text-sm"
        aria-invalid={Boolean(errors.name)}
        {...register('name')}
      />
      <FieldError errors={[errors.name]} />
    </div>
  )

  const lenderField = (
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
  )

  const openedField = (
    <div className="space-y-1.5">
      <label htmlFor="debt-opened" className="text-sm font-medium">
        {oneStep ? 'Opened on' : 'Started'}
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
  )

  const rateKindField = (
    <div className="space-y-1.5">
      <p className="text-sm font-medium" aria-hidden="true">
        Interest
      </p>
      <Controller
        control={control}
        name="rate_kind"
        render={({ field }) => (
          <SegmentedControl
            label="Interest"
            value={field.value}
            onChange={field.onChange}
            options={RATE_KIND_OPTIONS}
          />
        )}
      />
    </div>
  )

  // On an existing debt the rate lives in its history, which this form must
  // not rewrite — it is changed under Interest. The term stays editable.
  const rateField = !debt && (
    <div className="space-y-1.5">
      <label htmlFor="debt-rate" className="text-sm font-medium">
        {oneStep ? 'Monthly rate' : 'Rate'}{' '}
        <span className="text-muted-foreground">(% a month)</span>
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
  )

  const termField = (
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
  )

  const minimumField = (
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

  const preview = (
    <InterestPreviewCard
      principal={principal}
      monthlyRate={monthlyRate}
      tenureMonths={tenureMonths}
      editing={debt !== null}
    />
  )

  const saveLabel = (
    <>
      {mutation.isPending && <Loader2 className="animate-spin" />}
      {mutation.isPending ? 'Saving…' : debt ? 'Save changes' : 'Add debt'}
      {!mutation.isPending && principal && ` · ${formatMoney(principal)}`}
    </>
  )

  return (
    <Drawer open={open} onOpenChange={close} showSwipeHandle>
      <DrawerContent size="wide">
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{debt ? 'Edit debt' : 'New debt'}</DrawerTitle>
            <DrawerDescription>
              {oneStep
                ? 'What you owe. Adding it moves no money.'
                : step === 0
                  ? 'Who do you owe, and on what terms?'
                  : 'How much did you borrow to begin with?'}
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
                <GroupHeading>What it is</GroupHeading>
                <div className="grid grid-cols-2 gap-3">
                  {nameField}
                  {lenderField}
                </div>

                <GroupHeading>The money</GroupHeading>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label htmlFor="debt-principal" className="text-sm font-medium">
                      Borrowed
                    </label>
                    <Controller
                      control={control}
                      name="principal"
                      render={({ field }) => (
                        <MoneyField
                          id="debt-principal"
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          // So a failed save focuses it, as the design asks.
                          inputRef={field.ref}
                          invalid={Boolean(errors.principal)}
                        />
                      )}
                    />
                    <FieldError errors={[errors.principal]} />
                  </div>
                  {minimumField}
                </div>

                <GroupHeading>The terms</GroupHeading>
                <div className="grid grid-cols-2 gap-3">
                  {openedField}
                  {termField}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {rateKindField}
                  {rateField}
                </div>
                {preview}
                {noteField}
              </>
            ) : step === 0 ? (
              <>
                {nameField}
                {lenderField}
                <div className="grid gap-3 sm:grid-cols-2">
                  {openedField}
                  {rateKindField}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {rateField}
                  {termField}
                </div>
                {minimumField}
                {noteField}
              </>
            ) : (
              <>
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
                {/* Rate and term were given on the first step; the
                    preview fills in as the keypad is typed on. */}
                {preview}
              </>
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
