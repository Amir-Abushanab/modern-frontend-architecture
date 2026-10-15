---
plugins: ["../../plugin"]
description: "Build task: live updates from a Durable Object should use hibernatable WebSockets, unprompted"
tags: [build]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
---

Make the issue list on the project page update live when a teammate changes an issue. We deploy on Cloudflare, and wrangler.jsonc already declares an IssuesRoom Durable Object. Implement it in the project.
