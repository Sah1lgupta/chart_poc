// chart_view.dart
// Shared entry point — pick web or mobile implementation at compile time.
// This is the ONLY file the rest of your app should import (via the barrel).

import 'chart_view_stub.dart'
    if (dart.library.html) 'chart_view_web.dart'
    if (dart.library.io) 'chart_view_mobile.dart';

import 'package:flutter/widgets.dart';

import 'chart_controller.dart';

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
  }) => PlatformChartView(key: key, onCreated: onCreated, onEvent: onEvent);
}
