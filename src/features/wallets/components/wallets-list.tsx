import type { Wallet } from '../types'
import { WalletCards } from './wallet-cards'
import { WalletsTable } from './wallets-table'

type Props = {
  wallets: Wallet[]
  onEdit: (wallet: Wallet) => void
  onArchive: (wallet: Wallet) => void
}

/**
 * Cards on mobile, a table from `md` up.
 *
 * Switched in CSS rather than with `useIsMobile`: that hook starts `undefined`
 * and resolves in an effect, so a phone would paint the table first and swap
 * to cards a frame later. The cost is both markups in the DOM — `hidden` is
 * `display: none`, so the inactive one is out of the accessibility tree too.
 */
export function WalletsList({ wallets, onEdit, onArchive }: Props) {
  return (
    <>
      <div className="md:hidden">
        <WalletCards wallets={wallets} onEdit={onEdit} onArchive={onArchive} />
      </div>
      <div className="hidden md:block">
        <WalletsTable wallets={wallets} onEdit={onEdit} onArchive={onArchive} />
      </div>
    </>
  )
}
