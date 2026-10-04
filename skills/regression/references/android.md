# Android — regression checklist

Mostly a router: the criteria live in the topic skills. Invoke them via the Skill tool when a
judgement call is needed; use this file to know *what to look at* and *which skill decides*.

| Topic | Skill |
|---|---|
| Compose state, side-effects, stability, lazy lists | `android-compose` |
| Tokens, components, motion, M3 Expressive | `material-3` |
| Insets, system bars, IME | `edge-to-edge` |
| Routes, back stack, deep links, scenes | `navigation-3` |
| Manifest, permissions, storage, background work | `android-platform` |
| State/effect shape, logic placement | `android-mvi` |

## Contents

- [Pitfalls (phase 1B)](#pitfalls-phase-1b)
- [Build & test (phase 2, required)](#build-test-phase-2-required)
- [Exercise it (phase 2, opt-in)](#exercise-it-phase-2-opt-in)
- [Navigation audit (phase 2A)](#navigation-audit-phase-2a)
- [UI/UX bar (phase 2B)](#uiux-bar-phase-2b)

## Pitfalls (phase 1B)

- **Config change & process death** — rotation, dark-mode toggle, language change, split screen, and
  "Don't keep activities". State in a plain `var`/`remember` without `rememberSaveable` or
  `SavedStateHandle` is lost. Check anything the user typed or scrolled to.
- **Effects** — work in composition instead of `LaunchedEffect`; a `LaunchedEffect(Unit)` that should
  re-key; a collector outside `repeatOnLifecycle` still running in the background.
- **Recomposition cost** — unstable lambda/collection params, missing `key` in `LazyColumn`, reading
  scroll state in the wrong scope, `derivedStateOf` missing on a computed predicate.
- **Manifest & platform** — new permission without a rationale path, exported component without a
  permission, `WorkManager` constraints missing, foreground-service type unset, notification
  permission on 13+.
- **Storage** — schema change without a Room migration, `SharedPreferences` where DataStore belongs,
  scoped-storage violations on 10+.
- **Security** — sensitive data in `SharedPreferences`/plain files instead of `EncryptedSharedPreferences`
  or the Keystore; a token or key logged; a `WebView` with `javaScriptEnabled` loading untrusted content,
  `setAllowFileAccess`/`addJavascriptInterface` left on, or an unhandled SSL error.

## Build & test (phase 2, required)

Run before auditing anything: a static pass cannot tell you whether the code compiles, and a
pre-existing red test changes what counts as a regression.

| Step | Command |
|---|---|
| Compile | `./gradlew assembleDebug` (`:module:assembleDebug` for module scope) |
| Unit tests | `./gradlew test` — the whole suite, not just the new ones |
| Lint / static | `./gradlew lint detekt ktlintCheck` — skip what isn't configured |
| KMP | `./gradlew allTests` when the change is in `commonMain` |

Report results verbatim with failing test names. A suite you didn't run is reported as **not run**,
never as passing.

## Exercise it (phase 2, opt-in)

Reach for a device when a finding needs a running app to confirm or refute — a layout that only
breaks at a large font scale, an inset that only appears on a notched screen, a back-stack bug.
Optional by design: skipping is fine, silently skipping is not.

```bash
adb devices                                            # a device may already be attached
$ANDROID_HOME/emulator/emulator -list-avds             # else ~/Library/Android/sdk/emulator/emulator
$ANDROID_HOME/emulator/emulator -avd <name> &
adb wait-for-device && ./gradlew installDebug
adb shell am start -n <pkg>/<activity>
```

Then drive the flow the diff touched:

- `adb exec-out screencap -p > /tmp/s.png`, then **read the file back** — the only way to actually
  see a layout bug rather than infer it.
- `adb shell settings put system font_scale 1.3` — the large-font pass. Reset to `1.0` after.
- `adb shell am start -a android.intent.action.VIEW -d "<url>"` — deep links.
- `adb shell input keyevent KEYCODE_BACK` — back stack; `adb shell am kill <pkg>` then re-enter for
  process death.
- `./gradlew connectedAndroidTest` where instrumentation tests exist.

**Leave the device as you found it** — reset font scale and rotation, uninstall nothing the user
didn't ask you to. Never run a destructive `adb` command (`uninstall` on an app you didn't install,
`shell pm clear`) without asking.

## Navigation audit (phase 2A)

Run when routes, `NavHost`, deep links, or manifest activity entries changed. Detail: `navigation-3`.

- **Reachability** — the new destination is reachable from where it should be, and *not* from where
  it shouldn't (a logged-out user can't land on a logged-in screen).
- **Back stack** — `popUpTo` / `launchSingleTop` / `inclusive` set correctly? Back from the new
  screen lands where the user expects, and back from a dialog or sheet dismisses only the overlay.
- **`BackHandler`** — registered but not disabled when the screen is inactive.
- **Deep links** — argument types match, optional vs required is right, and there's a fallback when
  an arg is missing or malformed.
- **Conditional gating** — auth / feature-flag / onboarding checks applied to the right destinations.
- **Result passing** — `SavedStateHandle` or `previousBackStackEntry` plumbed in both directions if
  the new screen returns a result.
- **Overlays** — back press dismisses cleanly and never leaves a stuck scrim.

## UI/UX bar (phase 2B)

- **Text** — every `Text` in a fixed-height container has `maxLines` + `overflow`. Test at 1, 2, and
  200 chars. German/Russian run 30–50% longer than English.
- **Font scale** — layout survives `fontScale` 1.3 and 2.0; nothing clips, nothing overlaps.
- **Dark mode** — colors come from `MaterialTheme.colorScheme`. A literal `Color(0xFF…)`,
  `Color.White`, or `Color.Black` outside the theme file is a finding.
- **Insets** — content and interactive elements clear the status bar, nav bar, IME, and display
  cutout. Scroll containers pad with `WindowInsets`, not fixed dp.
- **Touch targets** — ≥48dp. An icon drawn at 24dp needs padding, not a smaller target.
- **RTL** — `start`/`end` not `left`/`right`; directional icons mirror; numbers/dates localized.
- **Accessibility** — `contentDescription` on meaningful icons and `null` on decorative ones; composite
  rows merge semantics; state (selected/disabled) exposed, not implied by color alone; TalkBack order
  follows visual order.
- **The three states** — loading, empty, and error each render, and error offers retry. A screen with
  only a happy path is a finding.
- **Adaptive** — phone portrait, phone landscape, tablet, foldable unfolded. Fixed dp widths that
  don't reflow, and a list-detail that stays single-pane on a tablet, are both findings.
- **Motion** — Material easing/durations; nothing longer than ~300ms for chrome; respects
  "remove animations" (`Settings.Global.ANIMATOR_DURATION_SCALE`).
