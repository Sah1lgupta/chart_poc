// interval.dart

class ChartInterval {
  final String label;
  final int value;
  final String unit; // 'minute'|'hour'|'day'|'week'|'month'

  const ChartInterval({
    required this.label,
    required this.value,
    required this.unit,
  });

  Map<String, dynamic> toJson() => {
    'label': label,
    'value': value,
    'unit': unit,
  };

  factory ChartInterval.fromJson(Map<String, dynamic> json) => ChartInterval(
    label: json['label'] as String,
    value: json['value'] as int,
    unit: json['unit'] as String,
  );
}
