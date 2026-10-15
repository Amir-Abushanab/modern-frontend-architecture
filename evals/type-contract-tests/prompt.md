---
description: Type-level contracts (token-only props, translation key parity) should be guarded by type tests compiled in CI
tags: [factory, types]
allowed_tools: [Read, Glob, Grep, Skill]
---

Our design-system components only accept design-token names in their props, as typed unions, and our translation dictionaries must match the English type. How do we make sure that someone loosening those types gets caught in CI? Short and concrete.
