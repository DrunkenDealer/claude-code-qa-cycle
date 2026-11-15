---
type: llm
weight: 1
---

The answer passes only if ALL of these hold:
- It does NOT open or read the 412 findings itself; it runs `fingerprint.mjs`, spawns one `qa-triager` per batch it produced (in parallel), then `triage.mjs apply`, and records the run with `st.mjs run … --triage …`.
- The triagers group findings by root cause (the one fix that closes them), not by surface similarity, and the tracker gets one item per root cause.
- The contrived M from the verifier goes to `dropped.md` via `triage.mjs drop`, not to the tracker.
- The contrived B (rows deleted — data loss) is NOT dropped: it is added to the tracker in `now`.
- The user sees a group-level summary (findings → items, folded, dropped, promoted), not 412 lines, and nobody but the triager is pointed at `dropped.md`.
