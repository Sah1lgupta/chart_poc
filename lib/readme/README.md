# Chart Engine — Setup

## What's here
- `chart.html` — the actual chart engine (Lightweight Charts + custom drawing tools). Fully self-contained and testable on its own — open it directly in any browser and it renders with mock BTC data.
- `flutter/chart_view.dart` — the widget your app imports. Same API on web and mobile.
- `flutter/chart_view_web.dart` — web implementation (`HtmlElementView` + iframe).
- `flutter/chart_view_mobile.dart` — mobile implementation (`webview_flutter`).
- `flutter/chart_view_stub.dart` — analyzer placeholder, never runs.

## 1. Test the engine standalone first
Open `chart.html` directly in Chrome/Safari before wiring anything into Flutter. You should see live mock candles, volume, working timeframe/series-type buttons, and functioning drawing tools (click Trendline → click two points on the chart).

## 2. Wire into your Flutter project
```
your_app/
├── web/
│   └── chart/chart.html          ← copy chart.html here (web build)
├── assets/
│   └── chart/chart.html          ← copy chart.html here too (mobile build)
├── pubspec.yaml                  ← add webview_flutter + web + asset entry (see below)
└── lib/
    ├── main.dart                 ← drop-in replacement for the default counter app
    └── chart/
        ├── chart_view.dart
        ├── chart_view_web.dart
        ├── chart_view_mobile.dart
        └── chart_view_stub.dart
```

`main.dart` swaps the default `flutter create` counter screen for a live chart screen: it seeds 200 mock candles on load, listens for chart events (drawing added, timeframe changed), and has a floating action button that simulates one incoming live tick via `addOrUpdateBar` — that FAB is the exact call site you'll eventually replace with your WebSocket listener.

`pubspec.yaml` additions:
```yaml
dependencies:
  webview_flutter: ^4.7.0
  web: ^1.1.0

flutter:
  assets:
    - assets/chart/chart.html
    - assets/chart/lightweight-charts.standalone.production.js
```

## 3. Use it
```dart
ChartController? controller;

ChartView(
  onCreated: (c) {
    controller = c;
    controller!.setData(myBars); // List<ChartBar>
  },
  onEvent: (event, payload) {
    if (event == 'drawingAdded') {
      // persist to your backend for cross-device save/load
    }
    if (event == 'timeframeChanged') {
      // refetch bars for payload['tf'] from your datafeed
    }
  },
)
```

Feed live ticks from your WebSocket listener — **batch them, don't call this per raw tick**:
```dart
Timer.periodic(const Duration(milliseconds: 200), (_) {
  if (latestBar != null) controller?.addOrUpdateBar(latestBar!);
});
```

Feed pattern-detection results (once you build that backend service):
```dart
controller?.setPatternMarkers([
  PatternMarker(time: bar.time, position: 'aboveBar', color: '#ef5350', shape: 'arrowDown', text: '3InDn'),
]);
```

## Troubleshooting: blank chart, but toolbar/tool-rail render fine
This means the static HTML/CSS loaded, but the Lightweight Charts JS library never initialized — almost always because it was being fetched from `unpkg.com` and the WebView had no network access. Fixed in this version by bundling the library locally instead of a CDN:

- **`lightweight-charts.standalone.production.js` must sit in the same folder as `chart.html`** — both `web/chart/` and `assets/chart/`. It's included in this delivery; don't skip copying it.
- Any JS error (including "library failed to load") now gets reported back to Flutter as a `jsError` event and shows as a red SnackBar via `main.dart`'s `_onChartEvent` — so failures are visible instead of silently going nowhere.
- If you still see a `jsError` about the library not loading, double check the file actually landed at `web/chart/lightweight-charts.standalone.production.js` (web) and `assets/chart/lightweight-charts.standalone.production.js` (mobile), and that it's listed in `pubspec.yaml`'s assets.
- On Android specifically, also confirm `android/app/src/main/AndroidManifest.xml` has `<uses-permission android:name="android.permission.INTERNET" />` inside the `<manifest>` tag — you'll still need this later for your real WebSocket datafeed even though the chart library itself no longer depends on it.
- To see the WebView's actual console output during development: Android → open `chrome://inspect` in desktop Chrome while the app runs on a device/emulator, or iOS → Safari → Develop menu → your device → chart.html.

## What's built vs. what's next
**Working now:** candlestick/line/area/bar rendering, volume pane, crosshair OHLC readout, timeframe + series-type switching, trendline/horizontal-line/rectangle/text drawing tools, live bar updates, pattern-marker rendering hook, cross-platform wrapper.

**Not yet built** (flagged honestly, not glossed over):
- Indicators (SMA/EMA/RSI/MACD) — Lightweight Charts has no built-ins; each is a small added series computed from your bar data. Ask when you want these.
- Drawing persistence (save/load across sessions) — the `drawingAdded`/`drawingsCleared` events give you the hook; you still need a backend table + load-on-open call.
- Multi-chart/split layouts — would mean multiple `ChartView` instances in a grid, not a chart.html change.
- OI overlay — needs your datafeed to actually provide open-interest data first.

## Swapping in TradingView Advanced Charts later
Once your license is approved, `chart.html`'s internals change (different JS API), but `ChartBridge`'s external shape (`setData`, `addOrUpdateBar`, `setPatternMarkers`, `setTheme`) can stay the same — meaning `chart_view.dart` and everything that calls it in your app **does not need to change**. Only the inside of `chart.html` gets swapped.