# Enforcement Map

Every default in `SKILL.md` maps to the mechanism that makes violating it fail (the Polar pattern: rules as lint in CI, not English — polar.sh/blog/orbit-llm-safe-design-system). No enforcer = aspiration. The table says which is which.

## Tiers, strongest first

1. **types** — wrong state unrepresentable
2. **lint** — oxlint, error-only
3. **boundaries** — knip, dependency-cruiser
4. **config** — binds every install (`minimumReleaseAge`, frozen lockfile)
5. **script** — greppable but not lintable: `scripts/check-*.ts` in `pnpm check`; brownfield version is a **ratchet** (below)
6. **review** — no mechanism yet; listed, not hidden

Push each rule as high as it goes; promote when a mechanism appears.

## Map

| Default | Tier | Mechanism |
|---|---|---|
| pnpm / configured Bun | config + script | `packageManager` field · `preinstall` guard (`only-allow pnpm`) |
| Dep cooldown | config | `minimumReleaseAge` · CI `--frozen-lockfile` · `allowBuilds` |
| TS strict | types | tsconfig flags; `tsc --noEmit` in the gate |
| No hand-typed wire types | types | client types inferred from the router — a copy has nowhere to live |
| No manual memoization | lint | `no-restricted-imports`: `useMemo`/`useCallback`/`memo` from `react` |
| No `isPending` plumbing | lint (partial) | `no-restricted-imports`: `useQuery` → `useSuspenseQuery` / collections |
| No raw layout elements | lint | `react/forbid-elements` (`div`, `section`, `span`…) with message → `Box`/`Row`/`Stack`; rule off inside `src/shared/ui/**` |
| Token-only color | types + script | prop unions; `check-tokens` bans palette classes (`bg-teal-600`), `bg-white`/`text-black`, raw `#hex`/`rgb()`/`oklch()`, raw channel bytes (PDF/canvas) |
| No arbitrary values (`[400px]`) | script | grep `className` for `[…]` |
| Token-only type | script | grep components for raw `font-size`/`letter-spacing`/`line-height`/`font-family`; `em` allowlisted (context-relative: inline `code`, `sup`) |
| Font loading | review | self-hosted variable woff2 · `preload` above-the-fold faces · fallback metrics measured per pair, not generated |
| Logical direction only | script | grep `pl-`/`ml-`/`text-left`/`left-0`/`margin-left`… (no oxlint Tailwind plugin) |
| `unsafeClassName` bounded | ratchet | budget count |
| Forms on-stack | lint | `no-restricted-imports`: `react-hook-form`, `formik` |
| a11y | lint | `jsx-a11y` set |
| Security set | lint + script | `react/no-danger` · `jsx-no-script-url` · `no-restricted-properties` on `process.env` · CI grep for `import.meta.env` → `security.md` |
| Structure | boundaries | knip · depcruise (`app → features → components/lib`) |
| i18n key parity | types | `export const ar: Dict` |
| Wide-event logging | lint (partial) | `no-console` error in `server/**`, allowed only in the logger module; one-event-per-request stays review |
| Hooks ↔ CI no drift | construction | both run the same `pnpm check` |
| Loader/component single query def | construction | collection / route `context()` → `data-and-typesafety.md` |
| State ladder · realtime choice | review | judgment; no gate |

## Ratchet

Brownfield can't ban day 1. Instead: committed budgets `{ label, max, pattern, exempt, fix }` in a ~60-line no-dep script — fail when the count exceeds `max`, lower `max` when you convert (the failure prints the new number), never raise it. Greenfield: `max: 0` is a ban. Exempt `src/shared/ui/**` — raw elements inside a primitive are the point of the primitive. `fix` says what to write instead, so an agent hitting the gate self-corrects.

## Wiring

Scripts run inside `pnpm check` (stage order → `agent-first-factory.md`). A new default lands with its row here — enforcer or `review`. Drift = a rule whose enforcer went missing; diff this table to notice.
