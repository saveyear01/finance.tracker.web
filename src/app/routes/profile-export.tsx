import { PageIntro } from '@/components/layouts/page-intro'
import { ExportForm } from '@/features/export'

export function ProfileExportRoute() {
  return (
    <div className="mx-auto w-full max-w-xl space-y-4">
      <PageIntro>Download your entries, balances and plans as a spreadsheet.</PageIntro>
      <ExportForm />
    </div>
  )
}
