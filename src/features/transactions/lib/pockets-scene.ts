import {
  AmbientLight,
  Color,
  CylinderGeometry,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  Shape,
  Vector3,
  WebGLRenderer,
} from 'three'

import { splitByWeight } from './split-preview'

/**
 * "Pockets" — the balance card's 3D scene (mockups `design/home-threejs.html`
 * and `-desktop.html`, chosen 2026-11-13): the app icon in 3D, one card per
 * allocation peeking out of the wallet, as far as its balance says. Plain
 * three.js, no React, so the component that owns it is the only thing to
 * load lazily and it can be torn down completely.
 *
 * What it shows, and nothing it shows is the only place it is said — the
 * figures beside it are real text and the canvas is `aria-hidden`:
 * - how far a card peeks follows its balance against the largest one
 *   (square-root, so a small allocation stays visible);
 * - below zero, a card sinks into the wallet, turns red and shakes once;
 * - `burst()` drops coins that split like the income did and bump each card
 *   as they land. The coins are only the picture: the balances come from
 *   the data, which refetches on its own.
 *
 * Battery: it renders only while something moves, and not at all while
 * off screen or in a hidden tab. Reduced motion gets a still 3D frame.
 */

export type PocketItem = {
  id: string
  cents: number
  /** A CSS colour or `var(--token)`, resolved against the host element. */
  color: string
}

export type PocketLeg = { id: string; cents: number }

type Card = {
  id: string
  cents: number
  color: string
  mesh: Mesh
  mat: MeshStandardMaterial
  base: Color
  x: number
  z: number
  tilt: number
  y: number
  v: number
  target: number
  delay: number
  shake: number
  hl: number
  hlv: number
  dim: number
  dimv: number
}

type Coin = {
  mesh: Mesh
  id: string
  from: Vector3
  ctrl: Vector3
  start: number
  dur: number
  spin: number
}

const MAX_CARDS = 6
const COINS = 20
const WALLET_W = 3.0
const WALLET_H = 1.8
const WALLET_TOP = WALLET_H / 2
const CARD_H = 1.6
/** Resting angle: a little from the right and above, so it reads as 3D even still. */
const REST = { x: 0.08, y: -0.2 }

function rounded(w: number, h: number, r: number, depth: number, bevel: number) {
  const s = new Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.quadraticCurveTo(x + w, y, x + w, y + r)
  s.lineTo(x + w, y + h - r)
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  s.lineTo(x + r, y + h)
  s.quadraticCurveTo(x, y + h, x, y + h - r)
  s.lineTo(x, y + r)
  s.quadraticCurveTo(x, y, x + r, y)
  const g = new ExtrudeGeometry(s, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 3,
    curveSegments: 10,
  })
  g.center()
  return g
}

/** A damped spring step: returns the new [position, velocity]. */
function spring(p: number, v: number, target: number, k: number, d: number, dt: number) {
  const nv = v + (-k * (p - target) - d * v) * dt
  return [p + nv * dt, nv] as const
}
const moving = (p: number, v: number, target: number) => Math.abs(p - target) + Math.abs(v) > 1e-3

export class PocketsScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(30, 1, 0.1, 50)
  private readonly rig = new Group()
  private readonly walletMat = new MeshStandardMaterial({ roughness: 0.55 })
  private readonly claspMat = new MeshStandardMaterial({ roughness: 0.4 })
  private readonly coinMat = new MeshStandardMaterial({ roughness: 0.35, metalness: 0.4 })
  private readonly coinGeo = new CylinderGeometry(0.15, 0.15, 0.05, 24)
  private readonly stripeMat = new MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45 })
  private dimTo = new Color()
  private negative = new Color()

  private cards: Card[] = []
  private coins: Coin[] = []
  private highlight: string | null = null
  private tilt = { rx: REST.x, ry: REST.y, vx: 0, vy: 0, tx: REST.x, ty: REST.y }
  private introPlayed = false

  private running = false
  private frame = 0
  private last = 0
  private onScreen = true
  private disposed = false
  private readonly cleanups: (() => void)[] = []
  private readonly host: HTMLElement
  private reduced: boolean

  /**
   * @param pointerArea where pointer movement tilts the wallet — the whole
   *   card, not just the canvas.
   */
  constructor(host: HTMLElement, pointerArea: HTMLElement, reduced: boolean) {
    this.host = host
    this.reduced = reduced
    // Throws without WebGL; the caller falls back to no scene.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    const canvas = this.renderer.domElement
    canvas.style.position = 'absolute'
    canvas.style.inset = '0'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    host.appendChild(canvas)

    this.camera.position.set(0, 0.55, 8.8)
    this.camera.lookAt(0, 0.45, 0)
    this.scene.add(new AmbientLight(0xffffff, 1.9))
    const key = new DirectionalLight(0xffffff, 1.7)
    key.position.set(-3, 5, 6)
    this.scene.add(key)
    this.scene.add(this.rig)

    this.rig.add(new Mesh(rounded(WALLET_W, WALLET_H, 0.28, 0.22, 0.05), this.walletMat))
    const clasp = new Mesh(new CylinderGeometry(0.13, 0.13, 0.06, 28), this.claspMat)
    clasp.rotation.x = Math.PI / 2
    clasp.position.set(WALLET_W / 2 - 0.5, -0.1, 0.19)
    this.rig.add(clasp)
    this.refreshColors()

    const resize = new ResizeObserver(() => this.resize())
    resize.observe(host)
    const visible = new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting
      this.kick()
    })
    visible.observe(host)
    const onVisibility = () => this.kick()
    document.addEventListener('visibilitychange', onVisibility)
    // next-themes switches the `dark` class on <html>; the tokens change with it.
    const theme = new MutationObserver(() => {
      this.refreshColors()
      this.render()
    })
    theme.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    const onMove = (e: PointerEvent) => {
      if (this.reduced || e.pointerType === 'touch') return
      const r = pointerArea.getBoundingClientRect()
      const px = (e.clientX - r.left) / r.width - 0.5
      const py = (e.clientY - r.top) / r.height - 0.5
      this.tilt.ty = REST.y + px * 0.6
      this.tilt.tx = REST.x + py * 0.4
      this.kick()
    }
    const onLeave = () => {
      this.tilt.tx = REST.x
      this.tilt.ty = REST.y
      this.kick()
    }
    pointerArea.addEventListener('pointermove', onMove)
    pointerArea.addEventListener('pointerleave', onLeave)

    this.cleanups.push(
      () => resize.disconnect(),
      () => visible.disconnect(),
      () => theme.disconnect(),
      () => document.removeEventListener('visibilitychange', onVisibility),
      () => pointerArea.removeEventListener('pointermove', onMove),
      () => pointerArea.removeEventListener('pointerleave', onLeave),
    )
    this.resize()
  }

  /** The allocations to show. Zero balances are left out; at most six cards. */
  setItems(items: PocketItem[]) {
    const shown = items
      .filter((item) => item.cents !== 0)
      .sort((a, b) => b.cents - a.cents)
      .slice(0, MAX_CARDS)
    const sameSet =
      shown.length === this.cards.length && shown.every((item) => this.cards.some((c) => c.id === item.id))

    if (!sameSet) this.rebuild(shown)
    for (const item of shown) {
      const card = this.cards.find((c) => c.id === item.id)
      if (!card) continue
      if (item.cents < 0 && card.cents >= 0 && this.introPlayed && !this.reduced) card.shake = 0.6
      card.cents = item.cents
      card.color = item.color
    }
    this.retarget()
    this.refreshColors()

    if (!this.introPlayed && this.cards.length > 0) {
      this.introPlayed = true
      this.intro()
    } else if (this.reduced) {
      this.snap()
    }
    this.kick()
    this.render()
  }

  /** Coins for an income just recorded: split like its legs, back to front. */
  burst(legs: PocketLeg[]) {
    const paid = legs.filter((leg) => leg.cents > 0)
    if (this.reduced || paid.length === 0) return
    // The coins split like the money did — the same largest remainder.
    const counts = splitByWeight(
      COINS,
      paid.map((leg, i) => ({ key: i, weight: leg.cents })),
    ).map((share) => share.cents)
    // After the drawer has had time to slide away from the card.
    const now = performance.now() + 320
    let seq = 0
    paid.forEach((leg, i) => {
      for (let c = 0; c < counts[i]; c++) {
        const mesh = new Mesh(this.coinGeo, this.coinMat)
        mesh.visible = false
        this.rig.add(mesh)
        const card = this.cards.find((card) => card.id === leg.id)
        this.coins.push({
          mesh,
          id: leg.id,
          from: new Vector3((Math.random() - 0.5) * 2.4, 3.4 + Math.random() * 0.6, 1.2),
          ctrl: new Vector3((card?.x ?? 0) * 0.5, WALLET_TOP + 2.2, 0.9),
          start: now + seq++ * 55 + Math.random() * 30,
          dur: 820,
          spin: 6 + Math.random() * 6,
        })
      }
    })
    this.kick()
  }

  /** Lift one allocation's card out and dim the rest (hovering its row), or null. */
  setHighlight(id: string | null) {
    this.highlight = id
    if (this.reduced) this.snap()
    this.kick()
    this.render()
  }

  setReducedMotion(reduced: boolean) {
    this.reduced = reduced
    if (reduced) {
      this.clearCoins()
      this.snap()
      this.render()
    }
  }

  dispose() {
    this.disposed = true
    cancelAnimationFrame(this.frame)
    this.cleanups.forEach((fn) => fn())
    this.clearCoins()
    this.scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.geometry.dispose()
        const material = object.material as MeshStandardMaterial | MeshStandardMaterial[]
        ;(Array.isArray(material) ? material : [material]).forEach((m) => m.dispose())
      }
    })
    this.coinGeo.dispose()
    this.coinMat.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  // ── internals ────────────────────────────────────────────────────────

  private rebuild(shown: PocketItem[]) {
    const previous = new Map(this.cards.map((card) => [card.id, card]))
    for (const card of this.cards) {
      this.rig.remove(card.mesh)
      card.mesh.geometry.dispose()
      card.mat.dispose()
      card.mesh.children.forEach((child) => (child as Mesh).geometry.dispose())
    }
    const n = shown.length
    // Biggest at the back and narrowest, like the icon; fanned so each shows,
    // with the fan narrowing as cards are added so none clears the wallet's side.
    const step = n > 1 ? Math.min(0.22, 0.5 / (n - 1)) : 0
    this.cards = shown.map((item, k) => {
      const w = n > 1 ? 2.05 + (k / (n - 1)) * 0.55 : 2.4
      const mat = new MeshStandardMaterial({ roughness: 0.5 })
      const mesh = new Mesh(rounded(w, CARD_H, 0.2, 0.04, 0.02), mat)
      const stripe = new Mesh(new PlaneGeometry(w * 0.32, 0.07), this.stripeMat)
      stripe.position.set(-w * 0.26, CARD_H / 2 - 0.2, 0.05)
      mesh.add(stripe)
      this.rig.add(mesh)
      const spread = k - (n - 1) / 2
      const before = previous.get(item.id)
      const card: Card = {
        id: item.id,
        cents: before?.cents ?? item.cents,
        color: item.color,
        mesh,
        mat,
        base: new Color(),
        x: spread * step,
        z: -0.3 - (n - 1 - k) * 0.09,
        tilt: -spread * 0.05,
        // A card that was already showing keeps where it was; a new one rises.
        y: before?.y ?? -0.7,
        v: before?.v ?? 0,
        target: 0,
        delay: 0,
        shake: 0,
        hl: 0,
        hlv: 0,
        dim: 0,
        dimv: 0,
      }
      this.place(card)
      return card
    })
  }

  private retarget() {
    const max = Math.max(1, ...this.cards.map((card) => card.cents))
    for (const card of this.cards) {
      card.target = card.cents <= 0 ? 0.06 : 0.16 + 1.05 * Math.sqrt(card.cents / max)
    }
  }

  private resolve(color: string) {
    const match = /^var\((--[\w-]+)\)$/.exec(color.trim())
    if (!match) return color
    return getComputedStyle(this.host).getPropertyValue(match[1]).trim() || '#888888'
  }

  private refreshColors() {
    this.walletMat.color.set(this.resolve('var(--secondary-foreground)'))
    this.claspMat.color.set(this.resolve('var(--secondary)'))
    this.coinMat.color.set(this.resolve('var(--coin)'))
    this.dimTo.set(this.resolve('var(--secondary)'))
    this.negative.set(this.resolve('var(--secondary-negative)'))
    for (const card of this.cards) {
      if (card.cents < 0) card.base.copy(this.negative)
      else card.base.set(this.resolve(card.color))
      this.paint(card)
    }
  }

  private paint(card: Card) {
    card.mat.color.copy(card.base).lerp(this.dimTo, card.dim * 0.55)
  }

  private place(card: Card, shakeX = 0) {
    // A highlighted card slides up and forward, clear of the wallet's front.
    card.mesh.position.set(
      card.x + shakeX,
      WALLET_TOP + card.y - CARD_H / 2 + card.hl * 0.28,
      card.z + card.hl * 0.55,
    )
    card.mesh.rotation.z = card.tilt * (1 - card.hl)
  }

  private intro() {
    if (this.reduced) return this.snap()
    this.tilt.rx = 0.7
    this.tilt.ry = -0.9
    this.tilt.vx = this.tilt.vy = 0
    this.cards.forEach((card, k) => {
      card.y = -0.7
      card.v = 0
      card.delay = 0.25 + k * 0.11
    })
  }

  private snap() {
    const t = this.tilt
    t.rx = t.tx = REST.x
    t.ry = t.ty = REST.y
    t.vx = t.vy = 0
    this.rig.rotation.set(t.rx, t.ry, 0)
    for (const card of this.cards) {
      card.y = card.target
      card.v = card.delay = card.shake = card.hlv = card.dimv = 0
      card.hl = this.highlight === card.id ? 1 : 0
      card.dim = this.highlight !== null && this.highlight !== card.id ? 1 : 0
      this.place(card)
      this.paint(card)
    }
  }

  private clearCoins() {
    this.coins.forEach((coin) => this.rig.remove(coin.mesh))
    this.coins = []
  }

  private kick() {
    if (this.disposed || this.running || !this.onScreen || document.hidden) return
    this.running = true
    this.last = performance.now()
    this.frame = requestAnimationFrame(this.tick)
  }

  private readonly tick = (now: number) => {
    const dt = Math.min(0.033, (now - this.last) / 1000)
    this.last = now
    const active = this.step(dt, now)
    this.render()
    if (active && this.onScreen && !document.hidden && !this.disposed) {
      this.frame = requestAnimationFrame(this.tick)
    } else {
      this.running = false
    }
  }

  private step(dt: number, now: number) {
    let active = false
    const t = this.tilt
    ;[t.rx, t.vx] = spring(t.rx, t.vx, t.tx, 60, 11, dt)
    ;[t.ry, t.vy] = spring(t.ry, t.vy, t.ty, 60, 11, dt)
    if (moving(t.rx, t.vx, t.tx) || moving(t.ry, t.vy, t.ty)) active = true
    this.rig.rotation.set(t.rx, t.ry, 0)

    for (const card of this.cards) {
      const hlTarget = this.highlight === card.id ? 1 : 0
      const dimTarget = this.highlight !== null && this.highlight !== card.id ? 1 : 0
      ;[card.hl, card.hlv] = spring(card.hl, card.hlv, hlTarget, 160, 18, dt)
      ;[card.dim, card.dimv] = spring(card.dim, card.dimv, dimTarget, 120, 22, dt)
      if (moving(card.hl, card.hlv, hlTarget) || moving(card.dim, card.dimv, dimTarget)) active = true
      this.paint(card)
      if (card.delay > 0) {
        card.delay -= dt
        active = true
        this.place(card)
        continue
      }
      ;[card.y, card.v] = spring(card.y, card.v, card.target, 140, 12, dt)
      if (moving(card.y, card.v, card.target)) active = true
      let shakeX = 0
      if (card.shake > 0) {
        card.shake = Math.max(0, card.shake - dt)
        shakeX = Math.sin(card.shake * 60) * 0.06 * (card.shake / 0.6)
        active = true
      }
      this.place(card, shakeX)
    }

    this.coins = this.coins.filter((coin) => {
      const p = (now - coin.start) / coin.dur
      if (p < 0) {
        coin.mesh.visible = false
        return true
      }
      coin.mesh.visible = true
      // Looked up every frame: an allocation that was empty gets its card
      // only once the refetched balances arrive, possibly mid-flight.
      const card = this.cards.find((c) => c.id === coin.id)
      if (p >= 1) {
        this.rig.remove(coin.mesh)
        if (card) card.v += 1.8
        return false
      }
      const to = card
        ? new Vector3(card.x, WALLET_TOP + card.y + 0.05, card.z + 0.1)
        : new Vector3(0, WALLET_TOP, 0)
      const e = p * p * (3 - 2 * p)
      const u = 1 - e
      coin.mesh.position
        .copy(coin.from)
        .multiplyScalar(u * u)
        .addScaledVector(coin.ctrl, 2 * u * e)
        .addScaledVector(to, e * e)
      coin.mesh.rotation.x += dt * coin.spin
      coin.mesh.rotation.z += dt * coin.spin * 0.6
      coin.mesh.scale.setScalar(Math.max(p > 0.85 ? (1 - p) / 0.15 : 1, 0.01))
      return true
    })
    if (this.coins.length) active = true
    return active
  }

  private resize() {
    const { width, height } = this.host.getBoundingClientRect()
    if (!width || !height) return
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    this.render()
  }

  private render() {
    if (!this.disposed) this.renderer.render(this.scene, this.camera)
  }
}
