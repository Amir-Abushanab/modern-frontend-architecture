# Logging & Telemetry

Applies the moment the app has a server side — oRPC handlers, TanStack Start server functions, Worker routes. Frontend apps almost always grow these, and they get logged worst. The browser side of the same pattern → **Client telemetry** below.

**Default: one wide event per request** (a *canonical log line*) — a single structured JSON event per request per service, built up through the request and emitted once at the end. Never scattered `console.log` breadcrumbs: breadcrumbs are optimized for writing, wide events for querying — the breadcrumb trail can't answer a question you didn't think of while writing it; a wide event with 30+ fields can.

Two words that carry the design:

- **Cardinality** — unique values a field can have. High-cardinality fields (`user_id`, `request_id`, `cart_id`) are what let you isolate *one* failing request; don't avoid them (columnar log stores handle them fine).
- **Dimensionality** — number of fields on the event. More context fields = more questions answerable after the fact. When in doubt, add the field.

## The pattern on the house stack

Build the event in **one middleware** (the same seam as the security headers — nothing ships without it), let handlers enrich it via context, emit once in `finally`:

```ts
const withWideEvent = os.middleware(async ({ context, next, path }) => {
  const start = Date.now()
  const event: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    request_id: context.requestId,            // also put it on the response for support tickets
    rpc: path.join('.'),
    version: context.env.VERSION, region: context.cf?.colo,
  }
  try {
    const result = await next({ context: { ...context, event } })
    event.outcome = 'success'
    return result
  } catch (err) {
    event.outcome = 'error'
    event.error = { type: err.name, code: err.code, message: err.message }
    throw err
  } finally {
    event.duration_ms = Date.now() - start
    console.log(event)                        // Workers Logs ingests structured JSON as-is
  }
})
```

Handlers add business context as it becomes known — `context.event.user = { id, plan, account_age_days }`, `context.event.payment = { provider, latency_ms, attempt }`, feature flags, sub-call latencies. The error path is where this pays: the failing event carries the *whole* story.

- **Levels stop mattering.** The one event ships at info; `outcome` / `status_code` / `error.*` are the query dimensions, not severity strings.
- **Correlate, don't centralize:** stamp `request_id` (and `trace_id` if tracing) on the event in *every* service it crosses — Worker → Durable Object → queue consumer — so one ID joins them.
- **PII / secrets:** IDs over emails; never log tokens, passwords, or raw request bodies (same boundary discipline as `security.md`).
- **Sampling (when volume costs):** tail-sample — always keep errors, slow requests (> p99), and flagged/VIP cohorts; random-sample the happy path. Never head-sample errors away.
- **OpenTelemetry is a delivery mechanism,** not a policy — it moves events, it doesn't decide what to capture. The wide event is the policy; OTel/Workers Logs/Logpush are transports.

**Never:** `console.log('here')` debugging left in · one log line per step · unstructured string interpolation (`` `user ${id} failed` `` — make it fields) · logging only the error with no request context.

## Client telemetry

**Not day-1 — server wide events are the priority; this can wait.** Add it when questions about real-user performance or client-side errors actually land, not on principle. What follows is the shape to reach for *then* (and it's deliberately cheap to adopt late — nothing else in the stack depends on it).

Same pattern, different unit of work — the browser has no request, so emit one wide event per **page load · route transition · key interaction · error**, all stamped with session context. The seam is a typed `track()` + a first-party ingest route; the sink is the deferred implementation.

- **Emitter: hand-rolled, typed, ~1–2 KB** — a `track()` that accumulates fields and batches. Not the OTel browser SDK (~60 KB gz auto-instrumented, span-shaped — and the OTel Browser SIG is itself pivoting to event-based). OTel/Honeycomb is the *later* swap behind the seam if real distributed-tracing depth lands.
- **Event shape mirrors the server event:** session fields on everything (`session_id`, app version, viewport, connection type, locale) + high-cardinality context (route, params, feature flags, interaction target, durations) + `outcome` / `error.*`.
- **Transport:** batch, then `fetch(url, { keepalive: true })`; flush on `visibilitychange`→hidden and `pagehide` — never `beforeunload` (bfcache-unreliable). `sendBeacon` is ad-block-targeted, header-less, 64 KB-capped; `fetchLater` is Chromium-only (not Baseline) — progressive enhancement at most.
- **Ingest = a same-origin route on the Worker,** zod-validated like any other input (Origin-checked — `security.md`). Survives ad blockers, keeps consent first-party, stamps server truth (`request.cf` country/colo, UA). Then one line per sink: `console.log(event)` → Workers Logs — full fidelity, joins the server wide events in one query surface — and optionally `writeDataPoint()` → Analytics Engine for dashboards (20 blobs / 20 doubles / 1 index per point, ~3-month retention: an aggregate sink, not the record). Self-host: same client + route, sink follows the deploy target.
- **Web Vitals: `web-vitals` (attribution build,** +~1.5 KB): fold each metric *with its attribution* (the LCP element, the INP script) into the page-view event on flush.
- **Errors ride the same pipeline:** `window.onerror` + `unhandledrejection` + the route ErrorBoundary produce error-outcome events. Sentry is the buy option for source-mapped stacks / release health — keep it behind `track()`.
- **Correlation is the payoff:** send `session_id` as a header on every oRPC call and stamp it onto the server wide event in the middleware above — one ID joins a slow INP to the exact server request behind it.
- **Privacy is a schema property:** typed event fields are an allowlist — no free-text DOM capture, no PII by construction (the same un-expressible-wrong-state move as token-only `Box`). Gate flushing on consent; head-sample happy-path page views if volume demands, never errors.

**Later — product analytics / session replay** (PostHog et al.): a separate concern, deliberately *not* day-1. Adopt only when product questions (funnels, retention, replay) genuinely land — and feed it from the same `track()` seam, or proxy it first-party, rather than scattering a second instrumentation layer through components.
