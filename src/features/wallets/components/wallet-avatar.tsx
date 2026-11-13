import { cn } from '@/lib/utils'

import { useWallets } from '../hooks/use-wallets'
import { useWalletLogo } from '../hooks/use-wallet-logo'
import { WALLET_TYPE_META } from '../lib/wallet-meta'
import type { Wallet, WalletType } from '../types'

const SIZES = {
  xs: { box: 'size-5', icon: 'size-3' },
  sm: { box: 'size-7', icon: 'size-3.5' },
  md: { box: 'size-9', icon: 'size-4' },
  lg: { box: 'size-11', icon: 'size-5' },
} as const

/**
 * A wallet's mark, wherever a wallet is shown (2026-11-13): its uploaded
 * logo as it is, or its type's icon in a circle until it has one.
 *
 * Pass the `wallet` when you have it; with only a `walletId` (a transaction,
 * an analytics row) it is looked up in the cached wallet list, archived ones
 * included, so every row costs no extra request. Decorative: the wallet's
 * name is always printed beside it.
 */
export function WalletAvatar({
  wallet,
  walletId,
  size = 'md',
  tone = 'muted',
  className,
}: {
  wallet?: Pick<Wallet, 'type' | 'logo_url'>
  walletId?: string
  size?: keyof typeof SIZES
  /** `hero` for one on the dark card: the icon in a translucent circle. */
  tone?: 'muted' | 'hero'
  className?: string
}) {
  const { wallets } = useWallets({ includeArchived: true })
  const found = wallet ?? wallets.find((candidate) => candidate.id === walletId)
  const logo = useWalletLogo(found?.logo_url)
  const { box, icon } = SIZES[size]

  if (logo) {
    // Shown as itself (the user's call, 2026-11-13): no circle, no backing,
    // fitted — never cropped — into the square the icon's circle takes, so
    // rows line up either way.
    return (
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        draggable={false}
        // Corners rounded in proportion, so a square logo reads as a tile at
        // every size (a transparent one is unaffected).
        className={cn('shrink-0 rounded-[22%] object-contain', box, className)}
      />
    )
  }

  const Icon = WALLET_TYPE_META[(found?.type ?? 'bank') as WalletType].icon
  return (
    <span
      aria-hidden="true"
      className={cn(
        'grid shrink-0 place-items-center rounded-full',
        tone === 'hero' ? 'bg-secondary-foreground/15' : 'bg-muted',
        box,
        className,
      )}
    >
      <Icon className={cn(icon, tone === 'hero' ? 'text-secondary-foreground' : 'text-muted-foreground')} />
    </span>
  )
}
