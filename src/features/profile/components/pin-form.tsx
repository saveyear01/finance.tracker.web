import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCurrentUser, useSetPin } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'

import { pinSchema, type PinFormValues } from '../schemas/profile-schemas'
import { TurnOffPinDrawer } from './turn-off-pin-drawer'

const EMPTY: PinFormValues = { pin: '', confirm_pin: '', current_password: '' }

/** Digits only, at most six — typed or pasted. */
const onlyDigits = (event: React.FormEvent<HTMLInputElement>) => {
  const input = event.currentTarget
  input.value = input.value.replace(/\D/g, '').slice(0, 6)
}

/**
 * The quick-unlock PIN: set one, change it, or turn it off. With a PIN the
 * app locks when it's opened and after five minutes away, and the PIN
 * unlocks it — the password is still what signs in on a new device. Setting
 * or changing it asks for the password, so an unattended session can't.
 */
export function PinForm() {
  const { user } = useCurrentUser()
  const setPin = useSetPin()
  const [turningOff, setTurningOff] = useState(false)
  const hasPin = Boolean(user?.has_pin)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PinFormValues>({ resolver: zodResolver(pinSchema), defaultValues: EMPTY })

  const onSubmit = handleSubmit(({ pin, current_password }) => {
    setPin.mutate(
      { pin, current_password },
      {
        onSuccess: () => {
          reset(EMPTY)
          toast.success(hasPin ? 'PIN changed.' : 'PIN set. The app now locks when you leave it.')
        },
      },
    )
  })

  const pinInput = {
    type: 'password',
    inputMode: 'numeric' as const,
    autoComplete: 'off',
    maxLength: 6,
    onInput: onlyDigits,
    className: 'h-11 text-base tracking-[0.4em] md:text-sm',
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        noValidate
        className="space-y-4 rounded-xl border border-border bg-card p-4"
      >
        <div>
          <h2 className="font-semibold">PIN</h2>
          <p className="text-sm text-muted-foreground">
            {hasPin
              ? 'On. The app locks when you open it and after 5 minutes away; your PIN unlocks it.'
              : 'Unlock the app with a 6-digit PIN. It locks when you open it and after 5 minutes away.'}
          </p>
        </div>

        {setPin.isError && (
          <Alert variant="destructive">
            <AlertDescription>{getApiErrorMessage(setPin.error)}</AlertDescription>
          </Alert>
        )}

        <FieldGroup className="gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="pin-new">{hasPin ? 'New PIN' : 'PIN'}</FieldLabel>
              <Input
                id="pin-new"
                placeholder="6 digits"
                aria-invalid={Boolean(errors.pin)}
                {...pinInput}
                {...register('pin')}
              />
              <FieldError errors={[errors.pin]} />
            </Field>
            <Field>
              <FieldLabel htmlFor="pin-confirm">Confirm PIN</FieldLabel>
              <Input
                id="pin-confirm"
                aria-invalid={Boolean(errors.confirm_pin)}
                {...pinInput}
                {...register('confirm_pin')}
              />
              <FieldError errors={[errors.confirm_pin]} />
            </Field>
          </div>
          <Field>
            <FieldLabel htmlFor="pin-password">Current password</FieldLabel>
            <Input
              id="pin-password"
              type="password"
              autoComplete="current-password"
              aria-invalid={Boolean(errors.current_password)}
              className="h-11 text-base md:text-sm"
              {...register('current_password')}
            />
            <FieldError errors={[errors.current_password]} />
          </Field>
        </FieldGroup>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" size="lg" className="h-11" disabled={setPin.isPending}>
            {setPin.isPending && <Loader2 className="animate-spin" />}
            {setPin.isPending ? 'Saving…' : hasPin ? 'Change PIN' : 'Set PIN'}
          </Button>
          {hasPin && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11 text-destructive hover:text-destructive"
              onClick={() => setTurningOff(true)}
            >
              Turn off PIN
            </Button>
          )}
        </div>
      </form>

      {/* Outside the form: React bubbles events through portals by component
          tree, so the drawer's own submit would also submit this form. */}
      <TurnOffPinDrawer open={turningOff} onOpenChange={setTurningOff} />
    </>
  )
}
