# Chart Engine — Implementation Plan (Phased, Sequential)

Each phase is independently shippable and testable in the `example/` app before moving to the
next. Do not start a phase until the previous one's acceptance criteria pass — this is what keeps
"a minor mistake causing a huge impact" from happening, since every phase is verified in isolation
before more complexity stacks on top.

For every phase: **Goal → Files touched → Steps → Acceptance criteria → Bridge additions (if any)**.

---

## Phase 0 — Restructure Current Code Into the Package Shape
**Goal:** move existing working code (from your upload) into the `packages/chart_engine`
folder structure from `02_ARCHITECTURE.md`, with zero feature changes. This is a pure refactor —
if anything behaves differently after this phase, that's a bug to fix before proceeding.

**Files touched:** all currently uploaded files, relocated per the architecture doc's folder map.
`chart.html`'s inline JS gets split into `core/chart-instance.js`, `core/bridge.js`,
`core/state.js`, `data/series-adapter.js` — same logic, just filed into modules with `<script>`
tags loading them in dependency order (no bundler needed yet; ES module `<script type="module">`
imports are fine and keep this framework-free).

**Steps:**
1. Create the folder tree.
2. Move `chart_view*.dart` → `controller/`, split `chart_view.dart`'s model classes into
   `models/chart_bar.dart` and `models/pattern_marker.dart`.
3. Extract `chart_bridge_codec.dart` (the `jsonEncodeBars`/`jsonEncodeBar`/`jsonEncodeMarkers`
   helpers + the `_escape()` string from mobile controller) into one shared file both platform
   controllers import — currently `_escape` is duplicated logic risk once more methods are added.
4. Split `chart.html`'s `<script>` block into the module files, verify order-of-load.
5. Move `main.dart`'s demo logic into `packages/chart_engine/example/lib/main.dart` unchanged.
6. Add `packages/chart_engine/pubspec.yaml` declaring `webview_flutter`, `web`, and the two
   asset paths.

**Acceptance criteria:**
- `example` app runs on both a web target and a mobile target, chart renders mock candles exactly
  as before, FAB tick simulation still works, `jsError`/`timeframeChanged` events still fire.
- No behavior change — this phase is invisible to an end user.

**Bridge additions:** none.

---

## Phase 1 — Chart Type Switching (Full Set)
**Goal:** implement all identified chart types: Line, Step Line, Area, Candle, Heikin Ashi,
Hollow Candle, Bar, Renko.

**Files touched:** `data/series-adapter.js`, `data/transforms/heikin-ashi.js`,
`data/transforms/renko.js`, `toolbar/chart-type-selector.js`, new Dart enum
`models/chart_type.dart`, `ChartController.setChartType()`.

**Steps:**
1. Define `ChartType` enum in Dart (`line, stepLine, area, candle, heikinAshi, hollowCandle, bar,
   renko`) — single source of truth, UI dropdowns elsewhere just iterate this enum.
2. `series-adapter.js`: given current chart type + raw bars, produce whatever Lightweight Charts
   series type + data shape that chart type needs (candlestick series for Candle/Hollow/Bar,
   line series for Line/Step Line, area series for Area).
3. `heikin-ashi.js` / `renko.js`: pure functions, raw bars in → transformed bars out. Unit-testable
   in isolation (plain JS, no chart dependency) — write a tiny manual test harness page for these
   two since they have real math (Heikin Ashi averaging, Renko brick sizing) that's easy to get
   subtly wrong.
4. Wire `setChartType(ChartType type)` through the bridge → JS swaps the series, keeps the same
   underlying data, re-renders.
5. Build the quick-select dropdown (matches image 4) and reuse it as the "Chart type" tab content
   inside the Settings modal (Phase 7) — same component, two entry points.

**Acceptance criteria:**
- Switching type mid-session preserves the visible time range (no jump/reset).
- Heikin Ashi output manually spot-checked against a known reference calculation for at least 5
  bars.
- Renko brick size configurable (fixed price size to start; ATR-based sizing flagged as a later
  enhancement, not blocking this phase).

**Bridge additions:** `setChartType(String type)` [Dart→JS], `chartTypeChanged` event [JS→Dart].

---

## Phase 2 — Timeframe / Interval Selector
**Goal:** the full interval system: quick buttons (1m 2m 3m 5m 10m 15m...) + dropdown (10 min...1
month) + range shortcuts (1D 5D 1M 3M 6M YTD 1Y 5Y All).

**Files touched:** `toolbar/timeframe-selector.js`, `models/interval.dart` (config-driven list, not
hardcoded UI), `ChartController` gains no new bridge method here — interval changes are a *data*
concern: the engine tells your app "user wants interval X", your app refetches bars for that
interval and calls `setData()` again (matches the existing `timeframeChanged` event already in
`main.dart`).

**Steps:**
1. Define an ordered `List<Interval>` config in Dart: `{label, value, unit}` e.g.
   `{label: '15 min', value: 15, unit: minute}`. The JS toolbar receives this list via a new
   `setAvailableIntervals()` bridge call so your app controls exactly which intervals are offered
   (some symbols may not support 1-minute data, for example).
2. Build quick-button row (first N of the list, configurable count) + overflow dropdown for the
   rest, matching image 1's pattern.
3. Build the "range shortcut" row (1D/5D/1M/.../All) as a *separate* concept from interval — a
   range shortcut both picks a sensible interval AND sets the visible time span, so it maps to two
   actions: emit `timeframeChanged` (interval) and internally call the nav "fit view" logic scoped
   to that range.
4. Highlight current selection matching screenshots' active-state style.

**Acceptance criteria:**
- Changing interval always round-trips through your app (engine never assumes it has the data —
  it must wait for a fresh `setData()` after emitting `timeframeChanged`, showing a loading state
  in between).
- Range shortcuts visually distinct from interval buttons (they're two different concerns even
  though both apps show them close together).

**Bridge additions:** `setAvailableIntervals(json)` [Dart→JS], `timeframeChanged` event already
exists [JS→Dart] — extended payload to include both `interval` and `rangeShortcut` if relevant.

---

## Phase 3 — Chart Navigation Controls
**Goal:** zoom in/out, pan left/right, reset/fit-view floating control cluster.

**Files touched:** `toolbar/nav-controls.js`.

**Steps:**
1. Zoom in/out: adjust Lightweight Charts' visible logical range by a fixed step factor.
2. Pan left/right: shift visible logical range by a fixed bar-count step.
3. Reset: call `timeScale().fitContent()`.
4. Position the cluster per image 2 (floating, bottom-center, semi-transparent background).
5. Keep native scroll-wheel/pinch zoom and drag-to-pan enabled — these buttons are additive, not a
   replacement.

**Acceptance criteria:** all 5 controls work identically across mobile (touch) and web (mouse),
survive a chart-type or interval switch without erroring.

**Bridge additions:** none — purely internal to the JS engine, no Dart involvement needed since
this doesn't affect app-level state.

---

## Phase 4 — Crosshair, OHLC Readout, Magnet
**Goal:** live OHLC/volume/%chg readout bar, crosshair with date label, hover tooltip, magnet
snap-to-value.

**Files touched:** `crosshair/crosshair-ohlc.js`, `drawings/magnet.js` (shared utility used again
in Phase 5).

**Steps:**
1. Subscribe to Lightweight Charts' `subscribeCrosshairMove`; on move, compute O/H/L/C/V/%chg for
   the hovered bar and render the readout bar (matches image 6's top strip).
2. When crosshair is idle (not hovering), fall back to showing the latest bar's OHLC — never leave
   the readout bar blank.
3. Date label on the vertical crosshair line, price label on horizontal line, both following
   cursor/touch position.
4. Magnet: a pure function `nearestPlottedValue(price, visibleBars) → snappedPrice`, used by every
   drawing tool in Phase 5 when magnet mode is on (toggle lives in Phase 6's Tools menu, but the
   function itself belongs here since it's crosshair/price-axis logic).

**Acceptance criteria:** readout values match a manual calculation for at least 3 sample bars;
magnet snapping demonstrably changes drawing tool endpoint placement when toggled on vs off.

**Bridge additions:** none required (fully internal), optional `crosshairMove` event if your app
ever wants to react to hover (e.g. showing a synced price in another widget) — build only if
needed, don't add speculative events.

---

## Phase 5 — Drawing Tools (Core Set First, Advanced Set Second)
**Goal:** implement all 13 identified drawing tools, in two waves so the highest-value ones ship
first.

**Wave 5A (core, matches ✅ items in audit):** Trend Line, Horizontal Line, Horizontal Ray,
Rectangle, Fibonacci Retracement, Text, Eraser, Cursor/default tool.

**Wave 5B (advanced, matches 🕓 items):** Parallel Channel, Long/Short Position tool, Path/brush,
Measure/Arrow, Angle, Flag.

**Files touched:** `drawings/drawing-manager.js`, one file per tool under `drawings/tools/`,
`models/drawing.dart`.

**Steps (apply per-tool, in order Trend Line → Horizontal Line → Horizontal Ray → Rectangle →
Fibonacci → Text → Eraser → cursor, then repeat pattern for Wave 5B):**
1. Define the tool's data shape in `models/drawing.dart` as one variant of a sealed/union `Drawing`
   type: `{id, type, points: [{time, price}], style: {color, lineWidth, ...}, locked, hidden}`.
2. Implement the tool's interaction in its own file: click/tap to place point(s), drag to adjust,
   double-click/tap-away to finalize (rules vary per tool — e.g. Horizontal Line needs 1 point,
   Trend Line needs 2, Rectangle needs 2 corners, Fibonacci needs 2 points + auto-computed levels).
3. `drawing-manager.js` stays tool-agnostic: it tracks the active tool, forwards pointer events to
   whichever tool file is active, holds the master list of placed drawings, and is the only place
   that calls `emitEvent('drawingAdded'/'drawingUpdated'/'drawingDeleted', ...)`.
4. Every finalized drawing round-trips: JS → `drawingAdded` event → Dart receives full
   `Drawing.toJson()` shape → (your app decides whether to persist).
5. Provide `ChartController.setDrawings(List<Drawing>)` so your app can *load* previously-saved
   drawings back onto the chart (e.g. on chart open, after fetching from your backend) — the
   reverse direction of the event above.

**Acceptance criteria (per wave):** each tool can be selected, drawn, dragged to edit, deleted via
eraser, and correctly serializes/deserializes (draw it, call `getLayout()`/`setDrawings()` round
trip, confirm pixel-identical placement).

**Bridge additions:** `setDrawings(json)` [Dart→JS], `drawingAdded` / `drawingUpdated` /
`drawingDeleted` events [JS→Dart].

---

## Phase 6 — Drawing Management (Tools Menu)
**Goal:** the toggle menu from image 5 — enable drawing toolbar, enable magnet, hide all, lock
all, show favourites, per-tool favorite star.

**Files touched:** `drawings/drawing-manager.js` (extend), a small `toolbar/tools-menu.js` for the
dropdown UI itself.

**Steps:**
1. Each toggle is a boolean in `state.js`; `drawing-manager.js` reads them before allowing/render-
   ing interactions (e.g. if `locked=true`, ignore drag events on all drawings).
2. Favorites: persist starred tool IDs in `state.js`; "Show favourites" toggle filters the tool
   rail shown to the user down to starred ones only.
3. All toggle states are included in `getLayout()`'s output so a saved layout remembers them.

**Acceptance criteria:** every toggle immediately affects behavior with no reload needed; toggling
"Hide all drawings" hides but does not delete (toggling back off restores them exactly).

**Bridge additions:** none beyond what Phase 5 already added — these toggles ride inside the same
`Drawing`/layout model.

---

## Phase 7 — Settings Modal
**Goal:** the 3-tab modal — Chart type, Customize, View on chart.

**Files touched:** `settings/settings-modal.js`, `models/chart_theme.dart`.

**Steps:**
1. "Chart type" tab: reuse the Phase 1 selector component as-is.
2. "Customize" tab: color pickers for up-candle color, down-candle color, background, grid line
   color, crosshair color, text color — all read/write through `models/chart_theme.dart` and the
   existing `setTheme()` bridge method (extend its payload rather than adding a parallel method).
3. "View on chart" tab: checkboxes for OHLC legend visibility, volume pane visibility, last-price
   line visibility, crosshair label visibility — each backed by a boolean in `state.js`.

**Acceptance criteria:** every setting change is visible immediately without closing the modal;
closing and reopening the modal shows the last-applied values (not reset to defaults).

**Bridge additions:** extend `setTheme()` payload shape (documented in
`04_CHART_BRIDGE_API_SPEC.md`), no new method name needed.

---

## Phase 8 — Indicators
**Goal:** Manage Indicators modal (search, categories, add/remove, favorites, added-list with
mini preview) + an initial real indicator set with correct math, rendered on main or sub panes.

**Files touched:** `indicators/indicator-registry.js`, `indicators/calc/*.js`,
`indicators/manage-indicators-modal.js`, `models/indicator_config.dart`,
`ChartController.setIndicators()`.

**Steps:**
1. Ship first-wave indicators with verified formulas: SMA, EMA, RSI, MACD, Bollinger Bands, VWAP,
   ATR. Each is a pure function `(bars, params) → seriesData`, unit-testable independent of
   rendering (critical given your "even a minor mistake will cause huge impact" concern — wrong
   RSI math on a real trading app is a serious trust problem, so each indicator gets a manual
   spot-check against a known reference value before being marked done).
2. `indicator-registry.js` maps `{id, displayName, category: main|sub, calcFn, defaultParams}` —
   adding a new indicator later means adding one entry here plus one calc file, nothing else.
3. Build the modal UI: search filters the registry by name, category tabs filter by `category`
   field, add button instantiates an `IndicatorConfig{indicatorId, params, color}` and appends to
   the active list, favorite star persists starred IDs same pattern as Phase 6.
4. Sub-chart pane indicators (RSI/MACD) render in their own pane beneath the volume pane, with
   synced time axis — reuse the multi-pane mechanism volume already established in current code.
5. Per-indicator settings: clicking an added indicator opens a small inline editor for its params
   (period length, colors) — re-runs the calc function and re-renders on change.

**Acceptance criteria:** each of the 7 first-wave indicators' output manually verified against a
reference calculation on the same sample data set; adding/removing indicators doesn't affect chart
type or drawings state; indicator list survives `getLayout()`/reload round trip.

**Bridge additions:** `setIndicators(json)` [Dart→JS], `indicatorAdded` / `indicatorRemoved`
events [JS→Dart].

---

## Phase 9 — Pattern Detection Rendering
**Goal:** render pattern labels (3InDn, Engulf+, etc.) exactly as image 8 shows — this phase is
purely the **rendering** of markers already computed elsewhere; no detection logic lives here.

**Files touched:** `patterns/pattern-renderer.js` (the existing `PatternMarker` model/bridge method
already covers the Dart side — confirm it, don't duplicate it).

**Steps:**
1. Confirm `setPatternMarkers()` bridge method (already in current code) covers position
   (aboveBar/belowBar), color, shape, text — cross-check against audit §8's marker examples.
2. Style markers to match reference screenshots (small arrow/label combo, color-coded).
3. Handle marker density/overlap (multiple patterns on adjacent candles) — offset stacking rule so
   labels don't collide.

**Acceptance criteria:** feeding a hand-crafted list of markers (mimicking image 8's example set)
renders visually equivalent output; overlapping markers on adjacent bars remain legible.

**Bridge additions:** none — this phase should require zero new bridge surface if Phase-0's audit
of the existing `PatternMarker` holds up. If a gap is found, document it here before adding
anything.

---

## Phase 10 — Remaining Chrome: Fullscreen, Alerts hook, Bookmark/Layout Save-Load
**Goal:** the toolbar icons not yet covered — fullscreen toggle, alert-creation gesture, and full
layout save/load (symbol/interval/type/theme/drawings/indicators as one object).

**Files touched:** `toolbar/fullscreen.js`, a thin `alerts` hook inside `crosshair-ohlc.js`
(tap-and-hold on price axis → `alertRequested` event), `models/chart_layout.dart`,
`ChartController.getLayout()` / `ChartController.applyLayout()`.

**Steps:**
1. Fullscreen: CSS-only, expands the chart container to fill viewport, engine emits
   `fullscreenChanged` so your app can hide its own chrome (app bar etc.) while active.
2. Alert gesture: tap-and-hold (or a small "+" affordance near the price axis, matching image 6)
   captures a price → `emitEvent('alertRequested', {price})`. Engine does not manage alert storage
   or notification — purely a UI gesture translated to an event, per the state-ownership rule in
   the architecture doc.
3. `getLayout()`: JS serializes current `{symbol-agnostic state: chartType, interval, theme,
   drawings[], indicators[], toggles}` → returned as JSON to Dart in response to the call.
4. `applyLayout(ChartLayout)`: reverse direction, restores everything in one call — this is what
   "bookmark" ultimately triggers on your app's side (save the returned JSON somewhere; later,
   reload it via this method).

**Acceptance criteria:** save a layout, mutate the chart heavily (change everything), reapply the
saved layout, confirm exact restoration of every covered field.

**Bridge additions:** `getLayout()` [Dart→JS, returns JSON], `applyLayout(json)` [Dart→JS],
`alertRequested` / `fullscreenChanged` events [JS→Dart].

---

## Phase 11 — Hardening Pass (Do Not Skip)
**Goal:** given this is a trading product where mistakes matter, this phase is dedicated purely to
verification, not new features.

**Steps:**
1. Re-walk `01_FEATURE_AUDIT.md` top to bottom, tick every ✅/🕓 item against what's actually built —
   flag any gap.
2. Re-verify every indicator's math against a second independent reference source (not just the
   one used during Phase 8), since indicator correctness directly affects trading decisions.
3. Stress-test live tick updates (`addOrUpdateBar`) at realistic frequency against every chart
   type, with drawings and indicators active simultaneously — confirm no dropped frames, no drift
   in indicator recalculation, no drawing coordinates desyncing from price/time axis after many
   updates.
4. Cross-platform pass: every feature above re-tested on both the web (iframe) and mobile
   (webview_flutter) implementations — the two have historically diverged before (see README's
   troubleshooting section on the CDN-vs-bundled JS library issue) so this is not assumed to be
   symmetric by default.
5. Update `05_PROJECT_STATE.md` to reflect final status.

**Acceptance criteria:** the checklist in `01_FEATURE_AUDIT.md` is fully annotated with pass/fail
per item, zero unexplained ❌ on anything marked ✅ scope.

---

## Sequencing Rationale
Phases 1–4 (chart type, timeframe, nav, crosshair) come first because every later feature
(drawings, indicators) needs a stable, correctly-behaving base chart to render on top of. Drawings
(5–6) come before indicators (8) because indicators need the multi-pane + magnet infrastructure
that drawings work already establishes. Settings (7) sits between them because its "Chart type"
tab depends on Phase 1 and its theme work is reused by nothing later, so it can slot in without
blocking anything. Patterns (9) and remaining chrome (10) are last because they're the most
self-contained and lowest-risk additions. Hardening (11) is always last, by design.
