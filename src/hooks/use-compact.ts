import { useSyncExternalStore } from 'react'

/**
 * Below `lg` — the width at which the app is a phone app: the floating pill
 * nav shows and the sidebar hides (`lg:hidden` in mobile-tab-bar). Pickers
 * and menus use it to open as bottom sheets there and as popovers above it,
 * so the two never disagree about which layout is on screen.
 */
const QUERY = '(max-width: 1023.98px)'

function subscribe(onChange: () => void) {
  const mql = window.matchMedia(QUERY)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}

export function useIsCompact(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
}
