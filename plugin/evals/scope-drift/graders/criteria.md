---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- It does NOT plan, fix, test or verify the W5 items or the other-area minors, and does not start agents on them.
- It treats the scoped work as complete (or reports it as done for the requested scope) rather than continuing the loop into other areas.
- It tells the user about the out-of-scope leftovers (the 2 W5 items and the 11 other-area minors, by workstream, count or ID — the situation gives no item IDs) as outside this session's scope, and leaves any decision to pull them in to the user.
- It does not move, re-bucket, retriage or close out-of-scope items on its own. Recording the scope the user gave at step 0 in `qa.config.json` (e.g. `scope: {ws: [W3], units: [U8, U9, U10]}`) and re-running `done.mjs` is allowed: that changes no item.
