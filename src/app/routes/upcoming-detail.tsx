import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  DeleteUpcomingDrawer,
  PayDrawer,
  UpcomingDetail,
  UpcomingDrawer,
  type Occurrence,
  type UpcomingExpense,
} from '@/features/upcoming'

/**
 * One due date's page: where it stands, its payments, and everything that
 * can be done to it.
 *
 * Deleting removes the whole bill — every due date of it — so it returns to
 * the list rather than leaving this page showing one that no longer exists.
 */
export function UpcomingDetailRoute() {
  const { expenseId, dueDate } = useParams()
  const navigate = useNavigate()
  // Each doubles as its drawer's open state.
  const [editing, setEditing] = useState<UpcomingExpense | null>(null)
  const [paying, setPaying] = useState<Occurrence | null>(null)
  const [deleting, setDeleting] = useState<UpcomingExpense | null>(null)

  return (
    <div className="mx-auto w-full max-w-xl">
      <UpcomingDetail
        id={expenseId}
        dueDate={dueDate}
        onPay={setPaying}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <UpcomingDrawer
        open={editing !== null}
        expense={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
      <PayDrawer
        occurrence={paying}
        onOpenChange={(open) => {
          if (!open) setPaying(null)
        }}
      />
      <DeleteUpcomingDrawer
        expense={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onDeleted={() => navigate('/upcoming', { replace: true })}
      />
    </div>
  )
}
