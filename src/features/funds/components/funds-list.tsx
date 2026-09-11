import type { Fund } from '../types'
import { FundCards } from './fund-cards'
import { FundsTable } from './funds-table'

type Props = {
  funds: Fund[]
  onEdit: (fund: Fund) => void
  onArchive: (fund: Fund) => void
}

/**
 * Cards on mobile, a table from `md` up — switched in CSS rather than with
 * `useIsMobile`, which resolves in an effect and would paint the table first
 * on a phone. See `WalletsList` for the same trade-off.
 */
export function FundsList({ funds, onEdit, onArchive }: Props) {
  return (
    <>
      <div className="md:hidden">
        <FundCards funds={funds} onEdit={onEdit} onArchive={onArchive} />
      </div>
      <div className="hidden md:block">
        <FundsTable funds={funds} onEdit={onEdit} onArchive={onArchive} />
      </div>
    </>
  )
}
