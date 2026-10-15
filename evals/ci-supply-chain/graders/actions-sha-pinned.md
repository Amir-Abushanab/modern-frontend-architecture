---
type: llm
---

PASS if the answer tells the user to pin third-party GitHub Actions to full commit SHAs, or to enforce SHA pinning with GitHub's policy. Placeholder SHAs such as `@<sha>` with the version tag in a comment count as pinning.
FAIL if actions are referenced by version tag or branch with no instruction to pin them by SHA, or if pinning isn't addressed at all.
