import { PageIntro } from '@/components/layouts/page-intro'
import { ExportForm } from '@/features/export'
import { ProfileLayout } from '@/features/profile'

export function ProfileExportRoute() {
  return (
    <ProfileLayout>
      <PageIntro>Download your entries, balances and plans as a spreadsheet.</PageIntro>
      <ExportForm />
    </ProfileLayout>
  )
}
