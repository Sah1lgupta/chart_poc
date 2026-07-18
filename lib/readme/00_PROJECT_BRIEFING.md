# 00 — PROJECT BRIEFING (Read This First, Always)

> **Paste this single file into any new LLM session before anything else.** It is written to be
> self-contained: even if the other 4 planning docs aren't attached, this file tells the new LLM
> exactly what's being built, why, what's already decided, and what to do next. If the other docs
> *are* attached, this file tells it the order to read them in.

---

## 1. What We Are Building

A **standalone, reusable chart engine** (Flutter + JS, built on Lightweight Charts) for a stock
trading app. It is being built as its own **separate package**
(`packages/chart_engine`) — not tangled into the main trading app's code. The trading app will
eventually just do:

```dart
ChartView(
  onCreated: (controller) => controller.setData(myBars),
  onEvent: (event, payload) { /* react to drawings, alerts, etc. */ },
)
```
...and everything else — chart types, drawing tools, indicators, timeframes, crosshair, settings —
lives inside the engine, invisible to the rest of the app.

**Scope is chart-only.** No watchlist, no AI features, no news/screener/heatmap, no order
execution logic inside the engine. It only renders whatever data (bars, live ticks, pattern
markers) the host app feeds it — it never makes its own network calls.

## 2. Why This Structure

This is being built for a **real trading product**, so two things matter more than usual:
1. **Correctness.** A wrong indicator calculation or a misplaced drawing is a real-money mistake
   for an end user — so the plan is deliberately phased and each phase has acceptance criteria that
   must pass before the next phase starts. No skipping ahead "to move faster."
2. **Maintainability.** The engine must stay "clean and separated — easy to read, easy to modify,
   no complex codebase." Every feature (a chart type, a drawing tool, an indicator) lives in its
   own file. Adding one new drawing tool later should mean touching **one new file**, not
   understanding the whole codebase.

## 3. Where the Idea Came From

We started from an already-working prototype (Lightweight Charts in a `chart.html`, wrapped by a
Flutter `ChartView`/`ChartController` with separate web/mobile implementations — this already
existed and works). Then we audited **two real trading-app UIs** (screenshots) feature-by-feature
to figure out everything a serious chart engine needs: timeframe selectors, chart type switching
(candle/line/area/Heikin Ashi/Renko/etc.), navigation controls, crosshair+OHLC readout, ~13
drawing tools, drawing management toggles (magnet/lock/hide/favorites), an indicators system
(Manage Indicators modal, search, categories, per-indicator params), pattern-marker rendering,
a settings modal (chart type / customize / view-on-chart tabs), theming, and full layout
save/load. Every one of those was individually verified against the screenshots — nothing was
guessed or assumed. Things clearly outside "chart engine" scope (watchlist, AI ratings, news,
screener, order execution, proprietary third-party indicators) were explicitly excluded so they
don't creep back in later.

## 4. The 5 Planning Documents (this file is #0)

| # | File | What it contains |
|---|---|---|
| 0 | `00_PROJECT_BRIEFING.md` | **This file.** The single-file context restore. |
| 1 | `01_FEATURE_AUDIT.md` | Exhaustive, screenshot-verified list of every chart tool/feature from both reference apps, tagged in-scope-now / later-phase / explicitly-out-of-scope. |
| 2 | `02_ARCHITECTURE.md` | The package folder structure, the Dart↔JS separation rules, who owns what data (engine never touches network), and why each boundary exists. |
| 3 | `03_IMPLEMENTATION_PLAN.md` | 12 sequential phases (0 = refactor existing code into the new structure with zero behavior change; 1–10 = features built in dependency order; 11 = a hardening/re-verification pass). Each phase lists exact files touched, steps, and acceptance criteria. |
| 4 | `04_CHART_BRIDGE_API_SPEC.md` | The exact, frozen Dart↔JS method/event contract (method names, payload shapes, models like `Drawing`, `IndicatorConfig`, `ChartLayout`). Any new bridge method must be added here **before** it's implemented, never after. |
| 5 | `05_PROJECT_STATE.md` | The **living tracker** — a phase-status table (not started / in progress / done / blocked) plus open decisions not yet made. This is the file that gets updated every session. |

**Reading order for a fresh LLM session:** this file (0) → `01` → `02` → `03` (find the current
phase) → `04` (check what's already spec'd) → `05` (check exact status + resume point).

## 5. Current Status (also tracked live in `05_PROJECT_STATE.md` — that file is the source of
truth if this section and that file ever disagree, trust `05`)

- Planning phase: **complete.** All 5 supporting docs written and delivered.
- Build phase: **not started yet.** Phase 0 (pure refactor of the existing working prototype into
  the `packages/chart_engine` folder structure, zero behavior change) is the next step whenever
  we begin coding.
- Nothing in the existing working prototype (`chart.html`, `main.dart`, the `chart_view*.dart`
  family) has been modified yet — it still works exactly as originally uploaded.

## 6. Non-Negotiable Rules (worth repeating in every context-restore)

- No network calls inside the chart engine package, ever — it only renders data it's handed.
- No watchlist / AI / news / screener / heatmap / order-execution code inside the engine.
- Every new Dart↔JS bridge method or event is documented in `04_CHART_BRIDGE_API_SPEC.md` **before**
  being coded.
- Each implementation phase's acceptance criteria (in `03`) must pass before starting the next
  phase — this is a trading product, correctness compounds, no skipping ahead.
- If scope needs to change (new screenshot, new feature request), it gets added to
  `01_FEATURE_AUDIT.md` **first**, then reflected into `03_IMPLEMENTATION_PLAN.md` — never
  implemented ad hoc mid-phase.

## 7. What To Tell a Fresh LLM Session To Do

> "Read `00_PROJECT_BRIEFING.md`, then `05_PROJECT_STATE.md` to see the current phase. Then open
> `03_IMPLEMENTATION_PLAN.md` to that phase's step list and continue from the first incomplete
> step — don't restart the phase, don't skip ahead, and don't touch anything outside that phase's
> listed files without checking `02_ARCHITECTURE.md` first."

## 8. What Happens After This

Once you confirm, the next actual action is **Phase 0**: relocating the existing working
prototype into the `packages/chart_engine` folder structure described in `02_ARCHITECTURE.md`,
with the explicit constraint that nothing about how the chart *behaves* changes — it's a pure
reorganization, verified against the current demo behavior before Phase 1 (chart types) begins.
