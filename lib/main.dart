import 'dart:async';
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:chart_engine/chart_engine.dart';
import 'package:chart_poc/services/data_feed.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Mock Live-Socket Test Harness',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0F111A),
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF6366F1),
          brightness: Brightness.dark,
        ),
        cardTheme: const CardThemeData(
          color: Color(0xFF151926),
          elevation: 0,
          shape: RoundedRectangleBorder(
            side: BorderSide(color: Color(0xFF242C3F), width: 1),
            borderRadius: BorderRadius.all(Radius.circular(12)),
          ),
        ),
        useMaterial3: true,
      ),
      home: const TestingDashboardScreen(),
    );
  }
}

class TestingDashboardScreen extends StatefulWidget {
  const TestingDashboardScreen({super.key});

  @override
  State<TestingDashboardScreen> createState() => _TestingDashboardScreenState();
}

class SymbolStats {
  final int ticksReceived;
  final double lastPrice;
  final double high;
  final double low;
  final int lastBarTime;
  final int duplicateCount;
  final int outOfOrderCount;
  final String status;

  SymbolStats({
    this.ticksReceived = 0,
    this.lastPrice = 0.0,
    this.high = 0.0,
    this.low = 0.0,
    this.lastBarTime = 0,
    this.duplicateCount = 0,
    this.outOfOrderCount = 0,
    this.status = 'Connected',
  });

  SymbolStats copyWith({
    int? ticksReceived,
    double? lastPrice,
    double? high,
    double? low,
    int? lastBarTime,
    int? duplicateCount,
    int? outOfOrderCount,
    String? status,
  }) {
    return SymbolStats(
      ticksReceived: ticksReceived ?? this.ticksReceived,
      lastPrice: lastPrice ?? this.lastPrice,
      high: high ?? this.high,
      low: low ?? this.low,
      lastBarTime: lastBarTime ?? this.lastBarTime,
      duplicateCount: duplicateCount ?? this.duplicateCount,
      outOfOrderCount: outOfOrderCount ?? this.outOfOrderCount,
      status: status ?? this.status,
    );
  }
}

class _TestingDashboardScreenState extends State<TestingDashboardScreen> {
  // Chart mode configuration
  bool _isGridMode = false;
  String _activeSymbol = 'BTCUSDT';
  String _currentInterval = '1m';

  // State maps per symbol
  final Map<String, ChartController> _controllers = {};
  final Map<String, StreamSubscription<ChartBar>> _subscriptions = {};
  final Map<String, SymbolStats> _stats = {};
  final Map<String, GlobalKey> _chartKeys = {};

  // Simulator configurations
  final Map<String, String> _tickSpeeds = {
    'BTCUSDT': 'normal',
    'ETHUSDT': 'normal',
    'SOLUSDT': 'normal',
    'ADAUSDT': 'normal',
  };
  final Map<String, double> _volatilities = {
    'BTCUSDT': 0.0015,
    'ETHUSDT': 0.0018,
    'SOLUSDT': 0.0025,
    'ADAUSDT': 0.0030,
  };
  final Map<String, double> _trendBiases = {
    'BTCUSDT': 0.0,
    'ETHUSDT': 0.0,
    'SOLUSDT': 0.0,
    'ADAUSDT': 0.0,
  };
  final Map<String, bool> _injectDuplicates = {
    'BTCUSDT': false,
    'ETHUSDT': false,
    'SOLUSDT': false,
    'ADAUSDT': false,
  };
  final Map<String, bool> _injectOutOfOrder = {
    'BTCUSDT': false,
    'ETHUSDT': false,
    'SOLUSDT': false,
    'ADAUSDT': false,
  };
  final Map<String, bool> _forceEmptyHistory = {
    'BTCUSDT': false,
    'ETHUSDT': false,
    'SOLUSDT': false,
    'ADAUSDT': false,
  };
  final Map<String, bool> _forceMalformedHistory = {
    'BTCUSDT': false,
    'ETHUSDT': false,
    'SOLUSDT': false,
    'ADAUSDT': false,
  };

  // Indicators
  final Set<String> _enabledIndicators = {'sma', 'rsi'};

  // Console Log
  final List<String> _consoleLogs = [];
  final ScrollController _consoleScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _logEvent('Dashboard initialized. Mock Market Feed loaded.');
  }

  @override
  void dispose() {
    _cleanupAllSubscriptions();
    _consoleScrollController.dispose();
    super.dispose();
  }

  void _cleanupAllSubscriptions() {
    for (var sub in _subscriptions.values) {
      sub.cancel();
    }
    _subscriptions.clear();
    MockChartDataFeed().disposeAll();
  }

  void _logEvent(String message) {
    final timestamp = DateTime.now().toLocal().toString().split(' ')[1].substring(0, 8);
    final logLine = '[$timestamp] $message';
    setState(() {
      _consoleLogs.add(logLine);
      if (_consoleLogs.length > 80) {
        _consoleLogs.removeAt(0);
      }
    });
    // Auto-scroll console
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_consoleScrollController.hasClients) {
        _consoleScrollController.animateTo(
          _consoleScrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  // --- Chart Setup & Data Loading ---
  void _onChartCreated(String symbol, ChartController controller) {
    _controllers[symbol] = controller;
    _logEvent('Chart canvas ready for $symbol.');
    _loadSymbolData(symbol, _currentInterval);
  }

  void _onChartEvent(String symbol, String event, Map<String, dynamic> payload) {
    debugPrint('Chart $symbol event: $event -> $payload');
    if (event == 'jsError' && mounted) {
      _logEvent('[$symbol] JS Error: ${payload['message']}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          backgroundColor: Colors.red,
          content: Text('Chart JS error: ${payload['message']}'),
          duration: const Duration(seconds: 4),
        ),
      );
    }
    if (event == 'timeframeChanged' && mounted) {
      final tf = payload['tf'] as String;
      final intervalStr = _mapTfToInterval(tf);
      _logEvent('[$symbol] Timeframe changed to tf=$tf ($intervalStr)');
      setState(() {
        _currentInterval = intervalStr;
      });
      
      if (_isGridMode) {
        // Reload all grid symbols
        _loadSymbolData('BTCUSDT', intervalStr);
        _loadSymbolData('ETHUSDT', intervalStr);
      } else {
        _loadSymbolData(symbol, intervalStr);
      }
    }
  }

  String _mapTfToInterval(String tf) {
    final clean = tf.toUpperCase().trim();
    if (clean == 'D' || clean == '1D') return '1d';
    if (clean == '60' || clean == '1H') return '1h';
    return '${clean}m';
  }

  Future<void> _loadSymbolData(String symbol, String interval) async {
    _subscriptions[symbol]?.cancel();
    
    final feed = MockChartDataFeed();
    final sim = feed.getOrCreateSimulator(symbol, interval);
    
    // Inject controls from UI
    sim.forceEmptyHistory = _forceEmptyHistory[symbol] ?? false;
    sim.forceMalformedHistory = _forceMalformedHistory[symbol] ?? false;
    sim.volatility = _volatilities[symbol] ?? 0.0015;
    sim.trendBias = _trendBiases[symbol] ?? 0.0;
    sim.setTickSpeed(_tickSpeeds[symbol] ?? 'normal');

    _logEvent('[$symbol] Loading history...');
    
    try {
      final bars = await feed.getHistoricalBars(
        symbol: symbol,
        interval: interval,
        limit: 200,
      );
      
      final controller = _controllers[symbol];
      if (controller != null) {
        if (bars.isEmpty) {
          _logEvent('[$symbol] Historical fetch returned empty (Simulating Load Error).');
          // Clear chart data to show error/empty state
          await controller.setData([]);
        } else {
          await controller.setData(bars);
          _logEvent('[$symbol] Loaded ${bars.length} historical bars.');
          
          // Reapply active indicators
          _updateIndicatorsForSymbol(symbol);
        }
      }
    } catch (e) {
      _logEvent('[$symbol] Exception loading history: $e');
    }
    
    // Subscribe to live tick stream
    _subscribeToSymbol(symbol, interval);
  }

  void _subscribeToSymbol(String symbol, String interval) {
    _subscriptions[symbol]?.cancel();
    
    final feed = MockChartDataFeed();
    final sim = feed.getOrCreateSimulator(symbol, interval);
    
    // Sync current controls
    sim.volatility = _volatilities[symbol] ?? 0.0015;
    sim.trendBias = _trendBiases[symbol] ?? 0.0;
    sim.injectDuplicates = _injectDuplicates[symbol] ?? false;
    sim.injectOutOfOrder = _injectOutOfOrder[symbol] ?? false;
    sim.setTickSpeed(_tickSpeeds[symbol] ?? 'normal');

    _logEvent('[$symbol] WebSocket subscribing to live tick stream.');

    final stream = feed.subscribeTicks(symbol: symbol, interval: interval);
    
    _subscriptions[symbol] = stream.listen((bar) {
      final controller = _controllers[symbol];
      if (controller != null && sim.isConnected) {
        controller.addOrUpdateBar(bar);
      }

      final prevStats = _stats[symbol];
      int dupCount = prevStats?.duplicateCount ?? 0;
      int oooCount = prevStats?.outOfOrderCount ?? 0;

      if (prevStats != null) {
        if (bar.time < prevStats.lastBarTime) {
          oooCount++;
          _logEvent('[$symbol] Out-of-Order tick injected at T=${bar.time} (Price: ${bar.close.toStringAsFixed(2)})');
        } else if (bar.time == prevStats.lastBarTime && bar.close == prevStats.lastPrice && sim.injectDuplicates) {
          dupCount++;
          _logEvent('[$symbol] Duplicate tick injected at T=${bar.time} (Price: ${bar.close.toStringAsFixed(2)})');
        }
      }

      setState(() {
        _stats[symbol] = SymbolStats(
          ticksReceived: (prevStats?.ticksReceived ?? 0) + 1,
          lastPrice: bar.close,
          high: bar.high,
          low: bar.low,
          lastBarTime: bar.time,
          duplicateCount: dupCount,
          outOfOrderCount: oooCount,
          status: sim.isConnected ? 'Connected' : 'Disconnected',
        );
      });
    }, onError: (err) {
      _logEvent('[$symbol] WS Error: $err');
    });
  }

  void _toggleConnection(String symbol) {
    final feed = MockChartDataFeed();
    final sim = feed.getOrCreateSimulator(symbol, _currentInterval);
    
    if (sim.isConnected) {
      sim.disconnect();
      _logEvent('[$symbol] Killed Socket connection.');
      setState(() {
        _stats[symbol] = (_stats[symbol] ?? SymbolStats()).copyWith(status: 'Disconnected');
      });
    } else {
      _logEvent('[$symbol] Restoring Socket connection...');
      setState(() {
        _stats[symbol] = (_stats[symbol] ?? SymbolStats()).copyWith(status: 'Reconnecting');
      });
      
      // Simulate real-world reconnect authentication/latency
      Future.delayed(const Duration(milliseconds: 600), () {
        sim.reconnect();
        _subscribeToSymbol(symbol, _currentInterval);
        _logEvent('[$symbol] Socket connected. Injected reconnection gap bars.');
        setState(() {
          _stats[symbol] = (_stats[symbol] ?? SymbolStats()).copyWith(status: 'Connected');
        });
      });
    }
  }

  void _updateIndicatorsForSymbol(String symbol) {
    final controller = _controllers[symbol];
    if (controller == null) return;
    
    final configs = <IndicatorConfig>[];
    for (var indId in _enabledIndicators) {
      if (indId == 'sma') {
        configs.add(const IndicatorConfig(
          id: 'sma_9',
          indicatorId: 'sma',
          displayName: 'SMA (9)',
          category: 'main',
          params: {'period': 9},
          color: '#f0b90b',
        ));
      } else if (indId == 'ema') {
        configs.add(const IndicatorConfig(
          id: 'ema_9',
          indicatorId: 'ema',
          displayName: 'EMA (9)',
          category: 'main',
          params: {'period': 9},
          color: '#e02424',
        ));
      } else if (indId == 'rsi') {
        configs.add(const IndicatorConfig(
          id: 'rsi_14',
          indicatorId: 'rsi',
          displayName: 'RSI (14)',
          category: 'sub',
          params: {'period': 14},
          color: '#a78bfa',
        ));
      } else if (indId == 'macd') {
        configs.add(const IndicatorConfig(
          id: 'macd_default',
          indicatorId: 'macd',
          displayName: 'MACD (12, 26, 9)',
          category: 'sub',
          params: {'fastPeriod': 12, 'slowPeriod': 26, 'signalPeriod': 9},
          color: '#3b82f6',
        ));
      } else if (indId == 'bb') {
        configs.add(const IndicatorConfig(
          id: 'bb_default',
          indicatorId: 'bb',
          displayName: 'Bollinger Bands (20, 2)',
          category: 'main',
          params: {'period': 20, 'stdDev': 2},
          color: '#10b981',
        ));
      } else if (indId == 'vwap') {
        configs.add(const IndicatorConfig(
          id: 'vwap_default',
          indicatorId: 'vwap',
          displayName: 'VWAP',
          category: 'main',
          params: {},
          color: '#3b82f6',
        ));
      } else if (indId == 'atr') {
        configs.add(const IndicatorConfig(
          id: 'atr_14',
          indicatorId: 'atr',
          displayName: 'ATR (14)',
          category: 'sub',
          params: {'period': 14},
          color: '#f43f5e',
        ));
      }
    }
    controller.setIndicators(configs);
  }

  void _toggleIndicator(String indId) {
    setState(() {
      if (_enabledIndicators.contains(indId)) {
        _enabledIndicators.remove(indId);
      } else {
        _enabledIndicators.add(indId);
      }
    });
    for (var symbol in _controllers.keys) {
      _updateIndicatorsForSymbol(symbol);
    }
    _logEvent('Indicators sync update: ${_enabledIndicators.join(", ")}');
  }

  void _setGridMode(bool value) {
    setState(() {
      _isGridMode = value;
    });
    
    if (value) {
      _activeSymbol = 'BTCUSDT'; // Focus settings panel on BTCUSDT by default
      _logEvent('Switched to Grid Mode (BTCUSDT + ETHUSDT)');
      // Cleanup older single chart non-grid symbols
      final toKeep = {'BTCUSDT', 'ETHUSDT'};
      for (var s in _subscriptions.keys.toList()) {
        if (!toKeep.contains(s)) {
          _subscriptions[s]?.cancel();
          _subscriptions.remove(s);
          _controllers.remove(s);
        }
      }
    } else {
      _logEvent('Switched to Single Chart: $_activeSymbol');
      // Cleanup non-active symbol
      for (var s in _subscriptions.keys.toList()) {
        if (s != _activeSymbol) {
          _subscriptions[s]?.cancel();
          _subscriptions.remove(s);
          _controllers.remove(s);
        }
      }
    }
  }

  void _switchActiveSymbol(String symbol) {
    if (_isGridMode) {
      setState(() {
        _activeSymbol = symbol; // Just switches control panel tweak target in grid mode
      });
      _logEvent('Control settings switched to $symbol');
    } else {
      final old = _activeSymbol;
      setState(() {
        _activeSymbol = symbol;
      });
      _subscriptions[old]?.cancel();
      _subscriptions.remove(old);
      _controllers.remove(old);
      _logEvent('Chart switched to $symbol. Connecting simulator...');
    }
  }

  // --- UI Helpers ---
  Widget _buildChartContainer(String symbol) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF131722),
        border: Border.all(color: const Color(0xFF242C3F), width: 1.5),
        borderRadius: BorderRadius.circular(12),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(10),
        child: Column(
          children: [
            // Internal Header
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              color: const Color(0xFF1E222D),
              child: Row(
                children: [
                  Text(
                    symbol,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white),
                  ),
                  const SizedBox(width: 8),
                  _buildStatusBadge(symbol),
                  const Spacer(),
                  // mini telemetry inline
                  Text(
                    _stats[symbol] != null
                        ? '\$${_stats[symbol]!.lastPrice.toStringAsFixed(2)}'
                        : '--',
                    style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.tealAccent, fontFamily: 'monospace'),
                  ),
                ],
              ),
            ),
            // Viewport
            Expanded(
              child: ChartView(
                key: _chartKeys[symbol] ??= GlobalKey(debugLabel: 'chart-$symbol'),
                onCreated: (controller) => _onChartCreated(symbol, controller),
                onEvent: (event, payload) => _onChartEvent(symbol, event, payload),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusBadge(String symbol) {
    final status = _stats[symbol]?.status ?? 'Connected';
    Color color;
    IconData icon;
    
    switch (status) {
      case 'Connected':
        color = const Color(0xFF10B981);
        icon = Icons.cloud_done;
        break;
      case 'Disconnected':
        color = const Color(0xFFEF4444);
        icon = Icons.cloud_off;
        break;
      case 'Reconnecting':
      default:
        color = const Color(0xFFF59E0B);
        icon = Icons.sync;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color, width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 10, color: color),
          const SizedBox(width: 4),
          Text(
            status.toUpperCase(),
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: color),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF151926),
        elevation: 0,
        title: Row(
          children: [
            const Icon(Icons.bolt, color: Colors.yellowAccent),
            const SizedBox(width: 8),
            const Text(
              'Mock Live-Socket Test Harness',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white),
            ),
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.indigo.withOpacity(0.3),
                borderRadius: BorderRadius.circular(4),
              ),
              child: const Text('POC STABLE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.indigoAccent)),
            )
          ],
        ),
        actions: [
          // Grid mode switch in app bar
          Row(
            children: [
              const Icon(Icons.grid_view_rounded, size: 18),
              const SizedBox(width: 6),
              const Text('Grid Mode', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
              Switch(
                value: _isGridMode,
                activeColor: const Color(0xFF6366F1),
                onChanged: _setGridMode,
              ),
            ],
          ),
          const SizedBox(width: 16),
        ],
      ),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 1. Chart Display Panel
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.all(12.0),
              child: _isGridMode
                  ? Row(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Expanded(child: _buildChartContainer('BTCUSDT')),
                        const SizedBox(width: 12),
                        Expanded(child: _buildChartContainer('ETHUSDT')),
                      ],
                    )
                  : _buildChartContainer(_activeSymbol),
            ),
          ),

          // 2. Testing Control Panel (Sidebar)
          Container(
            width: 420,
            decoration: const BoxDecoration(
              color: Color(0xFF11141F),
              border: Border(
                left: BorderSide(color: Color(0xFF242C3F), width: 1.5),
              ),
            ),
            child: Column(
              children: [
                // Control Panel Header
                Container(
                  padding: const EdgeInsets.all(16),
                  color: const Color(0xFF151926),
                  child: Row(
                    children: [
                      const Icon(Icons.tune, color: Color(0xFF6366F1)),
                      const SizedBox(width: 8),
                      const Text(
                        'Simulator Settings',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const Spacer(),
                      if (_isGridMode)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(color: Colors.orange.withOpacity(0.1), borderRadius: BorderRadius.circular(4)),
                          child: const Text('GRID TARGETING', style: TextStyle(fontSize: 9, color: Colors.orange)),
                        )
                    ],
                  ),
                ),

                // Controls Scroller
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Symbol Selection Slider / Tabs (for tweaking)
                        _buildSymbolTweakSelector(),
                        const SizedBox(height: 12),

                        // Section: Connection Controls
                        _buildConnectionCard(),
                        const SizedBox(height: 12),

                        // Section: Generator Physics Settings
                        _buildPhysicsCard(),
                        const SizedBox(height: 12),

                        // Section: Anomaly Injectors
                        _buildAnomalyCard(),
                        const SizedBox(height: 12),

                        // Section: Indicators
                        _buildIndicatorsCard(),
                        const SizedBox(height: 12),

                        // Section: Telemetry/Metrics
                        _buildTelemetryCard(),
                      ],
                    ),
                  ),
                ),

                // Section: Terminal Log Console (persistent at bottom)
                _buildConsoleConsole(),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSymbolTweakSelector() {
    final symbols = _isGridMode ? ['BTCUSDT', 'ETHUSDT'] : ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'ADAUSDT'];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(8.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Select Instrument to Configure',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            SegmentedButton<String>(
              segments: symbols
                  .map((s) => ButtonSegment<String>(
                        value: s,
                        label: Text(s, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                      ))
                  .toList(),
              selected: {_activeSymbol},
              onSelectionChanged: (selectedSet) {
                _switchActiveSymbol(selectedSet.first);
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildConnectionCard() {
    final symbol = _activeSymbol;
    final isConnected = MockChartDataFeed().getOrCreateSimulator(symbol, _currentInterval).isConnected;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const Icon(Icons.wifi, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                const Text('Harness Socket Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                const Spacer(),
                _buildStatusBadge(symbol),
              ],
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: () => _toggleConnection(symbol),
              style: ElevatedButton.styleFrom(
                backgroundColor: isConnected ? const Color(0xFFEF4444).withOpacity(0.15) : const Color(0xFF10B981).withOpacity(0.15),
                foregroundColor: isConnected ? const Color(0xFFEF4444) : const Color(0xFF10B981),
                side: BorderSide(color: isConnected ? const Color(0xFFEF4444) : const Color(0xFF10B981), width: 1),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              icon: Icon(isConnected ? Icons.link_off : Icons.link),
              label: Text(isConnected ? 'KILL SOCKET CONNECTION' : 'RESTORE CONNECTION (GAP FILL)'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhysicsCard() {
    final symbol = _activeSymbol;
    final sim = MockChartDataFeed().getOrCreateSimulator(symbol, _currentInterval);
    final speed = _tickSpeeds[symbol] ?? 'normal';

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.timeline, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Text('Price Action Physics', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
            const SizedBox(height: 12),
            
            // Speed settings
            const Text('Socket Tick Rate Frequency', style: TextStyle(fontSize: 11, color: Colors.grey)),
            const SizedBox(height: 6),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'quiet', label: Text('Quiet (2s)', style: TextStyle(fontSize: 10))),
                ButtonSegment(value: 'normal', label: Text('Normal (1s)', style: TextStyle(fontSize: 10))),
                ButtonSegment(value: 'fast', label: Text('High-Freq (150ms)', style: TextStyle(fontSize: 10))),
              ],
              selected: {speed},
              onSelectionChanged: (selectedSet) {
                final speedStr = selectedSet.first;
                setState(() {
                  _tickSpeeds[symbol] = speedStr;
                });
                sim.setTickSpeed(speedStr);
                _logEvent('[$symbol] Tick rate set to $speedStr.');
              },
            ),
            const SizedBox(height: 12),

            // Volatility Slider
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Asset Volatility Factor', style: TextStyle(fontSize: 11, color: Colors.grey)),
                Text('${(_volatilities[symbol]! * 100).toStringAsFixed(2)}%', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.tealAccent)),
              ],
            ),
            Slider(
              value: _volatilities[symbol]!,
              min: 0.0005,
              max: 0.0080,
              divisions: 15,
              activeColor: const Color(0xFF6366F1),
              onChanged: (val) {
                setState(() {
                  _volatilities[symbol] = val;
                });
                sim.volatility = val;
              },
            ),

            // Drift Slider
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Market Trend Bias (Drift)', style: TextStyle(fontSize: 11, color: Colors.grey)),
                Row(
                  children: [
                    Text(
                      _trendBiases[symbol]! > 0 ? '+${(_trendBiases[symbol]! * 1000).toStringAsFixed(1)}' : '${(_trendBiases[symbol]! * 1000).toStringAsFixed(1)}',
                      style: TextStyle(
                        fontSize: 11, 
                        fontWeight: FontWeight.bold, 
                        color: _trendBiases[symbol]! > 0 ? Colors.greenAccent : (_trendBiases[symbol]! < 0 ? Colors.redAccent : Colors.grey)
                      ),
                    ),
                    const SizedBox(width: 4),
                    IconButton(
                      icon: const Icon(Icons.refresh, size: 10),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        setState(() {
                          _trendBiases[symbol] = 0.0;
                        });
                        sim.trendBias = 0.0;
                        _logEvent('[$symbol] Reset trend bias to sideways.');
                      },
                    )
                  ],
                ),
              ],
            ),
            Slider(
              value: _trendBiases[symbol]!,
              min: -0.0020,
              max: 0.0020,
              divisions: 20,
              activeColor: const Color(0xFF6366F1),
              onChanged: (val) {
                setState(() {
                  _trendBiases[symbol] = val;
                });
                sim.trendBias = val;
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAnomalyCard() {
    final symbol = _activeSymbol;
    final sim = MockChartDataFeed().getOrCreateSimulator(symbol, _currentInterval);

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.bug_report, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Text('Network Anomaly Injector', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
            const SizedBox(height: 8),

            SwitchListTile(
              title: const Text('Inject Out-of-Order Ticks', style: TextStyle(fontSize: 11)),
              subtitle: const Text('Sends a tick from the past periodically', style: TextStyle(fontSize: 9, color: Colors.grey)),
              value: _injectOutOfOrder[symbol]!,
              activeColor: const Color(0xFF6366F1),
              dense: true,
              onChanged: (val) {
                setState(() {
                  _injectOutOfOrder[symbol] = val;
                });
                sim.injectOutOfOrder = val;
                _logEvent('[$symbol] Inject Out-of-Order: $val');
              },
            ),

            SwitchListTile(
              title: const Text('Inject Duplicate Ticks', style: TextStyle(fontSize: 11)),
              subtitle: const Text('Repeats identical prices on ticks', style: TextStyle(fontSize: 9, color: Colors.grey)),
              value: _injectDuplicates[symbol]!,
              activeColor: const Color(0xFF6366F1),
              dense: true,
              onChanged: (val) {
                setState(() {
                  _injectDuplicates[symbol] = val;
                });
                sim.injectDuplicates = val;
                _logEvent('[$symbol] Inject Duplicates: $val');
              },
            ),

            SwitchListTile(
              title: const Text('Simulate Bad History (Empty)', style: TextStyle(fontSize: 11)),
              subtitle: const Text('Makes history call fail/return empty on load', style: TextStyle(fontSize: 9, color: Colors.grey)),
              value: _forceEmptyHistory[symbol]!,
              activeColor: const Color(0xFF6366F1),
              dense: true,
              onChanged: (val) {
                setState(() {
                  _forceEmptyHistory[symbol] = val;
                  if (val) {
                    _forceMalformedHistory[symbol] = false; // Mutually exclusive
                    sim.forceMalformedHistory = false;
                  }
                });
                sim.forceEmptyHistory = val;
                _logEvent('[$symbol] Force Empty History: $val. (Reload history to test)');
              },
            ),

            SwitchListTile(
              title: const Text('Simulate Malformed History', style: TextStyle(fontSize: 11)),
              subtitle: const Text('Sends zeroed/incorrect historical fields', style: TextStyle(fontSize: 9, color: Colors.grey)),
              value: _forceMalformedHistory[symbol]!,
              activeColor: const Color(0xFF6366F1),
              dense: true,
              onChanged: (val) {
                setState(() {
                  _forceMalformedHistory[symbol] = val;
                  if (val) {
                    _forceEmptyHistory[symbol] = false; // Mutually exclusive
                    sim.forceEmptyHistory = false;
                  }
                });
                sim.forceMalformedHistory = val;
                _logEvent('[$symbol] Force Malformed History: $val. (Reload history to test)');
              },
            ),
            
            const SizedBox(height: 6),
            OutlinedButton.icon(
              onPressed: () => _loadSymbolData(symbol, _currentInterval),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFF242C3F)),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
              ),
              icon: const Icon(Icons.refresh, size: 14),
              label: const Text('RE-LOAD HISTORICAL DATA', style: TextStyle(fontSize: 11)),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIndicatorsCard() {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.analytics, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Text('Active Live Indicators', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                _buildIndicatorChip('sma', 'SMA (9)'),
                _buildIndicatorChip('ema', 'EMA (9)'),
                _buildIndicatorChip('bb', 'Boll (20,2)'),
                _buildIndicatorChip('rsi', 'RSI (14)'),
                _buildIndicatorChip('macd', 'MACD'),
                _buildIndicatorChip('atr', 'ATR (14)'),
                _buildIndicatorChip('vwap', 'VWAP'),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildIndicatorChip(String id, String label) {
    final isEnabled = _enabledIndicators.contains(id);
    return InkWell(
      onTap: () => _toggleIndicator(id),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: isEnabled ? const Color(0xFF6366F1).withOpacity(0.12) : const Color(0xFF1A1F30),
          border: Border.all(
            color: isEnabled ? const Color(0xFF6366F1) : const Color(0xFF242C3F),
            width: 1,
          ),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 11, 
            fontWeight: FontWeight.bold, 
            color: isEnabled ? Colors.white : Colors.grey[400]
          ),
        ),
      ),
    );
  }

  Widget _buildTelemetryCard() {
    final symbol = _activeSymbol;
    final stat = _stats[symbol] ?? SymbolStats();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.equalizer, size: 16, color: Colors.grey),
                const SizedBox(width: 6),
                Text('Telemetry & Stats Monitor', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
              ],
            ),
            const SizedBox(height: 12),
            _buildTelemetryRow('Ticks Received', '${stat.ticksReceived}', Colors.white),
            _buildTelemetryRow('Current Price', stat.lastPrice > 0 ? '\$${stat.lastPrice.toStringAsFixed(2)}' : '--', Colors.tealAccent),
            _buildTelemetryRow('Session High Price', stat.high > 0 ? '\$${stat.high.toStringAsFixed(2)}' : '--', Colors.greenAccent),
            _buildTelemetryRow('Session Low Price', stat.low > 0 ? '\$${stat.low.toStringAsFixed(2)}' : '--', Colors.redAccent),
            _buildTelemetryRow('Duplicate Ticks Count', '${stat.duplicateCount}', stat.duplicateCount > 0 ? Colors.orangeAccent : Colors.grey),
            _buildTelemetryRow('Out-of-Order Ticks Count', '${stat.outOfOrderCount}', stat.outOfOrderCount > 0 ? Colors.redAccent : Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildTelemetryRow(String label, String value, Color valueColor) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          Text(
            value,
            style: TextStyle(
              fontSize: 11, 
              fontWeight: FontWeight.bold, 
              color: valueColor, 
              fontFamily: 'monospace'
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildConsoleConsole() {
    return Container(
      height: 180,
      decoration: const BoxDecoration(
        color: Color(0xFF0A0C13),
        border: Border(
          top: BorderSide(color: Color(0xFF242C3F), width: 1.5),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            color: const Color(0xFF0F111A),
            child: Row(
              children: [
                const Icon(Icons.terminal, size: 14, color: Colors.tealAccent),
                const SizedBox(width: 6),
                const Text(
                  'WebSocket Telemetry Log',
                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.tealAccent),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _consoleLogs.clear();
                    });
                  },
                  style: TextButton.styleFrom(
                    padding: EdgeInsets.zero,
                    minimumSize: const Size(50, 20),
                    tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                  child: const Text('CLEAR LOGS', style: TextStyle(fontSize: 10, color: Colors.grey)),
                )
              ],
            ),
          ),
          Expanded(
            child: ListView.builder(
              controller: _consoleScrollController,
              padding: const EdgeInsets.all(12),
              itemCount: _consoleLogs.length,
              itemBuilder: (context, index) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 2.0),
                  child: Text(
                    _consoleLogs[index],
                    style: const TextStyle(
                      fontFamily: 'monospace', 
                      fontSize: 10, 
                      color: Color(0xFFC5C9D6)
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}