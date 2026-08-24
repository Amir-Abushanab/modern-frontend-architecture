# i18n & RTL

Default: a **typed hand-rolled dictionary** — key-safety, autocomplete, zero build step. No i18next/Lingui.

## The dict

```ts
// locales/en.ts — source of truth
export const en = {
  nav: { home: 'Home', settings: 'Settings' },
  cart: { title: 'Your cart' },
} as const
export type Dict = typeof en

// locales/ar.ts — typed against Dict → TS enforces exact key parity (missing/extra key = error)
import type { Dict } from './en'
export const ar: Dict = { nav: { home: 'الرئيسية', settings: 'الإعدادات' }, cart: { title: 'سلتك' } }
```

Type `t()` with a recursive `Paths<Dict>` so `t('cart.title')` autocompletes and rejects typos — key-safety + autocomplete, no codegen.

## Formatting = `Intl.*`

`Intl.PluralRules` (pick the `{one,few,many,other}` branch), `Intl.NumberFormat`, `Intl.DateTimeFormat`, `Intl.RelativeTimeFormat`, `Intl.ListFormat`. Covers the vast majority of "ICU" needs with zero deps. For full ICU *string* syntax (nested select/gender), rent a formatter behind `t()`: `intl-messageformat` (MF1) or `messageformat` v4 (MF2). Don't hand-roll a parser.

## Loading

Lazy per-locale **and** per-namespace via dynamic `import()` — a route loads only its namespace's strings:

```ts
const dict = (await import(`./locales/${locale}/${ns}.ts`)).default as Dict
```

## RTL

Set `document.documentElement.dir` from an **explicit** RTL set (`new Set(['ar','he','fa'])`), not `Intl.Locale.getTextInfo()` (Chromium-only, not Baseline). Author layout with **CSS logical properties** (`margin-inline`, `inset-inline-start`, `text-align: start`) so the UI mirrors for free. Mirror directional icons explicitly (`[dir=rtl] .chevron { transform: scaleX(-1) }`).

## The one tradeoff

A dict is one object → **no per-message tree-shaking** (unused keys in a loaded namespace still ship). Namespace-splitting bounds the waste — enough for almost everything. If you reach a scale where per-message dead-code elimination genuinely moves the bundle, **Paraglide** (compiles each message to a tree-shakeable function) is the escape hatch: accept its compile step for that specific win, nothing smaller.
