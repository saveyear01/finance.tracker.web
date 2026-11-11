import { BrandMark } from '@/components/brand-mark'

/**
 * The still launch screen — the page background with the mark centred at
 * 96px, as the iOS launch image draws it — for a session check that happens
 * after the animated launch screen (#boot in index.html) has gone. Keep the
 * mark's size in step with `SPLASH_MARK` in brand/generate-icons.mjs and
 * `--u` in index.html.
 */
export function SplashScreen({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-background" role="status">
      <BrandMark className="size-24" />
      <span className="sr-only">{label}</span>
    </div>
  )
}
