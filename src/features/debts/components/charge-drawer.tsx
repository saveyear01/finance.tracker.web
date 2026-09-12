import { useEffect, type FormEvent } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
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

import { useAddCharge } from '../hooks/use-debts'
import { chargeSchema, type ChargeFormValues } from '../schemas/debt-schemas'
import type { Debt } from '../types'

/**
 * Add to what a debt owes: a late fee, interest the lender billed, or a
 * restructure that put the amount up.
 *
 * No money moves — this is owed, not spent — so nothing is written to the
 * activity and no wallet changes. It is kept as its own dated row rather
 * than edited into the principal, so what was borrowed stays what was
 * borrowed and every rise says why. A paid-off debt owing again reopens.
 */
export function ChargeDrawer({
  debt,
  onOpenChange,
}: {
  /** The debt being charged, or null when the drawer is shut. */
  debt: Debt | null
  onOpenChange: (open: boolean) => void
}) {
  const add = useAddCharge()

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeSchema),
    defaultValues: { amount: '', charged_on: localToday(), note: '' },
  })

  // The drawer stays mounted between openings; start over each time.
  useEffect(() => {
    if (debt) reset({ amount: '', charged_on: localToday(), note: '' })
  }, [debt, reset])

  const close = (next: boolean) => {
    if (!next) add.reset()
    onOpenChange(next)
  }

  const onSubmit = handleSubmit((values) => {
    if (!debt) return
    add.mutate(
      {
        id: debt.id,
        input: {
          amount: values.amount,
          charged_on: values.charged_on,
          note: values.note.trim() || undefined,
        },
      },
      {
        onSuccess: (result) => {
          toast.success(
            `${formatMoney(values.amount)} added · ${formatMoney(result.remaining)} of ${debt.name} left.`,
          )
          close(false)
        },
      },
    )
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
            <DrawerTitle>{debt && `Add to ${debt.name}`}</DrawerTitle>
            <DrawerDescription>
              A fee, interest you were billed, or a restructure. No money moves — it just adds to
              what you owe.
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
            {add.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(add.error)}</AlertDescription>
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
            <Button type="submit" size="lg" className="h-11" disabled={add.isPending}>
              {add.isPending && <Loader2 className="animate-spin" />}
              {add.isPending ? 'Adding…' : 'Add to debt'}
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
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
