# Chart Bridge API Spec — Dart ⇄ JS Contract

This is the authoritative reference for the engine's external surface. Anything not listed here
does not exist yet — if implementation needs something not in this file, **update this file
first**, then implement. This prevents silent API drift between the Dart and JS sides.

Calling convention (unchanged from current code, extended, never replaced):
- **Dart → JS:** `window.ChartBridge.<method>(<jsonString or primitive args>)`
- **JS → Dart:** `emitEvent(String eventName, Object payload)` → arrives in Flutter as
  `ChartEventCallback(String event, Map<String, dynamic> payload)`

All JSON payloads are documented here as if already decoded (i.e. as Dart Maps / JS objects), even
though the wire format is a JSON string per the existing `_escape()`-based calling pattern.

---

## Dart → JS Methods

| Method | Phase | Args | Returns | Notes |
|---|---|---|---|---|
| `setData(bars)` | existing | `List<ChartBar>` | — | Already implemented |
| `addOrUpdateBar(bar)` | existing | `ChartBar` | — | Already implemented |
| `setPatternMarkers(markers)` | existing | `List<PatternMarker>` | — | Already implemented |
| `setTheme(themePayload)` | 0 / 7 | `ChartTheme` (extended in Phase 7 from the current `{background, text}` to full token set — see Model section) | — | Backward compatible: old 2-field payload still valid, new fields optional with sane defaults |
| `setChartType(type)` | 1 | `String` (one of `ChartType` enum values) | — | |
| `setAvailableIntervals(intervals)` | 2 | `List<Interval>` | — | Controls what the timeframe selector offers |
| `setDrawings(drawings)` | 5 | `List<Drawing>` | — | Full replace of drawing set (used for load-from-saved-layout) |
| `setIndicators(indicators)` | 8 | `List<IndicatorConfig>` | — | Full replace of active indicator set |
| `getLayout()` | 10 | — | `ChartLayout` (via a request/response pattern — see note below) | |
| `applyLayout(layout)` | 10 | `ChartLayout` | — | One-call full restore |

**Note on `getLayout()`:** unlike the fire-and-forget methods above, this needs a response. Two
implementation options (decide during Phase 10, document the choice here once made):
1. JS immediately emits `emitEvent('layoutSnapshot', layoutJson)` right after being asked, and Dart
   listens for that event once — simplest, reuses existing one-way plumbing, no new transport.
2. A real request/response channel (e.g. `evaluateJavascript` returning a value on web,
   equivalent on mobile) — more "correct" RPC shape but adds platform-specific complexity.
Recommendation: start with option 1 (event-based) since it reuses proven plumbing; only move to
option 2 if a real bidirectional need arises.

---

## JS → Dart Events

| Event | Phase | Payload | Notes |
|---|---|---|---|
| `jsError` | existing | `{message}` | Already implemented, wired to red SnackBar in demo |
| `timeframeChanged` | existing / extended in 2 | `{interval, unit, rangeShortcut?}` | App must refetch bars and call `setData()` again |
| `chartTypeChanged` | 1 | `{type}` | Informational — engine already applies the change itself |
| `drawingAdded` | 5 | `Drawing` (full object) | |
| `drawingUpdated` | 5 | `Drawing` (full object, same `id`) | Fired on drag/resize/edit |
| `drawingDeleted` | 5 | `{id}` | |
| `indicatorAdded` | 8 | `IndicatorConfig` | |
| `indicatorRemoved` | 8 | `{id}` | |
| `alertRequested` | 10 | `{price, time?}` | App owns all alert storage/notification logic |
| `fullscreenChanged` | 10 | `{isFullscreen: bool}` | So app can hide its own chrome while active |
| `layoutSnapshot` | 10 | `ChartLayout` | Response to `getLayout()`, see note above |

---

## Models (Dart-side shape, mirrored 1:1 in JS as plain objects)

### `ChartBar` (existing, unchanged)
```
{ time: int, open: double, high: double, low: double, close: double, volume: double }
```

### `PatternMarker` (existing, unchanged)
```
{ time: int, position: 'aboveBar'|'belowBar', color: string, shape: 'arrowUp'|'arrowDown'|'circle'|'square', text: string }
```

### `ChartType` (Phase 1, new enum)
```
'line' | 'stepLine' | 'area' | 'candle' | 'heikinAshi' | 'hollowCandle' | 'bar' | 'renko'
```

### `Interval` (Phase 2, new)
```
{ label: string, value: int, unit: 'minute'|'hour'|'day'|'week'|'month' }
```

### `Drawing` (Phase 5, new — one shape, `type` discriminates)
```
{
  id: string,
  type: 'trendLine'|'horizontalLine'|'horizontalRay'|'rectangle'|'fibonacci'|
        'parallelChannel'|'longPosition'|'shortPosition'|'text'|'measure'|
        'angle'|'path'|'flag',
  points: [{ time: int, price: double }, ...],   // count/meaning depends on `type`
  style: { color: string, lineWidth: int, fillOpacity?: double, fontSize?: int },
  text?: string,          // for the Text tool
  locked: bool,
  hidden: bool,
  favorite: bool
}
```

### `IndicatorConfig` (Phase 8, new)
```
{
  id: string,             // instance id, unique per added indicator
  indicatorId: string,    // registry key, e.g. 'sma', 'rsi'
  displayName: string,
  category: 'main'|'sub',
  params: { [key: string]: number|string },   // e.g. { period: 14 }
  color: string,
  favorite: bool
}
```

### `ChartTheme` (Phase 7, extends existing 2-field payload)
```
{
  background: string,      // existing field
  text: string,             // existing field
  upColor?: string,
  downColor?: string,
  gridLineColor?: string,
  crosshairColor?: string,
  wickUpColor?: string,
  wickDownColor?: string
}
```

### `ChartLayout` (Phase 10, new — the "everything" object)
```
{
  chartType: ChartType,
  interval: Interval,
  theme: ChartTheme,
  drawings: [Drawing],
  indicators: [IndicatorConfig],
  toggles: {
    drawingToolbarEnabled: bool,
    magnetEnabled: bool,
    drawingsHidden: bool,
    drawingsLocked: bool,
    showFavoritesOnly: bool,
    ohlcLegendVisible: bool,
    volumePaneVisible: bool,
    lastPriceLineVisible: bool
  }
}
```

---

## Change Log
- v0.1.0 (baseline, Phase 0): `setData`, `addOrUpdateBar`, `setPatternMarkers`, `setTheme`
  (2-field), `jsError`, `timeframeChanged` — matches the uploaded code as-is.
- *(Add a dated entry here every time a phase actually ships a bridge change — do not batch
  multiple phases into one entry, since this log doubles as the resumability trail for anyone
  picking the project back up.)*
