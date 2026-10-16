<!-- Always on: install without `paths:` frontmatter. Approaches get chosen while reading a spec or planning,
     before any matching file is touched, so a path-scoped rule loads too late. -->

# Frontend house rules

These are this project's defaults. When a choice comes up about data, state, forms, styling, realtime, tests, CI or
deploy, load the `modern-frontend-architecture` skill (it has the reasoning) and start from these. Use your judgement:
if the task or the codebase gives a good reason to do otherwise, do that and say why. In existing code, prefer the
surrounding pattern unless the task is already changing it, and mention the gap rather than rewriting working code.

- **Wire:** prefer the inferred client (oRPC, or Hono RPC `hc<AppType>`) to hand-typed API types, which drift.
- **Server data:** reach for TanStack DB collections (over Query) rather than `useEffect` fetching or hand-written
  cache updates.
- **Creates:** mint ids on the client (UUIDv7) and make server creates idempotent by id, so retries and double-taps
  are safe.
- **Forms:** TanStack Form, validated with the wire's zod schema.
- **Persisted state:** go through a schema-validated, versioned `persisted()` helper rather than raw `localStorage`;
  older and newer builds write it, and one bad value can blank the app.
- **Styling:** semantic tokens and logical direction (start/end); avoid raw px, hex and font sizes in components.
- **Realtime on Cloudflare:** a Durable Object with hibernatable WebSockets, even for one-way updates, because an open
  SSE stream keeps the object awake and billed for every idle tab. Snapshot then deltas on one connection, with a
  versioned first frame.
- **Secrets:** keep them in server-only modules (`*.server.ts`), out of `VITE_` variables and module scope.
- **Tests:** keep them hermetic: unmocked network requests should fail (MSW `'error'`), with no real secrets or live
  APIs.
- **Toolchain:** pnpm with `minimumReleaseAge: 10080` and `trustPolicy: no-downgrade`, oxlint + oxfmt, TS 7 strict;
  one `pnpm check`, and CI builds and fails on a dirty tree.
