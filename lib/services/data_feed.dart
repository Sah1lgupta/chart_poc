import 'dart:async';
import 'dart:math';
import 'package:flutter/foundation.dart';
import 'package:chart_engine/chart_engine.dart';

/// Abstract contract representing the data feed interface.
/// The real WebSocket / REST API service will implement this exact same interface.
abstract class ChartDataFeed {
  /// Fetches historical bars for a given symbol and interval.
  /// Represents a REST API request (e.g., `getBars`).
  Future<List<ChartBar>> getHistoricalBars({
    required String symbol,
    required String interval,
    required int limit,
    int? endTime,
  });

  /// Subscribes to live ticks for a given symbol and interval.
  /// Returns a broadcast stream of OHLC candle updates.
  Stream<ChartBar> subscribeTicks({
    required String symbol,
    required String interval,
  });

  /// Unsubscribes from live ticks for a given symbol and interval.
  Future<void> unsubscribeTicks({
    required String symbol,
    required String interval,
  });
}

/// Helper class to parse string intervals (like '1m', '5m', '1H', 'D') into seconds.
int parseIntervalToSeconds(String interval) {
  final lower = interval.toLowerCase().trim();
  if (lower == 'd' || lower == '1d') return 86400;
  if (lower == 'h' || lower == '1h' || lower == '60') return 3600;
  
  final numStr = lower.replaceAll('m', '');
  final val = int.tryParse(numStr);
  if (val != null) {
    if (lower.contains('h')) return val * 3600;
    return val * 60;
  }
  return 60; // Default fallback to 1 minute
}

/// Single symbol simulator containing its own price state, feed configurations,
/// and connections. By having independent state per symbol, we ensure no cross-contamination.
class SymbolSimulator {
  final String symbol;
  final String interval;
  final Random _rand = Random();

  // Price generation parameters
  double lastPrice;
  double volatility; // Standard deviation coefficient (e.g. 0.002 = 0.2% change per tick)
  double trendBias;  // Drift coefficient (e.g. 0.0001 drift up per tick)
  
  // Connection states
  bool isConnected = true;
  bool forceEmptyHistory = false;
  bool forceMalformedHistory = false;
  bool injectOutOfOrder = false;
  bool injectDuplicates = false;

  // Internal history & tick tracking
  final List<ChartBar> _history = [];
  ChartBar? _currentBar;
  int? _lastEmittedTime;
  
  // Live tick stream management
  StreamController<ChartBar>? _controller;
  Timer? _timer;
  Duration _tickInterval = const Duration(seconds: 1);

  SymbolSimulator({
    required this.symbol,
    required this.interval,
    double? initialPrice,
    this.volatility = 0.0015,
    this.trendBias = 0.0,
  }) : lastPrice = initialPrice ?? _getDefaultPrice(symbol) {
    _generateInitialHistory(250);
  }

  static double _getDefaultPrice(String symbol) {
    final s = symbol.toUpperCase();
    if (s.contains('BTC')) return 64000.0;
    if (s.contains('ETH')) return 3400.0;
    if (s.contains('SOL')) return 145.0;
    if (s.contains('ADA')) return 0.45;
    return 100.0;
  }

  /// Sets the frequency of the tick stream.
  void setTickSpeed(String speed) {
    Duration duration;
    switch (speed.toLowerCase()) {
      case 'quiet':
        duration = const Duration(milliseconds: 2000);
        break;
      case 'normal':
        duration = const Duration(milliseconds: 1000);
        break;
      case 'fast':
      case 'high-frequency':
        duration = const Duration(milliseconds: 150);
        break;
      default:
        duration = const Duration(milliseconds: 1000);
    }
    _tickInterval = duration;
    if (_timer != null && _timer!.isActive) {
      _startTimer();
    }
  }

  /// Generates initial batch of realistic bars.
  /// Divided into market phases (uptrend, downtrend, sideways, volatile) to look like real price action.
  void _generateInitialHistory(int count) {
    _history.clear();
    final intervalSec = parseIntervalToSeconds(interval);
    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final startTime = now - (count * intervalSec);
    
    double price = lastPrice;
    
    // We break the history into 4 distinct phases for realistic look
    final phaseLength = count ~/ 4;
    
    for (int i = 0; i < count; i++) {
      final barTime = startTime + (i * intervalSec);
      
      // Determine drift phase
      double currentDrift = trendBias;
      double currentVol = volatility;
      if (i < phaseLength) {
        // Phase 1: Mild Uptrend
        currentDrift += currentVol * 0.2;
      } else if (i < phaseLength * 2) {
        // Phase 2: Sideways/Choppy
        currentDrift = 0.0;
      } else if (i < phaseLength * 3) {
        // Phase 3: Mild Downtrend
        currentDrift -= currentVol * 0.2;
      } else {
        // Phase 4: Volatile Trend Run
        currentDrift += currentVol * 0.4;
        currentVol *= 1.5;
      }

      final open = price;
      // Multi-step walk per candle to create realistic high/lows
      double high = open;
      double low = open;
      double close = open;
      
      for (int step = 0; step < 5; step++) {
        final change = close * (currentDrift + (_rand.nextDouble() - 0.5) * currentVol);
        close += change;
        high = max(high, close);
        low = min(low, close);
      }

      price = close;
      
      _history.add(ChartBar(
        time: barTime,
        open: open,
        high: high,
        low: low,
        close: close,
        volume: 50.0 + _rand.nextDouble() * 200.0,
      ));
    }
    
    lastPrice = price;
    _currentBar = _history.last;
    _lastEmittedTime = _currentBar!.time;
  }

  /// Returns copy of the current cached history
  List<ChartBar> getHistory() {
    if (forceEmptyHistory) return [];
    if (forceMalformedHistory) {
      // Return bars with extreme/incorrect fields or zeroed values to test recovery
      return _history.map((bar) => ChartBar(
        time: bar.time,
        open: 0,
        high: -100,
        low: 999999,
        close: 0,
        volume: -10,
      )).toList();
    }
    return List.from(_history);
  }

  /// Activates the live tick feed
  Stream<ChartBar> start() {
    _controller ??= StreamController<ChartBar>.broadcast();
    _startTimer();
    return _controller!.stream;
  }

  /// Deactivates the live tick feed
  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(_tickInterval, (timer) {
      if (!isConnected) return;
      _generateTick();
    });
  }

  /// Generates a single tick
  void _generateTick() {
    if (_controller == null || _controller!.isClosed) return;

    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final intervalSec = parseIntervalToSeconds(interval);
    final barTime = now - (now % intervalSec);

    // Roll over check
    if (_currentBar == null || barTime > _currentBar!.time) {
      if (_currentBar != null) {
        // Add finalized bar to history
        _history.add(_currentBar!);
        if (_history.length > 1000) {
          _history.removeAt(0); // Cap memory growth
        }
      }
      
      _currentBar = ChartBar(
        time: barTime,
        open: lastPrice,
        high: lastPrice,
        low: lastPrice,
        close: lastPrice,
        volume: 0,
      );
    }

    // Volatility and drift pricing model
    final change = lastPrice * (trendBias + (_rand.nextDouble() - 0.5) * volatility);
    final newPrice = lastPrice + change;
    lastPrice = newPrice;

    // Update current bar
    _currentBar = ChartBar(
      time: _currentBar!.time,
      open: _currentBar!.open,
      high: max(_currentBar!.high, newPrice),
      low: min(_currentBar!.low, newPrice),
      close: newPrice,
      volume: _currentBar!.volume + _rand.nextDouble() * 15.0,
    );

    _lastEmittedTime = now;

    // Tick injectors for testing harness robustness
    if (injectDuplicates) {
      // Emit the exact same bar twice
      _controller!.add(_currentBar!);
      _controller!.add(_currentBar!);
    } else if (injectOutOfOrder && _rand.nextDouble() < 0.2 && _history.isNotEmpty) {
      // 20% chance to send an out-of-order bar from the past
      final pastIndex = _rand.nextInt(_history.length);
      final pastBar = _history[pastIndex];
      // Slightly alter price of past bar
      final alteredBar = ChartBar(
        time: pastBar.time,
        open: pastBar.open,
        high: pastBar.high * 1.001,
        low: pastBar.low * 0.999,
        close: pastBar.close * 1.0005,
        volume: pastBar.volume,
      );
      _controller!.add(alteredBar);
      
      // Also send the current bar so normal feed doesn't stall
      _controller!.add(_currentBar!);
    } else {
      // Happy path tick
      _controller!.add(_currentBar!);
    }
  }

  /// Simulates a disconnect. Stops emitting ticks over the stream.
  void disconnect() {
    isConnected = false;
    debugPrint('[MockFeed] Symbol $symbol disconnected.');
  }

  /// Simulates a reconnect. Calculates the time gap, generates missing bars,
  /// emits them as a burst, and resumes normal ticking.
  void reconnect() {
    if (isConnected) return;
    isConnected = true;
    debugPrint('[MockFeed] Symbol $symbol reconnecting... Gap backfill starting.');
    
    if (_lastEmittedTime == null || _controller == null || _controller!.isClosed) {
      return;
    }

    final now = DateTime.now().millisecondsSinceEpoch ~/ 1000;
    final intervalSec = parseIntervalToSeconds(interval);
    
    final elapsedSec = now - _lastEmittedTime!;
    final missedBarsCount = elapsedSec ~/ intervalSec;

    if (missedBarsCount >= 1) {
      debugPrint('[MockFeed] Gap backfill: emitting $missedBarsCount missed bars.');
      
      double price = lastPrice;
      
      // Generate and emit missed candles sequentially
      for (int i = 1; i <= missedBarsCount; i++) {
        final missedBarTime = (_currentBar?.time ?? (now - intervalSec)) + (i * intervalSec);
        
        final open = price;
        double high = open;
        double low = open;
        double close = open;
        
        // Walk price
        for (int step = 0; step < 5; step++) {
          final change = close * (trendBias + (_rand.nextDouble() - 0.5) * volatility);
          close += change;
          high = max(high, close);
          low = min(low, close);
        }
        
        price = close;
        
        final missedBar = ChartBar(
          time: missedBarTime,
          open: open,
          high: high,
          low: low,
          close: close,
          volume: 50.0 + _rand.nextDouble() * 150.0,
        );
        
        _history.add(missedBar);
        if (_history.length > 1000) {
          _history.removeAt(0);
        }
        
        // Fast-forward publish the gap candle
        _controller!.add(missedBar);
      }
      
      lastPrice = price;
      // Initialize new current bar
      _currentBar = ChartBar(
        time: now - (now % intervalSec),
        open: lastPrice,
        high: lastPrice,
        low: lastPrice,
        close: lastPrice,
        volume: 0,
      );
    }
    
    _lastEmittedTime = now;
  }

  /// Clean up resources
  void dispose() {
    stop();
    _controller?.close();
  }
}

/// Concrete global Mock Data Feed manager implementing the stable ChartDataFeed.
/// Manages a registry of SymbolSimulators and exposes their interfaces.
class MockChartDataFeed implements ChartDataFeed {
  // Singleton pattern for easy global sharing if needed, or can be instantiated normally.
  static final MockChartDataFeed _instance = MockChartDataFeed._internal();
  factory MockChartDataFeed() => _instance;
  MockChartDataFeed._internal();

  final Map<String, SymbolSimulator> _simulators = {};

  /// Retrieves or registers a simulator for the given symbol and interval.
  SymbolSimulator getOrCreateSimulator(String symbol, String interval) {
    final key = '${symbol.toUpperCase()}_$interval';
    if (!_simulators.containsKey(key)) {
      _simulators[key] = SymbolSimulator(symbol: symbol, interval: interval);
    }
    return _simulators[key]!;
  }

  @override
  Future<List<ChartBar>> getHistoricalBars({
    required String symbol,
    required String interval,
    required int limit,
    int? endTime,
  }) async {
    // Simulate network delay of 150-300ms
    await Future.delayed(Duration(milliseconds: 150 + Random().nextInt(150)));
    
    final sim = getOrCreateSimulator(symbol, interval);
    final history = sim.getHistory();
    
    if (history.isEmpty) {
      return [];
    }
    
    // Slice history based on limit (take latest)
    if (history.length > limit) {
      return history.sublist(history.length - limit);
    }
    return history;
  }

  @override
  Stream<ChartBar> subscribeTicks({
    required String symbol,
    required String interval,
  }) {
    final sim = getOrCreateSimulator(symbol, interval);
    return sim.start();
  }

  @override
  Future<void> unsubscribeTicks({
    required String symbol,
    required String interval,
  }) async {
    final key = '${symbol.toUpperCase()}_$interval';
    final sim = _simulators[key];
    if (sim != null) {
      sim.stop();
    }
  }

  /// Clean up all simulators
  void disposeAll() {
    for (var sim in _simulators.values) {
      sim.dispose();
    }
    _simulators.clear();
  }
}
