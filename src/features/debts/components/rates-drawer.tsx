import { useEffect, useState, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { DatePicker } from '@/components/date-picker'
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
import { cn } from '@/lib/utils'

import { useAddRate, useDeleteRate, useUpdateRate } from '../hooks/use-debts'
import { formatRate, shortDate } from '../lib/debt-meta'
import { rateSchema, type RateFormValues } from '../schemas/debt-schemas'
import type { Debt, DebtRate } from '../types'

/**
 * A debt's interest rate, and how it got there.
 *
 * A fixed debt keeps one rate for its life — there is nothing to add, only
 * that rate to correct. A variable one gets another row each time the rate
 * moves, so the rate an old payment was made under stays on the record
 * instead of being overwritten by today's.
 *
 * The rate is per MONTH, and with the debt's term it works out the interest:
 * flat, so `principal x rate x months` over the whole term. Without a term
 * there is nothing to multiply by, and what the lender bills is added to the
 * debt as a charge instead.
 *
 * Removing the last rate is allowed — that leaves the debt interest-free,
 * which is a real answer rather than an error.
 */
export function RatesDrawer({
  debt,
  onOpenChange,
}: {
  /** The debt whose rates these are, or null when the drawer is shut. */
  debt: Debt | null
  onOpenChange: (open: boolean) => void
}) {
  const add = useAddRate()
  const update = useUpdateRate()
  const remove = useDeleteRate()
  // The rate being corrected; null means the form adds a new one.
  const [editing, setEditing] = useState<DebtRate | null>(null)
  const fixed = debt?.rate_kind === 'fixed'
  // A fixed debt has one rate and can't gain another: the form only ever
  // corrects it, and is always open.
  const single = fixed ? (debt?.rates[0] ?? null) : null

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RateFormValues>({
    resolver: zodResolver(rateSchema),
    defaultValues: { monthly_rate: '', effective_from: localToday() },
  })

  // The drawer stays mounted between openings; start over each time.
  useEffect(() => {
    if (!debt) return
    setEditing(single)
    reset(
      single
        ? { monthly_rate: String(Number(single.monthly_rate)), effective_from: single.effective_from }
        : { monthly_rate: '', effective_from: localToday() },
    )
  }, [debt, single, reset])

  const edit = (rate: DebtRate | null) => {
    setEditing(rate)
    reset(
      rate
        ? { monthly_rate: String(Number(rate.monthly_rate)), effective_from: rate.effective_from }
        : { monthly_rate: '', effective_from: localToday() },
    )
  }

  const close = (next: boolean) => {
    if (!next) {
      add.reset()
      update.reset()
      remove.reset()
    }
    onOpenChange(next)
  }

  const pending = add.isPending || update.isPending
  const error = add.error ?? update.error ?? remove.error
  const failed = add.isError || update.isError || remove.isError

  const onSubmit = handleSubmit((values) => {
    if (!debt) return
    const input = { monthly_rate: values.monthly_rate, effective_from: values.effective_from }
    const done = {
      onSuccess: () => {
        toast.success(editing ? 'Rate updated.' : 'Rate change recorded.')
        if (!fixed) edit(null)
      },
    }
    if (editing) update.mutate({ id: debt.id, rateId: editing.id, input }, done)
    else add.mutate({ id: debt.id, input }, done)
  })

  return (
    <Drawer open={debt !== null} onOpenChange={close} showSwipeHandle>
      <DrawerContent>
        <form
          onSubmit={onSubmit as (event: FormEvent) => void}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          <DrawerHeader>
            <DrawerTitle>{debt && `${debt.name} · interest`}</DrawerTitle>
            <DrawerDescription>
              {fixed
                ? 'This debt keeps one rate. Correct it here, or make the debt variable to record changes over time.'
                : 'Record the rate each time it moves. Old rates stay on the record.'}{' '}
              {debt?.tenure_months
                ? "It's multiplied by the term to work out the interest."
                : 'Without a term there is nothing to work interest out from — add what you were billed to the debt instead.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {failed && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(error)}</AlertDescription>
              </Alert>
            )}

            {/* The history. A fixed debt's single rate is already in the
                form below, so listing it again would just be a duplicate. */}
            {!fixed && debt && debt.rates.length > 0 && (
              <ul className="space-y-2">
                {[...debt.rates].reverse().map((rate) => {
                  const inForce = rate.id === currentRateId(debt)
                  return (
                    <li
                      key={rate.id}
                      className={cn(
                        'flex items-center gap-3 rounded-xl border border-border bg-card p-3 text-card-foreground',
                        editing?.id === rate.id && 'ring-2 ring-ring/50',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium tabular-nums">{formatRate(rate.monthly_rate)}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          From {shortDate(rate.effective_from)}
                          {inForce && <span className="text-primary"> · in force</span>}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit the ${formatRate(rate.monthly_rate)} rate`}
                        onClick={() => edit(rate)}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete the ${formatRate(rate.monthly_rate)} rate`}
                        disabled={remove.isPending}
                        onClick={() =>
                          remove.mutate(
                            { id: debt.id, rateId: rate.id },
                            { onSuccess: () => toast.success('Rate change removed.') },
                          )
                        }
                      >
                        <Trash2 />
                      </Button>
                    </li>
                  )
                })}
              </ul>
            )}

            <div className="space-y-3 rounded-xl border border-border p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  {fixed ? 'Rate' : editing ? 'Edit this rate' : 'Record a rate change'}
                </p>
                {!fixed && editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="xs"
                    onClick={() => edit(null)}
                    aria-label="Stop editing"
                  >
                    <X />
                    Cancel
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label htmlFor="rate-value" className="text-sm font-medium">
                    Rate <span className="text-muted-foreground">(% a month)</span>
                  </label>
                  <Input
                    id="rate-value"
                    type="text"
                    inputMode="decimal"
                    placeholder="1.5"
                    autoComplete="off"
                    className="h-11 text-base md:text-sm"
                    aria-invalid={Boolean(errors.monthly_rate)}
                    {...register('monthly_rate')}
                  />
                  <FieldError errors={[errors.monthly_rate]} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="rate-from" className="text-sm font-medium">
                    In force from
                  </label>
                  <Controller
                    control={control}
                    name="effective_from"
                    render={({ field }) => (
                      <DatePicker
                        id="rate-from"
                        value={field.value}
                        onChange={field.onChange}
                        invalid={Boolean(errors.effective_from)}
                      />
                    )}
                  />
                  <FieldError errors={[errors.effective_from]} />
                </div>
              </div>
            </div>
          </div>

          {/* Primary action first, nearest the thumb. */}
          <DrawerFooter className="pt-2">
            <Button type="submit" size="lg" className="h-11" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              {!pending && !editing && <Plus />}
              {pending ? 'Saving…' : editing ? 'Save rate' : fixed ? 'Set rate' : 'Add rate change'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => close(false)}
            >
              Done
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}

/** Which row the API says is in force — the latest rate that has taken
 * effect, which is what `current_rate` reports. */
function currentRateId(debt: Debt): string | undefined {
  const taken = debt.rates.filter((rate) => rate.effective_from <= localToday())
  return (taken.at(-1) ?? debt.rates[0])?.id
}
