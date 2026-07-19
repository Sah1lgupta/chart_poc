// chart_view_stub.dart
// Never actually used at runtime — conditional import always resolves to
// _web or _mobile. Exists only so the analyzer has something to resolve
// against outside a real build.

import 'package:flutter/widgets.dart';

import 'chart_view.dart';

class PlatformChartView extends ChartView {
  const PlatformChartView({
    super.key,
    required super.onCreated,
    super.onEvent,
    super.width,
    super.height,
  }) : super.base();

  @override
  State<PlatformChartView> createState() {
    return _PlatformChartViewStubState();
  }
}

class _PlatformChartViewStubState extends State<PlatformChartView> {
  @override
  Widget build(BuildContext context) {
    throw UnimplementedError(
        'chart_view_stub.dart should never be selected at build time.');
  }
}
