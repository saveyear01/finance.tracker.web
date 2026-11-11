import { cn } from '@/lib/utils'

/**
 * The app's mark — "Pockets": cards peeking out of one wallet, several
 * allocations held in one place. The same art as the app icon
 * (brand/mark-square.svg) and the launch screen, so the logo inside the app
 * is the icon on the home screen.
 *
 * `simple` is the favicon's cut (brand/mark.svg): one card and no clasp, for
 * sizes under ~28px, where the full art blurs. Decorative by default — the
 * wordmark beside it names the app; pass `label` where it stands alone.
 */
export function BrandMark({
  className,
  simple = false,
  label,
}: {
  className?: string
  simple?: boolean
  label?: string
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={cn('block shrink-0', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width="100" height="100" rx={simple ? 20 : 22.5} fill="#11302c" />
      {simple ? (
        <>
          <rect x="22" y="18" width="56" height="34" rx="8" fill="#6ad6c9" />
          <rect x="14" y="40" width="72" height="44" rx="10" fill="#ffffff" />
        </>
      ) : (
        <>
          <rect x="26" y="16" width="48" height="34" rx="7" fill="#6ad6c9" />
          <rect x="20" y="26" width="60" height="34" rx="7" fill="#2bb3a5" />
          <rect x="14" y="40" width="72" height="44" rx="10" fill="#ffffff" />
          <circle cx="72" cy="62" r="5" fill="#11302c" />
        </>
      )}
    </svg>
  )
}
