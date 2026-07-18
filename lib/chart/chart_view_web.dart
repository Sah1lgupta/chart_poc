// chart_view_web.dart
// Web implementation using the modern, Wasm-compatible interop stack
// (dart:js_interop + package:web) — dart:html/dart:js are legacy and
// allowInterop was removed from recent stable Dart, so this replaces
// the earlier draft.
//
// pubspec.yaml: add   web: ^1.1.0   under dependencies.
//
// Place chart.html at: web/chart/chart.html

import 'dart:js_interop';
import 'dart:js_interop_unsafe';
import 'dart:ui_web' as ui_web;

import 'package:flutter/widgets.dart';
import 'package:web/web.dart' as web;

import 'chart_view.dart';

class PlatformChartView extends ChartView {
  const PlatformChartView({
    Key? key,
    required void Function(ChartController controller) onCreated,
    ChartEventCallback? onEvent,
  }) : super.base(key: key, onCreated: onCreated, onEvent: onEvent);

  @override
  State<PlatformChartView> createState() => _PlatformChartViewState();
}

class _PlatformChartViewState extends State<PlatformChartView> {
  late final String _viewType;

  @override
  void initState() {
    super.initState();
    _viewType = 'chart-view-${identityHashCode(this)}';

    ui_web.platformViewRegistry.registerViewFactory(_viewType, (int viewId) {
      final iframe = web.HTMLIFrameElement()
        ..src = 'chart/chart.html'
        ..style.border = 'none'
        ..style.width = '100%'
        ..style.height = '100%';

      iframe.onLoad.listen((_) {
        final iframeWindow = iframe.contentWindow;
        if (iframeWindow == null) return;

        // Expose window.onChartEvent(name, payload) inside the iframe so
        // chart.html's emitEvent() can call back out to Dart.
        iframeWindow.setProperty(
          'onChartEvent'.toJS,
          ((JSString event, JSAny? payload) {
            final decoded = payload?.dartify();
            final map = decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};
            widget.onEvent?.call(event.toDart, map);
          }).toJS,
        );

        widget.onCreated(_WebChartController(iframeWindow));
      });

      return iframe;
    });
  }

  @override
  Widget build(BuildContext context) {
    return HtmlElementView(viewType: _viewType);
  }
}

class _WebChartController implements ChartController {
  _WebChartController(this._window);
  final web.Window _window;

  JSObject? get _bridge => _window.getProperty('ChartBridge'.toJS) as JSObject?;

  void _call1(String fn, String jsonArg) {
    _bridge?.callMethod(fn.toJS, jsonArg.toJS);
  }

  void _call2(String fn, String a, String b) {
    _bridge?.callMethod(fn.toJS, a.toJS, b.toJS);
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
  Future<void> setTheme({required String background, required String text}) async {
    _call2('setTheme', background, text);
  }
}