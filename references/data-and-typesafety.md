# Data, URL State & Realtime

- The data stack (oRPC → Query → TanStack DB collections)
- Collections vs plain Query (the over-engineering guard)
- Loading & errors
- URL state
- Prefetching (route loaders)
- Realtime (follows deploy target)
- Sync / offline

## The data stack

```
oRPC (typed transport) → TanStack Query (sync) → TanStack DB collection (reactive store) → components (useLiveQuery)
```

- **oRPC + zod** for the client↔server boundary — end-to-end inferred types, no codegen. Over tRPC because oRPC is OpenAPI-compatible and framework/edge-agnostic (fits Cloudflare and non-TS consumers). Never hand-type backend types.
- **TanStack Query** is the sync primitive, mostly *under* collections. Direct use only for one-shot/imperative calls.
- **TanStack DB collection** is the default reactive store for any entity the UI reads and writes.

## Collections vs plain Query (the over-engineering guard)

Default entity data to a **Query-backed collection**: reads via `useLiveQuery` (sub-ms, incremental), writes optimistic with automatic rollback. Wiring is a lateral move from raw `useQuery`/`useMutation`, and it *deletes* the hand-rolled `onMutate`/rollback boilerplate.

```ts
export const projects = createCollection(queryCollectionOptions({
  queryClient, queryKey: ['projects'],
  queryFn: () => client.projects.list(),
  getKey: (p) => p.id,
  onInsert: ({ transaction }) => Promise.all(transaction.mutations.map(m => client.projects.create(m.modified))),
  onUpdate: ({ transaction }) => Promise.all(transaction.mutations.map(m => client.projects.update(m.modified))),
  onDelete: ({ transaction }) => Promise.all(transaction.mutations.map(m => client.projects.delete({ id: m.original.id }))),
}))
```

**Reach for a collection** when an entity is shared across views, mutated, queried live/derived, or sync/offline is plausibly roadmapped. **Plain Query / route loader** for one-shot reads, single-site or read-only data, imperative calls, content/static. **Never** stand up Electric/offline until a real requirement lands.

## Loading & errors

Suspense + ErrorBoundary. `useSuspenseQuery` (or `useLiveQuery` off a primed collection) so `data` is always defined; wrap routes in an ErrorBoundary tied to `QueryErrorResetBoundary` for retry. Never thread `isPending`/`isError` through components.

## URL state

TanStack Router with a **zod search schema** (`@tanstack/zod-adapter`, `fallback`/`default`) — `useSearch`/`navigate`/`Link` are typed. The URL is the store: filters/sort/pagination live in search params; declare the ones that affect data in **`loaderDeps`** (→ Prefetching, below). A detail panel is a **nested route** (`/issues/$issueId`) — "drawers-as-routes": linkable, bookmarkable, filters preserved. Concentrate writes in one typed helper (reset page on filter change; `replace` for edits, `push` for navigation).

## Prefetching (route loaders)

The loader's job is "ready on paint" — and loader and component must never hold **two copies of the same query definition**; copies drift, and a drifted loader prefetches the wrong key while the component re-suspends (tkdodo.eu/blog/reliable-query-prefetching-with-tanstack-router).

- **Collection data (the default): `await collection.preload()` in the loader;** the component `useLiveQuery`s the same module-scoped collection. Nothing *can* drift — key + fetch live once in `queryCollectionOptions`, and view params (filters, ranges) apply client-side in the live query, not in the queryKey. The divergence bug class is designed out; another payoff of the collection default.
- **Plain-Query route data** (one-shot reads, server aggregations): one source of truth in the route's **`context()`** — build the `queryOptions` there (it re-runs only when params/`loaderDeps` change), loader `ensureQueryData(ctx.statsOptions)`, component `useSuspenseQuery` of the *same object* via `useRouteContext()`. Never write the key/fn in two places.
- **`loaderDeps` is the contract:** exactly the search params that affect data. Omit one and the loader prefetches stale shape; over-declare and unrelated params (`?debug`) refetch.
- **Parameterized collections** (a factory like `projectCollection(projectId)`): derive the instance in that same `context()` so the loader `preload()`s exactly the instance the component reads.

## Realtime (follows the deploy target)

Pick the blessed transport day 1; the tool follows deploy:

| Deploy | Transport |
|---|---|
| Cloudflare | **Durable Object** (one per room/topic) + WebSocket |
| Self-host | **ws** + **Redis** pub/sub (fan-out across instances) |

Shared, typed JSON envelope (discriminated union) client↔server. Route realtime deltas **into the collection** (the sync seam) rather than hand-writing the cache. Use **SSE** (not WS) when it's predominantly server→client and you're on HTTP/2. Never run sockets on serverless functions.

## Sync / offline

You get the seam free by defaulting to collections. When local-first/offline lands, swap the Query-backed collection for an **Electric** (Postgres-sync) collection — components that `useLiveQuery`/mutate don't change. Don't build it until it's a real requirement.
