import { useState } from 'react'
import { Info } from 'lucide-react'

import { SegmentedControl } from '@/components/segmented-control'
import { WalletAvatar } from '@/features/wallets'
import { formatMoney } from '@/lib/money'

import type { Kind, KindSummary } from '../types'

/** Past this share of spending out of Unallocated, the card points it out. */
const UNALLOCATED_HINT = 25

/**
 * Where the money came out of — or, for income, landed in — by allocation or
 * by wallet: the app's own two views of money (what it's for, where it sits),
 * which grouping by note can't show.
 *
 * Spending out of Unallocated is money that hadn't been given a purpose yet;
 * past a quarter of it, the card says so.
 */
export function PaidFromCard({
  kind,
  summary,
  unallocatedName,
}: {
  kind: Kind
  summary: KindSummary
  /** The household's Unallocated fund, to spot it in the list. */
  unallocatedName: string | null
}) {
  const [by, setBy] = useState<'fund' | 'wallet'>('fund')
  const rows = by === 'fund' ? summary.by_fund : summary.by_wallet
  const total = Math.round(Number(summary.total) * 100)
  const max = Math.max(1, ...rows.map((row) => Math.round(Number(row.total) * 100)))
  const share = (value: string) => (total > 0 ? Math.round((Math.round(Number(value) * 100) / total) * 100) : 0)

  const unallocated =
    kind === 'expense' && unallocatedName
      ? summary.by_fund.find((row) => row.name === unallocatedName)
      : undefined
  const unallocatedShare = unallocated ? share(unallocated.total) : 0

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground">
      <h2 className="text-sm font-semibold">{kind === 'income' ? 'Landed in' : 'Paid from'}</h2>
      <SegmentedControl
        label={kind === 'income' ? 'Landed in' : 'Paid from'}
        className="h-9"
        value={by}
        onChange={setBy}
        options={[
          { value: 'fund', label: 'Allocations' },
          { value: 'wallet', label: 'Wallets' },
        ]}
      />
      <ul className="space-y-3">
        {rows.map((row) => {
          const cents = Math.round(Number(row.total) * 100)
          const isUnallocated = by === 'fund' && row.name === unallocatedName
          return (
            <li key={row.id} className="space-y-1.5 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="flex min-w-0 items-center gap-2 self-center">
                  {by === 'wallet' && <WalletAvatar walletId={row.id} size="xs" />}
                  <span className="truncate font-medium">{row.name}</span>
                </span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  <span className="font-semibold text-foreground">{formatMoney(row.total)}</span> ·{' '}
                  {share(row.total)}%
                </span>
              </div>
              <span className="block h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                <span
                  className={isUnallocated ? 'block h-full rounded-full bg-(--series-other)' : 'block h-full rounded-full bg-primary'}
                  style={{ width: `${(cents / max) * 100}%` }}
                />
              </span>
            </li>
          )
        })}
      </ul>

      {by === 'fund' && unallocated && unallocatedShare >= UNALLOCATED_HINT && (
        <div className="flex gap-3 rounded-xl bg-accent p-3.5 text-sm text-accent-foreground">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <p>
            <span className="block font-semibold">
              {unallocatedShare}% came from {unallocatedName}
            </span>
            {formatMoney(unallocated.total)} was spent from money that hadn't been given a purpose
            yet. An income split puts income into allocations as it arrives.
          </p>
        </div>
      )}
    </section>
  )
}
