# Security (runtime)

Runtime/app security — the day-1 boundaries a competent agent *still* botches. (Supply chain lives in `agent-first-factory.md` — a distinct, already-strong concern.) Unguided agents already know *what* to do here; the value is the stack-specific *how* and turning it into **enforcement**, so wrong states are un-expressible, not hoped against. Treat named versions as current-best (see `SKILL.md`).

## 1. CSP + security headers — one edge middleware

The retrofit nightmare; set it day 1. Everything below lives in **one Worker response middleware** so nothing ships without it.

**Nonce CSP — TanStack Start has it built in** (≥ v1.133.12; do *not* hand-roll):

- Generate a per-request nonce in a server middleware — `crypto.randomUUID()` (Web Crypto is global on Workers; avoid the `btoa(getRandomValues(Uint32Array))` snippet — it encodes a stringified array). Put it on context, pass `createRouter({ ssr: { nonce } })`; TanStack stamps its SSR `<script>`/`<style>` incl. hydration/dehydration + `ScriptOnce`, building on Vite's `html.cspNonce`. Read back via `getGlobalStartContext()?.nonce`.
- Per-request nonce ⇒ **no caching/prerender on nonce'd routes**. Run **`Content-Security-Policy-Report-Only` in dev** — strict CSP is friction-prone under the Vite dev server.

**The policy** (one header; nonce injected by the middleware):

```
default-src 'self';
script-src 'nonce-{n}' 'strict-dynamic';
style-src 'nonce-{n}';
object-src 'none'; base-uri 'none'; frame-ancestors 'none';
report-to csp
```

- **No `'self'` in `script-src`** — `'strict-dynamic'` makes browsers ignore host/scheme sources. The old-browser fallback is `https: 'unsafe-inline'`, never `'self'`.
- **`style-src` must be explicit** — omit it and styles fall back to `default-src 'self'`, blocking the inline CSS Vite/TanStack emit (`'strict-dynamic'` doesn't apply to styles). If runtime-injected library styles break the nonce, `style-src 'self' 'unsafe-inline'` is an acceptable relaxation (style-based XSS is low-risk).
- `report-to` needs a `Reporting-Endpoints` header defining the `csp` endpoint. Later hardening once stable: `require-trusted-types-for 'script'` + a Trusted Types policy.

**The rest of the bundle** (same middleware):

| Header | Value | Note |
|---|---|---|
| `Strict-Transport-Security` | `max-age=63072000; includeSubDomains` | add `preload` **deliberately later** — it's a ~one-way commitment, not a day-1 default |
| `X-Content-Type-Options` | `nosniff` | |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | already the browser default; belt-and-suspenders |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` | list only features you *don't* use; `()` denies all origins |
| `Cross-Origin-Opener-Policy` | `same-origin-allow-popups` | **not** plain `same-origin` — it silently breaks OAuth/SSO/payment popups |
| `X-Frame-Options` | `DENY` | legacy coverage beside `frame-ancestors 'none'` |

## 2. Client-bundle secret boundary

SSR co-locates server + client code, so a mis-scoped secret ships to every browser. The public prefix (`VITE_`, or `PUBLIC_` under Rsbuild) is a **publicity marker, not protection** — prefixed values are inlined into the bundle.

- **Read secrets only in server-only execution** — `createServerFn().handler()`, server routes, `.server()` middleware, `createServerOnlyFn()`. **Never at module scope** in an isomorphic/route file: the `createServerFn` boundary protects the handler *body*, not top-level imports — a module-scope read is pulled into the client graph and inlined.
- **On Cloudflare, secrets are Worker bindings** — `import { env } from "cloudflare:workers"`, outside `import.meta.env` entirely. Store with `wrangler secret put` / a gitignored `.dev.vars`; **never** `[vars]` in `wrangler.jsonc` (plaintext, committed).
- **One typed env module** (`src/config/env.ts`): separate zod `serverEnv` / `clientEnv` (`VITE_`) schemas, single read site — extends the typed-env rule in `stack-selection.md`.
- **The import graph is the real guarantee, not lint:** `serverEnv` must be unreachable from client code (`serverOnly`) — a lint rule can't stop bundling. As a tripwire, ban `process.env` outside the env module (oxlint `no-restricted-properties`). Banning **`import.meta.env`** needs `no-restricted-syntax`, which **oxlint lacks** (`import.meta` is a `MetaProperty`) — use an oxlint JS-plugin, a one-rule ESLint sidecar, or a CI grep. Allowlist `import.meta.env.DEV/PROD/MODE/SSR/BASE_URL`.
- Gitignore `.env*.local`; keep Vite patched (CVE-2025-31125, dev `server.fs.deny` bypass).

## 3. Cookies · CSRF · CORS · redirects

**Better Auth's CSRF/Origin protection guards only its own `/api/auth/*` handler — the oRPC API inherits none of it.** That gap *is* this item.

- **Cookies:** defaults are HttpOnly + `SameSite=Lax`; `Secure` is conditional, so on Workers set `advanced.useSecureCookies: true` explicitly (don't rely on `NODE_ENV`). Session cookie: `better-auth.session_token`.
- **CSRF:** Better Auth verifies the `Origin` header against `trustedOrigins` + Fetch-Metadata (`Sec-Fetch-Site`) — **no token**; SameSite=Lax is only defense-in-depth. Lax blocks classic cross-site POST but **fails** on: a state-changing **GET**, a **same-site sibling subdomain** (takeover), or `SameSite=None`. ⇒ **Replicate the Origin/Referer allowlist check on every non-GET oRPC mutation; keep all mutations non-GET; never `disableOriginCheck`.**
- **Cross-subdomain:** `advanced.crossSubDomainCookies: { enabled: true, domain: "example.com" }` + list subdomains in `trustedOrigins`; scope `domain` as narrowly as possible (any subdomain can read the cookie).
- **Redirects:** Better Auth validates `callbackURL` against `trustedOrigins`; **also** validate your app's own `redirect`/`next` params in the zod search schema against an **internal-path allowlist** (open-redirect).
- **CORS:** `trustedOrigins` is *not* CORS. Configure CORS on the Worker/oRPC separately — explicit Origin **allowlist**, echo the single matched origin, `Access-Control-Allow-Credentials: true`. Never reflect an arbitrary `Origin`; `*` is illegal with credentials.

## 4. XSS sinks (the paths auto-escaping misses)

React escapes `{interpolation}`; the holes are the sinks. Make them un-expressible — the same architecture-based constraint as token-only `Box` in `design-system.md`.

- **`dangerouslySetInnerHTML`** — ban in app code (oxlint **`react/no-danger`**). Untrusted HTML goes through **one blessed sanitized primitive** (`<Prose html>`).
- **Sanitize Worker-safe — never DOMPurify.** DOMPurify needs a DOM (jsdom); Workers have none, so `isomorphic-dompurify` throws there. Use a pure-JS sanitizer: **`sanitize-html`**, or **`rehype-sanitize`** in a react-markdown pipeline. (The native Sanitizer API `setHTML()` is browser-only — not in the Worker runtime.)
- **URLs:** React 19 renders `javascript:` URLs inert (and logs) — but **not** `data:`/`blob:`, nothing for `dangerouslySetInnerHTML`, and it isn't sanitization. Route user-controlled URLs through a `sanitizeUrl()` with a scheme allowlist (`http`/`https`/`mailto`/`tel`). Enforce with oxlint **`react/jsx-no-script-url`** + **`eslint/no-script-url`** (JSX + string literals).

> **oxlint note:** every rule here except `react/no-danger` is **default-off** — enable them explicitly. This security lint set runs in the gate (`agent-first-factory.md`).

## Skip — a competent agent already gets these right (documenting them is bloat)

Normal `{…}` output encoding (React auto-escapes) · SQLi (Drizzle + zod-validated oRPC inputs design it out) · password hashing / session-token crypto (Better Auth owns it) · generic "validate input" (the oRPC + zod wire schema *is* the enforced control) · rate-limiting / brute-force (Better Auth built-ins + Cloudflare platform).
