---
type: llm
---

PASS if existing violations are tracked per file (or per file and rule), for example a committed per-file baseline or suppressions file where new files start at zero and counts can only fall.
FAIL if the plan relies on a single repo-wide count (for example one `--max-warnings` number), on turning rules off, or on inline disable comments alone.
