---
plugins: ["../../plugin"]
description: "Build task: persisted UI state should be schema-validated and versioned, unprompted"
tags: [build]
max_turns: 40
timeout_seconds: 900
allowed_tools: [Read, Glob, Grep, Skill]
---

Users want the sidebar width and each table's column widths to be remembered between visits. Implement that in the project.
