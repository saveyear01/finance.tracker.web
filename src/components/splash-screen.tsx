/**
 * The launch screen, drawn by the app while it gets ready (the session
 * check). It is the same screen the phone shows first — the iOS launch image,
 * Android's manifest splash and the HTML shell in index.html: the page
 * background with the mark centred at 96px — so opening the app reads as one
 * screen rather than three. Keep the mark's size in step with
 * `SPLASH_MARK` in brand/generate-icons.mjs and `.boot-mark` in index.html.
 */
export function SplashScreen({ label }: { label: string }) {
  return (
    <div className="fixed inset-0 grid place-items-center bg-background" role="status">
      <svg className="block size-24" viewBox="0 0 100 100" aria-hidden="true">
        <rect width="100" height="100" rx="22.5" fill="#11302c" />
        <rect x="26" y="16" width="48" height="34" rx="7" fill="#6ad6c9" />
        <rect x="20" y="26" width="60" height="34" rx="7" fill="#2bb3a5" />
        <rect x="14" y="40" width="72" height="44" rx="10" fill="#ffffff" />
        <circle cx="72" cy="62" r="5" fill="#11302c" />
      </svg>
      <span className="sr-only">{label}</span>
    </div>
  )
}
