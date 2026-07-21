# chart_engine

A standalone, high-performance charting package for Flutter — built on [Lightweight Charts™](https://www.tradingview.com/lightweight-charts/) with a fully custom toolbar, drawing tools, technical indicators, and a Dart ↔ JS bridge. Drop it into any Flutter app (Web & Mobile) with a single widget.

> **Version:** 0.1.0  
> **Dart SDK:** ^3.12.2  
> **Platforms:** Android, iOS, Web  
> **License:** Proprietary (internal use)

---

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [API Reference](#api-reference)
  - [ChartView (Widget)](#chartview-widget)
  - [ChartController](#chartcontroller)
  - [ChartBar](#chartbar)
  - [ChartType](#charttype)
  - [ChartInterval](#chartinterval)
  - [ChartTheme](#charttheme)
  - [IndicatorConfig](#indicatorconfig)
  - [Drawing](#drawing)
  - [DrawingPoint](#drawingpoint)
  - [DrawingStyle](#drawingstyle)
  - [PatternMarker](#patternmarker)
  - [ChartLayout](#chartlayout)
  - [LayoutToggles](#layouttoggles)
  - [ChartEvents](#chartevents)
  - [ChartEventCallback](#charteventcallback)
  - [Bridge Codec Helpers](#bridge-codec-helpers)
- [Chart Types](#chart-types)
- [Technical Indicators](#technical-indicators)
- [Drawing Tools](#drawing-tools)
- [Theming](#theming)
- [Layout Persistence](#layout-persistence)
- [Events & Callbacks](#events--callbacks)
- [Architecture](#architecture)
- [Build Tool (Mobile HTML)](#build-tool-mobile-html)
- [Example App](#example-app)
- [Troubleshooting](#troubleshooting)

---

## Features

| Category | Details |
|---|---|
| **Chart Types** | Candlestick, Line, Step Line, Area, Heikin Ashi, Hollow Candlestick, Bar (OHLC), Renko |
| **Technical Indicators** | SMA, EMA, RSI (with 70/30 reference lines), MACD (line + signal + histogram), Bollinger Bands, VWAP, ATR |
| **Drawing Tools** | Trend Line, Horizontal Line, Horizontal Ray, Vertical Line, Extended Line, Ray, Parallel Channel, Rectangle, Fibonacci Retracement, Long Position, Short Position, Text Annotation, Measure/Ruler, Price Label, Flag/Pin Marker, Angle Tool, Freehand Path |
| **Drawing Management** | Toolbar toggle, Magnet mode, Hide all, Lock all, Favorites rail, Right-click context menu, Style editor, Undo/Redo (Ctrl+Z / Ctrl+Y) |
| **UI Chrome** | OHLC Legend bar, Volume pane, Floating navigation cluster, Fullscreen mode, Alert gesture hook |
| **Theming** | Full dark/light presets with 28+ customizable properties. Override only what you need via `copyWith()`. |
| **Layout Persistence** | Serialize/deserialize the entire chart state (type, interval, theme, drawings, indicators, toggles) to/from JSON |
| **Platform Support** | Single `ChartView` API — conditionally imports Web (iframe + `dart:js_interop`) or Mobile (WebView + `webview_flutter`) implementations |
| **Live Tick Updates** | `addOrUpdateBar()` for real-time streaming with throttled indicator recalculation |
| **Pattern Markers** | Overlay arrow/circle/square markers above or below bars for candlestick pattern detection |

---

## Installation

`chart_engine` is a local path package. Add it to your app's `pubspec.yaml`:

```yaml
dependencies:
  chart_engine:
    path: packages/chart_engine
```

Then run:

```bash
flutter pub get
```

### Web Setup

Copy (or symlink) the `chart.html` and `lightweight-charts.standalone.production.js` from the package assets into your Flutter app's `web/chart/` directory:

```
your_app/
├── web/
│   └── chart/
│       ├── chart.html
│       └── lightweight-charts.standalone.production.js
```

### Mobile Setup

No extra setup required. The package ships a self-contained `chart_mobile.html` (all JS inlined) that loads via `webview_flutter`'s `loadFlutterAsset()`.

> **Important:** After modifying any JS file under `assets/chart/js/`, you must regenerate `chart_mobile.html`. See [Build Tool (Mobile HTML)](#build-tool-mobile-html).

---

## Quick Start

```dart
import 'package:chart_engine/chart_engine.dart';
import 'package:flutter/material.dart';

class MyChartScreen extends StatefulWidget {
  const MyChartScreen({super.key});

  @override
  State<MyChartScreen> createState() => _MyChartScreenState();
}

class _MyChartScreenState extends State<MyChartScreen> {
  ChartController? _controller;

  void _onChartCreated(ChartController controller) {
    _controller = controller;

    // Load historical data
    controller.setData([
      ChartBar(time: 1700000000, open: 100, high: 105, low: 98, close: 103, volume: 1500),
      ChartBar(time: 1700000060, open: 103, high: 108, low: 101, close: 106, volume: 1200),
      // ... more bars
    ]);
  }

  void _onChartEvent(String event, Map<String, dynamic> payload) {
    debugPrint('Chart event: $event → $payload');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: ChartView(
        onCreated: _onChartCreated,
        onEvent: _onChartEvent,
      ),
    );
  }
}
```

---

## API Reference

### ChartView (Widget)

The main widget that renders the chart. Platform-agnostic — it automatically selects the correct implementation (Web iframe or Mobile WebView) at compile time.

```dart
ChartView({
  Key? key,
  required void Function(ChartController controller) onCreated,
  ChartEventCallback? onEvent,
  double? width,
  double? height,
})
```

#### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `onCreated` | `void Function(ChartController)` | **Yes** | Called once the underlying web view / DOM element is fully loaded and ready. Provides the `ChartController` instance for all subsequent interactions. |
| `onEvent` | `ChartEventCallback?` | No | Callback for events emitted FROM the chart JS engine back to Dart (e.g., drawing added, timeframe changed, JS error). See [ChartEvents](#chartevents). |
| `width` | `double?` | No | Optional fixed width constraint. If omitted, the chart expands to fill available space. |
| `height` | `double?` | No | Optional fixed height constraint. If omitted, the chart expands to fill available space. |

#### Example — Fixed size chart

```dart
ChartView(
  width: 800,
  height: 500,
  onCreated: (controller) => controller.setData(myBars),
  onEvent: (event, payload) => print('$event: $payload'),
)
```

#### Example — Full screen chart

```dart
Expanded(
  child: ChartView(
    onCreated: _onChartCreated,
    onEvent: _onChartEvent,
  ),
)
```

---

### ChartController

Abstract class — the primary API surface for interacting with the chart. You never construct this directly; it is provided via `ChartView.onCreated`.

All methods return `Future<void>` and communicate with the chart JS engine via the bridge.

#### Methods

| Method | Signature | Description |
|---|---|---|
| `setData` | `Future<void> setData(List<ChartBar> bars)` | Replaces **all** chart data with the provided bars. Triggers a full redraw, indicator recalculation, drawing overlay redraw, and auto-fits the time scale. |
| `addOrUpdateBar` | `Future<void> addOrUpdateBar(ChartBar bar)` | Updates the last bar if `bar.time` matches, or appends a new bar. Designed for live tick streaming. Indicator recalculation is **throttled** (200ms) for performance. |
| `setPatternMarkers` | `Future<void> setPatternMarkers(List<PatternMarker> markers)` | Renders pattern detection markers (arrows, circles, squares) above or below specific bars on the main series. |
| `setTheme` | `Future<void> setTheme(ChartTheme theme)` | Applies a complete theme to the chart engine — background, candle colors, grid, toolbar, typography, and more. |
| `setChartType` | `Future<void> setChartType(ChartType type)` | Switches the chart series type (e.g., from candlestick to line chart). Automatically transforms data as needed (e.g., Heikin Ashi averaging, Renko brick building). |
| `setAvailableIntervals` | `Future<void> setAvailableIntervals(List<ChartInterval> intervals)` | Sets the list of timeframe intervals available in the chart toolbar. |
| `setDrawings` | `Future<void> setDrawings(List<Drawing> drawings)` | Loads a complete set of drawings onto the chart, replacing any existing drawings. |
| `setIndicators` | `Future<void> setIndicators(List<IndicatorConfig> indicators)` | Clears all active indicators and applies the provided configurations. Each indicator is created, its series are added to the chart, and calculations are run. |
| `getLayout` | `Future<void> getLayout()` | Requests a full layout snapshot from the chart. The result is emitted as a `layoutSnapshot` event via `onEvent`. |
| `applyLayout` | `Future<void> applyLayout(ChartLayout layout)` | Restores a previously saved layout — chart type, interval, theme, drawings, indicators, and toggles are all applied. |

#### Usage Pattern — Live streaming

```dart
void _onChartCreated(ChartController controller) {
  _controller = controller;
  controller.setData(historicalBars);
}

// Call from your WebSocket listener (batch every 100–250ms, not per raw tick)
void onTickReceived(ChartBar tick) {
  _controller?.addOrUpdateBar(tick);
}
```

#### Usage Pattern — Switching chart type

```dart
_controller?.setChartType(ChartType.heikinAshi);
```

#### Usage Pattern — Adding indicators

```dart
_controller?.setIndicators([
  IndicatorConfig(
    id: 'sma_20',
    indicatorId: 'sma',
    displayName: 'SMA (20)',
    category: 'main',
    params: {'period': 20},
    color: '#f0b90b',
  ),
  IndicatorConfig(
    id: 'rsi_14',
    indicatorId: 'rsi',
    displayName: 'RSI (14)',
    category: 'sub',
    params: {'period': 14},
    color: '#a78bfa',
  ),
]);
```

---

### ChartBar

A single OHLCV (Open, High, Low, Close, Volume) price bar.

```dart
class ChartBar {
  final int time;
  final double open, high, low, close, volume;

  const ChartBar({
    required this.time,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    this.volume = 0,
  });

  Map<String, dynamic> toJson();
}
```

#### Properties

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `time` | `int` | **Yes** | — | Unix timestamp in **seconds** (not milliseconds). Must match Lightweight Charts' expected format. |
| `open` | `double` | **Yes** | — | Opening price of the bar. |
| `high` | `double` | **Yes** | — | Highest price during the bar's time interval. |
| `low` | `double` | **Yes** | — | Lowest price during the bar's time interval. |
| `close` | `double` | **Yes** | — | Closing price of the bar. |
| `volume` | `double` | No | `0` | Trading volume for the bar. Used by the volume pane and VWAP indicator. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes the bar to a JSON-compatible map for the JS bridge. |

#### Example

```dart
final bar = ChartBar(
  time: DateTime.now().millisecondsSinceEpoch ~/ 1000,
  open: 64000.0,
  high: 64250.5,
  low: 63800.0,
  close: 64100.0,
  volume: 1.5,
);
```

> **Note:** `time` must be in **seconds**. To convert from Dart's `DateTime`:
> ```dart
> final timeInSeconds = DateTime.now().millisecondsSinceEpoch ~/ 1000;
> ```

---

### ChartType

Enum representing the available chart series types.

```dart
enum ChartType {
  line,
  stepLine,
  area,
  candle,
  heikinAshi,
  hollowCandle,
  bar,
  renko,
}
```

#### Values

| Value | Description |
|---|---|
| `line` | Continuous line connecting close prices. Clean, minimal view. |
| `stepLine` | Line chart with discrete horizontal/vertical steps instead of diagonal connections. |
| `area` | Close-price line with gradient fill to the bottom. Great for dashboards. |
| `candle` | **Default.** Standard candlestick chart showing OHLC with filled/hollow bodies and wicks. |
| `heikinAshi` | Smoothed candlesticks using averaging formula. Filters trend noise. |
| `hollowCandle` | Bullish candles have hollow (transparent) bodies; bearish candles are solid filled. |
| `bar` | OHLC bar chart — vertical high-low line with left (open) and right (close) ticks. |
| `renko` | Time-independent brick chart. New bricks added only when price moves by a threshold. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `String` | Returns the enum's name as a string (e.g., `'candle'`, `'heikinAshi'`). |
| `fromString(String val)` | `ChartType` | Static method. Parses a string back to a `ChartType`. Falls back to `ChartType.candle` if unrecognized. |

#### Example

```dart
// Switch to Heikin Ashi
controller.setChartType(ChartType.heikinAshi);

// Parse from saved layout
final type = ChartType.fromString('area'); // ChartType.area
```

---

### ChartInterval

Represents a timeframe/interval for the chart (e.g., 1 minute, 5 minutes, 1 day).

```dart
class ChartInterval {
  final String label;
  final int value;
  final String unit;

  const ChartInterval({
    required this.label,
    required this.value,
    required this.unit,
  });
}
```

#### Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `label` | `String` | **Yes** | Display label shown in the toolbar (e.g., `'1m'`, `'5m'`, `'1H'`, `'D'`). |
| `value` | `int` | **Yes** | Numeric value of the interval (e.g., `1`, `5`, `15`, `60`). |
| `unit` | `String` | **Yes** | Time unit. One of: `'minute'`, `'hour'`, `'day'`, `'week'`, `'month'`. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. |
| `fromJson(Map<String, dynamic>)` | `ChartInterval` | Factory constructor. Deserializes from JSON. |

#### Example

```dart
controller.setAvailableIntervals([
  ChartInterval(label: '1m', value: 1, unit: 'minute'),
  ChartInterval(label: '5m', value: 5, unit: 'minute'),
  ChartInterval(label: '15m', value: 15, unit: 'minute'),
  ChartInterval(label: '1H', value: 60, unit: 'minute'),
  ChartInterval(label: 'D', value: 1, unit: 'day'),
  ChartInterval(label: 'W', value: 1, unit: 'week'),
]);
```

---

### ChartTheme

Comprehensive theme configuration. All color values are CSS-compatible hex strings (e.g., `'#131722'`). Every property has a sensible default — consumers only override what they need.

```dart
const ChartTheme({
  required this.background,
  required this.text,
  // ... all other properties have defaults
});
```

#### Properties

##### Core Colors

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `background` | `String` | **Yes** | — | Chart background color. |
| `text` | `String` | **Yes** | — | Primary text / label color. |
| `upColor` | `String` | No | `'#26a69a'` | Bullish candle body color (green/teal). |
| `downColor` | `String` | No | `'#ef5350'` | Bearish candle body color (red). |
| `gridLineColor` | `String` | No | `'#202431'` | Grid line color. |
| `crosshairColor` | `String` | No | `'#758696'` | Crosshair line color. |
| `wickUpColor` | `String?` | No | `null` | Bullish candle wick color. Defaults to `upColor` if null. |
| `wickDownColor` | `String?` | No | `null` | Bearish candle wick color. Defaults to `downColor` if null. |

##### Volume Pane Colors

| Property | Type | Default | Description |
|---|---|---|---|
| `volumeUpColor` | `String` | `'#26a69a55'` | Volume bar color for bullish bars (semi-transparent). |
| `volumeDownColor` | `String` | `'#ef535055'` | Volume bar color for bearish bars (semi-transparent). |

##### Series Colors (Line / Area / StepLine / Baseline)

| Property | Type | Default | Description |
|---|---|---|---|
| `lineSeriesColor` | `String` | `'#5b9cf6'` | Line series color. |
| `areaTopColor` | `String` | `'#5b9cf655'` | Area chart gradient top color. |
| `areaBottomColor` | `String` | `'#5b9cf600'` | Area chart gradient bottom color (transparent). |

##### Toolbar / Chrome Colors

| Property | Type | Default | Description |
|---|---|---|---|
| `toolbarBackground` | `String` | `'#1e222d'` | Toolbar background color. |
| `toolbarBorder` | `String` | `'#2a2e39'` | Toolbar border color. |
| `toolbarText` | `String` | `'#b2b5be'` | Toolbar text color. |
| `toolbarActiveBackground` | `String` | `'#2962ff33'` | Active toolbar button background. |
| `toolbarActiveText` | `String` | `'#5b9cf6'` | Active toolbar button text color. |
| `toolbarHoverBackground` | `String` | `'#2a2e39'` | Toolbar button hover background. |

##### Drawing Defaults

| Property | Type | Default | Description |
|---|---|---|---|
| `drawingDefaultColor` | `String` | `'#5b9cf6'` | Default color for new drawings. |

##### Typography

| Property | Type | Default | Description |
|---|---|---|---|
| `fontFamily` | `String` | `"-apple-system, 'Segoe UI', Roboto, sans-serif"` | CSS font-family string. |
| `fontSize` | `int` | `12` | Base font size in pixels. |
| `fontWeight` | `int` | `400` | CSS font weight (100–900). |

##### Layout Dimensions

| Property | Type | Default | Description |
|---|---|---|---|
| `toolbarHeight` | `int` | `44` | Top toolbar height in pixels. |
| `bottomBarHeight` | `int` | `30` | Bottom bar height in pixels. |
| `toolRailWidth` | `int` | `40` | Drawing tool rail width in pixels. |

##### Line Styles

| Property | Type | Default | Description |
|---|---|---|---|
| `defaultLineWidth` | `int` | `2` | Default line width for drawings. |

##### Scale / Axis

| Property | Type | Default | Description |
|---|---|---|---|
| `scaleBorderColor` | `String` | `'#2a2e39'` | Price/time scale axis border color. |

#### Factory Constructors

| Constructor | Description |
|---|---|
| `ChartTheme.dark()` | Professional dark trading look. Background: `#131722`, Text: `#b2b5be`. |
| `ChartTheme.light()` | Clean light theme. Background: `#ffffff`, Text: `#131722`, with adjusted greens/reds and toolbar colors. |
| `ChartTheme.fromJson(Map<String, dynamic>)` | Deserializes from a JSON map. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes all theme properties to JSON. |
| `copyWith({...})` | `ChartTheme` | Creates a copy with only specified fields overridden. Accepts all 28 properties as optional named parameters. |

#### Example — Dark theme with custom candle colors

```dart
controller.setTheme(
  ChartTheme.dark().copyWith(
    upColor: '#3FB950',
    downColor: '#F85149',
    gridLineColor: '#1a1e2e',
  ),
);
```

#### Example — Fully custom brand theme

```dart
controller.setTheme(
  ChartTheme(
    background: '#0a0e17',
    text: '#c9d1d9',
    upColor: '#00d4aa',
    downColor: '#ff6b6b',
    toolbarBackground: '#161b22',
    toolbarText: '#8b949e',
    fontFamily: "'Inter', sans-serif",
  ),
);
```

---

### IndicatorConfig

Configuration for a single technical indicator instance.

```dart
class IndicatorConfig {
  final String id;
  final String indicatorId;
  final String displayName;
  final String category;
  final Map<String, dynamic> params;
  final String color;
  final bool favorite;

  const IndicatorConfig({
    required this.id,
    required this.indicatorId,
    required this.displayName,
    required this.category,
    required this.params,
    required this.color,
    this.favorite = false,
  });
}
```

#### Properties

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | **Yes** | — | Unique instance identifier (e.g., `'sma_20'`). Must be unique across all active indicators. |
| `indicatorId` | `String` | **Yes** | — | The indicator type key. Must match a registered indicator: `'sma'`, `'ema'`, `'rsi'`, `'macd'`, `'bb'`, `'vwap'`, `'atr'`. |
| `displayName` | `String` | **Yes** | — | Human-readable name shown in the chart legend (e.g., `'SMA (20)'`). |
| `category` | `String` | **Yes** | — | Where to render: `'main'` (overlay on price chart) or `'sub'` (separate sub-pane below). |
| `params` | `Map<String, dynamic>` | **Yes** | — | Indicator-specific parameters. See [Technical Indicators](#technical-indicators) for each indicator's params. |
| `color` | `String` | **Yes** | — | CSS hex color for the indicator line (e.g., `'#f0b90b'`). |
| `favorite` | `bool` | No | `false` | Whether this indicator is marked as a favorite. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. |
| `fromJson(Map<String, dynamic>)` | `IndicatorConfig` | Factory constructor. Deserializes from JSON. |

---

### Drawing

Represents a single drawing object on the chart (trend line, rectangle, Fibonacci, etc.).

```dart
class Drawing {
  final String id;
  final String type;
  final List<DrawingPoint> points;
  final DrawingStyle style;
  final String? text;
  final bool locked;
  final bool hidden;
  final bool favorite;

  const Drawing({
    required this.id,
    required this.type,
    required this.points,
    required this.style,
    this.text,
    this.locked = false,
    this.hidden = false,
    this.favorite = false,
  });
}
```

#### Properties

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `String` | **Yes** | — | Unique drawing identifier. |
| `type` | `String` | **Yes** | — | Drawing tool type. See [Drawing Tools](#drawing-tools) for the full list. |
| `points` | `List<DrawingPoint>` | **Yes** | — | Anchor points that define the drawing's geometry (1–3 points depending on tool type). |
| `style` | `DrawingStyle` | **Yes** | — | Visual styling (color, line width, fill opacity, font size). |
| `text` | `String?` | No | `null` | Text content for text annotations and labels. |
| `locked` | `bool` | No | `false` | If `true`, the drawing cannot be moved or edited. |
| `hidden` | `bool` | No | `false` | If `true`, the drawing is not rendered but remains in state. |
| `favorite` | `bool` | No | `false` | Whether this drawing is starred as a favorite. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. |
| `fromJson(Map<String, dynamic>)` | `Drawing` | Factory constructor. Deserializes from JSON. |

---

### DrawingPoint

A time-price coordinate for a drawing anchor.

```dart
class DrawingPoint {
  final int time;
  final double price;

  const DrawingPoint({
    required this.time,
    required this.price,
  });
}
```

#### Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `time` | `int` | **Yes** | Unix timestamp in seconds. |
| `price` | `double` | **Yes** | Price level at this anchor point. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. |
| `fromJson(Map<String, dynamic>)` | `DrawingPoint` | Factory constructor. Deserializes from JSON. |

---

### DrawingStyle

Visual style configuration for a drawing.

```dart
class DrawingStyle {
  final String color;
  final int lineWidth;
  final double? fillOpacity;
  final int? fontSize;

  const DrawingStyle({
    required this.color,
    required this.lineWidth,
    this.fillOpacity,
    this.fontSize,
  });
}
```

#### Properties

| Property | Type | Required | Default | Description |
|---|---|---|---|---|
| `color` | `String` | **Yes** | — | CSS hex color string (e.g., `'#5b9cf6'`). |
| `lineWidth` | `int` | **Yes** | — | Line width in pixels. |
| `fillOpacity` | `double?` | No | `null` | Fill opacity (0.0–1.0) for filled shapes like rectangles and channels. |
| `fontSize` | `int?` | No | `null` | Font size for text-based drawings (text annotation, price label). |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. Omits null fields. |
| `fromJson(Map<String, dynamic>)` | `DrawingStyle` | Factory constructor. Deserializes from JSON. |

---

### PatternMarker

A marker rendered above or below a specific bar — used for candlestick pattern detection overlays (e.g., "Doji", "Hammer", "Engulfing").

```dart
class PatternMarker {
  final int time;
  final String position;
  final String color;
  final String shape;
  final String text;

  const PatternMarker({
    required this.time,
    required this.position,
    required this.color,
    required this.shape,
    required this.text,
  });
}
```

#### Properties

| Property | Type | Required | Description |
|---|---|---|---|
| `time` | `int` | **Yes** | Unix timestamp (seconds) of the bar to mark. |
| `position` | `String` | **Yes** | Marker position relative to the bar: `'aboveBar'` or `'belowBar'`. |
| `color` | `String` | **Yes** | Marker color (CSS hex). |
| `shape` | `String` | **Yes** | Marker shape: `'arrowUp'`, `'arrowDown'`, `'circle'`, or `'square'`. |
| `text` | `String` | **Yes** | Label text displayed alongside the marker (e.g., `'Hammer'`, `'Doji'`). |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. |

#### Example

```dart
controller.setPatternMarkers([
  PatternMarker(
    time: 1700000120,
    position: 'belowBar',
    color: '#26a69a',
    shape: 'arrowUp',
    text: 'Hammer',
  ),
  PatternMarker(
    time: 1700000300,
    position: 'aboveBar',
    color: '#ef5350',
    shape: 'arrowDown',
    text: 'Shooting Star',
  ),
]);
```

---

### ChartLayout

A complete snapshot of the chart state — serializable to/from JSON for persistence and cloud sync.

```dart
class ChartLayout {
  final ChartType chartType;
  final ChartInterval interval;
  final ChartTheme theme;
  final List<Drawing> drawings;
  final List<IndicatorConfig> indicators;
  final LayoutToggles toggles;

  const ChartLayout({
    required this.chartType,
    required this.interval,
    required this.theme,
    required this.drawings,
    required this.indicators,
    required this.toggles,
  });
}
```

#### Properties

| Property | Type | Description |
|---|---|---|
| `chartType` | `ChartType` | The active chart series type. |
| `interval` | `ChartInterval` | The active timeframe interval. |
| `theme` | `ChartTheme` | Complete theme configuration. |
| `drawings` | `List<Drawing>` | All drawings on the chart. |
| `indicators` | `List<IndicatorConfig>` | All active indicator configurations. |
| `toggles` | `LayoutToggles` | UI toggle states (toolbar, magnet, etc.). |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes the entire layout to JSON. |
| `fromJson(Map<String, dynamic>)` | `ChartLayout` | Factory constructor. Deserializes from JSON. |

---

### LayoutToggles

UI toggle states that are part of the chart layout.

```dart
class LayoutToggles {
  final bool drawingToolbarEnabled;
  final bool magnetEnabled;
  final bool drawingsHidden;
  final bool drawingsLocked;
  final bool showFavoritesOnly;
  final bool ohlcLegendVisible;
  final bool volumePaneVisible;
  final bool lastPriceLineVisible;

  const LayoutToggles({
    required this.drawingToolbarEnabled,
    required this.magnetEnabled,
    required this.drawingsHidden,
    required this.drawingsLocked,
    required this.showFavoritesOnly,
    required this.ohlcLegendVisible,
    required this.volumePaneVisible,
    required this.lastPriceLineVisible,
  });
}
```

#### Properties

| Property | Type | Default (fromJson) | Description |
|---|---|---|---|
| `drawingToolbarEnabled` | `bool` | `true` | Whether the drawing tool rail is visible. |
| `magnetEnabled` | `bool` | `false` | Whether drawing anchor points snap to the nearest OHLC value. |
| `drawingsHidden` | `bool` | `false` | Whether all drawings are hidden (but not deleted). |
| `drawingsLocked` | `bool` | `false` | Whether all drawings are locked from editing/dragging. |
| `showFavoritesOnly` | `bool` | `false` | Whether the tool rail shows only favorited drawing tools. |
| `ohlcLegendVisible` | `bool` | `true` | Whether the OHLC legend bar (top-left readout) is visible. |
| `volumePaneVisible` | `bool` | `true` | Whether the volume histogram pane is visible. |
| `lastPriceLineVisible` | `bool` | `true` | Whether the last-price horizontal line is displayed. |

#### Methods

| Method | Return | Description |
|---|---|---|
| `toJson()` | `Map<String, dynamic>` | Serializes to JSON. |
| `fromJson(Map<String, dynamic>)` | `LayoutToggles` | Factory constructor. Deserializes with sensible defaults. |

---

### ChartEvents

Static class containing typed event name constants for all events emitted by the chart JS engine. Using these constants prevents typo bugs when comparing event names.

```dart
class ChartEvents {
  static const String jsError = 'jsError';
  static const String timeframeChanged = 'timeframeChanged';
  static const String drawingAdded = 'drawingAdded';
  static const String drawingUpdated = 'drawingUpdated';
  static const String drawingDeleted = 'drawingDeleted';
  static const String drawingsCleared = 'drawingsCleared';
  static const String chartTypeChanged = 'chartTypeChanged';
  static const String indicatorAdded = 'indicatorAdded';
  static const String indicatorRemoved = 'indicatorRemoved';
  static const String alertRequested = 'alertRequested';
  static const String fullscreenChanged = 'fullscreenChanged';
  static const String layoutSnapshot = 'layoutSnapshot';
}
```

#### Event Reference

| Event | Payload | Description |
|---|---|---|
| `jsError` | `{ message: String }` | A JavaScript error occurred inside the chart engine. |
| `timeframeChanged` | `{ tf: String, interval: int, unit: String, rangeShortcut: String? }` | User changed the timeframe via the toolbar. `tf` is the label (e.g., `'5'`). |
| `drawingAdded` | Drawing JSON object | A drawing was added by the user. |
| `drawingUpdated` | Drawing JSON object | A drawing was modified (moved, restyled). |
| `drawingDeleted` | `{ id: String }` | A drawing was deleted. |
| `drawingsCleared` | `{}` | All drawings were cleared. |
| `chartTypeChanged` | `{ type: String }` | The chart type was changed. |
| `indicatorAdded` | `{ id: String, indicatorId: String, params: Map, color: String }` | An indicator was added. |
| `indicatorRemoved` | `{ id: String }` | An indicator was removed. |
| `alertRequested` | `{ price: double }` | User requested a price alert (bell icon / double-click on price axis). |
| `fullscreenChanged` | `{ fullscreen: bool }` | Fullscreen mode was toggled. |
| `layoutSnapshot` | Full layout JSON | Response to `getLayout()`. Contains the entire chart state. |

#### Example — Handling events

```dart
void _onChartEvent(String event, Map<String, dynamic> payload) {
  switch (event) {
    case ChartEvents.jsError:
      showErrorSnackbar('Chart Error: ${payload['message']}');
      break;
    case ChartEvents.timeframeChanged:
      final interval = payload['tf'] as String;
      loadNewData(interval);
      break;
    case ChartEvents.drawingAdded:
      saveDrawingToDatabase(payload);
      break;
    case ChartEvents.alertRequested:
      createPriceAlert(payload['price'] as double);
      break;
    case ChartEvents.layoutSnapshot:
      saveLayoutToCloud(payload);
      break;
  }
}
```

---

### ChartEventCallback

Type alias for the event callback function signature.

```dart
typedef ChartEventCallback = void Function(
  String event,
  Map<String, dynamic> payload,
);
```

---

### Bridge Codec Helpers

Internal utility functions for encoding Dart models to JSON strings for the JS bridge. These are used by the platform-specific controllers and are exported for advanced usage.

| Function | Signature | Description |
|---|---|---|
| `jsonEncodeBars` | `String jsonEncodeBars(List<ChartBar> bars)` | Encodes a list of bars to a JSON string. |
| `jsonEncodeBar` | `String jsonEncodeBar(ChartBar bar)` | Encodes a single bar to a JSON string. |
| `jsonEncodeMarkers` | `String jsonEncodeMarkers(List<PatternMarker> markers)` | Encodes pattern markers to a JSON string. |
| `jsonEncodeIntervals` | `String jsonEncodeIntervals(List<ChartInterval> intervals)` | Encodes intervals to a JSON string. |
| `jsonEncodeDrawings` | `String jsonEncodeDrawings(List<Drawing> drawings)` | Encodes drawings to a JSON string. |
| `jsonEncodeIndicators` | `String jsonEncodeIndicators(List<IndicatorConfig> indicators)` | Encodes indicators to a JSON string. |
| `jsonEncodeTheme` | `String jsonEncodeTheme(ChartTheme theme)` | Encodes a theme to a JSON string. |
| `jsonEncodeLayout` | `String jsonEncodeLayout(ChartLayout layout)` | Encodes a full layout to a JSON string. |
| `escapeForJs` | `String escapeForJs(String s)` | Escapes a JSON string for safe embedding inside a single-quoted JS string literal. Used by the mobile controller. |

---

## Chart Types

The chart engine supports **8 chart series types**, switchable at runtime via `controller.setChartType()`.

| # | Type | Enum Value | Series Kind | Best For |
|---|---|---|---|---|
| 1 | **Candlestick** | `ChartType.candle` | OHLC candles | Default. Price-action analysis, pattern recognition. |
| 2 | **Line** | `ChartType.line` | Single-value (close) | Clean macro view. Support/resistance identification. |
| 3 | **Step Line** | `ChartType.stepLine` | Single-value (close) | Illiquid markets, discrete price jumps. |
| 4 | **Area** | `ChartType.area` | Single-value (close) | Dashboards, portfolio overviews. |
| 5 | **Heikin Ashi** | `ChartType.heikinAshi` | Averaged OHLC | Trend-following, swing trading. Filters noise. |
| 6 | **Hollow Candlestick** | `ChartType.hollowCandle` | OHLC (hollow/solid) | Extra dimension for session analysis. |
| 7 | **Bar (OHLC)** | `ChartType.bar` | OHLC bars | Traditional western charting. Less visual clutter. |
| 8 | **Renko** | `ChartType.renko` | Time-independent bricks | Isolates price trend from time. Breakout trading. |

### Data Transformations

Some chart types transform the raw OHLCV data before rendering:

- **Heikin Ashi:** Applies the averaging formula: `Close = (O+H+L+C)/4`, `Open = (prevOpen+prevClose)/2`.
- **Renko:** Builds bricks from cumulative price movement. Always recalculates from scratch on live updates.
- **All others:** Use the raw data directly or extract the close price for single-value series.

---

## Technical Indicators

Seven built-in indicators with real-time recalculation. Indicators are categorized as **main** (overlaid on the price chart) or **sub** (rendered in a separate pane below).

### Indicator Reference

| # | ID | Name | Category | Parameters | Default Color | Description |
|---|---|---|---|---|---|---|
| 1 | `sma` | Simple Moving Average | `main` | `period: int` (default: 9) | `#f0b90b` | Average of closing prices over N periods. |
| 2 | `ema` | Exponential Moving Average | `main` | `period: int` (default: 9) | `#e02424` | Weighted moving average — reacts faster to recent prices. |
| 3 | `rsi` | Relative Strength Index | `sub` | `period: int` (default: 14) | `#a78bfa` | Oscillator (0–100). Includes dashed 70/30 reference lines. |
| 4 | `macd` | MACD | `sub` | `fastPeriod: int` (12), `slowPeriod: int` (26), `signalPeriod: int` (9) | `#3b82f6` | Three series: MACD line, signal line, histogram. |
| 5 | `bb` | Bollinger Bands | `main` | `period: int` (20), `stdDev: num` (2) | `#10b981` | Three series: upper band, middle SMA, lower band. |
| 6 | `vwap` | VWAP | `main` | `sessionResetHour: int` (0), `timezoneOffsetMinutes: int` (0) | `#3b82f6` | Volume-weighted average price, resets at session boundary. |
| 7 | `atr` | Average True Range | `sub` | `period: int` (default: 14) | `#f43f5e` | Volatility oscillator measuring market range. |

### Sub-Pane Layout

Sub-pane indicators (`rsi`, `macd`, `atr`) are rendered in the bottom 45% of the chart, equally divided. The main chart occupies the top 55%. Adding or removing sub-pane indicators triggers automatic layout rebalancing.

### Example — Multiple indicators

```dart
controller.setIndicators([
  // Main chart overlay — SMA
  IndicatorConfig(
    id: 'sma_20',
    indicatorId: 'sma',
    displayName: 'SMA (20)',
    category: 'main',
    params: {'period': 20},
    color: '#f0b90b',
  ),
  // Main chart overlay — Bollinger Bands
  IndicatorConfig(
    id: 'bb_20_2',
    indicatorId: 'bb',
    displayName: 'Bollinger Bands (20, 2)',
    category: 'main',
    params: {'period': 20, 'stdDev': 2},
    color: '#10b981',
  ),
  // Sub pane — RSI
  IndicatorConfig(
    id: 'rsi_14',
    indicatorId: 'rsi',
    displayName: 'RSI (14)',
    category: 'sub',
    params: {'period': 14},
    color: '#a78bfa',
  ),
  // Sub pane — MACD
  IndicatorConfig(
    id: 'macd_default',
    indicatorId: 'macd',
    displayName: 'MACD (12, 26, 9)',
    category: 'sub',
    params: {'fastPeriod': 12, 'slowPeriod': 26, 'signalPeriod': 9},
    color: '#3b82f6',
  ),
]);
```

---

## Drawing Tools

17 drawing tools are available. Each tool type is identified by a string key used in `Drawing.type`.

| # | Tool | Type String | Points Required | Description |
|---|---|---|---|---|
| 1 | **Trend Line** | `'trendLine'` | 2 | Straight line segment between two coordinates. |
| 2 | **Horizontal Line** | `'horizontalLine'` | 1 | Infinite horizontal line at a price level. |
| 3 | **Horizontal Ray** | `'horizontalRay'` | 1 | Horizontal line extending infinitely to the right from a point. |
| 4 | **Vertical Line** | `'verticalLine'` | 1 | Infinite vertical line at a time coordinate. |
| 5 | **Extended Line** | `'extendedLine'` | 2 | Line through two points extending infinitely in both directions. |
| 6 | **Ray** | `'ray'` | 2 | Line segment from point A through B, extending to chart edge. |
| 7 | **Parallel Channel** | `'parallelChannel'` | 3 | Two parallel diagonal lines with fill. Point 0–1 define the main line; point 2 offsets the channel width. |
| 8 | **Rectangle** | `'rectangle'` | 2 | Filled box defined by two diagonal corners. |
| 9 | **Fibonacci Retracement** | `'fibonacci'` | 2 | Horizontal lines at 0%, 23.6%, 38.2%, 50%, 61.8%, 78.6%, 100% between a swing high/low. |
| 10 | **Long Position** | `'longPosition'` | 2 | Risk-reward box: entry + target (green) + stop-loss (red). |
| 11 | **Short Position** | `'shortPosition'` | 2 | Risk-reward box for bearish positions. Target below, stop above. |
| 12 | **Text Annotation** | `'text'` | 1 | Custom text label at a coordinate. Uses `Drawing.text`. |
| 13 | **Measure / Ruler** | `'measure'` | 2 | Measures price difference, % change, and bar count. Non-permanent. |
| 14 | **Price Label** | `'priceLabel'` | 1 | Price tag pill on the price axis. |
| 15 | **Flag / Pin Marker** | `'flag'` | 1 | Colored flagpole marker. |
| 16 | **Angle Tool** | `'angle'` | 3 | Measures the angle in degrees between two connected lines. |
| 17 | **Freehand Path** | `'path'` | N (many) | Freeform drawing via click-and-drag. |

### Drawing Management Features

| Feature | Description |
|---|---|
| **Magnet Mode** | Snaps anchor points to nearest OHLC price. |
| **Lock All** | Prevents dragging/editing of all drawings. |
| **Hide All** | Hides all drawings without deleting them. |
| **Favorites Rail** | Filter the tool rail to starred tools only. |
| **Context Menu** | Right-click on a drawing for Lock, Hide, Delete, and Style options. |
| **Style Editor** | Change drawing color, line width, fill opacity. |
| **Undo / Redo** | `Ctrl+Z` / `Ctrl+Y` (or `Ctrl+Shift+Z`). |

### Example — Loading saved drawings

```dart
controller.setDrawings([
  Drawing(
    id: 'support_line_1',
    type: 'horizontalLine',
    points: [DrawingPoint(time: 1700000000, price: 62500.0)],
    style: DrawingStyle(color: '#26a69a', lineWidth: 2),
  ),
  Drawing(
    id: 'fib_1',
    type: 'fibonacci',
    points: [
      DrawingPoint(time: 1700000000, price: 64000.0),
      DrawingPoint(time: 1700003600, price: 62000.0),
    ],
    style: DrawingStyle(color: '#5b9cf6', lineWidth: 1, fillOpacity: 0.1),
  ),
]);
```

---

## Theming

### Built-in Presets

```dart
// Professional dark theme (default)
controller.setTheme(ChartTheme.dark());

// Clean light theme
controller.setTheme(ChartTheme.light());
```

### Customizing a Preset

Use `copyWith()` to override only specific properties:

```dart
controller.setTheme(
  ChartTheme.dark().copyWith(
    upColor: '#00e676',        // Custom green
    downColor: '#ff1744',      // Custom red
    background: '#0d1117',     // GitHub-dark background
    toolbarBackground: '#161b22',
  ),
);
```

### Complete Custom Theme

When building for a specific brand, construct `ChartTheme` directly:

```dart
controller.setTheme(
  ChartTheme(
    background: '#ffffff',
    text: '#333333',
    upColor: '#089981',
    downColor: '#f23645',
    gridLineColor: '#f0f0f0',
    crosshairColor: '#999999',
    volumeUpColor: '#08998140',
    volumeDownColor: '#f2364540',
    toolbarBackground: '#fafafa',
    toolbarBorder: '#e5e5e5',
    toolbarText: '#333333',
    fontFamily: "'Poppins', sans-serif",
    fontSize: 13,
  ),
);
```

---

## Layout Persistence

Save and restore the **entire** chart state — perfect for cloud sync, session persistence, and layout bookmarks.

### Save Layout

```dart
// 1. Request layout snapshot
controller.getLayout();

// 2. Receive it in the event callback
void _onChartEvent(String event, Map<String, dynamic> payload) {
  if (event == ChartEvents.layoutSnapshot) {
    // Convert to ChartLayout model
    final layout = ChartLayout.fromJson(payload);
    // Serialize to JSON string and save
    final json = layout.toJson();
    saveToDatabase(json); // your persistence logic
  }
}
```

### Restore Layout

```dart
// Load from your persistence layer
final json = loadFromDatabase();
final layout = ChartLayout.fromJson(json);

// Apply to chart
controller.applyLayout(layout);
```

### What Gets Saved

The layout snapshot includes:
- Chart type (candlestick, line, etc.)
- Active interval/timeframe
- Complete theme configuration
- All drawings (with positions, styles, text)
- All indicator configurations (with params, colors)
- All UI toggles (toolbar, magnet, volume pane, etc.)

---

## Events & Callbacks

Events flow from the chart JS engine to Dart via the `onEvent` callback. The callback receives:
1. `event` — A string name (use `ChartEvents.*` constants).
2. `payload` — A `Map<String, dynamic>` with event-specific data.

### Event Flow

```
User interacts with chart UI
       ↓
chart.html JS → emitEvent(name, payload)
       ↓
Bridge (FlutterBridge.postMessage on mobile / window.onChartEvent on web)
       ↓
ChartView decodes → calls onEvent(event, payload) in your Dart code
```

### Common Patterns

#### Reload data on timeframe change

```dart
onEvent: (event, payload) {
  if (event == ChartEvents.timeframeChanged) {
    final tf = payload['tf'] as String;
    final unit = payload['unit'] as String;
    fetchAndLoadData(tf, unit);
  }
}
```

#### Persist drawings on change

```dart
onEvent: (event, payload) {
  if (event == ChartEvents.drawingAdded ||
      event == ChartEvents.drawingUpdated ||
      event == ChartEvents.drawingDeleted) {
    syncDrawingsToCloud();
  }
}
```

#### Show JS errors

```dart
onEvent: (event, payload) {
  if (event == ChartEvents.jsError) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        backgroundColor: Colors.red,
        content: Text('Chart Error: ${payload['message']}'),
      ),
    );
  }
}
```

---

## Architecture

```
┌─────────────────────────────────────────────┐
│              Your Flutter App               │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │           ChartView Widget          │    │
│  │  (conditional import: web/mobile)   │    │
│  └──────────────┬──────────────────────┘    │
│                 │                            │
│       ┌─────────┴──────────┐                │
│       ▼                    ▼                │
│  ┌──────────┐      ┌─────────────┐         │
│  │ Web impl │      │ Mobile impl │         │
│  │ (iframe) │      │ (WebView)   │         │
│  └─────┬────┘      └──────┬──────┘         │
│        │                   │                │
│        ▼                   ▼                │
│  ┌───────────────────────────────────┐      │
│  │     ChartController (abstract)    │      │
│  │  setData / addOrUpdateBar / ...   │      │
│  └──────────────┬────────────────────┘      │
│                 │                            │
│  ┌──────────────▼────────────────────┐      │
│  │    ChartBridgeCodec (JSON enc)    │      │
│  └──────────────┬────────────────────┘      │
└─────────────────┼───────────────────────────┘
                  │  JS Bridge
┌─────────────────▼───────────────────────────┐
│            chart.html / chart_mobile.html    │
│                                             │
│  ┌──────────┐  ┌────────────┐  ┌─────────┐ │
│  │ Core     │  │ Indicators │  │Drawings │ │
│  │ bridge   │  │ registry   │  │manager  │ │
│  │ state    │  │ calc/      │  │tools/   │ │
│  │ series   │  │            │  │magnet   │ │
│  │ theme    │  │            │  │         │ │
│  │ transform│  │            │  │         │ │
│  └──────────┘  └────────────┘  └─────────┘ │
│                                             │
│  Lightweight Charts™ (rendering engine)     │
└─────────────────────────────────────────────┘
```

### Key Architecture Decisions

| Aspect | Decision |
|---|---|
| **Rendering** | All chart rendering is done via Lightweight Charts™ in a WebView/iframe. Zero Flutter canvas code. |
| **Bridge** | Communication is via a JSON-based protocol. Dart → JS uses `window.ChartBridge.*` methods. JS → Dart uses `emitEvent()` which routes to `FlutterBridge.postMessage` (mobile) or `window.onChartEvent` (web). |
| **Platform split** | `chart_view.dart` uses Dart conditional imports (`dart.library.html` → web, `dart.library.io` → mobile) to select the correct implementation. |
| **Indicator math** | All indicator calculations run in JavaScript (in-browser). No Dart computation for indicators. |
| **Throttling** | `addOrUpdateBar` throttles indicator recalculation to every 200ms to prevent performance degradation during rapid live tick updates. |

---

## Build Tool (Mobile HTML)

The mobile WebView cannot load external `<script src="...">` tags from Flutter assets. The build tool inlines all JS files into a single self-contained `chart_mobile.html`.

### Usage

Run from the `packages/chart_engine/` directory:

```bash
dart run tool/build_mobile_html.dart
```

### When to Run

**After any change** to files in `assets/chart/js/` — including:
- Core files (`bridge.js`, `state.js`, `series-manager.js`, etc.)
- Drawing tools (`tools/*.js`)
- Indicator calculations (`calc/*.js`)
- UI handlers (`ui-handlers.js`)
- Settings modal (`settings-modal.js`)

### What It Does

1. Reads `chart.html`
2. Finds all `<script src="...">` tags
3. Reads each referenced JS file
4. Replaces each tag with an inline `<script>` containing the file contents
5. Writes the result to `chart_mobile.html`

---

## Example App

A complete example app is included at `packages/chart_engine/example/`. It demonstrates:

- Basic chart setup with `ChartView`
- Loading mock OHLCV data
- Handling chart events
- Live tick simulation via a FAB button
- Error handling for JS errors

### Running the Example

```bash
cd packages/chart_engine/example
flutter run -d chrome     # for web
flutter run -d <device>   # for mobile
```

### Example Code

```dart
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:chart_engine/chart_engine.dart';

void main() => runApp(const MyApp());

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chart Engine Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.deepPurple,
          brightness: Brightness.dark,
        ),
      ),
      home: const ChartScreen(title: 'BTCUSDT'),
    );
  }
}

class ChartScreen extends StatefulWidget {
  const ChartScreen({super.key, required this.title});
  final String title;

  @override
  State<ChartScreen> createState() => _ChartScreenState();
}

class _ChartScreenState extends State<ChartScreen> {
  ChartController? _controller;
  double _lastClose = 64000;
  final _rand = Random();

  void _onChartCreated(ChartController controller) {
    _controller = controller;
    controller.setData(_generateMockBars(200));
  }

  void _onChartEvent(String event, Map<String, dynamic> payload) {
    debugPrint('Chart event: $event -> $payload');
    if (event == ChartEvents.jsError && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red,
          content: Text('Chart JS error: ${payload['message']}'),
        ),
      );
    }
  }

  List<ChartBar> _generateMockBars(int count) {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final bars = <ChartBar>[];
    var price = _lastClose;
    for (var i = count; i >= 0; i--) {
      final time = now - i * 60;
      final open = price;
      final change = (_rand.nextDouble() - 0.5) * 40;
      final close = open + change;
      final high = [open, close].reduce(max) + _rand.nextDouble() * 15;
      final low = [open, close].reduce(min) - _rand.nextDouble() * 15;
      price = close;
      bars.add(ChartBar(
        time: time, open: open, high: high, low: low,
        close: close, volume: _rand.nextDouble() * 2,
      ));
    }
    _lastClose = price;
    return bars;
  }

  void _simulateTick() {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final currentMinute = now - (now % 60);
    final change = (_rand.nextDouble() - 0.5) * 40;
    final close = _lastClose + change;
    _controller?.addOrUpdateBar(ChartBar(
      time: currentMinute,
      open: _lastClose,
      high: max(_lastClose, close) + _rand.nextDouble() * 10,
      low: min(_lastClose, close) - _rand.nextDouble() * 10,
      close: close,
      volume: _rand.nextDouble() * 2,
    ));
    _lastClose = close;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131722),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e222d),
        title: Text(widget.title),
      ),
      body: ChartView(
        onCreated: _onChartCreated,
        onEvent: _onChartEvent,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _simulateTick,
        tooltip: 'Simulate live tick',
        child: const Icon(Icons.bolt),
      ),
    );
  }
}
```

---

## Troubleshooting

### Common Issues

| Issue | Cause | Solution |
|---|---|---|
| **Chart shows blank white screen** | `chart.html` not found in `web/chart/` | Copy chart assets to `web/chart/`. See [Web Setup](#web-setup). |
| **Mobile chart shows blank screen** | `chart_mobile.html` is outdated or missing | Run `dart run tool/build_mobile_html.dart` from `packages/chart_engine/`. |
| **`jsError` event with "setData failed"** | Data format issue — possibly empty array or malformed JSON | Ensure all `ChartBar` objects have valid `time`, `open`, `high`, `low`, `close` values. |
| **Indicators not showing** | Wrong `indicatorId` or `category` | Use exact IDs from the [Indicator Reference](#indicator-reference): `sma`, `ema`, `rsi`, `macd`, `bb`, `vwap`, `atr`. |
| **`timeframeChanged` fires but data doesn't update** | The event only notifies — you must reload data yourself | In `onEvent`, detect `timeframeChanged` and call `setData()` with data for the new interval. |
| **Drawings disappear after data reload** | `setData()` triggers a full redraw | Re-apply drawings after `setData()` using `setDrawings()`, or use `applyLayout()` to restore everything. |
| **Live ticks cause lag** | Indicator recalculation on every tick | This is handled — recalculation is throttled to 200ms. If still slow, reduce the number of active indicators. |

### Platform Notes

- **Web:** Uses `dart:js_interop` + `package:web` (Wasm-compatible). Does **not** use legacy `dart:html` or `dart:js`.
- **Mobile:** Uses `webview_flutter ^4.14.1`. Requires Android API 21+ and iOS 14+.
- **Desktop:** Not officially supported yet (but may work via webview implementations).

---

## Package File Structure

```
packages/chart_engine/
├── lib/
│   ├── chart_engine.dart            # Barrel file — single import for consumers
│   └── src/
│       ├── bridge/
│       │   └── chart_bridge_codec.dart  # JSON encoding helpers
│       ├── controller/
│       │   ├── chart_controller.dart    # Abstract controller API
│       │   ├── chart_view.dart          # Platform-agnostic widget (conditional import)
│       │   ├── chart_view_mobile.dart   # Mobile implementation (WebView)
│       │   ├── chart_view_web.dart      # Web implementation (iframe + js_interop)
│       │   └── chart_view_stub.dart     # Stub for static analysis
│       ├── events/
│       │   └── chart_event.dart         # Typed event name constants
│       └── models/
│           ├── chart_bar.dart           # OHLCV bar model
│           ├── chart_layout.dart        # Full layout snapshot model
│           ├── chart_theme.dart         # Theme configuration (28+ properties)
│           ├── chart_type.dart          # Chart type enum
│           ├── drawing.dart             # Drawing, DrawingPoint, DrawingStyle
│           ├── indicator_config.dart    # Indicator configuration model
│           ├── interval.dart            # Timeframe interval model
│           └── pattern_marker.dart      # Pattern detection marker model
├── assets/chart/
│   ├── chart.html                   # Main chart HTML (web)
│   ├── chart_mobile.html            # Self-contained HTML (mobile, generated)
│   ├── lightweight-charts.standalone.production.js
│   └── js/
│       ├── core/
│       │   ├── bridge.js            # Dart↔JS bridge & event emission
│       │   ├── chart-instance.js    # Lightweight Charts initialization
│       │   ├── ohlc-readout.js      # OHLC legend bar
│       │   ├── series-manager.js    # Series type switching
│       │   ├── state.js             # Global chart state
│       │   ├── theme-manager.js     # Theme application
│       │   └── transforms.js        # Heikin Ashi & Renko transforms
│       ├── drawings/
│       │   ├── drawing-manager.js   # Drawing lifecycle management
│       │   ├── magnet.js            # OHLC snap logic
│       │   └── tools/               # 17 individual drawing tool renderers
│       ├── indicators/
│       │   ├── indicator-registry.js # Indicator lifecycle & rendering
│       │   ├── manage-indicators.js  # Indicator UI modal
│       │   └── calc/                 # 7 indicator calculation modules
│       ├── settings/
│       │   └── settings-modal.js     # Chart settings UI
│       └── ui-handlers.js           # Toolbar & UI event handlers
├── tool/
│   └── build_mobile_html.dart       # Mobile HTML generator script
├── example/
│   └── lib/main.dart                # Example app
└── pubspec.yaml                     # Package manifest
```

---

## Exported API Summary

Everything is accessible via a single import:

```dart
import 'package:chart_engine/chart_engine.dart';
```

### Models (8)

`ChartBar` · `ChartType` · `ChartInterval` · `ChartTheme` · `IndicatorConfig` · `Drawing` · `DrawingPoint` · `DrawingStyle` · `PatternMarker` · `ChartLayout` · `LayoutToggles`

### Controller & Widget (2)

`ChartController` (abstract) · `ChartView` (widget)

### Events (1)

`ChartEvents` (static constants class)

### Type Definitions (1)

`ChartEventCallback`

---

*Built with [Lightweight Charts™](https://www.tradingview.com/lightweight-charts/) by TradingView.*
