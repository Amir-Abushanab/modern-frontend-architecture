---
description: One-way live updates from a Durable Object should use hibernatable WebSockets, not SSE that keeps the object awake
tags: [realtime, correctness]
allowed_tools: [Read, Glob, Grep, Skill]
---

Our React app runs on Cloudflare. We want to push live notifications to each user's open tabs, server to client only, from one Durable Object per user. Should the tabs connect with Server-Sent Events or a WebSocket? Pick one and say why in a few sentences.
