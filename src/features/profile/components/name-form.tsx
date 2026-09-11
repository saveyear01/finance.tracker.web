import { useEffect } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCurrentUser, useUpdateProfile } from '@/features/auth'
import { getApiErrorMessage } from '@/lib/api-client'

import { nameSchema, type NameFormValues } from '../schemas/profile-schemas'

export function NameForm() {
  const { user } = useCurrentUser()
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: { first_name: '', last_name: '' },
  })

  // Load the saved name, and re-load it after a save so "dirty" resets to
  // the new values rather than the ones the page opened with.
  useEffect(() => {
    if (user) {
      reset({ first_name: user.first_name, last_name: user.last_name })
    }
  }, [user, reset])

  const onSubmit = handleSubmit((values) => {
    updateProfile.mutate(values, {
      onSuccess: () => toast.success('Name saved.'),
    })
  })

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-4 rounded-xl border border-border bg-card p-4"
    >
      <div>
        <h2 className="font-semibold">Personal details</h2>
        <p className="text-sm text-muted-foreground">How the app greets you.</p>
      </div>

      {updateProfile.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(updateProfile.error)}</AlertDescription>
        </Alert>
      )}

      <FieldGroup className="gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="profile-first-name">First name</FieldLabel>
            <Input
              id="profile-first-name"
              autoComplete="given-name"
              aria-invalid={Boolean(errors.first_name)}
              className="h-11 text-base md:text-sm"
              {...register('first_name')}
            />
            <FieldError errors={[errors.first_name]} />
          </Field>
          <Field>
            <FieldLabel htmlFor="profile-last-name">Last name</FieldLabel>
            <Input
              id="profile-last-name"
              autoComplete="family-name"
              aria-invalid={Boolean(errors.last_name)}
              className="h-11 text-base md:text-sm"
              {...register('last_name')}
            />
            <FieldError errors={[errors.last_name]} />
          </Field>
        </div>

        <Field>
          <FieldLabel htmlFor="profile-email">Email</FieldLabel>
          <Input
            id="profile-email"
            value={user?.email ?? ''}
            readOnly
            disabled
            className="h-11 text-base md:text-sm"
          />
          <FieldDescription>
            Your sign-in address. Changing it needs email verification, which
            isn't available yet.
          </FieldDescription>
        </Field>
      </FieldGroup>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full sm:w-auto"
        // Nothing to save until something changed — and never twice at once.
        disabled={!isDirty || updateProfile.isPending}
      >
        {updateProfile.isPending && <Loader2 className="animate-spin" />}
        {updateProfile.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}
