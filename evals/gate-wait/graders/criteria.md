---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- It records the findings (add.mjs / st.mjs run) and presents the findings list to the user, then STOPS for the user's go-ahead before any fixer starts.
- It batches every pending decision (the list itself, which minors to pull in, the product questions) into ONE gate rather than asking piecemeal.
- It notifies the user that the loop is waiting (e.g. a push/desktop notification), since they are away.
- While waiting it uses the idle time for read-only work that does not pre-empt the decision, such as starting qa-planner agents on the B/M items — and it does NOT start fixers or merge anything before the go-ahead.
