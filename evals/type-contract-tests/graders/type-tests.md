---
type: llm
---

PASS if it proposes type-level tests that fail when a type is loosened, for example `expectTypeOf`/`assertType` checks or `@ts-expect-error` lines (in `*.test-d.ts` files or similar), run in CI through `tsc` or `vitest --typecheck`.
FAIL if it only suggests code review, CODEOWNERS, or ordinary runtime tests without any type-level assertions.
