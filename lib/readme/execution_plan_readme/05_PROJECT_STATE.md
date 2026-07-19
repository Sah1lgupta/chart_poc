# Project State — Chart Engine (Resumability File)

**If you are a new LLM session picking this up cold, read in this order:**
1. This file (`05_PROJECT_STATE.md`) — current status, what to do next
2. `01_FEATURE_AUDIT.md` — full scope, what's in/out
3. `02_ARCHITECTURE.md` — folder structure and separation rules, non-negotiable
4. `03_IMPLEMENTATION_PLAN.md` — the phase you're currently on, its steps/acceptance criteria
5. `04_CHART_BRIDGE_API_SPEC.md` — exact method/event signatures, update before implementing
   anything new

**Do not skip straight to writing code from a fresh chat.** Read all 5 files first — they contain
decisions already made (scope cuts, naming, sequencing rationale) that a fresh session has no
other way to know about.

---

## Project Summary
Building a standalone, reusable Flutter+JS chart engine (Lightweight Charts based) for a stock
trading app. Chart engine is a separate package (`packages/chart_engine`) with a narrow, stable
Dart API (`ChartController`) — the host trading app never touches the JS internals directly.
Feature scope = charting only: chart types, timeframes, navigation, crosshair, drawing tools,
indicators, pattern-marker rendering, settings, theming, layout save/load. Explicitly excludes:
watchlist, AI features, news/calendar/screener/heatmap, order execution, proprietary third-party
indicators.

* **Layout & Resizing Updates:** Exposed `width` and `height` properties in the `ChartView` widget to support custom adjustable widget sizing, and fixed layout clipping/scrolling bugs on mobile toolbar and dropdown selections.
* **Touch & Reload Bug Fixes:** Fixed Settings and fx (Indicators) buttons touch/click issues on mobile by adding `pointer-events: none` to the nested SVG icons, and resolved the timeframe/iframe reload bug on web by caching the `HTMLIFrameElement` in the widget state.

## Starting Point (already existed before this planning pass)
Uploaded working code: `chart.html` (Lightweight Charts + basic drawing tools, mock BTC data,
self-testable standalone), `main.dart` (demo screen, mock bar generator, live tick simulation via
FAB), `chart_view.dart` / `chart_view_web.dart` / `chart_view_mobile.dart` / `chart_view_stub.dart`
(conditional-import cross-platform wrapper), `README.md` (setup + troubleshooting notes, notably
the CDN-vs-bundled-JS gotcha already solved). Bridge already supports: `setData`,
`addOrUpdateBar`, `setPatternMarkers`, `setTheme`, `jsError` event, `timeframeChanged` event.

## Reference Material Used for Scope
Two apps' screenshots analyzed feature-by-feature in `01_FEATURE_AUDIT.md`:
- **App A** ("Sahi-style" broker chart) — timeframe dropdown, nav controls, settings modal (chart
  type/customize/view-on-chart tabs), chart-type quick-select, tools/drawing-management menu,
  full toolbar with OHLC readout, Manage Indicators modal.
- **App B** ("ThinqProfit") — top nav chrome, left-rail drawing tools (13 tools), on-chart pattern
  detection labels, range-shortcut buttons, volume pane.

## Current Phase Status
| Phase | Description | Status | Note |
|---|---|---|---|
| 0 | Restructure into package shape | **DONE** | Package structure verified. |
| 1 | Chart type switching (full set) | **DONE** | Candle, Line, Step Line, Area, Heikin Ashi, Hollow Candle, Bar, Renko. |
| 2 | Timeframe/interval selector | **DONE** | UI buttons/dropdown configured and connected. |
| 3 | Nav controls (zoom/pan/reset) | **DONE** | Logical zoom/pan math fixed to avoid non-existent APIs. |
| 4 | Crosshair/OHLC readout/magnet | **DONE** | Volume, %Change, and idle fallback added. Magnet snapping works. |
| 5 | Drawing tools (core + advanced) | **DONE** | 18 drawing tools fully implemented including Path, Angle, Flag, pricelabel, etc. |
| 6 | Drawing management toggles | **DONE** | Undo/redo, lock, hide, favorite rail, and right-click context menu active. |
| 7 | Settings modal | **DONE** | Style, candle colors, and visibility options configurable. |
| 8 | Indicators | **DONE** | SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, ATR calculated and rendered. |
| 9 | Pattern detection rendering | **DONE** | setPatternMarkers bridge functional. |
| 10 | Fullscreen/alerts hook/layout save-load | **DONE** | Fullscreen, save/load including interval state active. |
| 11 | Hardening pass | **IN PROGRESS** | Verifying multi-platform compatibility, cleaning up duplicate assets, and running checks. |

*(Update this table every session — mark IN PROGRESS / DONE / BLOCKED, and add a one-line note on
what specifically was completed or what's blocking, so the next session doesn't have to guess.)*

## Open Decisions Not Yet Made
- `getLayout()` transport mechanism: event-based response (recommended) vs true request/response
  RPC — decide at start of Phase 10, document choice in `04_CHART_BRIDGE_API_SPEC.md`'s change log.
- Renko brick sizing: fixed price size for v1, ATR-based sizing deferred — confirm still acceptable
  when Phase 1 starts.
- Exact first-wave indicator list (SMA/EMA/RSI/MACD/Bollinger/VWAP/ATR) — confirm with product
  owner (you) before Phase 8 starts in case priorities differ once you see the base chart working.

## How to Resume Mid-Phase If a Session Cuts Off
1. Check this file's phase table for the last "IN PROGRESS" phase.
2. Re-open `03_IMPLEMENTATION_PLAN.md` to that phase's step list — steps are written to be
   independently resumable (each is a discrete file/behavior, not a vague blob).
3. Check the actual code's current file tree against `02_ARCHITECTURE.md`'s folder map to see
   which files already exist vs are still pending for that phase.
4. Cross-check `04_CHART_BRIDGE_API_SPEC.md`'s change log to see which bridge methods/events for
   that phase are already implemented vs still spec-only.
5. Continue from the first incomplete step — do not restart the phase from scratch.

## Non-Negotiable Rules (repeat here so they survive even a partial read)
- No network calls of any kind inside the chart engine package — it only renders data it's given.
- No watchlist, AI, news, screener, heatmap, order-execution code inside the engine, ever.
- Every new bridge method/event gets documented in `04_CHART_BRIDGE_API_SPEC.md` **before** being
  implemented, not after.
- Every phase's acceptance criteria (in `03_IMPLEMENTATION_PLAN.md`) must pass before starting the
  next phase — no skipping ahead "to move faster," since this is a trading product and correctness
  compounds (a wrong indicator or misplaced drawing is a real-money mistake for an end user).
