import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'

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
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { getApiErrorMessage } from '@/lib/api-client'

import { useCreateFund, useUpdateFund } from '../hooks/use-mutate-fund'
import { fundSchema, type FundFormValues } from '../schemas/fund-schema'
import type { Fund } from '../types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when renaming an existing fund; absent when adding a new one. */
  fund?: Fund | null
}

export function FundDrawer({ open, onOpenChange, fund = null }: Props) {
  const isEditing = fund !== null

  const createFund = useCreateFund()
  const updateFund = useUpdateFund()
  const mutation = isEditing ? updateFund : createFund

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FundFormValues>({
    resolver: zodResolver(fundSchema),
    defaultValues: { name: '' },
  })

  // Reload whenever the drawer opens onto a different fund — the component
  // stays mounted between openings.
  useEffect(() => {
    if (open) {
      reset({ name: fund?.name ?? '' })
    }
  }, [open, fund, reset])

  const close = (next: boolean) => {
    // Leave nothing behind for the next open — a stale error especially.
    if (!next) {
      createFund.reset()
      updateFund.reset()
    }
    onOpenChange(next)
  }

  const onSubmit = handleSubmit(({ name }) => {
    const done = { onSuccess: () => close(false) }
    if (fund) {
      updateFund.mutate({ id: fund.id, name }, done)
    } else {
      createFund.mutate({ name }, done)
    }
  })

  return (
    <Drawer open={open} onOpenChange={close} showSwipeHandle>
      <DrawerContent>
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{isEditing ? 'Rename allocation' : 'New allocation'}</DrawerTitle>
            <DrawerDescription>
              {isEditing
                ? 'The money in it stays where it is.'
                : 'What some of your money is for — Savings, Emergency Fund, Travel. It starts empty.'}
            </DrawerDescription>
          </DrawerHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {mutation.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{getApiErrorMessage(mutation.error)}</AlertDescription>
              </Alert>
            )}

            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="fund-name">Name</FieldLabel>
                <Input
                  id="fund-name"
                  autoFocus
                  placeholder="Emergency Fund"
                  aria-invalid={Boolean(errors.name)}
                  className="h-11 text-base md:text-sm"
                  {...register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>
            </FieldGroup>
          </div>

          {/* Primary action first — nearest the thumb in a bottom drawer. */}
          <DrawerFooter className="pt-2">
            <Button type="submit" size="lg" disabled={mutation.isPending} className="h-11">
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {mutation.isPending ? 'Saving…' : isEditing ? 'Save' : 'Add allocation'}
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
