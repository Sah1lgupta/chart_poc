/// A single OHLCV bar. `time` is a unix seconds timestamp (matches
/// Lightweight Charts' expected format).
class ChartBar {
  final int time;
  final double open, high, low, close, volume;

  const ChartBar({
    required this.time,
    required this.open,
    required this.high,
    required this.low,
    required this.close,
    this.volume = 0,
  });

  Map<String, dynamic> toJson() => {
    'time': time,
    'open': open,
    'high': high,
    'low': low,
    'close': close,
    'volume': volume,
  };
}
