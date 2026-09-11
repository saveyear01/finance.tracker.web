import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useChangePassword } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'

import { passwordSchema, type PasswordFormValues } from '../schemas/profile-schemas'

const EMPTY: PasswordFormValues = {
  current_password: '',
  new_password: '',
  confirm_password: '',
}

export function PasswordForm() {
  const changePassword = useChangePassword()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: EMPTY,
  })

  const onSubmit = handleSubmit(({ current_password, new_password }) => {
    changePassword.mutate(
      { current_password, new_password },
      {
        onSuccess: () => {
          // Never leave passwords sitting in a form after they have been used.
          reset(EMPTY)
          toast.success('Password changed. Your other devices have been signed out.')
        },
      },
    )
  })

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <div>
        <h2 className="font-semibold">Password</h2>
        <p className="text-sm text-muted-foreground">
          Changing it signs you out everywhere except this device.
        </p>
      </div>

      {changePassword.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(changePassword.error)}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="password-current">Current password</FieldLabel>
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.current_password)}
            className="h-11 text-base md:text-sm"
            {...register('current_password')}
          />
          <FieldError errors={[errors.current_password]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password-new">New password</FieldLabel>
          <Input
            id="password-new"
            type="password"
            // `new-password` is what makes a password manager offer to
            // generate one and save it.
            autoComplete="new-password"
            placeholder="At least 8 characters"
            aria-invalid={Boolean(errors.new_password)}
            className="h-11 text-base md:text-sm"
            {...register('new_password')}
          />
          <FieldError errors={[errors.new_password]} />
        </Field>
        <Field>
          <FieldLabel htmlFor="password-confirm">Confirm new password</FieldLabel>
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(errors.confirm_password)}
            className="h-11 text-base md:text-sm"
            {...register('confirm_password')}
          />
          <FieldError errors={[errors.confirm_password]} />
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full sm:w-auto"
        disabled={changePassword.isPending}
      >
        {changePassword.isPending && <Loader2 className="animate-spin" />}
        {changePassword.isPending ? 'Changing…' : 'Change password'}
      </Button>
    </form>
  )
}
