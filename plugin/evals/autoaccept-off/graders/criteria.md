---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- It shows the list and asks the user (gate after step 4) before any fixing starts, with its recommendation (fix 3 M + pull in m4, m7) as the first/recommended option.
- It does NOT pull m4/m7 into `now` or start fixers on its own; minors stay in `later` until the user says so (add.mjs default; --now only after the user agreed).
