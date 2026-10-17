---
type: llm
---

PASS if the type that the Arabic dictionary is checked against has plain `string` values at its leaves, so real Arabic text compiles: for example a mapped or widening type over `typeof en`, an `en` declared without `as const`, or an explicit interface with `string` fields.
FAIL if the Arabic dictionary is typed as `typeof en` (or an alias of it) where `en` is declared `as const`, because then every leaf is an English literal type and Arabic strings are not assignable.
