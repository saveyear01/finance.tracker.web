import { useState } from 'react'
import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { FundDrawer } from '@/features/funds'
import { WalletDrawer } from '@/features/wallets'
import { formatMoney } from '@/lib/money'
import { cn } from '@/lib/utils'

import type { SetupProgress, SetupStep } from '../hooks/use-setup-progress'

type StepMeta = {
  id: SetupStep
  title: string
  hint: string
  action: string
}

const STEPS: StepMeta[] = [
  {
    id: 'wallet',
    title: 'Add a wallet',
    hint: 'A bank account, an e-wallet or cash: where your money sits',
    action: 'Add wallet',
  },
  {
    id: 'allocations',
    title: 'Add what your money is for',
    hint: 'Savings, Emergency Fund, Travel. These are your allocations.',
    action: 'Add allocation',
  },
  {
    id: 'split',
    title: 'Set your income split',
    hint: 'How each income is shared out across them',
    action: 'Set split',
  },
  {
    id: 'income',
    title: 'Record your first income',
    hint: "It's split for you as it lands",
    action: 'Record income',
  },
]

/**
 * "Get set up" — Home's first-run checklist (design/large-screen.html,
 * 2026-11-13), on every screen size. Four steps that tick off from data that
 * already exists (`useSetupProgress`); a done one is struck through and says
 * what was done, the next one's button is the primary one, and the card goes
 * away once all four are done — Home stops rendering it.
 *
 * The wallet and allocation drawers are opened here; recording income is
 * Home's own drawer, so that step hands back to it.
 */
export function SetupChecklist({
  progress,
  onRecordIncome,
  onHide,
}: {
  progress: SetupProgress
  onRecordIncome: () => void
  /** Dismiss the card (some households never want an income split). */
  onHide?: () => void
}) {
  const navigate = useNavigate()
  const [drawer, setDrawer] = useState<'wallet' | 'fund' | null>(null)
  const { done, doneCount } = progress
  const next = STEPS.find((step) => !done[step.id])?.id

  const run: Record<SetupStep, () => void> = {
    wallet: () => setDrawer('wallet'),
    allocations: () => setDrawer('fund'),
    split: () => navigate('/profile/income-split'),
    income: onRecordIncome,
  }

  return (
    <section className="space-y-3 card-surface p-4 text-card-foreground" aria-labelledby="setup-heading">
      <div className="flex items-baseline justify-between gap-2">
        <h2 id="setup-heading" className="text-sm font-semibold">
          Get set up
        </h2>
        <span className="flex items-baseline gap-3 text-sm text-muted-foreground">
          {doneCount} of 4 done
          {onHide && (
            <button
              type="button"
              onClick={onHide}
              className="rounded font-medium text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              Hide
            </button>
          )}
        </span>
      </div>
      <span
        className="block h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-label="Setup progress"
        aria-valuemin={0}
        aria-valuemax={4}
        aria-valuenow={doneCount}
      >
        <i className="block h-full rounded-full bg-primary transition-[width]" style={{ width: `${doneCount * 25}%` }} />
      </span>

      <ol className="-mx-4 -mb-4">
        {STEPS.map((step, index) => {
          const isDone = done[step.id]
          return (
            <li
              key={step.id}
              className="grid grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-3 gap-y-2 border-t border-border px-4 py-3 sm:grid-cols-[1.75rem_minmax(0,1fr)_auto]"
            >
              <span
                className={cn(
                  'grid size-7 place-items-center rounded-full text-xs font-semibold',
                  isDone
                    ? 'bg-primary text-primary-foreground'
                    : step.id === next
                      ? 'border border-primary text-primary'
                      : 'bg-muted text-muted-foreground',
                )}
                aria-hidden="true"
              >
                {isDone ? <Check className="size-3.5" /> : index + 1}
              </span>
              <span className="min-w-0">
                <span className={cn('block text-sm font-medium', isDone && 'text-muted-foreground line-through')}>
                  {step.title}
                  {isDone && <span className="sr-only"> (done)</span>}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {isDone ? doneDetail(step.id, progress) : step.hint}
                </span>
              </span>
              {!isDone && (
                // Under the text on a phone, so the hint keeps the width;
                // beside it from `sm`.
                <Button
                  variant={step.id === next ? 'default' : 'ghost'}
                  size="sm"
                  // Income needs a wallet to land in; the form would only
                  // say so.
                  disabled={step.id === 'income' && !done.wallet}
                  className="col-start-2 justify-self-start sm:col-start-3"
                  onClick={run[step.id]}
                >
                  {step.action}
                </Button>
              )}
            </li>
          )
        })}
      </ol>

      <WalletDrawer open={drawer === 'wallet'} onOpenChange={(open) => !open && setDrawer(null)} />
      <FundDrawer open={drawer === 'fund'} onOpenChange={(open) => !open && setDrawer(null)} />
    </section>
  )
}

/** What a done step reads in place of its hint: what was actually done. */
function doneDetail(step: SetupStep, { wallets, purposes, rules }: SetupProgress): string {
  switch (step) {
    case 'wallet':
      return wallets.length === 1
        ? `${wallets[0].name} · ${formatMoney(wallets[0].balance)}`
        : `${wallets.length} wallets`
    case 'allocations':
      return purposes.length <= 3
        ? purposes.map((fund) => fund.name).join(', ')
        : `${purposes.length} allocations`
    case 'split':
      return rules.map((rule) => `${rule.fund_name} ${rule.percentage}%`).join(' · ')
    case 'income':
      return 'Recorded'
  }
}
