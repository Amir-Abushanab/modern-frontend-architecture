---
type: llm
---

PASS if the recommendation is WebSockets accepted through the Durable Object WebSocket Hibernation API (for example `ctx.acceptWebSocket` / `state.acceptWebSocket`), or WebSockets chosen because an open SSE response keeps the Durable Object awake or billed while hibernated WebSockets don't.
FAIL if the recommendation is Server-Sent Events from the Durable Object, or if it doesn't pick one.
