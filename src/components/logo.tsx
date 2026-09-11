import { Wallet } from 'lucide-react'

import { env } from '@/config/env'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  /** Override the wordmark colour where the ground isn't `--background`. */
  wordmarkClassName?: string
}

/**
 * The app logo: a lucide `wallet` mark plus the wordmark.
 *
 * One component rather than several copies — the mark appears in the login
 * brand panel and the login mobile header, and they should not be able to
 * drift apart.
 */
export function Logo({ className, wordmarkClassName }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        {/* Decorative — the wordmark beside it already names the app. */}
        <Wallet className="size-5" aria-hidden="true" />
      </span>
      <span
        className={cn('text-lg font-semibold tracking-tight', wordmarkClassName)}
      >
        {env.APP_NAME}
      </span>
    </div>
  )
}
