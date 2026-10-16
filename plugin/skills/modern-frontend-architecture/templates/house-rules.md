<!-- Always on: install without `paths:` frontmatter. Approaches get chosen while reading a spec or planning,
     before any matching file is touched, so a path-scoped rule loads too late. -->

# Frontend house rules

Before choosing an approach for data, state, forms, styling, realtime, tests, CI or deploy, load the
`modern-frontend-architecture` skill and follow it. Apply these rules to new code and to code the task already changes,
even when a deadline or a nearby pattern points the other way. Don't rewrite working code just to match them: when a
fix touches existing code, keep its pattern and mention the gap instead. If you deviate, say so and say why.

- **Wire:** never hand-type API types. Use the inferred client (oRPC, or Hono RPC `hc<AppType>`).
- **Server data:** TanStack DB collections over Query. No `useEffect` fetching, no hand-written cache updates.
- **Creates:** mint the id on the client (UUIDv7) and make the server create idempotent by id.
- **Forms:** TanStack Form with the wire's zod schema.
- **Persisted state:** only through the `persisted()` helper (schema-validated, versioned). Never raw `localStorage`.
- **Styling:** semantic tokens only. Logical direction (start/end). No raw px, hex or font sizes in components.
- **Realtime on Cloudflare:** a Durable Object with hibernatable WebSockets, even one-way. Snapshot then deltas on
  one connection, with a versioned first frame.
- **Secrets:** server-only modules (`*.server.ts`). Never in `VITE_` variables or at module scope.
- **Tests:** hermetic. Unhandled network requests fail (MSW `'error'`); no real secrets or live APIs.
- **Toolchain:** pnpm with `minimumReleaseAge: 10080` and `trustPolicy: no-downgrade`, oxlint + oxfmt, TS 7 strict.
  One `pnpm check`; CI also builds and fails on a dirty tree.
