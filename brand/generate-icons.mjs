/**
 * Rasterises the brand SVGs in this folder into the PNGs the manifest and iOS
 * need. Re-run with `node brand/generate-icons.mjs` after editing a source SVG.
 */
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

import sharp from 'sharp'

const brand = import.meta.dirname
const out = path.join(brand, '..', 'public')

/** [source, output, size] — sizes match what vite-plugin-pwa references. */
const targets = [
  ['mark-square.svg', 'pwa-64x64.png', 64],
  ['mark-square.svg', 'pwa-192x192.png', 192],
  ['mark-square.svg', 'pwa-512x512.png', 512],
  ['mark-maskable.svg', 'maskable-icon-512x512.png', 512],
  // iOS applies its own rounding and does not honour transparency, so this one
  // is the square, fully opaque variant.
  ['mark-square.svg', 'apple-touch-icon-180x180.png', 180],
]

await mkdir(out, { recursive: true })

for (const [src, name, size] of targets) {
  await sharp(path.join(brand, src))
    .resize(size, size)
    .png()
    .toFile(path.join(out, name))
  console.log(`${name}  ${size}x${size}`)
}
