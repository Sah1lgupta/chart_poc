# Feature Audit — Chart Engine Reference Apps

**Purpose:** Exhaustive, verified list of every chart-related tool/feature visible in the reference
screenshots, so nothing gets missed while building our own chart engine. Non-chart features
(watchlist, AI, news, screener, calendar) are explicitly listed as OUT OF SCOPE so they don't
accidentally get pulled in later.

**Sources**
- **App A** ("Sahi-style" broker chart) — screenshots 1–7
- **App B** ("ThinqProfit") — screenshot 8

Legend: ✅ In scope for v1 · 🕓 In scope, later phase · ❌ Out of scope (per your instruction)

---

## 1. Timeframe / Interval Controls
| Feature | Source | Status | Notes |
|---|---|---|---|
| Quick range buttons: 1D, 5D | App A (img 1) | ✅ | Top-left of chart |
| Quick range buttons: 1D 5D 1M 3M 6M YTD 1Y 5Y All | App B (img 8) | ✅ | Bottom of chart |
| Interval quick buttons: 1m 2m 3m 5m 10m 15m | App A (img 1, 6) | ✅ | Inline row |
| Interval dropdown (full list): 10 min, 15 min, 30 min, 1 hour, 4 hour, 1 day, 1 week, 1 month | App A (img 1) | ✅ | Scrollable dropdown, current selection highlighted |
| Interval dropdown in App B ("1m ▾") | App B (img 8) | ✅ | Same concept, different UI chrome |

**Verified requirement:** interval selection must support **both** minute-based intraday
granularities AND day/week/month granularities, driven by a single config list (not hardcoded
buttons), so we can add/remove intervals without touching UI code.

---

## 2. Chart Type Selector
| Feature | Source | Status | Notes |
|---|---|---|---|
| Line | App A (img 3, 4) | ✅ | |
| Step Line | App A (img 3, 4) | ✅ | |
| Area | App A (img 3, 4) | ✅ | |
| Candle (candlestick) | App A (img 3, 4) | ✅ | Default |
| Heikin Ashi | App A (img 3, 4) | ✅ | Computed candle transform |
| Hollow Candle | App A (img 3, 4) | ✅ | Candle variant, hollow body on up-candles |
| Renko | App A (img 3, 4) | 🕓 | Non-time-based bricks; needs its own data transform, phase 2 |
| Bar (OHLC bars) | Not shown, but standard on Lightweight Charts | 🕓 | Add for completeness alongside the above |
| Quick chart-type dropdown from toolbar (img 4) | App A | ✅ | Same list as Settings > Chart type tab, just a shortcut |
| Chart-type tab inside Settings modal (img 3) | App A | ✅ | Settings modal must have this as first tab |

---

## 3. Chart Navigation Controls
| Feature | Source | Status | Notes |
|---|---|---|---|
| Zoom out (−) | App A (img 2, 6) | ✅ | |
| Zoom in (+) | App A (img 2, 6) | ✅ | |
| Scroll/pan left (‹) | App A (img 2, 6) | ✅ | |
| Scroll/pan right (›) | App A (img 2, 6) | ✅ | |
| Reset / fit-to-view (⟳) | App A (img 2, 6) | ✅ | Resets zoom+scroll to default range |
| Floating control cluster positioned bottom-center of chart | App A (img 2) | ✅ | UI placement detail |
| Pinch-to-zoom / trackpad scroll-zoom (implicit, standard chart behavior) | Both | ✅ | Native Lightweight Charts behavior, just needs to stay enabled |

---

## 4. Crosshair, OHLC Readout & Price/Time Axis
| Feature | Source | Status | Notes |
|---|---|---|---|
| Crosshair toggle/mode icon (top toolbar, "+" with chevron) | App A (img 6) | ✅ | Modes: normal crosshair vs free cursor, likely |
| OHLC + Volume + %chg readout bar above chart (O, H, L, C, V, %chg) | App A (img 6) | ✅ | Updates live on hover/crosshair move, and on latest bar when idle |
| OHLC tooltip popup on hover (date + O/H/L/C/V) | App B (img 8) | ✅ | Alternate presentation of same data — floating box near cursor |
| Horizontal dotted crosshair line + vertical dotted line | Both | ✅ | Standard crosshair |
| Date label on vertical crosshair line (e.g. "17 Jul 26, 14:01") | App A (img 6) | ✅ | Sits on time axis |
| Price label(s) on right price axis showing current price, following crosshair | Both | ✅ | |
| Live last-price line + label (e.g. 1327.20 in red) | App A (img 6) | ✅ | Distinct from crosshair — always-on marker for latest close |
| Bid/ask style extra price labels (e.g. 1329.51, 1324.47) | App A (img 6) | 🕓 | Only relevant once order-book/quote data is wired in; stub the visual slot now |
| Magnet mode — "Snap drawings to nearest plotted value" | App A (img 5, tooltip) | ✅ | Affects drawing tool placement, listed again in §6 |

---

## 5. Drawing Tools (Toolbar)
| Feature | Source | Status | Notes |
|---|---|---|---|
| Trend Line | App A (img 5), App B (img 8, left rail) | ✅ | |
| Horizontal Line | App A (img 5) | ✅ | |
| Horizontal Ray | App A (img 5) | ✅ | |
| Rectangle | App A (img 5), App B (img 8) | ✅ | |
| Fibonacci Retracement | App A (img 5) | ✅ | |
| Parallel Channel | App A (img 5) | 🕓 | Two parallel trend lines, more complex math |
| Long Position (tool) | App A (img 5) | 🕓 | Draws entry/target/stop-loss box with R:R calc |
| Short Position (tool) | App A (img 5) | 🕓 | Mirror of above |
| Path / brush freehand draw | App B (img 8, left rail) | 🕓 | |
| Text annotation tool | App B (img 8, left rail, "T") | ✅ | |
| Arrow / measure tool | App B (img 8, left rail) | 🕓 | Measures price/time distance between two points |
| Angle tool | App B (img 8, left rail) | 🕓 | |
| Flag / pin marker | App B (img 8, left rail) | 🕓 | Single-point annotation |
| Eraser / delete-single-drawing tool | App B (img 8, left rail) | ✅ | |
| Cursor/pointer default tool (deselect drawing mode) | App B (img 8, left rail, orange "+") | ✅ | Baseline state |

**Verified requirement:** every drawing tool must persist as a serializable object (type, points,
style) so it survives timeframe switches and can later be saved/loaded from a backend — matches
the `drawingAdded` / `drawingsCleared` event hooks already stubbed in the current `chart.html`.

---

## 6. Drawing Management (Tools Menu)
| Feature | Source | Status | Notes |
|---|---|---|---|
| Enable drawing toolbar (toggle) | App A (img 5) | ✅ | Shows/hides the drawing tool rail |
| Enable magnet (toggle) | App A (img 5) | ✅ | Snap-to-value behavior for all drawings |
| Hide all drawings (toggle) | App A (img 5) | ✅ | Visual hide, doesn't delete |
| Lock all drawings (toggle) | App A (img 5) | ✅ | Prevents accidental drag/edit |
| Show favourites (toggle) | App A (img 5) | ✅ | Filters drawing list to starred tools only |
| Per-tool favorite star | App A (img 5) | ✅ | Click star next to any drawing tool to pin it |

---

## 7. Indicators
| Feature | Source | Status | Notes |
|---|---|---|---|
| "Manage Indicators" modal | App A (img 7) | ✅ | Full-screen modal, search + categorized list |
| Search box for indicators | App A (img 7) | ✅ | |
| Category tabs: All, Main chart, Sub chart, AI based, OI based(+more) | App A (img 7) | ✅ (tabs) / ❌ (AI-based content) | We build the tab **mechanism**; "AI based" tab itself is out of scope per your instruction — omit or leave empty |
| Add (+) button per indicator | App A (img 7) | ✅ | |
| Favorite (★) per indicator | App A (img 7) | ✅ | |
| "Added indicators" side panel with live mini preview + empty state | App A (img 7) | ✅ | |
| Proprietary/branded indicators tagged "Only on Sahi" (Expected Move, Key Levels, Max Pain, OI Profile, OI Resistance, OI Support, Pushkar Premium Trend) | App A (img 7) | ❌ | Third-party proprietary indicators — not ours to replicate; architecture must simply support **adding custom indicators later** via the same registry |
| Generic technical indicators (52W H/L, Accumulation/Distribution, Adaptive SuperTrend, Advance/Decline Ratio, Arnaud Legoux Moving Average, etc.) | App A (img 7) | ✅ | Build an extensible indicator registry; ship a first-wave subset (MA/EMA/RSI/MACD/BB/VWAP), rest added incrementally |
| Indicators menu entry in App B top nav | App B (img 8) | ✅ | Same concept, different entry point |
| Sub-chart pane rendering (separate pane below main chart for oscillators) | Both (implicit) | ✅ | Required for RSI/MACD/Volume-oscillator style indicators |
| Per-indicator settings (edit period, color, style) | Implicit standard behavior | ✅ | Not fully visible in screenshots but required for any indicator to be usable — flagged explicitly so it isn't missed |

---

## 8. Pattern Detection Overlay
| Feature | Source | Status | Notes |
|---|---|---|---|
| "Patterns (39)" menu entry | App B (img 8, top nav) | 🕓 | Count implies a fixed catalog of candlestick patterns |
| On-chart pattern labels (3InDn, 3OutDn, Engulf−, Engulf+, DB, Rise3, 3InUp, Kick−) | App B (img 8) | 🕓 | Small text/arrow markers above/below the relevant candle |
| Marker color coding (red for bearish, green/teal for bullish) | App B (img 8) | 🕓 | |

**Note:** current codebase already has a `PatternMarker` model + `setPatternMarkers()` bridge
method — this feature slots directly into that existing hook. Detection logic stays outside the
chart engine (your backend/Dart), the engine only renders markers it's given.

---

## 9. Chart Toolbar / Top Bar (Chrome)
| Feature | Source | Status | Notes |
|---|---|---|---|
| Buy / Sell quick-action buttons | App A (img 4), App B (img 8, "S"/"B") | ❌ | Trading panel concern, not chart engine — chart engine only exposes a slot/callback for the host app to render its own buttons if desired |
| Alarm/alert bell icon | App A (img 4) | 🕓 | Price alert creation UI — chart engine exposes hook (tap-to-set-alert-at-price), actual alert logic/storage lives in host app |
| Bookmark icon (save chart layout) | App A (img 4) | 🕓 | Persist current: symbol, interval, chart type, drawings, indicators as one layout object |
| Fullscreen / expand icon | App A (img 4, corners) | ✅ | Toggles chart to fill available space |
| Settings (gear) icon | App A (img 4, 6) | ✅ | Opens Settings modal (§10) |
| "fx" icon (indicators shortcut) | App A (img 6) | ✅ | Shortcut into Manage Indicators modal |
| Grid/layout icon | App A (img 6) | 🕓 | Likely multi-pane/compare layout — flagged, not required for v1 single-chart engine |
| Drawing tools (pencil) icon | App A (img 6) | ✅ | Opens/toggles drawing tool rail |
| Chart-type (candle) icon | App A (img 6) | ✅ | Opens quick chart-type dropdown (§2) |
| Top nav: Candles, OI, Indicators, Patterns, Order Flow, Strategy, Screener, Heatmap, Calendar, News, Chart Tools, layout, AI, avatar | App B (img 8) | Mixed | Candles/Indicators/Patterns/Chart Tools = ✅/🕓 above. OI, Order Flow, Strategy, Screener, Heatmap, Calendar, News, AI, avatar/watchlist = ❌ explicitly out of scope |
| "Paper Trading" toggle | App B (img 8) | ❌ | Trading feature, not chart |
| Technical Rating gauge widget ("Strong Buy") | App B (img 8) | ❌ | Analysis/AI-adjacent widget, out of scope |

---

## 10. Settings Modal
| Feature | Source | Status | Notes |
|---|---|---|---|
| Tab: Chart type | App A (img 3) | ✅ | Covered in §2 |
| Tab: Customize | App A (img 3) | ✅ | Colors (up/down candle color, background, grid lines, text), likely per chart-type |
| Tab: View on chart | App A (img 3) | ✅ | Toggles for what overlays render: OHLC legend, volume, last-price line, etc. |

---

## 11. Volume & Multi-Pane Layout
| Feature | Source | Status | Notes |
|---|---|---|---|
| Volume histogram pane, synced x-axis with main price pane | App B (img 8) | ✅ | Already implemented in current `chart.html`; keep and formalize |
| Trend line drawable on volume pane too | App B (img 8) | 🕓 | Drawing tools should be pane-aware, not just main-pane |
| Additional sub-panes for oscillator indicators (RSI/MACD) | Implicit (§7) | ✅ | Needed once first indicators ship |

---

## 12. Theming
| Feature | Source | Status | Notes |
|---|---|---|---|
| Dark theme (both apps, default) | Both | ✅ | Already default in current code |
| Light theme | Not directly shown, but standard toggle expected | 🕓 | `setTheme()` bridge method already exists — extend it |
| Per-element color customization (via Settings > Customize) | App A (img 3) | ✅ | See §10 |

---

## 13. Explicitly Out of Scope (confirmed with you)
- Watchlist panel (App B right sidebar, NIFTY 50 / BANK NIFTY / BTCUSDT tiles)
- AI button / AI-based indicator tab / Technical Rating gauge
- News, Calendar, Screener, Heatmap, Strategy backtester, Order Flow analytics
- Symbol search bar (host app's concern, not the chart engine's)
- Actual Buy/Sell trade execution, Paper Trading toggle
- Proprietary "Only on Sahi" indicators (Expected Move, Key Levels, Max Pain, OI Profile/Resistance/Support, Pushkar Premium Trend) — not ours to copy, but registry must be extensible enough to add custom ones later if you build your own

---

## 14. Cross-Check Summary (sanity count)
- Chart types: **7** identified (Line, Step Line, Area, Candle, Heikin Ashi, Hollow Candle, Renko) + Bar added by us = 8
- Drawing tools: **13** identified across both apps
- Nav controls: **5** (zoom in/out, pan left/right, reset)
- Toolbar chrome icons (chart-relevant only): **6** (crosshair mode, fx/indicators, drawing tools, chart type, settings, fullscreen)
- Settings modal tabs: **3**
- Drawing-management toggles: **5**
- Indicator-modal mechanisms: search, 2+ real category tabs, add, favorite, added-list, per-item settings = **6** mechanisms (content itself is data-driven, not hardcoded)

This list is the single source of truth for scope. Any new screenshot/feature request later should
be **appended here first**, then reflected into the implementation plan — never implemented ad hoc.
