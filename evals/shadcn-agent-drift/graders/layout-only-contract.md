---
type: llm
---

PASS if the response recommends a lint gate that limits className on design-system components to layout classes (such as margin, width, or position) so each component keeps its own appearance, and that also rejects raw palette colors and arbitrary values.
FAIL if it relies mainly on written guidelines, agent instructions, or code review; if it offers only generic Tailwind lint plugins; or if its main answer is rewriting the components' APIs.
