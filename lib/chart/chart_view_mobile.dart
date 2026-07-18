// chart_view_mobile.dart
// Mobile implementation: loads the SAME chart.html (bundled as a Flutter
// asset) into a webview_flutter WebView.
//
// pubspec.yaml:
//   dependencies:
//     webview_flutter: ^4.7.0
//   flutter:
//     assets:
//       - assets/chart/chart.html
//
// Place chart.html at: assets/chart/chart.html

import 'dart:convert';

import 'package:flutter/widgets.dart';
import 'package:webview_flutter/webview_flutter.dart';

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
          onPageFinished: (_) => widget.onCreated(_MobileChartController(_controller)),
        ),
      )
      ..loadFlutterAsset('assets/chart/chart.html');
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
    _run("window.ChartBridge.setData('${_escape(jsonEncodeBars(bars))}');");
  }

  @override
  Future<void> addOrUpdateBar(ChartBar bar) async {
    _run("window.ChartBridge.addOrUpdateBar('${_escape(jsonEncodeBar(bar))}');");
  }

  @override
  Future<void> setPatternMarkers(List<PatternMarker> markers) async {
    _run("window.ChartBridge.setPatternMarkers('${_escape(jsonEncodeMarkers(markers))}');");
  }

  @override
  Future<void> setTheme({required String background, required String text}) async {
    _run("window.ChartBridge.setTheme('$background', '$text');");
  }

  String _escape(String s) => s.replaceAll('\\', '\\\\').replaceAll("'", "\\'");
}