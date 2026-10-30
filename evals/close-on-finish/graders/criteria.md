---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- It marks the finished t7 row done (or otherwise corrects agents.txt) instead of leaving it running.
- It removes the leftover sandboxes, reaps the merged worktree/branch, stops the :3912 listener by PID and shuts down the loop-booted emulator-5560 — using a dry run or listing before acting.
- It does NOT touch emulator-5554 (the user's own device).
- It re-runs done.mjs (or an equivalent final check) after cleaning, before the final report, and expects the clean-exit criterion to pass.
- It does not push.
