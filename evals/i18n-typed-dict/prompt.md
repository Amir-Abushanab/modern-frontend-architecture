---
description: A typed translation dictionary must type translations with string leaves (not the literal types of an `as const` English object) and load locales without casting
tags: [i18n, correctness]
allowed_tools: [Read, Glob, Grep, Skill]
---

We're adding Arabic to our React app and want typed translations with no i18n library: English is the source of truth, and a missing or extra key in Arabic should be a type error. Show en.ts, ar.ts, the dictionary type, and how each locale is lazy-loaded. Keep it short.
