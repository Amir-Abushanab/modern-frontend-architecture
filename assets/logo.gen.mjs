// Animated logo generator — "Blueprint → Build"
// Emits one SVG per frame; rasterize with rsvg-convert, assemble with img2webp.
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const OUT = join(dirname(fileURLToPath(import.meta.url)), 'frames')
mkdirSync(OUT, { recursive: true })

const FPS = 24, DUR = 4.5, W = 1280, H = 400
const FRAMES = Math.round(FPS * DUR) // 108; frame 108 ≡ frame 0

// --- easing / helpers ---------------------------------------------------
const clamp01 = (x) => Math.min(1, Math.max(0, x))
const win = (t, a, b) => clamp01((t - a) / (b - a))
const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)
const easeOutBack = (t) => { const c = 1.10158; return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2 }
const fmt = (n) => +n.toFixed(2)

// --- palette ------------------------------------------------------------
const NAVY_A = '#0D2140', NAVY_B = '#081627'
const DASH = '#67E4FF', SOLID = '#BFF1FF', FILLC = '#35D0FF'
const TEXT = '#EAF7FF', SUB = '#8FB8D9', CHIP = '#67E4FF'

// --- mark geometry (320×320 box at 64,40) -------------------------------
const MX = 64, MY = 40
// [x, y, w, h, drawStart, drawEnd, fill, fillOpacity, strokeW]
const els = [
  { x: 10,  y: 10, w: 300, h: 300, d0: 0.00, d1: 0.75, fill: null,      fo: 0,    sw: 3.5 }, // frame
  { x: 24,  y: 24, w: 272, h: 44,  d0: 0.22, d1: 0.92, fill: FILLC,     fo: 0.88, sw: 3 },   // header
  { x: 24,  y: 84, w: 64,  h: 212, d0: 0.40, d1: 1.10, fill: FILLC,     fo: 0.26, sw: 3 },   // sidebar
  { x: 104, y: 84, w: 90,  h: 96,  d0: 0.58, d1: 1.22, fill: '#FFFFFF', fo: 0.12, sw: 3 },   // card1
  { x: 206, y: 84, w: 90,  h: 96,  d0: 0.72, d1: 1.36, fill: '#FFFFFF', fo: 0.12, sw: 3 },   // card2
  { x: 104, y: 196, w: 192, h: 100, d0: 0.86, d1: 1.50, fill: '#FFFFFF', fo: 0.10, sw: 3 },  // list
]
const perim = (e) => 2 * (e.w + e.h)
const rectPath = (e) => `M ${MX + e.x} ${MY + e.y} h ${e.w} v ${e.h} h ${-e.w} Z`

// timeline (seconds)
const BUILD0 = 1.55, BUILD_DUR = 0.5, BUILD_STAG = 0.09
const DIS0 = 3.45, DIS_DUR = 0.5, DIS_STAG = 0.03
const UND0 = 3.85, UND_DUR = 0.4, UND_STAG = 0.05

function markSVG(T) {
  let defs = '', body = ''
  els.forEach((e, i) => {
    const P = perim(e)
    // draw progress: in during d0..d1, out (undraw) at the end
    const undS = UND0 + (els.length - 1 - i) * UND_STAG
    let p = easeInOutCubic(win(T, e.d0, e.d1)) * P
    const und = win(T, undS, undS + UND_DUR)
    if (und > 0) p = (1 - easeInOutCubic(und)) * P
    // build crossfade: 0 = blueprint, 1 = built (and back during dissolve)
    let b = easeInOutCubic(win(T, BUILD0 + i * BUILD_STAG, BUILD0 + i * BUILD_STAG + BUILD_DUR))
    const dis = win(T, DIS0 + (els.length - 1 - i) * DIS_STAG, DIS0 + (els.length - 1 - i) * DIS_STAG + DIS_DUR)
    if (dis > 0) b *= 1 - easeInOutCubic(dis)
    // gentle pulse while holding
    const pulse = T > 2.5 && T < 3.45 ? 1 + 0.05 * Math.sin((T - 2.5) * Math.PI * 2 / 0.95) : 1
    // scale pop on build
    const s = 1 + 0.035 * (easeOutBack(clamp01(b)) - 1) * 0 + (b > 0 && b < 1 ? (easeOutBack(b) - b) * 0.02 : 0)
    const cx = MX + e.x + e.w / 2, cy = MY + e.y + e.h / 2
    const tf = s !== 1 ? ` transform="translate(${fmt(cx)} ${fmt(cy)}) scale(${fmt(s)}) translate(${fmt(-cx)} ${fmt(-cy)})"` : ''
    const d = rectPath(e)
    let g = `<g${tf}>`
    if (p > 0.5 && b < 1) {
      defs += `<mask id="m${i}"><path d="${d}" fill="none" stroke="white" stroke-width="12" stroke-dasharray="${fmt(p)} ${fmt(P + 2)}"/></mask>`
      g += `<path d="${d}" fill="none" stroke="${DASH}" stroke-width="${e.sw}" stroke-dasharray="8 7" opacity="${fmt(0.9 * (1 - b))}" mask="url(#m${i})"/>`
    }
    if (b > 0) {
      if (e.fill) g += `<rect x="${MX + e.x}" y="${MY + e.y}" width="${e.w}" height="${e.h}" rx="6" fill="${e.fill}" opacity="${fmt(e.fo * b * pulse)}"/>`
      g += `<path d="${d}" fill="none" stroke="${SOLID}" stroke-width="${e.sw}" opacity="${fmt(0.95 * b)}" stroke-linejoin="round"/>`
      body += detail(i, b, T)
    }
    g += '</g>'
    body = g + body // details appended after so they sit on top
  })
  return { defs, body }
}

// inner UI details, tied to each element's build progress
function detail(i, b, T) {
  const o = fmt(b)
  const X = (v) => MX + v, Y = (v) => MY + v
  switch (i) {
    case 1: return `<g opacity="${o}"><circle cx="${X(44)}" cy="${Y(46)}" r="4.5" fill="${NAVY_B}" opacity="0.85"/><circle cx="${X(62)}" cy="${Y(46)}" r="4.5" fill="${NAVY_B}" opacity="0.85"/><circle cx="${X(80)}" cy="${Y(46)}" r="4.5" fill="${NAVY_B}" opacity="0.85"/><rect x="${X(100)}" y="${Y(41)}" width="84" height="10" rx="5" fill="${NAVY_B}" opacity="0.5"/></g>`
    case 2: return `<g opacity="${o}">` + [0, 1, 2, 3].map(k => `<rect x="${X(36)}" y="${Y(102 + k * 28)}" width="${k === 0 ? 40 : 32}" height="10" rx="4" fill="${SOLID}" opacity="${k === 0 ? 0.9 : 0.45}"/>`).join('') + '</g>'
    case 3: { // bar chart
      const bars = [30, 48, 38].map((h, k) => `<rect x="${X(122 + k * 20)}" y="${fmt(Y(164) - h * b)}" width="12" height="${fmt(h * b)}" rx="3" fill="${SOLID}" opacity="0.85"/>`).join('')
      return `<g>${bars}</g>`
    }
    case 4: { // donut
      const C = 2 * Math.PI * 21
      return `<g opacity="${o}"><circle cx="${X(251)}" cy="${Y(126)}" r="21" fill="none" stroke="${SOLID}" stroke-width="8" opacity="0.25"/><circle cx="${X(251)}" cy="${Y(126)}" r="21" fill="none" stroke="${SOLID}" stroke-width="8" stroke-dasharray="${fmt(C * 0.72 * b)} ${fmt(C)}" stroke-linecap="round" transform="rotate(-90 ${X(251)} ${Y(126)})"/><rect x="${X(232)}" y="${Y(158)}" width="38" height="8" rx="4" fill="${SOLID}" opacity="0.5"/></g>`
    }
    case 5: { // list rows + blinking caret
      const blink = (T > 2.6 && T < 2.85) || (T > 3.05 && T < 3.3) ? 1 : 0
      return `<g opacity="${o}"><rect x="${X(118)}" y="${Y(212)}" width="164" height="12" rx="5" fill="#FFFFFF" opacity="0.35"/><rect x="${X(118)}" y="${Y(236)}" width="110" height="12" rx="5" fill="#FFFFFF" opacity="0.28"/><rect x="${X(234)}" y="${Y(234)}" width="3.5" height="16" fill="${DASH}" opacity="${blink}"/><rect x="${X(118)}" y="${Y(260)}" width="140" height="12" rx="5" fill="#FFFFFF" opacity="0.18"/></g>`
    }
    default: return ''
  }
}

// static layers ----------------------------------------------------------
function grid() {
  let s = `<g opacity="0.055" stroke="${DASH}" stroke-width="1">`
  for (let x = 40; x < W; x += 40) s += `<line x1="${x}" y1="0" x2="${x}" y2="${H}"/>`
  for (let y = 40; y < H; y += 40) s += `<line x1="0" y1="${y}" x2="${W}" y2="${y}"/>`
  s += '</g>'
  const crosses = [[480, 96], [1096, 152], [560, 328], [1188, 300], [428, 232]]
    .map(([x, y]) => `<path d="M ${x - 6} ${y} h 12 M ${x} ${y - 6} v 12" stroke="${DASH}" stroke-width="1.5" opacity="0.16"/>`).join('')
  return s + crosses
}

const MONO = 'Menlo, Consolas, monospace'
const text = `
  <text x="448" y="215" font-family="${MONO}" font-weight="bold" font-size="44" fill="${TEXT}">modern-frontend-architecture</text>`

for (let f = 0; f < FRAMES; f++) {
  const T = f / FPS
  const { defs, body } = markSVG(T)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${NAVY_A}"/><stop offset="1" stop-color="${NAVY_B}"/></linearGradient><clipPath id="rc"><rect width="${W}" height="${H}" rx="26"/></clipPath>${defs}</defs>
<g clip-path="url(#rc)"><rect width="${W}" height="${H}" fill="url(#bg)"/>${grid()}${body}${text}</g>
<rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="25" fill="none" stroke="${FILLC}" stroke-width="1.5" opacity="0.22"/>
</svg>`
  writeFileSync(join(OUT, `f${String(f).padStart(3, '0')}.svg`), svg)
}
console.log(`wrote ${FRAMES} frames to ${OUT}`)
