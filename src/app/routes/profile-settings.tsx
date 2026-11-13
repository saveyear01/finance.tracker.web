import { NameForm, PasswordForm, ProfileLayout } from '@/features/profile'

export function ProfileSettingsRoute() {
  return (
    <ProfileLayout>
      <NameForm />
      <PasswordForm />
    </ProfileLayout>
  )
}
