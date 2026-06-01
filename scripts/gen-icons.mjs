// Gera os ícones PNG do PWA a partir de um SVG (gradiente roxo→rosa + folha).
// Rodar: node scripts/gen-icons.mjs
import sharp from "sharp"
import { mkdir } from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname, join } from "node:path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const ICONS = join(__dirname, "..", "public", "icons")
const SPLASH = join(__dirname, "..", "public", "splash")

/** SVG do ícone. `round` = raio dos cantos; `leafScale` = tamanho da folha. */
function iconSvg({ round = 0, leafScale = 1 } = {}) {
  const s = leafScale
  // transform pra escalar a folha em torno do centro (512,512)
  const tf = `translate(${512 * (1 - s)}, ${512 * (1 - s)}) scale(${s})`
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#f472b6"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" rx="${round}" fill="url(#g)"/>
  <g transform="${tf}">
    <path d="M512 210 C 730 295, 772 625, 512 815 C 252 625, 294 295, 512 210 Z" fill="#ffffff"/>
    <path d="M512 250 L 512 772" stroke="#a78bfa" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M512 412 L 416 348 M512 486 L 612 420 M512 560 L 432 506 M512 628 L 600 572"
          stroke="#a78bfa" stroke-width="11" stroke-linecap="round" fill="none"/>
  </g>
</svg>`
}

/** Splash: fundo off-white + ícone centralizado + wordmark. */
function splashSvg(w, h) {
  const cx = w / 2
  const iconSize = Math.min(w, h) * 0.26
  const iconY = h / 2 - iconSize * 0.75
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="#a78bfa"/>
      <stop offset="1" stop-color="#f472b6"/>
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#fafafa"/>
  <g transform="translate(${cx - iconSize / 2}, ${iconY}) scale(${iconSize / 1024})">
    <rect width="1024" height="1024" rx="230" fill="url(#g)"/>
    <path d="M512 210 C 730 295, 772 625, 512 815 C 252 625, 294 295, 512 210 Z" fill="#ffffff"/>
    <path d="M512 250 L 512 772" stroke="#a78bfa" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M512 412 L 416 348 M512 486 L 612 420 M512 560 L 432 506 M512 628 L 600 572"
          stroke="#a78bfa" stroke-width="11" stroke-linecap="round" fill="none"/>
  </g>
  <text x="${cx}" y="${h / 2 + iconSize * 0.62}" text-anchor="middle"
        font-family="-apple-system, system-ui, sans-serif" font-size="${iconSize * 0.22}"
        font-weight="600" fill="#18181b" letter-spacing="2">Dieta</text>
</svg>`
}

async function png(svg, size, out) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log("✓", out.split("/").slice(-2).join("/"))
}

async function pngWH(svg, w, h, out) {
  await sharp(Buffer.from(svg)).resize(w, h).png().toFile(out)
  console.log("✓", out.split("/").slice(-2).join("/"))
}

// Resoluções de splash iOS (device → [w, h] portrait)
const SPLASHES = [
  [1170, 2532], // iPhone 12/13/14/16e
  [1179, 2556], // iPhone 14/15/16 Pro
  [1206, 2622], // iPhone 16 Pro
  [1290, 2796], // iPhone 14/15 Pro Max
  [1320, 2868], // iPhone 16 Pro Max
  [1284, 2778], // iPhone 12/13 Pro Max
  [1125, 2436], // iPhone X/XS/11 Pro
  [1242, 2688], // iPhone XS Max/11 Pro Max
  [828, 1792], // iPhone XR/11
]

async function main() {
  await mkdir(ICONS, { recursive: true })
  await mkdir(SPLASH, { recursive: true })

  // Ícones "any" — cantos arredondados
  await png(iconSvg({ round: 230, leafScale: 1 }), 192, join(ICONS, "icon-192.png"))
  await png(iconSvg({ round: 230, leafScale: 1 }), 512, join(ICONS, "icon-512.png"))
  // Maskable — square full-bleed, folha menor (safe zone)
  await png(iconSvg({ round: 0, leafScale: 0.72 }), 512, join(ICONS, "icon-maskable.png"))
  // Apple touch — square opaco (iOS arredonda)
  await png(iconSvg({ round: 0, leafScale: 1 }), 180, join(ICONS, "apple-touch-icon.png"))

  // Splash screens
  for (const [w, h] of SPLASHES) {
    await pngWH(splashSvg(w, h), w, h, join(SPLASH, `splash-${w}x${h}.png`))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
