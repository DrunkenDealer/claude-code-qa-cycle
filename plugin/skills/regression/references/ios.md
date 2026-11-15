# iOS — regression checklist

Judge iOS by the **Human Interface Guidelines**, not by the Android build that shipped last week.
Covers native (SwiftUI/UIKit) and **Compose Multiplatform on iOS**, which is where most of the
"it feels wrong" findings come from.

## Contents

- [Pitfalls (phase 1B)](#pitfalls-phase-1b)
- [Build & test (phase 2, required)](#build-test-phase-2-required)
- [Exercise it (phase 2, opt-in)](#exercise-it-phase-2-opt-in)
- [HIG bar (phase 2B)](#hig-bar-phase-2b)
- [Compose Multiplatform on iOS — the "feels Android" tells](#compose-multiplatform-on-ios-the-feels-android-tells)

## Pitfalls (phase 1B)

- **State restoration** — the app is killed in the background constantly. Anything the user typed,
  scrolled, or selected must survive a cold relaunch (`@SceneStorage`, `SavedStateHandle` on CMP)
  or be deliberately discarded.
- **Lifecycle** — `scenePhase` / `willResignActive`: timers, cameras, location, and audio sessions
  released on background; work resumed on foreground; no polling while backgrounded.
- **Background execution** — iOS gives no free background time. A "finish the upload after the user
  leaves" assumption borrowed from Android is a bug unless it uses a background URLSession or a
  registered background task.
- **Permissions** — an `Info.plist` usage string is required or the app *crashes* on first request.
  Handle "denied" and "restricted", not just granted, and never ask on launch without priming.
- **Keychain & data protection** — tokens in Keychain, not `UserDefaults`; files that must be
  readable while locked need an explicit protection class.
- **Memory** — retain cycles in closures (`[weak self]`), large images decoded at full size.
- **Store review traps** — ATT prompt before any IDFA use; Sign in with Apple required alongside
  other social logins; account deletion reachable in-app; no external purchase links.

## Build & test (phase 2, required)

| Step | Command |
|---|---|
| Compile | `xcodebuild -scheme <s> -destination 'generic/platform=iOS Simulator' build` |
| Tests | `xcodebuild test -scheme <s> -destination 'platform=iOS Simulator,name=iPhone 16'` |
| KMP shared | `./gradlew allTests` (or `:shared:iosSimulatorArm64Test`) before the Xcode build |

On a KMP project the Kotlin tests are the cheap half and run without Xcode — do them even when the
iOS build itself can't be produced here. Report results verbatim; not run is **not run**.

## Exercise it (phase 2, opt-in)

The HIG findings below are mostly *feel* — swipe-back, scroll physics, safe areas, font metrics —
and feel is the one thing a diff cannot show you. Boot a simulator when the finding is one of those.

```bash
xcrun simctl list devices available | grep iPhone
xcrun simctl boot "iPhone 16" && open -a Simulator
xcrun simctl install booted <app>.app && xcrun simctl launch booted <bundle-id>
```

- `xcrun simctl io booted screenshot /tmp/s.png` — then read the file back.
- **Swipe back from every pushed screen.** The single most common CMP-on-iOS defect.
- Dynamic Type: Settings ▸ Accessibility ▸ Larger Text, or
  `xcrun simctl ui booted content_size accessibility-extra-large`.
- `xcrun simctl openurl booted "<url>"` — deep links.
- Rotate, and background/foreground the app (`xcrun simctl` + Home) for state restoration.

`xcrun simctl shutdown all` when done. Don't erase a simulator the user may have state in.

## HIG bar (phase 2B)

- **Navigation** — push for hierarchy, sheet for a self-contained task, full-screen cover only when
  the task owns the screen. Every pushed screen keeps the **interactive swipe-back gesture** working
  and a visible back affordance. A modal has an explicit Cancel/Done, and a dirty modal confirms on
  swipe-to-dismiss instead of silently discarding.
- **Safe areas** — content respects top (notch/Dynamic Island) and bottom (home indicator) insets;
  backgrounds extend edge to edge, controls don't. Nothing interactive sits in the home-indicator
  strip or under the Dynamic Island.
- **Touch targets** — ≥44×44pt (iOS is 44, not Android's 48dp — using 48 is fine, using 36 is not).
- **Dynamic Type** — text scales with the user's setting up to the accessibility sizes; layouts
  reflow instead of clipping. Fixed-height rows containing text are a finding.
- **VoiceOver** — every control has a label; images are labelled or hidden; state and traits
  (button/selected/disabled) exposed; focus order matches reading order; custom gestures have an
  accessible alternative.
- **Standard controls** — prefer the system control over a custom one. Non-standard switches,
  pickers, and pull-to-refresh are findings unless there's a stated reason.
- **Keyboard** — content scrolls clear of the keyboard, the focused field stays visible, Return key
  type matches the field, and there's a way to dismiss (scroll-to-dismiss or Done).
- **Gestures** — nothing competes with the system edges: swipe-back (left edge), Control Center /
  notifications (top edges), home indicator (bottom). A horizontal carousel at the left edge blocks
  swipe-back.
- **Feedback** — haptics for meaningful state changes (`UIImpactFeedbackGenerator` /
  `UINotificationFeedbackGenerator`), not for every tap.
- **Motion** — respects Reduce Motion; no parallax or spring-heavy transitions when it's on.
- **Dark mode** — semantic colors / asset catalog appearances, never a hardcoded hex.
- **Localization & RTL** — leading/trailing not left/right; text expansion tolerated; dates, numbers,
  and currency formatted through the locale.

## Compose Multiplatform on iOS — the "feels Android" tells

Audit these specifically when the UI is CMP; each one is a common finding:

- **Back affordance** — Compose has no navigation bar back button by default and no swipe-back gesture
  unless it's wired. A screen reachable only by a top-left arrow drawn in Compose still needs the
  edge swipe to work, or users will call it broken.
- **Ripple** — Material ripple on iOS reads as foreign. Use the platform-appropriate press state
  (opacity/scale) on iOS.
- **Scroll physics & overscroll** — iOS expects rubber-band overscroll and its own fling curve;
  Android's stretch/glow effect is a finding.
- **Sheets & dialogs** — an iOS sheet has a grabber, corner radius, and drag-to-dismiss; a Material
  `AlertDialog` is not an iOS alert.
- **Typography** — SF Pro (or the app's own face) with iOS metrics; Roboto on iOS is a finding.
- **Text selection & context menu** — selection handles, magnifier, and the Copy/Paste callout should
  be the iOS ones.
- **Safe area** — CMP doesn't handle insets for you; verify against the Dynamic Island and the home
  indicator on a real device size, not just the simulator default.
- **System share, pickers, and links** — must route to the native sheet/`SFSafariViewController`,
  not an in-app imitation.
