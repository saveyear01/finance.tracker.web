import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Controller, useForm } from 'react-hook-form'

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
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getApiErrorMessage } from '@/lib/api-client'

import { useCreateWallet, useUpdateWallet } from '../hooks/use-mutate-wallet'
import { WALLET_TYPE_META } from '../lib/wallet-meta'
import { walletSchema, type WalletFormValues } from '../schemas/wallet-schema'
import { WALLET_TYPES, type Wallet, type WalletType } from '../types'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present when editing an existing wallet; absent when adding a new one. */
  wallet?: Wallet | null
}

const EMPTY: WalletFormValues = { name: '', type: 'bank', opening_balance: '' }

export function WalletDrawer({ open, onOpenChange, wallet = null }: Props) {
  const isEditing = wallet !== null

  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const mutation = isEditing ? updateWallet : createWallet

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<WalletFormValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: EMPTY,
  })

  // Reload the form whenever the drawer opens onto a different wallet, rather
  // than only on mount — the component stays mounted between openings.
  useEffect(() => {
    if (!open) {
      return
    }
    reset(
      wallet
        ? { name: wallet.name, type: wallet.type, opening_balance: '' }
        : EMPTY,
    )
  }, [open, wallet, reset])

  const close = (next: boolean) => {
    // Leave nothing behind for the next open — a stale error especially.
    if (!next) {
      createWallet.reset()
      updateWallet.reset()
    }
    onOpenChange(next)
  }

  const onSubmit = handleSubmit((values) => {
    const done = { onSuccess: () => close(false) }

    if (wallet) {
      updateWallet.mutate({ id: wallet.id, name: values.name, type: values.type }, done)
    } else {
      createWallet.mutate(
        {
          name: values.name,
          type: values.type,
          opening_balance: values.opening_balance || '0',
        },
        done,
      )
    }
  })

  return (
    <Drawer open={open} onOpenChange={close} showSwipeHandle>
      <DrawerContent>
        {/* The form wraps header, body and footer so the footer's submit
            button belongs to it; `min-h-0` lets the body scroll when the
            on-screen keyboard shrinks the drawer. */}
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>{isEditing ? 'Edit wallet' : 'New wallet'}</DrawerTitle>
            <DrawerDescription>
              {isEditing
                ? 'Rename the wallet or change its type. Its balance only changes through transactions.'
                : 'A place your money physically sits — a bank account, an e-wallet, or cash.'}
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
                <FieldLabel htmlFor="wallet-name">Name</FieldLabel>
                <Input
                  id="wallet-name"
                  autoFocus
                  placeholder="Main bank account"
                  aria-invalid={Boolean(errors.name)}
                  className="h-11 text-base md:text-sm"
                  {...register('name')}
                />
                <FieldError errors={[errors.name]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="wallet-type">Type</FieldLabel>
                {/*
                  Controller rather than register: the Select is not a native
                  input, so it has no ref for react-hook-form to attach to.
                */}
                <Controller
                  control={control}
                  name="type"
                  render={({ field }) => (
                    <Select
                      value={field.value}
                      onValueChange={(value) => field.onChange(value as WalletType)}
                    >
                      <SelectTrigger
                        id="wallet-type"
                        className="h-11! w-full"
                        aria-invalid={Boolean(errors.type)}
                      >
                        {/* Without a formatter this renders the raw value —
                            "ewallet" rather than "E-wallet". */}
                        <SelectValue>
                          {(value) => WALLET_TYPE_META[value as WalletType].label}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {WALLET_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {WALLET_TYPE_META[type].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.type]} />
              </Field>

              {/* Create only: once a wallet exists its balance is the ledger's. */}
              {!isEditing && (
                <Field>
                  <FieldLabel htmlFor="wallet-opening-balance">
                    Opening balance
                  </FieldLabel>
                  <Input
                    id="wallet-opening-balance"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-invalid={Boolean(errors.opening_balance)}
                    className="h-11 text-base md:text-sm"
                    {...register('opening_balance')}
                  />
                  <FieldDescription>
                    What's in it right now. It starts out in Unallocated until
                    you split it into allocations.
                  </FieldDescription>
                  <FieldError errors={[errors.opening_balance]} />
                </Field>
              )}
            </FieldGroup>
          </div>

          {/* Primary action first: in a bottom drawer the stacked buttons sit
              under the thumb, and the one people came for belongs nearest. */}
          <DrawerFooter className="pt-2">
            <Button type="submit" size="lg" disabled={mutation.isPending} className="h-11">
              {mutation.isPending && <Loader2 className="animate-spin" />}
              {mutation.isPending
                ? 'Saving…'
                : isEditing
                  ? 'Save changes'
                  : 'Add wallet'}
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
