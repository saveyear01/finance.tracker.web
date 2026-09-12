import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import {
  ChargeDrawer,
  DebtDetail,
  DebtDrawer,
  DeleteDebtDrawer,
  PayDebtDrawer,
  RatesDrawer,
  type Debt,
} from '@/features/debts'

/**
 * One debt's page: its figures, its payments, and everything that can be
 * done to it.
 *
 * Deleting returns to the list — staying would leave the page showing a debt
 * that is no longer there.
 */
export function DebtDetailRoute() {
  const { debtId } = useParams()
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Debt | null>(null)
  // Each doubles as its drawer's open state.
  const [paying, setPaying] = useState<Debt | null>(null)
  const [charging, setCharging] = useState<Debt | null>(null)
  const [rating, setRating] = useState<Debt | null>(null)
  const [deleting, setDeleting] = useState<Debt | null>(null)

  return (
    <div className="mx-auto w-full max-w-xl">
      <DebtDetail
        id={debtId}
        onPay={setPaying}
        onCharge={setCharging}
        onRates={setRating}
        onEdit={setEditing}
        onDelete={setDeleting}
      />

      <DebtDrawer
        open={editing !== null}
        debt={editing}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      />
      <PayDebtDrawer
        debt={paying}
        onOpenChange={(open) => {
          if (!open) setPaying(null)
        }}
      />
      <ChargeDrawer
        debt={charging}
        onOpenChange={(open) => {
          if (!open) setCharging(null)
        }}
      />
      <RatesDrawer
        debt={rating}
        onOpenChange={(open) => {
          if (!open) setRating(null)
        }}
      />
      <DeleteDebtDrawer
        debt={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onDeleted={() => navigate('/debts', { replace: true })}
      />
    </div>
  )
}
