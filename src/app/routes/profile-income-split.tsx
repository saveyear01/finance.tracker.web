import { PageIntro } from '@/components/layouts/page-intro'
import { AllocationEditor } from '@/features/allocations'

export function ProfileIncomeSplitRoute() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <PageIntro>How every income you log is split across your allocations.</PageIntro>
      <AllocationEditor />
    </div>
  )
}
