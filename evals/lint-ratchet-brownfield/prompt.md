---
description: Adopting a strict lint set on an existing codebase should ratchet per file (or file × rule), not by one repo-wide warning count
tags: [factory, brownfield]
allowed_tools: [Read, Glob, Grep, Skill]
---

We're adopting a much stricter lint rule set in a TypeScript monorepo that has about 800 existing violations. We can't fix them all at once, new code must not add more, and the number should only go down. Exactly how do we roll this out? Keep it short.
