// chart_controller.dart
// Abstract API surface for the chart engine. The host app interacts with the
// chart exclusively through this controller — never touching JS internals.

import '../models/chart_bar.dart';
import '../models/pattern_marker.dart';
import '../models/chart_type.dart';
import '../models/interval.dart';
import '../models/drawing.dart';
import '../models/indicator_config.dart';
import '../models/chart_theme.dart';
import '../models/chart_layout.dart';

/// Controller returned via [ChartView.onCreated] — use this to push data
/// into the chart from your Dart/BLoC layer.
abstract class ChartController {
  /// Replaces all chart data with [bars].
  Future<void> setData(List<ChartBar> bars);

  /// Updates or appends a single bar (for live tick updates).
  Future<void> addOrUpdateBar(ChartBar bar);

  /// Renders pattern detection markers above/below candles.
  Future<void> setPatternMarkers(List<PatternMarker> markers);

  /// Applies a complete theme to the chart engine.
  ///
  /// Pass a [ChartTheme] object — every visual property the chart exposes
  /// is configurable through this single call. Use [ChartTheme.dark()] or
  /// [ChartTheme.light()] as starting points, then override specific fields:
  ///
  /// ```dart
  /// controller.setTheme(ChartTheme.dark().copyWith(
  ///   upColor: '#3FB950',
  ///   downColor: '#F85149',
  /// ));
  /// ```
  Future<void> setTheme(ChartTheme theme);

  /// Switches the chart series type (candle, line, area, etc.).
  Future<void> setChartType(ChartType type);

  /// Sets the available timeframe intervals in the toolbar.
  Future<void> setAvailableIntervals(List<ChartInterval> intervals);

  /// Loads a set of drawings onto the chart.
  Future<void> setDrawings(List<Drawing> drawings);

  /// Sets the active indicators with their configurations.
  Future<void> setIndicators(List<IndicatorConfig> indicators);

  /// Requests a layout snapshot — emits a `layoutSnapshot` event.
  Future<void> getLayout();

  /// Restores a previously saved layout.
  Future<void> applyLayout(ChartLayout layout);
}

/// Callback shape for events coming FROM the chart JS engine.
typedef ChartEventCallback = void Function(
  String event,
  Map<String, dynamic> payload,
);
