import { NameForm, PasswordForm } from '@/features/profile'

export function ProfileSettingsRoute() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <NameForm />
      <PasswordForm />
    </div>
  )
}
