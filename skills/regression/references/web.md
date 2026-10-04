# Web — regression checklist

Bar is **WCAG 2.2 AA** plus responsive, forms, and perf. If the project has its own design-system
skill (tokens, components, states), that skill wins — use this file for what it doesn't cover.

## Contents

- [Pitfalls (phase 1B)](#pitfalls-phase-1b)
- [Build & test (phase 2, required)](#build-test-phase-2-required)
- [Exercise it (phase 2, opt-in)](#exercise-it-phase-2-opt-in)
- [Navigation & routing audit (phase 2A)](#navigation-routing-audit-phase-2a)
- [UI/UX bar (phase 2B)](#uiux-bar-phase-2b)
  - [Semantics & keyboard](#semantics-keyboard)
  - [Visual & responsive](#visual-responsive)
  - [Forms](#forms)
  - [States & feedback](#states-feedback)
  - [Performance](#performance)

## Pitfalls (phase 1B)

- **URL is state** — filters, tabs, pagination, and open dialogs that live only in memory break the
  back button, refresh, and link sharing. Back must not skip past in-app navigation, and it must not
  trap the user either.
- **Hydration / SSR** — server and client render the same markup; nothing reads `window`,
  `localStorage`, or `Date.now()` during render; no layout flash on hydrate.
- **Data fetching** — a stale response overtaking a newer one (no abort/sequence guard), missing
  loading state on a slow connection, no retry on failure, cache key not updated after the shape
  changed.
- **Effects & listeners** — every `addEventListener`, observer, interval, and subscription removed on
  unmount; effects that re-run on every render because a dependency isn't memoized.
- **Storage** — quota and private-mode failures wrapped in try/catch; nothing sensitive in
  `localStorage`; a schema bump handled instead of crashing on old data.
- **Security** — no `dangerouslySetInnerHTML`/`v-html` on user content without sanitizing; external
  links `rel="noopener noreferrer"`; no secrets in client bundles or `NEXT_PUBLIC_*`.

## Build & test (phase 2, required)

Run before auditing anything. Read `package.json` scripts first and prefer what the project defines;
use the project's package manager per its lockfile (`pnpm` / `yarn` / `bun`, not always `npm`).

| Step | Command |
|---|---|
| Build | `npm run build` |
| Tests | `npm test` — the whole suite |
| Typecheck | `npx tsc --noEmit` (TypeScript projects) |
| Lint | `npm run lint` / `npx eslint .` |

Report results verbatim. A suite you didn't run is reported as **not run**, never as passing.

## Exercise it (phase 2, opt-in)

The web is the cheapest platform to actually drive, so the bar for skipping is higher here than on
mobile. Reach for it whenever a finding is about rendered output, focus order, or a state you can
only reach by clicking.

```bash
npm run dev &                       # or the project's own start script
npx playwright --version            # already a dependency in many projects
```

With Playwright (or the `webapp-testing` skill, which wraps this):

- **Screenshot the surface and read the image back.** Contrast, truncation, overlap and layout
  breakage are visual defects — inferring them from CSS is guessing.
- **Tab through it** and confirm the focus ring is visible at every stop, order follows the visual
  order, and no stop is unreachable or invisible.
- **Resize** to the project's breakpoints plus 320px wide; confirm nothing scrolls horizontally.
- **Reload mid-flow and press browser Back** — the two failures a static read of a router never catches.
- Check the console for errors and the network tab for a request the change made redundant.

Reset any state you created (uploaded files, seeded records) and kill the dev server when done.

## Navigation & routing audit (phase 2A)

Run when routes, guards, or link targets changed.

- **Reachability** — the new route is reachable from where it should be, and a guard actually blocks
  it where it shouldn't (an unauthenticated user hitting the URL directly, not just the link).
- **Browser back / forward** — lands where the user expects, doesn't skip past in-app steps, and
  doesn't trap. A modal opened via route must close on back, not exit the page.
- **Deep links & params** — a missing, malformed, or stale param renders a real state, not a crash
  or an infinite spinner. Required vs optional is enforced.
- **Refresh mid-flow** — reloading on any step of a multi-step flow restores or redirects
  deliberately; it never lands on a blank step.
- **Result passing** — a value returned from a child route reaches the parent (query param, state,
  or store), and doesn't leak into the URL when it shouldn't.
- **Scroll & focus restoration** — back restores scroll; a route change moves focus to the new
  heading rather than leaving it on the old page's trigger.

## UI/UX bar (phase 2B)

### Semantics & keyboard
- Real elements: `<button>` for actions, `<a href>` for navigation, `<label for>` on every input,
  headings in order. A `div` with `onClick` is a finding.
- Everything reachable and operable by keyboard alone, in visual order. No positive `tabindex`.
- `:focus-visible` on every interactive element — visible against its background, never removed
  without a replacement.
- Modals/sheets: focus moves in, is trapped, `Esc` closes, focus returns to the trigger, background
  scroll locked, `aria-modal` + labelled.
- ARIA only where semantics can't carry it, and correct when used (`aria-expanded`, `aria-current`,
  `role="alert"` on errors, live region for async status).

### Visual & responsive
- Contrast ≥4.5:1 body text, ≥3:1 large text and UI/graphic boundaries.
- Never color alone — pair with icon, text, or shape.
- Target size ≥24×24 CSS px (WCAG 2.2), ≥44px for anything primary on touch.
- Zoom to 200% and a 320px viewport: no horizontal page scroll, no clipped content. Wide tables,
  code blocks, and diagrams scroll inside their own container, not the page.
- Dark mode via tokens; every color defined in the base theme, not only inside a media query.
- Long text truncates deliberately (`text-overflow`/line clamp) — never by accident under a fixed
  height. Assume 30–50% expansion for de/ru.
- RTL: logical properties (`margin-inline`, `inset-inline`) not `left`/`right`; directional icons mirror.
- `prefers-reduced-motion` honored — animation reduced to a fade or removed, not just shortened.

### Forms
- Label, autocomplete token, and appropriate `inputmode`/`type` on every field.
- Errors: inline, next to the field, text (not just red), announced, and focus moves to the first one.
- Validation on blur/submit, not on every keystroke; the submit button disables while in flight and
  can't double-submit.
- Destructive actions confirm; long operations show progress; success is acknowledged.
- Nothing is lost on refresh mid-form when the form is long.

### States & feedback
- Loading, empty, and error render for every async surface, and error offers retry. Skeletons match
  the final layout so nothing jumps.
- Feedback within ~100ms of any interaction — a dead click is a finding.
- Optimistic updates roll back visibly on failure.

### Performance
- Images: explicit `width`/`height` (or `aspect-ratio`), `loading="lazy"` below the fold, modern
  format, sized for the container. Missing dimensions = layout shift = finding.
- Fonts: `font-display: swap` and a real fallback stack; no invisible-text flash.
- No unbounded list without virtualization or pagination; no render-blocking work added to the
  critical path; heavy components code-split.
- Watch the deltas that matter: CLS from late-inserted content, INP from work on the click handler,
  LCP from a hero image that isn't preloaded.
