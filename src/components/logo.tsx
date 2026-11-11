import { BrandMark } from '@/components/brand-mark'
import { env } from '@/config/env'
import { cn } from '@/lib/utils'

type LogoProps = {
  className?: string
  /** Override the wordmark colour where the ground isn't `--background`. */
  wordmarkClassName?: string
  /** On a ground as dark as the mark's own tile (the login brand panel):
   *  a faint ring keeps the tile's edge. */
  onDark?: boolean
}

/**
 * The app logo: the Pockets mark (the app icon) plus the wordmark.
 *
 * One component rather than several copies — the mark appears in the login
 * brand panel and the login mobile header, and they should not be able to
 * drift apart.
 */
export function Logo({ className, wordmarkClassName, onDark = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Decorative — the wordmark beside it already names the app. */}
      <BrandMark
        className={cn('size-9 rounded-[22.5%]', onDark && 'ring-1 ring-secondary-foreground/25')}
      />
      <span
        className={cn('text-lg font-semibold tracking-tight', wordmarkClassName)}
      >
        {env.APP_NAME}
      </span>
    </div>
  )
}
