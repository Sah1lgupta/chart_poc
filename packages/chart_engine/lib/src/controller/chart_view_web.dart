// chart_view_web.dart
// Web implementation using the modern, Wasm-compatible interop stack
// (dart:js_interop + package:web) — dart:html/dart:js are legacy and
// allowInterop was removed from recent stable Dart, so this replaces
// the earlier draft.
//
// Place chart.html at: web/chart/chart.html

import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';
import 'package:web/web.dart' as web;

import 'chart_controller.dart';
import 'chart_view.dart';
import '../bridge/chart_bridge_codec.dart';
import '../models/chart_bar.dart';
import '../models/pattern_marker.dart';
import '../models/chart_type.dart';
import '../models/interval.dart';
import '../models/drawing.dart';
import '../models/indicator_config.dart';
import '../models/chart_theme.dart';
import '../models/chart_layout.dart';

class PlatformChartView extends ChartView {
  const PlatformChartView({
    super.key,
    required super.onCreated,
    super.onEvent,
    super.width,
    super.height,
  }) : super.base();

  @override
  State<PlatformChartView> createState() => _PlatformChartViewState();
}

class _PlatformChartViewState extends State<PlatformChartView> {
  late final String _viewType;
  late final web.HTMLIFrameElement _iframe;

  @override
  void initState() {
    super.initState();
    _viewType = 'chart-view-${identityHashCode(this)}';

    _iframe = web.HTMLIFrameElement()
      ..src = 'chart/chart.html'
      ..style.border = 'none'
      ..style.width = '100%'
      ..style.height = '100%';

    _iframe.onLoad.listen((_) {
      final iframeWindow = _iframe.contentWindow;
      if (iframeWindow == null) return;

      // Expose window.onChartEvent(name, payload) inside the iframe so
      // chart.html's emitEvent() can call back out to Dart.
      iframeWindow.setProperty(
        'onChartEvent'.toJS,
        ((JSString event, JSAny? payload) {
          final decoded = payload?.dartify();
          final map = decoded is Map
              ? Map<String, dynamic>.from(decoded)
              : <String, dynamic>{};
          widget.onEvent?.call(event.toDart, map);
        }).toJS,
      );

      widget.onCreated(_WebChartController(iframeWindow));
    });

    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      return _iframe;
    });
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: widget.width,
      height: widget.height,
      child: HtmlElementView(viewType: _viewType),
    );
  }
}

class _WebChartController implements ChartController {
  _WebChartController(this._window);
  final web.Window _window;

  JSObject? get _bridge =>
      _window.getProperty('ChartBridge'.toJS) as JSObject?;

  void _call1(String fn, String jsonArg) {
    _bridge?.callMethod(fn.toJS, jsonArg.toJS);
  }

  @override
  Future<void> setData(List<ChartBar> bars) async {
    _call1('setData', jsonEncodeBars(bars));
  }

  @override
  Future<void> addOrUpdateBar(ChartBar bar) async {
    _call1('addOrUpdateBar', jsonEncodeBar(bar));
  }

  @override
  Future<void> setPatternMarkers(List<PatternMarker> markers) async {
    _call1('setPatternMarkers', jsonEncodeMarkers(markers));
  }

  @override
  Future<void> setTheme({
    required String background,
    required String text,
    ChartTheme? theme,
  }) async {
    final t = theme ?? ChartTheme(background: background, text: text);
    _call1('setTheme', jsonEncodeTheme(t));
  }

  @override
  Future<void> setChartType(ChartType type) async {
    _call1('setChartType', type.toJson());
  }

  @override
  Future<void> setAvailableIntervals(List<ChartInterval> intervals) async {
    _call1('setAvailableIntervals', jsonEncodeIntervals(intervals));
  }

  @override
  Future<void> setDrawings(List<Drawing> drawings) async {
    _call1('setDrawings', jsonEncodeDrawings(drawings));
  }

  @override
  Future<void> setIndicators(List<IndicatorConfig> indicators) async {
    _call1('setIndicators', jsonEncodeIndicators(indicators));
  }

  @override
  Future<void> getLayout() async {
    _bridge?.callMethod('getLayout'.toJS);
  }

  @override
  Future<void> applyLayout(ChartLayout layout) async {
    _call1('applyLayout', jsonEncodeLayout(layout));
  }
}
