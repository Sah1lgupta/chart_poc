import 'dart:math';

import 'package:flutter/material.dart';

import 'chart/chart_view.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Chart Engine Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.deepPurple,
          brightness: Brightness.dark,
        ),
      ),
      home: const ChartScreen(title: 'BTCUSDT'),
    );
  }
}

class ChartScreen extends StatefulWidget {
  const ChartScreen({super.key, required this.title});

  final String title;

  @override
  State<ChartScreen> createState() => _ChartScreenState();
}

class _ChartScreenState extends State<ChartScreen> {
  ChartController? _controller;
  double _lastClose = 64000;
  final _rand = Random();

  // Called once the underlying web view / DOM element is ready.
  void _onChartCreated(ChartController controller) {
    _controller = controller;
    _controller!.setData(_generateMockBars(200));
  }

  // Called for events coming FROM the chart JS (drawing added, timeframe
  // changed, etc.) — see chart.html's emitEvent().
  void _onChartEvent(String event, Map<String, dynamic> payload) {
    debugPrint('Chart event: $event -> $payload');
    if (event == 'jsError' && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red,
          content: Text('Chart JS error: ${payload['message']}'),
          duration: const Duration(seconds: 6),
        ),
      );
    }
    if (event == 'timeframeChanged' && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Timeframe changed to ${payload['tf']}')),
      );
    }
  }

  List<ChartBar> _generateMockBars(int count) {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final bars = <ChartBar>[];
    var price = _lastClose;
    for (var i = count; i >= 0; i--) {
      final time = now - i * 60;
      final open = price;
      final change = (_rand.nextDouble() - 0.5) * 40;
      final close = open + change;
      final high = [open, close].reduce(max) + _rand.nextDouble() * 15;
      final low = [open, close].reduce(min) - _rand.nextDouble() * 15;
      price = close;
      bars.add(ChartBar(
        time: time,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: _rand.nextDouble() * 2,
      ));
    }
    _lastClose = price;
    return bars;
  }

  // Simulates one incoming live tick — this is the pattern you'd call from
  // your WebSocket listener (batched every 100-250ms, not per raw tick).
  void _simulateTick() {
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final currentMinute = now - (now % 60);
    final change = (_rand.nextDouble() - 0.5) * 40;
    final close = _lastClose + change;
    final bar = ChartBar(
      time: currentMinute,
      open: _lastClose,
      high: max(_lastClose, close) + _rand.nextDouble() * 10,
      low: min(_lastClose, close) - _rand.nextDouble() * 10,
      close: close,
      volume: _rand.nextDouble() * 2,
    );
    _lastClose = close;
    _controller?.addOrUpdateBar(bar);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF131722),
      appBar: AppBar(
        backgroundColor: const Color(0xFF1e222d),
        title: Text(widget.title),
      ),
      body: ChartView(
        onCreated: _onChartCreated,
        onEvent: _onChartEvent,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _simulateTick,
        tooltip: 'Simulate live tick',
        child: const Icon(Icons.bolt),
      ),
    );
  }
}