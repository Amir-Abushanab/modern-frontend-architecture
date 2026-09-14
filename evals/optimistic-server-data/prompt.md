---
description: Optimistic entity data should go through a TanStack DB collection, not hand-rolled Query cache writes
tags: [defaults, data]
allowed_tools: [Read, Glob, Grep, Skill]
---

New React app: users see a list of projects from our API and can rename them inline. The list should update instantly and roll back if the request fails. What should I use for fetching and the optimistic cache? Keep it to a short recommendation.
