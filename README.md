<p align="center">
  <img src="assets/logo.webp" width="640" alt="modern-frontend-architecture — dashed blueprint boundaries draw in, then fill into a built UI" />
</p>

# modern-frontend-architecture

An **agent skill** that holds coding agents to one opinionated, type-safe, agent-first house standard for web frontends — stack, data, state, styling, security, logging, i18n, and deploy.

It's a *decision layer*, not a tutorial: a lean `SKILL.md` of blessed defaults that routes to focused references, and defers to companion skills for depth. Plain `SKILL.md` format — it works in any agent that loads skills (Claude Code, Cursor, OpenCode, …).

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

**Any agent** — via the [skills CLI](https://github.com/vercel-labs/skills):

```
npx skills add Amir-Abushanab/modern-frontend-architecture
```

**Claude Code** — as a plugin, via the [amir-skills marketplace](https://github.com/Amir-Abushanab/skills):

```
/plugin marketplace add Amir-Abushanab/skills
/plugin install modern-frontend-architecture@amir-skills
```

**Manually** — clone or symlink this repo into your agent's skills directory (`~/.claude/skills/`, `.agents/skills/`, …). `SKILL.md` at the root is the entry point.

## Companion skills

Depth is deferred, not duplicated. For full value, install alongside:

- **`modern-web-guidance`** — platform HTML/CSS/JS.
- **`web-animation-design`** — motion.
- **`vercel-composition-patterns`** — component composition depth.
- **`vercel-react-best-practices`** — React render/perf.

If a project is missing them, the skill degrades gracefully — it falls back to first principles instead of dead-ending.

## Structure

```
SKILL.md       # the lean router + defaults table
references/    # loaded on demand — stack-selection · data-and-typesafety · state
               # design-system · i18n-rtl · agent-first-factory · enforcement-map
               # security · logging
```

## Credits

The logging reference (`references/logging.md`) is inspired by a decade of experience, [the original list](https://x.com/FardeemM/status/2067802731960520909) from [Fardeem Munir](https://github.com/fardeem), and [Logging Sucks — Your Logs Are Lying To You](https://loggingsucks.com/) by [Boris Tane](https://boristane.com).

## License

MIT — see [LICENSE](./LICENSE).
