# Agent-First Factory

"Build the factory so it can efficiently build the thing." One blessed pattern per job, and gates that make wrong states fail loudly.

## The gate — one command, three stages

**Define the checks once as pnpm scripts; hooks and CI both call those scripts** — so "what runs locally" and "what runs in CI" can't drift. Two scripts:

- `pnpm fix` — the autofixers (they write): `oxlint --fix` + `oxfmt`.
- `pnpm check` — the gate (no writes), error-only, zero warnings:

```
oxlint            # lint (errors only)
oxfmt --check     # format
tsc --noEmit      # TS 7 types
knip              # unused files, deps, exports
depcruise         # import-boundary rules
vitest run        # unit / component
```

Run it by **cost**, not all-at-once:

| Stage | Runs | Why |
|---|---|---|
| **pre-commit** | `oxlint --fix` + `oxfmt` on **staged files**, then re-stage | fast — keeps commits painless; no types/tests/knip here |
| **pre-push** | full `pnpm check` | the heavy checks (types, knip, boundaries, tests) before code leaves your machine |
| **CI** | full `pnpm check` | **authoritative** — hooks are bypassable (`--no-verify`), CI is not |

CI is the source of truth; the hooks are just its fast local mirror.

- **oxlint rule sets** — beyond the defaults, enable **`jsx-a11y`** (accessibility as a gate, not a hope — missing `alt`, click-without-keyboard, bad ARIA all fail the build) and the security set from `security.md`. Error-only, like everything else.
- **knip** — deletes creep: unused files, dependencies, exports. Redundancy is a bug.
- **dependency-cruiser** — enforces the bulletproof-react boundaries: features can't import each other's internals; direction is `app → features → components/lib` only (no upward or sideways reaching). This is what stops structure rotting into vibes.

### Git-hook tool

- **Simple** (a script or two): **native `.githooks/`** — commit the dir, point git at it with `git config core.hooksPath .githooks` (wire that into a `prepare` script so it's zero-install). No dependency.
- **Complex** (parallel tasks, staged-file globbing, per-language, a team): **lefthook**, not husky. lefthook is a single Go binary — parallel hooks, one declarative `lefthook.yml`, built-in `{staged_files}` globbing — matching the house's fast-native-tooling bias (oxc, TS 7). husky is a shell script *per hook*, sequential, with config that churns across majors.

## Dependency hygiene (supply chain)

Two cooldown layers — don't run code a stranger published an hour ago — and they are *not* equally binding:

- **Install-time — pnpm `minimumReleaseAge` (the enforced gate).** In `pnpm-workspace.yaml`, `minimumReleaseAge: 10080` (7 days, in minutes). pnpm refuses to install *any* version — **including transitive deps** — published less than 7 days ago, the window in which most compromised packages get caught and yanked. Enforced on every install and in CI, impossible to forget. pnpm 11 already defaults it to `1440` (1 day); raise it to 7. `minimumReleaseAgeExclude: [pkg]` for the rare thing you must take immediately.
- **Update-time — ncu, in a committed `.ncurc.json` (advisory).** Put `cooldown: 7` (plus `target`, `packageManager: pnpm`, and any version pins) in `.ncurc.json` — **not a bare `--cooldown` flag**. The file also governs a bare `ncu` / `ncu -u` (an agent that skips your pnpm script still gets the cooldown) and scales as ncu settings accumulate; wrap it in a pnpm script (`"deps": "ncu"`) for discoverability too — belt and suspenders. ncu then won't *propose* a version younger than 7 days; `--format cooldown` lists the skips. Reach for `.ncurc.js` only when you need per-package predicate functions (JSON/CLI can't express those). CLI flags override the file.

**Which layer does the work:** ncu is proposal-time — skippable, overridable, and it only decides what to *suggest*. `minimumReleaseAge` is the wall: enforced on every install, transitively, in CI. The `.ncurc.json` upgrade just hardens the advisory half; your actual solidity comes from the pnpm layer.

Already supply-chain controls elsewhere in the stack, named here so they aren't forgotten: the **`allowBuilds` allow-list** (pnpm blocks arbitrary install/postinstall scripts by default — opt in per package), a **frozen lockfile in CI** (`--frozen-lockfile`, for byte-identical, tamper-evident installs), and **`pnpm audit`** as a gate signal.

*(Runtime security — CSP, headers, the secret boundary, CSRF, XSS sinks — now lives in `references/security.md`; its lint set (`react/no-danger`, `react/jsx-no-script-url`, `eslint/no-script-url`, `no-restricted-properties`) runs in this gate. Supply-chain stays here.)*

## Single source of truth — right tool per layer

There is no one tool that packages skills + MCP *and* preserves conditional (glob-scoped) rules. Split the harness by layer:

**Skills + MCP → APM** ([Agent Package Manager](https://github.com/microsoft/apm)). Declare each in one `apm.yml`; `apm install` resolves the tree (incl. transitive deps), fans skills and MCP servers out to every target's native config, and pins them in `apm.lock.yaml` for byte-identical installs. This replaces a home-grown skills lockfile and a scattered per-agent `.mcp.json`. Authoring skills → `superpowers:writing-skills`.

**Rules → the richest native conditional format, fanned outward.** Do NOT route rules through APM (or ruler) — both *flatten* every rule into one always-on file per agent, discarding glob-scoping. That regresses agents that support conditional loading (Claude `.claude/rules/`, Cursor `.cursor/rules/*.mdc`, Copilot `applyTo`). Author rules once in that conditional format, and fan *out* — never let rules originate in a lowest-common-denominator packager. Conditional agents get scoped `.mdc`/globs; flat agents (Codex, Gemini, AGENTS.md) get the concatenated set. A ~40-line generator over your rule dir does this and stays pnpm-native (it replaces the old `cp CLAUDE.md → AGENTS.md` hack).

APM gotchas worth knowing up front:
- **APM is a standalone binary** (`brew install microsoft/apm/apm`), not an npm package — you can't `pnpm add -D` it. Wrap it in a pnpm script (`"agents": "apm install"`, and `apm install --frozen` in `prepare` behind a `command -v apm` guard) so it stays pnpm-invoked without being a node dep.
- **Custom (non-registry) MCP servers need `registry: false`** in `apm.yml` alongside their `transport`/`command`/`url` — otherwise APM does a registry lookup by name and fails. Easiest is to let `apm mcp install <name> --transport … --url …` write the entry for you.

## Releases

changesets for versioning + changelogs.

## Principle

Every recurring decision an agent would otherwise re-litigate becomes a lint rule, a boundary rule, a primitive, or a copy-paste-able pattern in `ultimate-ts-starter`. Consistency is a tooling property, not a matter of discipline.
