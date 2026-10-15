---
description: "Steered build task: a team note suggests SSE, which keeps a Durable Object awake"
tags: [build, steered]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: 'Team notes: on our last project we pushed notifications to the browser with Server-Sent Events and it worked well, so we would like to reuse that approach here.'
---

Make the issue list on the project page update live when a teammate changes an issue. We deploy on Cloudflare, and wrangler.jsonc already declares an IssuesRoom Durable Object. Implement it in the project.
