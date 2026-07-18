// chart_bridge_codec.dart
// Shared JSON encoding helpers used by both web and mobile ChartController
// implementations. Centralises the escape/encode logic so there's no
// duplication risk as more bridge methods are added.

import 'dart:convert';

import '../models/chart_bar.dart';
import '../models/pattern_marker.dart';
import '../models/interval.dart';
import '../models/drawing.dart';
import '../models/indicator_config.dart';
import '../models/chart_theme.dart';
import '../models/chart_layout.dart';

/// Encode a list of [ChartBar] into a JSON string for the bridge.
String jsonEncodeBars(List<ChartBar> bars) =>
    jsonEncode(bars.map((b) => b.toJson()).toList());

/// Encode a single [ChartBar] into a JSON string for the bridge.
String jsonEncodeBar(ChartBar bar) => jsonEncode(bar.toJson());

/// Encode a list of [PatternMarker] into a JSON string for the bridge.
String jsonEncodeMarkers(List<PatternMarker> markers) =>
    jsonEncode(markers.map((m) => m.toJson()).toList());

/// Encode a list of [ChartInterval] into a JSON string for the bridge.
String jsonEncodeIntervals(List<ChartInterval> intervals) =>
    jsonEncode(intervals.map((i) => i.toJson()).toList());

/// Encode a list of [Drawing] into a JSON string for the bridge.
String jsonEncodeDrawings(List<Drawing> drawings) =>
    jsonEncode(drawings.map((d) => d.toJson()).toList());

/// Encode a list of [IndicatorConfig] into a JSON string for the bridge.
String jsonEncodeIndicators(List<IndicatorConfig> indicators) =>
    jsonEncode(indicators.map((ind) => ind.toJson()).toList());

/// Encode [ChartTheme] into a JSON string for the bridge.
String jsonEncodeTheme(ChartTheme theme) => jsonEncode(theme.toJson());

/// Encode [ChartLayout] into a JSON string for the bridge.
String jsonEncodeLayout(ChartLayout layout) => jsonEncode(layout.toJson());

/// Escape a JSON string for safe embedding inside a JS string literal
/// (single-quoted). Used by the mobile controller when injecting JS via
/// `runJavaScript()`.
String escapeForJs(String s) =>
    s.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
