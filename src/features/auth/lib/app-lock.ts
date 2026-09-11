import { useSyncExternalStore } from 'react'

/**
 * Whether the app is locked behind the PIN — a tiny store outside React, so
 * signing in, setting a PIN, and the lock screen can all flip it, and the
 * gate re-renders.
 *
 * Kept in memory on purpose: a reload or a fresh launch starts LOCKED, which
 * is what "lock when the app is opened" means. It only matters for accounts
 * with a PIN — `AppLock` ignores it otherwise.
 */
let locked = true
const listeners = new Set<() => void>()

function set(next: boolean) {
  if (locked === next) return
  locked = next
  for (const listener of listeners) listener()
}

export const appLock = {
  lock: () => set(true),
  unlock: () => set(false),
  isLocked: () => locked,
  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}

export function useAppLocked(): boolean {
  return useSyncExternalStore(appLock.subscribe, appLock.isLocked)
}

/** How long the app may sit in the background before it locks again. */
export const AWAY_LIMIT_MS = 5 * 60 * 1000
