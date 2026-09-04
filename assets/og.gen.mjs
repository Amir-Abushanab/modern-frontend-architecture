// Social preview generator — the logo's rest frame, on a 1280×640 canvas.
// Same mark, palette and grid as logo.gen.mjs; one tagline added under the wordmark.
//   node assets/og.gen.mjs && rsvg-convert -w 1280 -h 640 assets/og.svg -o assets/og.png
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const W = 1280, H = 640

// --- palette (shared with logo.gen.mjs) ---------------------------------
const NAVY_A = '#0D2140', NAVY_B = '#081627'
const DASH = '#67E4FF', SOLID = '#BFF1FF', FILLC = '#35D0FF'
const TEXT = '#EAF7FF', SUB = '#8FB8D9'
const MONO = 'Menlo, DejaVu Sans Mono, Consolas, monospace'

const fmt = (n) => +n.toFixed(2)

// --- mark: the logo's 320×320 box, fully built --------------------------
const MX = 80, MY = 160
const els = [
  { x: 10,  y: 10,  w: 300, h: 300, fill: null,      fo: 0,    sw: 3.5 }, // frame
  { x: 24,  y: 24,  w: 272, h: 44,  fill: FILLC,     fo: 0.88, sw: 3 },   // header
  { x: 24,  y: 84,  w: 64,  h: 212, fill: FILLC,     fo: 0.26, sw: 3 },   // sidebar
  { x: 104, y: 84,  w: 90,  h: 96,  fill: '#FFFFFF', fo: 0.12, sw: 3 },   // card1 — bars
  { x: 206, y: 84,  w: 90,  h: 96,  fill: '#FFFFFF', fo: 0.12, sw: 3 },   // card2 — donut
  { x: 104, y: 196, w: 192, h: 100, fill: '#FFFFFF', fo: 0.10, sw: 3 },   // list
]
const rectPath = (e) => `M ${e.x} ${e.y} h ${e.w} v ${e.h} h ${-e.w} Z`

// inner UI details, identical to the logo's built state
function detail(i) {
  switch (i) {
    case 1: return `<g><circle cx="44" cy="46" r="4.5" fill="${NAVY_B}" opacity="0.85"/><circle cx="62" cy="46" r="4.5" fill="${NAVY_B}" opacity="0.85"/><circle cx="80" cy="46" r="4.5" fill="${NAVY_B}" opacity="0.85"/><rect x="100" y="41" width="84" height="10" rx="5" fill="${NAVY_B}" opacity="0.5"/></g>`
    case 2: return '<g>' + [0, 1, 2, 3].map((k) => `<rect x="36" y="${102 + k * 28}" width="${k === 0 ? 40 : 32}" height="10" rx="4" fill="${SOLID}" opacity="${k === 0 ? 0.9 : 0.45}"/>`).join('') + '</g>'
    case 3: return '<g>' + [30, 48, 38].map((h, k) => `<rect x="${122 + k * 20}" y="${164 - h}" width="12" height="${h}" rx="3" fill="${SOLID}" opacity="0.85"/>`).join('') + '</g>'
    case 4: {
      const C = 2 * Math.PI * 21
      return `<g><circle cx="251" cy="126" r="21" fill="none" stroke="${SOLID}" stroke-width="8" opacity="0.25"/><circle cx="251" cy="126" r="21" fill="none" stroke="${SOLID}" stroke-width="8" stroke-dasharray="${fmt(C * 0.72)} ${fmt(C)}" stroke-linecap="round" transform="rotate(-90 251 126)"/><rect x="232" y="158" width="38" height="8" rx="4" fill="${SOLID}" opacity="0.5"/></g>`
    }
    case 5: return `<g><rect x="118" y="212" width="164" height="12" rx="5" fill="#FFFFFF" opacity="0.35"/><rect x="118" y="236" width="110" height="12" rx="5" fill="#FFFFFF" opacity="0.28"/><rect x="118" y="260" width="140" height="12" rx="5" fill="#FFFFFF" opacity="0.18"/></g>`
    default: return ''
  }
}

function mark() {
  let body = ''
  els.forEach((e, i) => {
    if (e.fill) body += `<rect x="${e.x}" y="${e.y}" width="${e.w}" height="${e.h}" rx="6" fill="${e.fill}" opacity="${e.fo}"/>`
    body += `<path d="${rectPath(e)}" fill="none" stroke="${SOLID}" stroke-width="${e.sw}" opacity="0.95" stroke-linejoin="round"/>`
    body += detail(i)
  })
  return `<g transform="translate(${MX} ${MY})">${body}</g>`
}

// --- blueprint backdrop -------------------------------------------------
function grid() {
  let s = `<g opacity="0.055" stroke="${DASH}" stroke-width="1">`
  for (let x = 40; x < W; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`
  for (let y = 40; y < H; y += 40) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`
  s += '</g>'
  const crosses = [[560, 128], [1112, 200], [608, 536], [1168, 480], [200, 560], [1040, 96]]
    .map(([x, y]) => `<path d="M ${x - 6} ${y} h 12 M ${x} ${y - 6} v 12" stroke="${DASH}" stroke-width="1.5" opacity="0.16"/>`).join('')
  return s + crosses
}

// --- wordmark + tagline -------------------------------------------------
const TX = 464
const text = `
  <text x="${TX}" y="312" font-family="${MONO}" font-weight="bold" font-size="44" fill="${TEXT}">modern-frontend-architecture</text>
  <text x="${TX}" y="358" font-family="${MONO}" font-size="22" fill="${SUB}">Architect your frontend like a 10x engineer.</text>`

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY_A}"/><stop offset="1" stop-color="${NAVY_B}"/></linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${grid()}
${mark()}
${text}
<rect x="0.75" y="0.75" width="${W - 1.5}" height="${H - 1.5}" fill="none" stroke="${FILLC}" stroke-width="1.5" opacity="0.22"/>
</svg>`

writeFileSync(join(HERE, 'og.svg'), svg)
console.log(`wrote ${join(HERE, 'og.svg')} (${W}×${H})`)
