# Stack Selection

Day-1 skeleton. Decide in this order — deploy target first, because it cascades.

## 1. Deploy target (decide first)

| Target | When | Cascades to |
|---|---|---|
| **Cloudflare** (default) | almost always | Workers + Durable Objects (realtime) · `vite-plus`/`vp` · edge KV/D1/R2 |
| **Self-host** (first-class) | data residency · cost control · no-edge constraint | **Bun** (preferred) · Deno · Node — in Docker · ws + Redis, or Bun's built-in WebSocket · own object store |

Never Vercel. Realtime transport, some tooling (`vp`), and edge features all follow from this choice.

## 2. Framework

**Default: TanStack Start** + React 19 + React Compiler. It does SSR *and* SSG, so one codebase covers the app *and* its marketing/content pages — typed router, loaders, the whole TanStack stack.

Reach for **Astro** only when a site is **super-SEO-critical** (content-heavy, near-zero-JS actually matters) **or will never grow an app** (pure content / marketing / docs). For a mixed site that has or might get an app, one TanStack Start app beats an Astro + Start split — don't split prematurely; Astro isn't worth it otherwise.

Never Next.js — it couples rendering to its model and pulls you onto Vercel; a SPA on Next is pure overhead.

## 3. Monorepo

pnpm workspaces, plain (no Nx/Turbo). `apps/*` + `packages/*`. Pin dependency versions with pnpm **catalogs** in `pnpm-workspace.yaml`; pin pnpm itself via `packageManager`. Node 24+.

pnpm 11 blocks dependency build scripts by default — allow the few you need under `allowBuilds:` in `pnpm-workspace.yaml` (e.g. `esbuild`, `sharp`).

## 4. Toolchain

- **Lint + format: oxc** (oxlint + oxfmt), **error-only**, no warnings. Over Biome/ESLint because it's Rust-fast *and* doesn't consume the TypeScript compiler API — so it runs on **TS 7** today (typescript-eslint can't until 7.1, ~Oct 2026).
- **Types: TypeScript 7** native `tsc`, `strict` + `noUncheckedIndexedAccess` + `noUnusedLocals`/`noUnusedParameters` + `verbatimModuleSyntax`. `tsc --noEmit` is a CI gate, separate from the build.
- Cloudflare: build via `vite-plus` (`vp`). Off Cloudflare: plain Vite.

## 5. Repo skeleton

bulletproof-react: `src/app` (routes) · `src/features/<feature>/{components,api,hooks,stores,types}` · `src/components` (shared) · `src/lib`. Enforcement (knip + dependency-cruiser) → `agent-first-factory.md`.

## Day-1 also

Typed env (zod-validated, single read site — client-bundle secret boundary in `security.md`) · Better Auth · Vitest + Testing Library + MSW · Playwright e2e · git hooks running the gate · CSP + security headers day 1 (`security.md`).

## Already on another stack? (brownfield)

The deploy cascade and framework picks are *day-1* calls. When you inherit a codebase, the seam matters more than the label — see the "Brownfield & hard constraints" note in `SKILL.md` for the general rule; specifics:

- **On Next.js:** don't migrate for conformance. Keep the portable seams *inside* it — oRPC (runs in route handlers), Query-backed collections, token-only components, typed search params. Move off only at a real greenfield boundary (a new app in the monorepo, a major rewrite), or when App-Router / Server-Component coupling imposes a concrete cost you can name.
- **On Vercel:** the realtime cascade is the forcing function — long-lived sockets don't fit serverless. Put realtime (and any Durable-Object-shaped state) on a small Cloudflare Worker or a stateful host *beside* the Vercel app rather than rewriting the deploy. Reassess the host at the next greenfield boundary.
- **Migrate incrementally.** Strangler pattern: new features on the house stack, existing ones ported only when already being touched. A big-bang migration is almost never justified by architecture non-conformance alone.
