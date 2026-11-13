import { useEffect, useRef, useSyncExternalStore, type RefObject } from 'react'

import { PocketsScene, type PocketItem, type PocketLeg } from '../lib/pockets-scene'

/** One income just recorded, to play as coins. `key` makes a repeat replay. */
export type PocketsBurst = { key: string; legs: PocketLeg[] }

const REDUCED = '(prefers-reduced-motion: reduce)'
function subscribeReduced(onChange: () => void) {
  const mql = window.matchMedia(REDUCED)
  mql.addEventListener('change', onChange)
  return () => mql.removeEventListener('change', onChange)
}
const readReduced = () => window.matchMedia(REDUCED).matches

/**
 * The balance card's 3D wallet (`PocketsScene`), owned by React.
 *
 * The default export, so `BalanceCard` can `lazy()` it: three.js is a chunk
 * of its own, fetched after Home has drawn. Without WebGL the scene throws
 * and this renders an empty box — the figures beside it say everything the
 * picture does.
 */
export default function PocketsCanvas({
  items,
  burst,
  highlightId,
  pointerArea,
  className,
}: {
  items: PocketItem[]
  burst: PocketsBurst | null
  highlightId: string | null
  /** The card the pointer tilts the wallet over. */
  pointerArea: RefObject<HTMLElement | null>
  className?: string
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<PocketsScene | null>(null)
  const reduced = useSyncExternalStore(subscribeReduced, readReduced, () => false)

  // Effects run in the order written, so on mount the scene is created first
  // and the ones after it hand it the motion setting, highlight and items.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let scene: PocketsScene
    try {
      scene = new PocketsScene(host, pointerArea.current ?? host, readReduced())
    } catch {
      return // no WebGL
    }
    sceneRef.current = scene
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [pointerArea])

  useEffect(() => {
    sceneRef.current?.setReducedMotion(reduced)
  }, [reduced])

  useEffect(() => {
    sceneRef.current?.setHighlight(highlightId)
  }, [highlightId])

  useEffect(() => {
    sceneRef.current?.setItems(items)
  }, [items])

  const lastBurst = useRef<string | null>(null)
  useEffect(() => {
    if (!burst || burst.key === lastBurst.current) return
    lastBurst.current = burst.key
    sceneRef.current?.burst(burst.legs)
  }, [burst])

  return <div ref={hostRef} aria-hidden="true" className={className} style={{ position: 'relative' }} />
}
