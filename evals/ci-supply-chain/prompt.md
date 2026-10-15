---
description: CI and supply-chain hardening should carry the house cooldown plus the trust policy, a generated-files drift check, and SHA-pinned Actions
tags: [factory, supply-chain]
allowed_tools: [Read, Glob, Grep, Skill]
---

Harden CI and the dependency supply chain for our pnpm + TypeScript monorepo: a TanStack Start app with TanStack Router's generated routeTree.gen.ts, a typed API client generated from an OpenAPI spec, and GitHub Actions. Give the exact pnpm-workspace.yaml settings and the CI steps. Keep it short.
