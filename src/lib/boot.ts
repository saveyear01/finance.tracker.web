/**
 * The animated launch screen (`#boot` in index.html) — dismissed from here
 * once the app knows what to show.
 *
 * On a COLD START (the installed app opened from the home screen) it stays
 * until the show has played — the cards out and the glint run — so the
 * launch reads as one moment rather than a flicker (the user's call,
 * 2026-11-11). A reload or a browser tab never waits: there the app comes up
 * the moment it's ready.
 */

/** From the animation's start to the cards out and the glint done. */
const SHOW_MS = 1400
/** The exit (cards tucked back, mark lifted away), then the fade. */
const LEAVE_MS = 450

declare global {
  interface Window {
    __bootStart?: number
    __dismissBoot?: () => void
  }
}

function isColdStart(): boolean {
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS before it reported display-mode for home-screen apps.
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
  return standalone && (nav?.type ?? 'navigate') === 'navigate'
}

let dismissed = false

/** Is the launch screen still covering the app? */
export function bootIsShowing(): boolean {
  return !dismissed && document.getElementById('boot') !== null
}

/** Play the launch screen out. Safe to call more than once. */
export function dismissBoot(): void {
  if (dismissed) return
  const boot = document.getElementById('boot')
  if (!boot) return
  dismissed = true

  const elapsed = performance.now() - (window.__bootStart ?? 0)
  const wait = isColdStart() ? Math.max(0, SHOW_MS - elapsed) : 0

  window.setTimeout(() => {
    boot.classList.replace('is-playing', 'is-leaving')
    boot.classList.add('is-gone')
    window.setTimeout(() => boot.remove(), LEAVE_MS)
  }, wait)
}

window.__dismissBoot = dismissBoot
