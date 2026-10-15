---
plugins: ["../../plugin"]
description: "Build task: a create flow should mint ids on the client and make the server create idempotent, unprompted"
tags: [build]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
---

Add a way to create tasks on the project page: a text field and an Add button under the project name. Tasks belong to a project and are stored in Postgres. Add whatever schema, server procedure and client code you need, and write it into the project. Creating a task should feel instant.
