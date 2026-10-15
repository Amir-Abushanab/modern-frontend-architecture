# State

Most "state" is server data — put it in a collection (`data-and-typesafety.md`), not a store. What's left:

| State | Use |
|---|---|
| Server-derived / shared entities | TanStack DB collection (`useLiveQuery`) |
| Client-only global (debug/feature flags, ephemeral UI) | zustand or xstate-store — not Context |
| Complex interactive (interdependent transitions, hierarchy/parallelism, coordinating actors; "music playing while navigating") | **XState** statechart |
| Persisted across sessions (preferences, layout, drafts) | one `persisted(key, schema, defaults)` helper over `localStorage` — never raw storage calls |

**Persisted state is untrusted input.** An older build, a newer build, another tab or a crash mid-write may have produced it. The helper:
- validates every read with zod, with `.catch()` per field, so one bad field can't wipe the rest;
- stores a `{ v, data }` envelope with chained migrations; never edit a migration that has shipped;
- falls back to defaults for data written by a newer build;
- quarantines bad data under a side key instead of deleting it;
- syncs across tabs through the `storage` event.

First-paint state (theme, sidebar open) lives in a cookie the server reads; localStorage isn't visible during SSR. Lint bans `localStorage`/`sessionStorage` outside the helper (`enforcement-map.md`).

- **React Compiler is on** → no manual `useMemo`/`useCallback`. Don't add them.
- **The XState threshold (not a hair-trigger):** a small, flat FSM — a handful of states, one controller — is *fine* hand-rolled; agents write clean ones, so don't reach for the dependency reflexively. Cross to XState when it outgrows that: hierarchical/parallel states, guards/actions multiplying, several machines coordinating (actors), or you want the statechart's devtools/visualization. **Signal:** you're hand-maintaining a transition table that keeps gaining branches, or wiring multiple machines together — that's reinvented XState; adopt it for the statechart, guards/actions, actor model, devtools, and visualization.
- Context is fine for low-frequency, genuinely tree-scoped values (theme, current user). Not for app state, and not as a store to dodge zustand.
- **No effect webs.** `useEffect` that fetches, or copies one piece of state into another, is the anti-pattern this ladder replaces. Fetching goes through collections or `useSuspenseQuery`, derived values are computed in render, and user-caused logic lives in the event handler. Effects are for syncing with something outside React (DOM, subscriptions, `useSyncExternalStore`). Lint restricts `useEffect` in `src/features/**`; a disable comment must say why.

Render/re-render performance → defer to `vercel-react-best-practices`.
