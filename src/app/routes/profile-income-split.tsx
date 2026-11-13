import { PageIntro } from '@/components/layouts/page-intro'
import { AllocationEditor } from '@/features/allocations'
import { ProfileLayout } from '@/features/profile'

export function ProfileIncomeSplitRoute() {
  return (
    <ProfileLayout wide>
      <PageIntro>How every income you log is split across your allocations.</PageIntro>
      <AllocationEditor />
    </ProfileLayout>
  )
}
