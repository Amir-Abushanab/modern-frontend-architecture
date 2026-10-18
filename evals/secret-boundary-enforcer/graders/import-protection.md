---
type: llm
---

PASS if the answer names TanStack Start's import protection as the enforcer: the production build failing when a server-only module (for example a `*.server.*` file, a module marked with the `server-only` import, or a configured `importProtection` specifier) is reachable from client code.
FAIL if it relies only on conventions, folder names, lint rules, or reviewing code, or doesn't mention import protection or an equivalent build-failing check.
