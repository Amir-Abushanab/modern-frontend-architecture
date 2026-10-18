# i18n & RTL

Default: a **typed hand-rolled dictionary** — key-safety, autocomplete, zero build step. No i18next/Lingui.

## The dict

```ts
// locales/en.ts — source of truth
export const en = {
  nav: { home: 'Home', settings: 'Settings' },
  cart: { title: 'Your cart' },
} as const
type Widen<T> = { readonly [K in keyof T]: T[K] extends string ? string : Widen<T[K]> }
export type Dict = Widen<typeof en> // English's keys, any string values

// locales/ar.ts — typed against Dict → TS enforces exact key parity (missing/extra key = error)
import type { Dict } from './en'
export const ar: Dict = { nav: { home: 'الرئيسية', settings: 'الإعدادات' }, cart: { title: 'سلتك' } }
```

Widen the leaves: `as const` makes each English string a literal type, so `Dict = typeof en` would demand `'Home'` and no translation would compile. Keep `as const` on `en` itself — the literals are what lets `t()` infer each message's `{placeholders}` as typed params.

Type `t()` with a recursive `Paths<Dict>` so `t('cart.title')` autocompletes and rejects typos — key-safety + autocomplete, no codegen. **Plural messages are objects keyed by CLDR category** (`{ one, other }`; Arabic adds `zero two few many`), and `Paths` stops at them: `t('files.uploaded', { count })` is a key, `t('files.uploaded.one')` isn't — only `t()` picks the branch, via `Intl.PluralRules`.

## Formatting = `Intl.*`

`Intl.PluralRules` (pick the `{one,few,many,other}` branch), `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.ListFormat`. Covers the vast majority of "ICU" needs with zero deps. For full ICU *string* syntax (nested select/gender), rent a formatter behind `t()`: `intl-messageformat` (MF1) or `messageformat` v4 (MF2). Don't hand-roll a parser.

## Loading

Lazy per-locale **and** per-namespace via dynamic `import()` — a route loads only its namespace's strings. Type the loaders through a map, never `(await import(path)).default as Dict`: the cast hides a wrong shape, or a named export read as `.default`:

```ts
const load = {
  en: () => import('./locales/en.ts').then((m) => m.en),
  ar: () => import('./locales/ar.ts').then((m) => m.ar),
} satisfies Record<Locale, () => Promise<Dict>> // one map per namespace when you split
```

## RTL

Set `document.documentElement.dir` from an **explicit** RTL set (`new Set(['ar','he','fa'])`), not `Intl.Locale.getTextInfo()` (Chromium-only, not Baseline). Layout already mirrors for free: **CSS logical properties / logical Tailwind (`ps-*`, `text-start`)** are the house styling default from day 1, enforced by lint (→ `design-system.md`) — not an i18n-time retrofit. If physical `left/right` snuck in somewhere, that's a lint gap to fix, not an RTL task. What RTL actually adds: the `dir` flip above, mirroring directional icons explicitly (`[dir=rtl] .chevron { transform: scaleX(-1) }`), and **isolating interpolated values** — `t()` wraps each in FSI…PDI (`⁨…⁩`) so an English filename inside an Arabic sentence keeps its order, and the reverse. They're characters, not `<bdi>`, so they hold in `aria-label`, `title` and toasts. User content rendered on its own gets `dir="auto"`.

## The one tradeoff

A dict is one object → **no per-message tree-shaking** (unused keys in a loaded namespace still ship). Namespace-splitting bounds the waste — enough for almost everything. If you reach a scale where per-message dead-code elimination genuinely moves the bundle, **Paraglide** (compiles each message to a tree-shakeable function) is the escape hatch: accept its compile step for that specific win, nothing smaller.
