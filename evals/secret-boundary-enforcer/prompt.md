---
plugins: ["../../plugin"]
description: The client-bundle secret boundary in TanStack Start should be enforced by import protection failing the build, not by convention or lint alone
tags: [security, correctness]
allowed_tools: [Read, Glob, Grep, Skill]
---

TanStack Start app on Cloudflare Workers. What actually guarantees that server-only modules and secrets never end up in the client bundle: the enforcing mechanism, not a convention? Be brief and concrete.
