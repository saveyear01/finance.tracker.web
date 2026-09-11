import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useSetPin } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'

import { turnOffPinSchema, type TurnOffPinFormValues } from '../schemas/profile-schemas'

/** Confirm turning the PIN off — with the password, like setting it. */
export function TurnOffPinDrawer({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const setPin = useSetPin()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TurnOffPinFormValues>({
    resolver: zodResolver(turnOffPinSchema),
    defaultValues: { current_password: '' },
  })

  useEffect(() => {
    if (open) {
      reset({ current_password: '' })
      setPin.reset()
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset])

  const onSubmit = handleSubmit(({ current_password }) =>
    setPin.mutate(
      { pin: null, current_password },
      {
        onSuccess: () => {
          toast.success('PIN turned off.')
          onOpenChange(false)
        },
      },
    ),
  )

  return (
    <Drawer open={open} onOpenChange={onOpenChange} showSwipeHandle>
      <DrawerContent>
        {/* Its own form — the drawer renders outside the PIN form's. */}
        <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
          <DrawerHeader>
            <DrawerTitle>Turn off PIN?</DrawerTitle>
            <DrawerDescription>
              The app will stop locking. You can set a PIN again any time.
            </DrawerDescription>
          </DrawerHeader>

          <div className="space-y-4 p-4">
            {setPin.isError && (
              <Alert variant="destructive">
                <AlertDescription>{getApiErrorMessage(setPin.error)}</AlertDescription>
              </Alert>
            )}
            <Field>
              <FieldLabel htmlFor="pin-off-password">Current password</FieldLabel>
              <Input
                id="pin-off-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(errors.current_password)}
                className="h-11 text-base md:text-sm"
                {...register('current_password')}
              />
              <FieldError errors={[errors.current_password]} />
            </Field>
          </div>

          <DrawerFooter className="pt-0">
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              className="h-11"
              disabled={setPin.isPending}
            >
              {setPin.isPending && <Loader2 className="animate-spin" />}
              {setPin.isPending ? 'Turning off…' : 'Turn off'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-11"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
