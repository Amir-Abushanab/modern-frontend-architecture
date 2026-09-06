# Typography

The third token axis. Spacing and color are tokenized (`design-system.md`); type is the one that drifts silently, because nobody catches `0.72rem` against `0.75rem` in review.

## Scale

**Sizes are role-named tokens, never literals.** Same rule as spacing: `font-size: var(--text-sm)`, never `0.85rem`.

Untokenized type does not drift into a few wrong values, it drifts into a continuum. A mid-size site audited at 38 distinct sizes between 9px and 26px, 34 of them under 1px from a neighbour. At that density no value means anything and there is no right one to reach for, so every new component invents another.

- **9 to 13 role-named steps** (`2xs xs sm md base lg xl 2xl 3xl`), not a generated ratio ladder. A pure 1.2 ratio spends its steps where the product does not live.
- **Weight the dense end.** Most UI sits below 1rem (labels, meta, chips, badges). Give that range the most steps.
- **Fluid steps are `clamp()` tokens too.** Four near-identical hand-written clamps for one role is the same failure as four near-identical rem values.
- **Pick by role, not by pixel.** If a step looks 1px off, the fix is a different step. Adding one takes an argument that the existing steps cannot express.

## Tracking and leading

Both are functions of size and case, not free variables, so both get tokens: `--track-display` (large type needs pulling in), `--track-tight`, `--track-body` (0), `--track-label` (uppercase needs air), and `--leading-none` through `--leading-prose`.

**Headlines that wrap need their own leading step.** Display leading (~1.04) collides descenders against the next line's ascenders the moment the text takes two lines. Set it once, do not retune per component.

**Never duplicate a leading value in arithmetic.** A `min-height: calc(3 * 1.14em)` reserving space for a three-line headline drifts as soon as the line-height changes. Reference the token: `calc(3 * var(--leading-head) * 1em)`.

## The `em` carve-out

Context-relative sizes stay `em` and are exempt: inline `<code>` in prose, `<sup>`, a glyph sized against its button. They scale with their parent by design, and tokenizing them breaks that. This is the one allowlist a "no raw font-size" rule needs, and it is what keeps the rule honest.

## Font loading

**Self-host variable woff2 and `preload` the faces used above the fold.** Not Google Fonts: a third-party origin costs a connection, puts a render-blocking dependency outside your control, and has to be allowed in CSP. One variable file beats four static weights; subset to the axes and glyphs actually used. `font-display: swap`, never `block`.

**Metric-matched fallbacks, measured, not guessed.** Declare a fallback face wrapping a local system font and override its metrics so text occupies the same space before the webfont lands:

```css
@font-face {
  font-family: 'Brand Fallback';
  src: local('Arial');
  size-adjust: 103.06%;
  ascent-override: 97.52%;
  descent-override: 28.62%;
  line-gap-override: 0%;
}
```

- **Measure per font pair, off the real elements at their real settings.** Generated defaults get x-height close and advance width wrong, which is the one that matters: wrapping depends on advance width, and under `text-wrap: balance` a 1% error moves a line break and shifts the whole block.
- `local()` with no match drops the rule cleanly, so a machine without the system face falls through to the next family.
- Re-measure when either face changes. Stale metrics are worse than none, because they look deliberate.

**Do not reach for `font-size-adjust: from-font`.** It looks like the right lever and is not. It matches x-height while leaving advance widths alone, so text still rewraps, and it silently overrides `size-adjust` on the metric-matched faces above. It fails on real pages and works on a blank one, which makes it expensive to find.

## Variable font axes

`font-variation-settings` is a low-level escape hatch with two consequences:

- **It disables `font-optical-sizing: auto`.** Pinning `'opsz'` on an element sized by `clamp()` freezes optical size across the whole fluid range, defeating the axis.
- **It does not compose across the cascade.** A descendant setting one axis resets every other axis to the font's `fvar` defaults, which are frequently not what CSS would have resolved.

Prefer the high-level properties (`font-weight`, `font-optical-sizing`, `font-stretch`). Reach for `font-variation-settings` only for axes with no high-level equivalent, and set every axis you depend on in the same declaration.

## Hard rules

- **Inputs are at least 16px on phones.** Below that iOS zooms the page on focus. A gate, not a preference: assert it in the a11y suite.
- **`font-family` is always a token.** `var(--font-sans)`, never a literal stack outside the `@font-face` block and the theme file.

## Enforcement

Token-only type is script tier (grep, same as logical direction): components carry no raw `font-size`, `letter-spacing`, `line-height`, or `font-family`, with `em` allowlisted per the carve-out. Font loading is review tier. Per-rule table → `enforcement-map.md`.

Motion → `web-animation-design`. Platform CSS → `modern-web-guidance`.
