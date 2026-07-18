# Chart Engine — Architecture

**Goal:** the chart engine must be a standalone, swappable package. Your trading app hands it
data (bars, live ticks, indicator values, pattern markers) through one narrow, stable API surface.
Everything about rendering, tools, UI chrome lives *inside* the engine and never leaks into your
app code. This mirrors what the current README already promises for a TradingView-Advanced-Charts
swap — we're just extending the same boundary to a much richer feature set.

## 1. Two-Layer Mental Model

```
┌─────────────────────────────────────────────────────────────┐
│  YOUR TRADING APP (Flutter)                                  │
│  - Screens, BLoC/state mgmt, your REST/WebSocket datafeed    │
│  - Owns: symbol selection, order placement, watchlist, auth  │
│  - Talks to the engine ONLY through ChartController + events │
└───────────────────────────┬───────────────────────────────────┘
                            │  (stable Dart API — package boundary)
┌───────────────────────────▼───────────────────────────────────┐
│  CHART ENGINE PACKAGE  (packages/chart_engine)                │
│  - Flutter shell: ChartView, ChartController (web/mobile)     │
│  - JS engine: chart.html + modular JS (rendering, tools,      │
│    indicators, drawings, settings) — this is the "brain"      │
│  - Ships as its own pub package (local path now, publishable  │
│    later); your app depends on it like any other package      │
└─────────────────────────────────────────────────────────────┘
```

**Rule of thumb:** if a change only affects *how the chart looks or behaves*, it happens inside
the engine package and your app never needs to change. If a change is about *what data feeds the
chart* or *what the app does in response to a chart event*, it happens in your app.

## 2. Folder Structure

```
your_repo/
├── packages/
│   └── chart_engine/                     ← the whole deliverable of this project
│       ├── pubspec.yaml
│       ├── lib/
│       │   ├── chart_engine.dart         ← single public export file (barrel)
│       │   └── src/
│       │       ├── controller/
│       │       │   ├── chart_controller.dart       (abstract API, unchanged shape)
│       │       │   ├── chart_view.dart              (StatefulWidget, conditional import)
│       │       │   ├── chart_view_web.dart
│       │       │   ├── chart_view_mobile.dart
│       │       │   └── chart_view_stub.dart
│       │       ├── models/
│       │       │   ├── chart_bar.dart
│       │       │   ├── pattern_marker.dart
│       │       │   ├── drawing.dart                 (NEW — serializable drawing object)
│       │       │   ├── indicator_config.dart         (NEW — indicator instance + params)
│       │       │   ├── chart_layout.dart              (NEW — saved layout: symbol/interval/type/drawings/indicators)
│       │       │   └── chart_theme.dart               (NEW — color tokens)
│       │       ├── bridge/
│       │       │   └── chart_bridge_codec.dart        (JSON encode/decode helpers, escaping)
│       │       └── events/
│       │           └── chart_event.dart               (typed event names + payload shape docs)
│       ├── assets/
│       │   └── chart/
│       │       ├── chart.html                        (shell only — loads modular JS below)
│       │       ├── lightweight-charts.standalone.production.js
│       │       └── js/
│       │           ├── core/
│       │           │   ├── bridge.js                  (postMessage / channel plumbing — in/out)
│       │           │   ├── state.js                   (single source of truth in-JS state object)
│       │           │   └── chart-instance.js          (Lightweight Charts init, resize, panes)
│       │           ├── data/
│       │           │   ├── series-adapter.js          (bar → series data per chart type)
│       │           │   └── transforms/
│       │           │       ├── heikin-ashi.js
│       │           │       └── renko.js
│       │           ├── toolbar/
│       │           │   ├── timeframe-selector.js
│       │           │   ├── chart-type-selector.js
│       │           │   └── nav-controls.js            (zoom/pan/reset)
│       │           ├── drawings/
│       │           │   ├── drawing-manager.js          (add/select/drag/delete/lock/hide)
│       │           │   ├── tools/
│       │           │   │   ├── trend-line.js
│       │           │   │   ├── horizontal-line.js
│       │           │   │   ├── horizontal-ray.js
│       │           │   │   ├── rectangle.js
│       │           │   │   ├── fibonacci.js
│       │           │   │   ├── parallel-channel.js
│       │           │   │   ├── position-tool.js        (long/short)
│       │           │   │   ├── text.js
│       │           │   │   ├── measure.js
│       │           │   │   ├── angle.js
│       │           │   │   ├── path.js
│       │           │   │   └── flag.js
│       │           │   └── magnet.js                    (snap-to-value helper, shared by all tools)
│       │           ├── indicators/
│       │           │   ├── indicator-registry.js        (id → {name, category, calc fn, defaultParams, pane: main|sub})
│       │           │   ├── calc/
│       │           │   │   ├── sma.js, ema.js, rsi.js, macd.js, bollinger.js, vwap.js, atr.js ...
│       │           │   └── manage-indicators-modal.js
│       │           ├── patterns/
│       │           │   └── pattern-renderer.js          (renders markers the Dart side already computed/pushed)
│       │           ├── settings/
│       │           │   └── settings-modal.js            (Chart type / Customize / View on chart tabs)
│       │           ├── crosshair/
│       │           │   └── crosshair-ohlc.js             (readout bar + tooltip + magnet-aware)
│       │           └── theme/
│       │               └── theme.js                      (applies chart_theme.dart payload to CSS vars + series options)
│       └── example/
│           └── (a minimal Flutter app — same role main.dart plays today — used purely to
│              manually test the engine in isolation, never imported by your real app)
│
└── your_app/                              ← your actual trading app, unchanged elsewhere
    └── pubspec.yaml  → dependency: chart_engine: { path: ../packages/chart_engine }
```

### Why this split matters (directly answers your "clean, separated, easy to modify" requirement)
- **One JS file per concern.** Want to add a new drawing tool? You touch exactly one new file in
  `drawings/tools/` and register it — you never touch `chart-instance.js` or any other tool.
- **`state.js` is the only place mutable chart state lives** in JS. No tool or modal reaches into
  another module's internals; everything reads/writes through `state.js` getters/setters. This is
  what keeps the JS side from turning into "complex codebase" spaghetti as features grow.
- **`bridge.js` is the only file that knows about Flutter.** Every other JS module is plain,
  testable, framework-agnostic chart logic. If you ever embed this same `chart.html` somewhere
  that isn't Flutter (a plain web dashboard, an admin panel), only `bridge.js` needs a shim.
- **Dart side mirrors the same idea:** `ChartController` (the abstract API) never changes shape
  when we add a feature — we add a new method (e.g. `addDrawing()`, `setIndicators()`) the same
  way `setPatternMarkers()` was added previously. Web/mobile implementations both implement the
  same abstract class, so a bug fix in the API shape happens once, in one file, and both platforms
  pick it up.
- **Models are pure data classes** (`Drawing`, `IndicatorConfig`, `ChartLayout`, `ChartTheme`) with
  `toJson()`/`fromJson()`. They contain zero rendering logic — they're just the typed contract
  between your app and the engine, and also what you'd persist to your backend for save/load.

## 3. The Bridge Contract (Dart ⇄ JS)

Kept as the **single narrowest surface** possible. Full method-by-method spec lives in
`04_CHART_BRIDGE_API_SPEC.md` — this section only states the *principle*:

- Dart → JS: always `window.ChartBridge.<method>(jsonString)` — one JSON string argument (already
  the pattern in the current code for `setData`/`addOrUpdateBar`/`setPatternMarkers`/`setTheme`).
  We extend this same pattern for drawings, indicators, layout, and settings — never invent a
  second calling convention.
- JS → Dart: always `emitEvent(eventName, payload)` → arrives in Flutter as
  `onEvent(String event, Map<String, dynamic> payload)` — already true today, we just add new
  event names (`drawingAdded`, `drawingUpdated`, `drawingDeleted`, `indicatorAdded`,
  `indicatorRemoved`, `chartTypeChanged`, `layoutSaved`, `alertRequested`, etc.) without touching
  the transport mechanism itself.

## 4. State Ownership Rules (prevents "who owns this data" bugs)

| Data | Owned by | Notes |
|---|---|---|
| Raw OHLCV bars | Your app (datafeed) | Pushed in via `setData`/`addOrUpdateBar`, engine never fetches data itself |
| Current chart type / interval / theme | Engine (JS `state.js`), mirrored optionally to your app via events if you want to persist it | Engine is fully functional even if your app ignores these events |
| Drawings (trend lines, fib, etc.) | Engine holds them live in-memory for rendering; your app is told about every add/update/delete via events so *your app* decides whether/how to persist to a backend | Engine never talks to your backend directly — no network calls inside the engine, ever |
| Indicator instances + params | Same pattern as drawings | Calculation happens in JS (`indicators/calc/*`), using only the bars already pushed to it |
| Pattern markers | Your app / your backend computes detection, engine only renders what it's given (already true today via `setPatternMarkers`) | Keeps heavy/AI-ish logic out of the engine, matches your "no AI in the chart" instruction |
| Alerts | Engine emits `alertRequested` with a price when the bell/tap gesture fires; your app owns storage, notification, and re-drawing the alert line back via a `setAlertLines()`-style call | |
| Saved layouts | Engine can serialize its current full state to a `ChartLayout` object on request (`getLayout()` → returns JSON); your app decides where that JSON lives | |

## 5. Versioning & Compatibility

- The engine package gets its own `pubspec.yaml` version (start at `0.1.0`).
- The bridge contract (`04_CHART_BRIDGE_API_SPEC.md`) is the changelog anchor: any breaking change
  to a method signature bumps the engine's minor version and gets a dated entry in that file.
- Your app pins the engine via a path dependency during development; once stable, it can be moved
  to a private pub server or git dependency without any code changes elsewhere.

## 6. What "easy to modify" means in practice (acceptance test for this architecture)

Pick any single feature from the audit and check: can one person add it by touching **only the
files listed for that feature's phase** in `03_IMPLEMENTATION_PLAN.md`, without needing to
understand the rest of the codebase? If the answer is ever "no, I also had to change X unrelated
file," that's a signal the module boundaries above have leaked and need tightening before more
features are added on top.
