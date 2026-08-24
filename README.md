<p align="center">
  <img src="assets/logo.webp" width="640" alt="modern-frontend-architecture — dashed blueprint boundaries draw in, then fill into a built UI" />
</p>

# modern-frontend-architecture

A Claude Code **skill** that steers agents to architect a modern web frontend to one opinionated, type-safe, agent-first house standard — stack, data, state, styling, security, logging, i18n, and deploy.

It's a *decision layer*, not a tutorial: a lean `SKILL.md` of blessed defaults that routes to focused references, and defers to other skills (`modern-web-guidance`, `vercel-composition-patterns`, `vercel-react-best-practices`) for depth.

## The one principle

> **Establish the boundary on day 1; defer the implementation.**

Day-1 decisions are cheap, reversible *boundary* choices — never premature infrastructure. It's what makes "architect for scale from day 1" and "don't over-engineer" the same instruction.

## The stance (excerpt)

| Decision | Use | Not |
|---|---|---|
| Web stack | TanStack Start (default; SSR+SSG) · Astro only if super-SEO/content-only | Next.js |
| Deploy | Cloudflare · self-host | Vercel |
| Wire types | oRPC + zod | tRPC · hand-typed |
| Server data | oRPC → TanStack Query → TanStack DB collection | raw Query + hand-rolled optimism |
| Styling | design-system primitives · variant props | `className` on components |
| i18n | typed dict (`as const` + `Paths<T>`) + `Intl.*` | i18next · Lingui |

Full table + reasoning in [`SKILL.md`](./SKILL.md). Toolchain: pnpm + catalogs, oxc, TS 7, React Compiler, knip + dependency-cruiser, bulletproof-react.

Reference implementation of the patterns: [`ultimate-ts-starter`](https://github.com/Amir-Abushanab/ultimate-ts-starter).

## Install

**As a plugin** (once this repo is pushed to a git host):

```
/plugin marketplace add Amir-Abushanab/modern-frontend-architecture
/plugin install modern-frontend-architecture@amir-skills
```

**Via the [skills CLI](https://github.com/vercel-labs/skills)** (cross-agent — Claude Code, Cursor, OpenCode, …):

```
npx skills add Amir-Abushanab/modern-frontend-architecture
```

**Local dev (symlink):**

```
ln -s "$PWD" ~/.claude/skills/modern-frontend-architecture
```

The `.claude-plugin/plugin.json` makes the symlinked folder load as a skills-directory plugin.

## Companion skills

This skill *defers* depth rather than duplicating it. For full value, install alongside:

- **`modern-web-guidance`** — platform HTML/CSS/JS (usually already user-global).
- **`web-animation-design`** — motion.
- **`vercel-composition-patterns`** — component composition depth.
- **`vercel-react-best-practices`** — React render/perf.

The two `vercel-*` are project-scoped in this setup (APM-managed under `.agents/skills/`), not user-global. If a project doesn't have them, the skill degrades gracefully — it falls back to `modern-web-guidance` + first principles instead of dead-ending.

## Structure

```
SKILL.md                     # the lean router + defaults table
references/                  # loaded on demand
  stack-selection.md · data-and-typesafety.md · state.md
  design-system.md · i18n-rtl.md · agent-first-factory.md
  security.md · logging.md
.claude-plugin/              # distribution manifests (plugin + marketplace)
assets/                      # logo.webp + its generator (logo.gen.mjs)
```

## Credits

The logging reference (`references/logging.md`) is inspired by a decade of experience, [the original list](https://x.com/FardeemM/status/2067802731960520909) from [Fardeem Munir](https://github.com/fardeem), and [Logging Sucks — Your Logs Are Lying To You](https://loggingsucks.com/) by [Boris Tane](https://boristane.com).

## Status

v0.1, web-first.

## License

MIT — see [LICENSE](./LICENSE).
