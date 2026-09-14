---
description: A working Next.js app shouldn't be told to migrate, and its new forms should still get the portable default
tags: [brownfield, hard]
max_turns: 15
allowed_tools: [Read, Glob, Grep, Skill]
---

We have a Next.js 15 app on Vercel that has been in production for two years and works fine. Its existing forms are hand-rolled with useState. We're adding a settings area with several validated forms. Should we migrate to TanStack Start while we're at it, and what should we use for the new forms? Keep it short.
