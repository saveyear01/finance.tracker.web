/**
 * The animated launch screen (`#boot` in index.html) — dismissed from here
 * once the app knows what to show.
 *
 * It always plays the whole show, on every start (browser tabs and reloads
 * too), then rests on the finished logo before leaving — the user's call,
 * 2026-11-11: a fast load used to cut it off mid-tilt. With reduced motion
 * there is no show to wait for, so it leaves as soon as the app is ready.
 */

/** From the animation's start: the cards out (1.38s), the glint done
 *  (2.05s), then a rest on the finished logo. */
const SHOW_MS = 2600
/** The exit (cards tucked back, mark lifted away), then the fade. */
const LEAVE_MS = 450

declare global {
  interface Window {
    __bootStart?: number
    __dismissBoot?: () => void
  }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const wait = reducedMotion() ? 0 : Math.max(0, SHOW_MS - elapsed)

  window.setTimeout(() => {
    boot.classList.replace('is-playing', 'is-leaving')
    boot.classList.add('is-gone')
    window.setTimeout(() => boot.remove(), LEAVE_MS)
  }, wait)
}

window.__dismissBoot = dismissBoot
