---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- N22 is not marked verified or failed on the basis of the partial run; its status stays as it was (fixed, awaiting verification).
- The v41 row is marked stopped (not done) with the reason recorded (usage limit).
- It plans to resume after the reset by continuing the same agent with SendMessage (same session, context kept) or a fresh verifier that picks up from the scenarios already completed (a progress/checkpoint file or the saved evidence) — not by silently redoing everything from zero without considering what was done.
- It holds the queued long/heavy agents until the limit resets instead of launching them into the same limit.
