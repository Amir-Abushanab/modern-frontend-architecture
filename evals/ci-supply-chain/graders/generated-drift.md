---
type: llm
---

PASS if CI regenerates or builds the generated files (the route tree and/or the API client) and then fails when the working tree differs from the commit, for example with `git diff --exit-code` or an empty `git status --porcelain` check.
FAIL if there is no step that detects stale generated files.
