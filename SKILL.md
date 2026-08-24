---
name: modern-frontend-architecture
description: Use when starting, scaffolding, or reviewing the architecture of a web frontend, or making any frontend architecture decision — framework/stack choice, client-server data, state management, routing/URL state, styling and design systems, i18n/RTL, server-side logging/observability, or deploy target. Triggers on new web-app setup, "which library/framework should I use", data fetching and mutations, global vs local state, component and design-system design, internationalization, and Cloudflare/self-host/Vercel deploy questions.
---

# Modern Frontend Architecture

House standard for web frontends. Take the `Use` default; open the reference for how + why.

**Guiding rule:** establish the boundary on day 1, defer the implementation. Default to the collection seam — don't build Electric. Pick the realtime transport — don't build the system.

**Current best, not eternal truth — last reviewed 2026-08-24.** The *boundaries* (the decisions and seams) below are durable; the *named tools and versions* filling them are the current best as of that review. If today's date is well past it, treat specific tool/version picks as possibly superseded — keep the decision, re-verify what best fills it now. This is the guiding rule applied to the skill itself: the seam is the commitment, the tool is the implementation.

**Defer, don't duplicate:** platform HTML/CSS/JS → `modern-web-guidance` · composition → `vercel-composition-patterns` · React perf → `vercel-react-best-practices` · motion → `web-animation-design`. The two `vercel-*` are companion skills — install them alongside this one (see README); if a target project doesn't have them, fall back to `modern-web-guidance` + first principles, don't inline their depth here.

**Reference implementation:** `ultimate-ts-starter` (`github.com/Amir-Abushanab/ultimate-ts-starter`) — copy patterns from it.

## Defaults

| Decision | Use | Not | Why (when non-obvious) |
|---|---|---|---|
| Package manager | pnpm + catalogs | npm / yarn | |
| Web stack | TanStack Start (default; SSR+SSG) · Astro only if super-SEO-critical or content-only | Next.js · Astro/split by default | one Start app covers mixed sites; reach for Astro only when SEO is paramount; Next couples rendering to its model + Vercel |
| Deploy | Cloudflare · self-host (first-class) | Vercel | |
| Lint / format | oxc (oxlint + oxfmt), error-only | ESLint+Prettier · Biome | Rust-fast *and* skips the TS compiler API, so TS 7 works today |
| Types | TS 7 native `tsc`, strict + `noUncheckedIndexedAccess` | TS 6 · loose | |
| Wire types | oRPC + zod | tRPC · hand-typed | OpenAPI-compatible, edge-agnostic |
| Server data | oRPC → TanStack Query → TanStack DB collection (`useLiveQuery`, optimistic) | raw Query for entity data · hand-rolled cache writes | collection gives optimistic+rollback and the sync seam free — deletes ~80 lines |
| Loading / error | Suspense + ErrorBoundary | `isPending` / `isError` plumbing | |
| Memoization | React Compiler | manual `useMemo` / `useCallback` | |
| Client state | collection → zustand / xstate-store → XState | Context/`useEffect` webs · a hand-rolled FSM that keeps growing | small flat FSM is fine; hierarchy/parallelism/coordinating actors = reach for XState |
| URL state | typed search params (TanStack Router + zod) · loaders · drawers-as-routes | untyped `useSearchParams` | |
| Realtime | day-1 transport by deploy: CF → Durable Objects · self-host → ws + Redis | ad-hoc socket per feature · sockets on serverless | |
| Forms | TanStack Form + zod (reuse the wire schema) → submit via the collection / oRPC mutation | react-hook-form · Formik · bare `FormData` for anything nontrivial | headless + typed; the zod input schema is shared with oRPC, so validation and wire types can't drift |
| Styling | Base UI (shadcn copy-paste) → house primitives · semantic-token-only props | `className` · raw Tailwind · arbitrary px/hex · palette primitives (`blue-500`) in components | layout via token-only `Box`/`Row`/`Stack`; palette lives in the theme file only; variance via props; rows via `ButtonList` |
| Structure | bulletproof-react, enforced by knip + dependency-cruiser | unenforced folders | gates are not optional |
| Git hooks & checks | one `pnpm check` (+ `pnpm fix`); `.githooks` simple · lefthook complex; pre-commit autofix on staged · pre-push + CI full gate | husky · everything in pre-commit · hook↔CI drift | one script = source of truth, CI authoritative (hooks bypassable); lefthook is parallel + one YAML |
| Dep updates | pnpm `minimumReleaseAge: 10080` (7d, the enforced gate) + ncu cooldown in `.ncurc.json` | bare `--cooldown` flag · adopting versions published hours ago | `minimumReleaseAge` enforces on every install incl. transitive; ncu is advisory (config covers bare `ncu` too) |
| Security · headers/CSP | nonce CSP (TanStack `ssr.nonce`, ≥1.133.12) + header bundle in one Worker middleware | `unsafe-inline` · no CSP · `COOP: same-origin` · HSTS `preload` on day 1 | day-1 boundary, painful to retrofit; framework ships nonce support |
| Security · app | secrets server-only (never module-scope / `VITE_`) · Origin-check non-GET oRPC mutations · sanitize HTML Worker-safe (not DOMPurify) · ban `dangerouslySetInnerHTML` | trusting Better Auth's CSRF for the oRPC API · DOMPurify in a Worker · secrets at module scope | Better Auth guards only its own routes; React escaping misses the sinks |
| Logging (server fns / API routes) | one **wide event** per request — structured canonical log line, built in middleware, emitted once | scattered `console.log` breadcrumbs · one line per step · unstructured strings | queryable high-cardinality record; breadcrumbs can't answer questions you didn't pre-write |
| Client telemetry (not day-1 — add when needed) | typed `track()` → batched `fetch` keepalive → first-party Worker ingest → same sinks as server logging | OTel browser SDK day 1 · vendor RUM snippet · `sendBeacon` | server logging first; when real-user perf/error questions land, this shape is cheap to add late |
| i18n / RTL | typed dict (`as const` + `Paths<T>`) + `Intl.*` · lazy `import()` · RTL via `dir` + logical properties | i18next · Lingui | key-safety + autocomplete, zero build step; Paraglide only if per-message tree-shaking matters |

## References

| For… | Read |
|---|---|
| stack · deploy · toolchain · repo skeleton | `references/stack-selection.md` |
| data · URL state · realtime | `references/data-and-typesafety.md` |
| where state lives | `references/state.md` |
| components · design system | `references/design-system.md` |
| internationalization | `references/i18n-rtl.md` |
| CI gates · git hooks · supply-chain · enforcement · the factory | `references/agent-first-factory.md` |
| runtime security · CSP · headers · secrets · CSRF · XSS | `references/security.md` |
| server-side logging · wide events · client telemetry · sampling | `references/logging.md` |

## Brownfield & hard constraints

These are day-1 **greenfield** defaults. On an existing codebase, or when a real constraint (client mandate, an existing Next/Vercel app, the team's skill set) rules out the house choice:

- **Adopt the seam, not necessarily the tool.** The durable value is the *boundaries* — typed wire boundary, the collection/store seam, one realtime transport, token-only components. Most are portable onto another stack; take the seam even where the tool differs.
- **Non-conformance isn't a reason to migrate.** A rewrite is justified by a concrete cost the current choice imposes, not by "it's not the table." Match the default on *new* surfaces; migrate an existing one only when it's already being changed for another reason (strangler, not big-bang).
- **The "Never"s are day-1 defaults, not migration mandates.** Already on Next.js/Vercel and it works? Don't rip it out — adopt the portable seams now, reach for the house stack at the next greenfield boundary (new app, major rewrite). Migration specifics → `references/stack-selection.md`.
