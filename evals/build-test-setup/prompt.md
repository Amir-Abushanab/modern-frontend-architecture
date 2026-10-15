---
description: "Build task: the test setup should fail on unhandled network requests, unprompted"
tags: [build]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
---

Set up testing for this app: a Vitest config, a setup file, and one example test for the projects collection that does not need a running server. Write the files into the project.
