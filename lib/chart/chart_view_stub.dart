// chart_view_stub.dart
// Never actually used at runtime — conditional import always resolves to
// _web or _mobile. Exists only so the analyzer has something to resolve
// against outside a real build.

import 'package:flutter/widgets.dart';
import 'chart_view.dart';

class PlatformChartView extends ChartView {
  const PlatformChartView({
    Key? key,
    required void Function(ChartController controller) onCreated,
    ChartEventCallback? onEvent,
  }) : super.base(key: key, onCreated: onCreated, onEvent: onEvent);

  @override
  State<PlatformChartView> createState() => throw UnimplementedError(
      'chart_view_stub.dart should never be selected at build time.');
}