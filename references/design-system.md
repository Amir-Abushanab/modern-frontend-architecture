# Design System

Agent-first component system: agents compose from **typed, token-only primitives** — never raw elements, `className`, or arbitrary values. The rule that matters isn't a doc; wrong states are *un-expressible* (typed props) and caught by lint. Architecture-based constraint, not hope-based compliance.

## Headless layer

Default to **Base UI** (MUI team; actively maintained — Radix slowed after the WorkOS acquisition) for behavior: menus, dialogs, popovers, toolbars, tables. Consume it via **shadcn's copy-paste** model so you *own* the code and can conform it to the house rules below. Radix / React Aria are fine alternatives — Base UI is the current best default. Never hand-roll ARIA / roving-tabindex.

shadcn ships Tailwind + `className`; when you copy a component in, **strip the `className` surface and re-express variance as props** (below). Owning the code is what makes that possible.

## Layout = one token-only primitive

A polymorphic `Box` is the layout primitive (Orbit-style — polar.sh/blog/orbit-llm-safe-design-system). Props accept **design tokens only**, never arbitrary strings/px/hex:

```tsx
<Box as="section" flexDirection="column" gap="l" padding="m"
     background="surface-card" borderRadius="m" />
```

- **`as`** is a *closed set* of elements (`div`/`section`/`nav`/`ul`/…) — semantics without an open escape hatch. No raw `<div>` in app code.
- **Spacing is intent-named, not pixels:** `xs s m l xl 2xl 3xl 4xl 5xl`. `gap="l"`, never `gap={16}`.
- **Colors are semantic tokens** bundling light/dark via `light-dark(...)`: `surface-card`, `text-primary`, `border-primary`. An agent can't ship something right in light and broken in dark.
- **Direction is logical, never physical — day 1, not at i18n time.** Directional props and internal Tailwind are start/end (`paddingStart`, `ps-*`, `ms-*`, `text-start`, `start-0`, `rounded-s-*`, `border-s`), never left/right — they compile to CSS logical properties, so RTL later is `dir="rtl"` + icon flips, not a grep-and-pray migration (→ `i18n-rtl.md`). Physical variants (`pl-*`, `ml-*`, `text-left`, `left-0`) are lint-banned in app code and component internals alike; physical is legitimate only for geometry that ignores reading direction (pointer/drag coordinates, maps, `scaleX` transforms).
- **Two tiers, and only the semantic tier is public.** Primitive/palette tokens (`blue-500`, `gray-100`) exist *only inside the theme file*, where semantic tokens alias them. Component props expose the semantic names alone — `background="blue-500"` fails `tsc` because it isn't in the union. That's what keeps re-theming and dark mode one-edit operations: meaning lives in the component, the palette lives in one file.
- `Row` / `Stack` / `Grid` are thin presets over `Box` (fixed `flexDirection`) for ergonomics.

## Components

- **No `className` prop.** Variance is **typed variant props** (`variant`/`size`); each component owns its Tailwind internally (CVA is fine *inside*).
- **Rows of actions = data-driven `ButtonList`,** not hand-assembled JSX:

```tsx
type Action = Omit<ButtonProps, 'children' | 'size'> & { label: string }
function ButtonList({ actions, size }: { actions: Action[]; size?: ButtonSize }) {
  return <Row gap="s">{actions.map(a => <Button key={a.label} size={size} {...a}>{a.label}</Button>)}</Row>
}
```

- **Semantic tokens, not values,** everywhere — no raw hex/px *and no palette primitives* in components; one token edit re-themes everything (dark mode, per-tenant).

## Forms

**TanStack Form** (headless, typed) for form state; **zod** for the schema — the *same* schema that types the oRPC input, so client validation and wire types can't drift. Forms obey the same rules as every other component: fields are **house `Field` primitives** (token-only props, no `className`), never raw `<input>`; variance via props.

- **One schema, two jobs.** `const input = z.object({…})` types the oRPC procedure *and* validates the form (`validators: { onSubmit: input }`). Never re-declare the form's shape by hand.
- **Submit rides the data seam.** On submit, call the collection's optimistic write (or the oRPC mutation for a one-shot) — the form doesn't own server state, the collection does. Success/rollback come from there, not from bespoke form state.
- **Fields are primitives.** `<Field name="email">` wrapping token-only inputs; label / error / description are slots, not ad-hoc markup. The design-system rules don't stop at forms.

Never reach for react-hook-form / Formik — TanStack Form is headless, typed, and on-stack. Bare `FormData` is fine only for a trivial, uncontrolled single-field case, not for anything validated or multi-step.

## Enforcement (see `agent-first-factory.md`)

Primary: **types** — token-only prop unions fail `tsc`. Secondary: **lint** — `react/forbid-elements` bans raw elements (rule off inside the primitives dir, where they belong). What lint can't see (palette classes, raw hex, physical `pl-*`/`text-left`) is a rule-script; `unsafeClassName` is ratchet-counted. Per-rule table → `enforcement-map.md`. Accessibility rides the same gate: Base UI owns the ARIA/behavior, and oxlint's **`jsx-a11y`** set (enabled in `agent-first-factory.md`) catches what slips through — missing `alt`, non-interactive click handlers, broken label associations. Docs are hope; types + lint are the contract.

Composition depth (compound components, slots) → `vercel-composition-patterns`. Motion → `web-animation-design`. XSS sinks (`dangerouslySetInnerHTML`, unsafe URLs) → `security.md` — banned by lint; untrusted HTML/URLs flow through sanitized `<Prose>` / `sanitizeUrl` primitives (the same un-expressible-wrong-state constraint as token-only `Box`).
