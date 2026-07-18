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
  Future<void> setData(List<ChartBar> bars);
  Future<void> addOrUpdateBar(ChartBar bar);
  Future<void> setPatternMarkers(List<PatternMarker> markers);
  Future<void> setTheme({
    required String background,
    required String text,
    ChartTheme? theme,
  });
  Future<void> setChartType(ChartType type);
  Future<void> setAvailableIntervals(List<ChartInterval> intervals);
  Future<void> setDrawings(List<Drawing> drawings);
  Future<void> setIndicators(List<IndicatorConfig> indicators);
  Future<void> getLayout();
  Future<void> applyLayout(ChartLayout layout);
}

/// Callback shape for events coming FROM the chart JS engine.
typedef ChartEventCallback = void Function(
  String event,
  Map<String, dynamic> payload,
);
