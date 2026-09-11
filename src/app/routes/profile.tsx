import { ProfileCard, ProfileMenu } from '@/features/profile'

export function ProfileRoute() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <ProfileCard />
      <ProfileMenu />
    </div>
  )
}
