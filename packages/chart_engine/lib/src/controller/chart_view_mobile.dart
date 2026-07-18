// chart_view_mobile.dart
// Mobile implementation: loads the SAME chart.html (bundled as a Flutter
// asset) into a webview_flutter WebView.

import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
  }) : super.base();

  @override
  State<PlatformChartView> createState() => _PlatformChartViewState();
}

class _PlatformChartViewState extends State<PlatformChartView> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..addJavaScriptChannel(
        'FlutterBridge',
        onMessageReceived: (JavaScriptMessage message) {
          // chart.html's emitEvent() posts {event, payload} here on mobile.
          final decoded = jsonDecode(message.message) as Map<String, dynamic>;
          widget.onEvent?.call(
            decoded['event'] as String,
            Map<String, dynamic>.from(decoded['payload'] as Map),
          );
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (_) =>
              widget.onCreated(_MobileChartController(_controller)),
        ),
      )
      ..loadFlutterAsset(
          'packages/chart_engine/assets/chart/chart.html');
  }

  @override
  Widget build(BuildContext context) {
    return WebViewWidget(controller: _controller);
  }
}

class _MobileChartController implements ChartController {
  _MobileChartController(this._controller);
  final WebViewController _controller;

  void _run(String js) {
    // Batch-friendly: for high-frequency ticks, call addOrUpdateBar at most
    // every 100-250ms from your BLoC, not per raw tick.
    _controller.runJavaScript(js);
  }

  @override
  Future<void> setData(List<ChartBar> bars) async {
    _run("window.ChartBridge.setData('${escapeForJs(jsonEncodeBars(bars))}');");
  }

  @override
  Future<void> addOrUpdateBar(ChartBar bar) async {
    _run("window.ChartBridge.addOrUpdateBar('${escapeForJs(jsonEncodeBar(bar))}');");
  }

  @override
  Future<void> setPatternMarkers(List<PatternMarker> markers) async {
    _run("window.ChartBridge.setPatternMarkers('${escapeForJs(jsonEncodeMarkers(markers))}');");
  }

  @override
  Future<void> setTheme({
    required String background,
    required String text,
    ChartTheme? theme,
  }) async {
    final t = theme ?? ChartTheme(background: background, text: text);
    _run("window.ChartBridge.setTheme('${escapeForJs(jsonEncodeTheme(t))}');");
  }

  @override
  Future<void> setChartType(ChartType type) async {
    _run("window.ChartBridge.setChartType('${type.toJson()}');");
  }

  @override
  Future<void> setAvailableIntervals(List<ChartInterval> intervals) async {
    _run("window.ChartBridge.setAvailableIntervals('${escapeForJs(jsonEncodeIntervals(intervals))}');");
  }

  @override
  Future<void> setDrawings(List<Drawing> drawings) async {
    _run("window.ChartBridge.setDrawings('${escapeForJs(jsonEncodeDrawings(drawings))}');");
  }

  @override
  Future<void> setIndicators(List<IndicatorConfig> indicators) async {
    _run("window.ChartBridge.setIndicators('${escapeForJs(jsonEncodeIndicators(indicators))}');");
  }

  @override
  Future<void> getLayout() async {
    _run("window.ChartBridge.getLayout();");
  }

  @override
  Future<void> applyLayout(ChartLayout layout) async {
    _run("window.ChartBridge.applyLayout('${escapeForJs(jsonEncodeLayout(layout))}');");
  }
}
