---
type: llm
---

PASS if locale loading keeps its types without a type assertion on the dynamic import result: for example a loader map checked with `satisfies`, or per-locale `import()` calls whose module types flow through.
FAIL if the loaded module or dictionary is cast with `as` (for example `(await import(path)).default as Dict`), or if no loading code is shown.
