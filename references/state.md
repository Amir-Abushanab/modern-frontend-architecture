# State

Most "state" is server data — put it in a collection (`data-and-typesafety.md`), not a store. What's left:

| State | Use |
|---|---|
| Server-derived / shared entities | TanStack DB collection (`useLiveQuery`) |
| Client-only global (debug/feature flags, ephemeral UI) | zustand or xstate-store — not Context |
| Complex interactive (interdependent transitions, hierarchy/parallelism, coordinating actors; "music playing while navigating") | **XState** statechart |

- **React Compiler is on** → no manual `useMemo`/`useCallback`. Don't add them.
- **The XState threshold (not a hair-trigger):** a small, flat FSM — a handful of states, one controller — is *fine* hand-rolled; agents write clean ones, so don't reach for the dependency reflexively. Cross to XState when it outgrows that: hierarchical/parallel states, guards/actions multiplying, several machines coordinating (actors), or you want the statechart's devtools/visualization. **Signal:** you're hand-maintaining a transition table that keeps gaining branches, or wiring multiple machines together — that's reinvented XState; adopt it for the statechart, guards/actions, actor model, devtools, and visualization.
- Context is fine for low-frequency, genuinely tree-scoped values (theme, current user). Not for app state, and not as a store to dodge zustand.

Render/re-render performance → defer to `vercel-react-best-practices`.
