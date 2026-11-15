---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- The in-scope W3 finding is logged as a fix-now item and goes through the normal flow (fix after the user's gate).
- The Looks finding is logged in the tracker (not dropped) but is NOT queued for fixing in this session: it is parked (later/deferred or equivalent) and marked as outside the scope.
- The user is told about the out-of-scope finding by ID and asked (or left to decide) whether to pull it in; no planner or fixer is started on it without the user's word.
