// chart_view.dart
// Shared entry point — pick web or mobile implementation at compile time.
// This is the ONLY file the rest of your app should import.

import 'chart_view_stub.dart'
if (dart.library.html) 'chart_view_web.dart'
if (dart.library.io) 'chart_view_mobile.dart';

import 'package:flutter/widgets.dart';
import 'dart:convert';

String jsonEncodeBars(List<ChartBar> bars) => jsonEncode(bars.map((b) => b.toJson()).toList());
String jsonEncodeBar(ChartBar bar) => jsonEncode(bar.toJson());
String jsonEncodeMarkers(List<PatternMarker> markers) => jsonEncode(markers.map((m) => m.toJson()).toList());

/// A single OHLCV bar. `time` is a unix seconds timestamp (matches
/// Lightweight Charts' expected format).
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

  Map<String, dynamic> toJson() => {
    'time': time,
    'open': open,
    'high': high,
    'low': low,
    'close': close,
    'volume': volume,
  };
}

/// A pattern marker to render above/below a candle (feeds the
/// "39 patterns" auto-detection feature — detection logic lives in
/// your backend/Dart, this just tells the chart where to draw the tag).
class PatternMarker {
  final int time;
  final String position; // 'aboveBar' | 'belowBar'
  final String color;
  final String shape; // 'arrowUp' | 'arrowDown' | 'circle' | 'square'
  final String text;

  const PatternMarker({
    required this.time,
    required this.position,
    required this.color,
    required this.shape,
    required this.text,
  });

  Map<String, dynamic> toJson() => {
    'time': time,
    'position': position,
    'color': color,
    'shape': shape,
    'text': text,
  };
}

/// Controller returned via [ChartView.onCreated] — use this to push data
/// into the chart from your Dart/BLoC layer.
abstract class ChartController {
  Future<void> setData(List<ChartBar> bars);
  Future<void> addOrUpdateBar(ChartBar bar);
  Future<void> setPatternMarkers(List<PatternMarker> markers);
  Future<void> setTheme({required String background, required String text});
}

typedef ChartEventCallback = void Function(String event, Map<String, dynamic> payload);

/// The chart widget itself. Same API on web and mobile —
/// implementation swaps automatically via conditional import above.
abstract class ChartView extends StatefulWidget {
  const ChartView.base({
    super.key,
    required this.onCreated,
    this.onEvent,
  });

  /// Called once the underlying web view / DOM element is ready.
  final void Function(ChartController controller) onCreated;

  /// Called for events coming FROM the chart (drawing added, timeframe
  /// changed, etc.) — wired to `window.onChartEvent` in chart.html.
  final ChartEventCallback? onEvent;

  factory ChartView({
    Key? key,
    required void Function(ChartController controller) onCreated,
    ChartEventCallback? onEvent,
  }) = PlatformChartView;
}