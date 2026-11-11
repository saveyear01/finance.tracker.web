/**
 * Rasterises the brand SVGs in this folder into what the manifest, iOS and
 * the browser tab need, and writes the iOS launch screens. Re-run with
 * `npm run icons` after editing a source SVG.
 *
 * The launch screen is the same everywhere the app starts, so it reads as one
 * screen rather than three: the page's background with the mark centred at
 * SPLASH_MARK CSS px. Android draws its own from the manifest (name, icon,
 * background_color); iOS needs an image per screen size, generated here; and
 * the HTML shell (index.html) and the session check (`SplashScreen`) draw the
 * same thing until the app is ready.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const brand = import.meta.dirname
const web = path.join(brand, '..')
const out = path.join(web, 'public')

/** [source, output, size] — sizes match what vite-plugin-pwa references. */
const targets = [
  ['mark-square.svg', 'pwa-64x64.png', 64],
  ['mark-square.svg', 'pwa-192x192.png', 192],
  ['mark-square.svg', 'pwa-512x512.png', 512],
  ['mark-maskable.svg', 'maskable-icon-512x512.png', 512],
  // iOS rounds the corners itself and fills transparency with black, so this
  // one comes from the full, opaque square.
  ['mark-apple.svg', 'apple-touch-icon-180x180.png', 180],
]

await mkdir(out, { recursive: true })

for (const [src, name, size] of targets) {
  await sharp(path.join(brand, src)).resize(size, size).png().toFile(path.join(out, name))
  console.log(`${name}  ${size}x${size}`)
}

await copyFile(path.join(brand, 'mark.svg'), path.join(out, 'favicon.svg'))
console.log('favicon.svg')

// ── iOS launch screens ──────────────────────────────────────────────────────

/** The mark's size on every launch screen, in CSS px. Keep in step with
 *  `#boot` (--u) in index.html and `SplashScreen`. */
const SPLASH_MARK = 96

/** --background in index.css, per theme. */
const BACKGROUND = { light: '#f5f5f2', dark: '#0a100f' }

/**
 * Portrait screens, in CSS px and device pixel ratio: every iPhone since the
 * SE (1st gen) and the current iPads. A device missing here gets a blank
 * launch screen, which is all iOS ever shows without one.
 */
const SCREENS = [
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12/13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 13, 14
  [375, 812, 3], // X, XS, 11 Pro, 12/13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [414, 736, 3], // 6s/7/8 Plus
  [375, 667, 2], // 6s/7/8, SE 2nd/3rd gen
  [320, 568, 2], // SE 1st gen
  [1024, 1366, 2], // iPad Pro 12.9"
  [834, 1194, 2], // iPad Pro 11"
  [820, 1180, 2], // iPad Air
  [834, 1112, 2], // iPad Air 3rd gen, Pro 10.5"
  [810, 1080, 2], // iPad 9th gen
  [768, 1024, 2], // iPad mini 5th gen, older iPads
  [744, 1133, 2], // iPad mini 6th gen
]

// The mark's art without its <svg> wrapper, to nest inside each screen.
const markSvg = await readFile(path.join(brand, 'mark-square.svg'), 'utf8')
const markInner = markSvg.slice(markSvg.indexOf('>', markSvg.indexOf('<svg')) + 1, markSvg.lastIndexOf('</svg>'))

const splashDir = path.join(out, 'splash')
await mkdir(splashDir, { recursive: true })
const links = []

for (const [w, h, dpr] of SCREENS) {
  for (const theme of ['light', 'dark']) {
    const [pw, ph, mark] = [w * dpr, h * dpr, SPLASH_MARK * dpr]
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${pw}" height="${ph}" viewBox="0 0 ${pw} ${ph}">
      <rect width="${pw}" height="${ph}" fill="${BACKGROUND[theme]}"/>
      <svg x="${(pw - mark) / 2}" y="${(ph - mark) / 2}" width="${mark}" height="${mark}" viewBox="0 0 100 100">${markInner}</svg>
    </svg>`
    const name = `splash-${pw}x${ph}-${theme}.png`
    await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(path.join(splashDir, name))
    links.push(
      `    <link rel="apple-touch-startup-image" href="/splash/${name}" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait) and (prefers-color-scheme: ${theme})" />`,
    )
  }
}
console.log(`splash/  ${links.length} launch screens`)

// Write the <link> tags into index.html between its markers, so the list
// there can never drift from the images generated here.
const indexPath = path.join(web, 'index.html')
const html = await readFile(indexPath, 'utf8')
const START = '<!-- splash:start -->'
const END = '<!-- splash:end -->'
const a = html.indexOf(START)
const b = html.indexOf(END)
if (a === -1 || b === -1) throw new Error(`index.html needs ${START} … ${END} markers`)
await writeFile(indexPath, `${html.slice(0, a + START.length)}\n${links.join('\n')}\n    ${html.slice(b)}`)
console.log('index.html  launch-screen links updated')
