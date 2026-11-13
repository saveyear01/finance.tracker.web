import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SplitView } from '@/components/layouts/split-view'
import {
  ChargeDrawer,
  DebtDetail,
  DebtDrawer,
  DebtList,
  DeleteDebtDialog,
  PayDebtDrawer,
  RatesDrawer,
  type Debt,
  type DebtCharge,
} from '@/features/debts'

/**
 * One debt's page: its figures, its payments, and everything that can be
 * done to it.
 *
 * Deleting returns to the list — staying would leave the page showing a debt
 * that is no longer there. (On a big screen `/debts` then opens the next.)
 *
 * From `lg` the page sits beside the debts list (`SplitView`), this debt's
 * row selected; below it the list is not rendered and the page is its own
 * screen, as before. The list's "Add new debt" opens the same drawer as
 * Edit, empty.
 */
export function DebtDetailRoute() {
  const { debtId } = useParams()
  const navigate = useNavigate()
  // The debt form: `{ debt: null }` adds one, `{ debt }` edits it.
  const [form, setForm] = useState<{ debt: Debt | null } | null>(null)
  // Each doubles as its drawer's open state.
  const [paying, setPaying] = useState<Debt | null>(null)
  // A charge is added (charge: null) or, opened from History, edited.
  const [charging, setCharging] = useState<{ debt: Debt; charge: DebtCharge | null } | null>(
    null,
  )
  const [rating, setRating] = useState<Debt | null>(null)
  const [deleting, setDeleting] = useState<Debt | null>(null)

  return (
    <>
      <SplitView
        list={<DebtList selectedId={debtId} onAdd={() => setForm({ debt: null })} />}
        detail={
          <DebtDetail
            id={debtId}
            onPay={setPaying}
            onCharge={(debt) => setCharging({ debt, charge: null })}
            onEditCharge={(debt, charge) => setCharging({ debt, charge })}
            onRates={setRating}
            onEdit={(debt) => setForm({ debt })}
            onDelete={setDeleting}
          />
        }
      />

      <DebtDrawer
        open={form !== null}
        debt={form?.debt ?? null}
        onOpenChange={(open) => {
          if (!open) setForm(null)
        }}
      />
      <PayDebtDrawer
        debt={paying}
        onOpenChange={(open) => {
          if (!open) setPaying(null)
        }}
      />
      <ChargeDrawer
        debt={charging?.debt ?? null}
        charge={charging?.charge ?? null}
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
      <DeleteDebtDialog
        debt={deleting}
        onOpenChange={(open) => {
          if (!open) setDeleting(null)
        }}
        onDeleted={() => navigate('/debts', { replace: true })}
      />
    </>
  )
}
