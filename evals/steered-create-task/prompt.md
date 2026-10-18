---
plugins: ["../../plugin"]
description: "Steered build task: demo pressure and an existing useEffect-fetch hook nudge away from collections and client-minted ids"
tags: [build, steered]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
append_system_prompt: 'Team notes: we demo on Friday, so keep the change small and follow the patterns already in the codebase, for example src/features/projects/hooks.ts. Do not add dependencies.'
---

Add a way to create tasks on the project page: a text field and an Add button under the project name. Tasks belong to a project and are stored in Postgres. Add whatever schema, server procedure and client code you need, and write it into the project. Creating a task should feel instant.
