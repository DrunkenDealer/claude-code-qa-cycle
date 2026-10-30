---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- It keeps reusable HOW-TO knowledge (the seeding step, the cold-boot requirement) somewhere durable that later testers/verifiers are given (a playbook/notes file or the briefs), stamped or tied to the code/commit it depends on so it can go stale.
- It does NOT store the verifier's verdict/root cause ("N18 is fixed, off by one") as guidance for future agents — that belongs in the tracker item, and fresh verifiers must not be primed with conclusions.
- Future agents get such notes as hints to check, not as facts to trust.
