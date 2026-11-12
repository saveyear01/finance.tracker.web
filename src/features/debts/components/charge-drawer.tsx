import { useEffect, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Trash2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { AmountPad } from '@/components/amount-pad'
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
import { formatMoney } from '@/lib/money'

import { useAddCharge, useDeleteCharge, useUpdateCharge } from '../hooks/use-debts'
import { chargeSchema, type ChargeFormValues } from '../schemas/debt-schemas'
import type { Debt, DebtCharge } from '../types'

/** A stored amount as the keypad would have typed it: "1500", "1500.50". */
function asTyped(amount: string): string {
  const cents = Math.round(Number(amount) * 100)
  return cents % 100 === 0 ? String(cents / 100) : (cents / 100).toFixed(2)
}

const valuesFor = (charge: DebtCharge | null): ChargeFormValues =>
  charge
    ? { amount: asTyped(charge.amount), charged_on: charge.charged_on, note: charge.note ?? '' }
    : { amount: '', charged_on: localToday(), note: '' }

/**
 * Add to what a debt owes: a late fee, interest the lender billed, or a
 * restructure that put the amount up — or, given a `charge`, correct one or
 * delete it (opened from the debt's History; one added by mistake would
 * otherwise be there for good).
 *
 * No money moves — this is owed, not spent — so nothing is written to the
 * activity and no wallet changes. It is kept as its own dated row rather
 * than edited into the principal, so what was borrowed stays what was
 * borrowed and every rise says why. A paid-off debt owing again reopens.
 */
export function ChargeDrawer({
  debt,
  charge = null,
  onOpenChange,
}: {
  /** The debt being charged, or null when the drawer is shut. */
  debt: Debt | null
  /** The charge being edited; null to add one. */
  charge?: DebtCharge | null
  onOpenChange: (open: boolean) => void
}) {
  const add = useAddCharge()
  const update = useUpdateCharge()
  const remove = useDeleteCharge()
  const mutation = charge ? update : add

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: valuesFor(null),
  })

  // The drawer stays mounted between openings; start over each time.
  useEffect(() => {
    if (debt) reset(valuesFor(charge))
  }, [debt, charge, reset])

  const close = (next: boolean) => {
    if (!next) {
      add.reset()
      update.reset()
      remove.reset()
    }
    onOpenChange(next)
  }

  const deleteCharge = () => {
    if (!debt || !charge) return
    remove.mutate(
      { id: debt.id, chargeId: charge.id },
      {
        onSuccess: (result) => {
          toast.success(`Charge removed · ${formatMoney(result.remaining)} of ${debt.name} left.`)
          close(false)
        },
      },
    )
  }

  const onSubmit = handleSubmit((values) => {
    if (!debt) return
    const input = {
      amount: values.amount,
      charged_on: values.charged_on,
      note: values.note.trim() || undefined,
    }
    const done = {
      onSuccess: (result: Debt) => {
        toast.success(
          charge
            ? `Charge saved · ${formatMoney(result.remaining)} of ${debt.name} left.`
            : `${formatMoney(values.amount)} added · ${formatMoney(result.remaining)} of ${debt.name} left.`,
        )
        close(false)
      },
    }
    if (charge) update.mutate({ id: debt.id, chargeId: charge.id, input }, done)
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
            <DrawerTitle>
              {charge ? (charge.note ?? 'Charge') : debt && `Add a charge to ${debt.name}`}
            </DrawerTitle>
            <DrawerDescription>
              {charge
                ? 'No money moved: this only raised what you owe. Change it, or delete it if it was added by mistake.'
                : 'A fee, interest you were billed, or a restructure. No money moves — it just adds to what you owe.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {(mutation.isError || remove.isError) && (
              <Alert variant="destructive">
                <AlertDescription>
                  {getApiErrorMessage(mutation.error ?? remove.error)}
                </AlertDescription>
              </Alert>
            )}

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

            <div className="space-y-1.5">
              <label htmlFor="charge-date" className="text-sm font-medium">
                Added on
              </label>
              <Controller
                control={control}
                name="charged_on"
                render={({ field }) => (
                  <DatePicker
                    id="charge-date"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={Boolean(errors.charged_on)}
                  />
                )}
              />
              <FieldError errors={[errors.charged_on]} />
            </div>

            <div className="space-y-1.5">
              <Input
                placeholder="Late fee, interest, restructure…"
                aria-label="Note"
                className="h-11 text-base md:text-sm"
                {...register('note')}
              />
              <FieldError errors={[errors.note]} />
            </div>
          </div>

          {/* Primary action first, nearest the thumb. */}
          <DrawerFooter className="pt-2">
            <Button
              type="submit"
              size="lg"
              className="h-11"
              disabled={mutation.isPending || remove.isPending}
            >
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {mutation.isPending
                ? 'Saving…'
                : charge
                  ? 'Save changes'
                  : 'Add to debt'}
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
            {charge && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="h-11 text-destructive"
                onClick={deleteCharge}
                disabled={mutation.isPending || remove.isPending}
              >
                {remove.isPending ? <Loader2 className="animate-spin" /> : <Trash2 />}
                Delete charge
              </Button>
            )}
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
