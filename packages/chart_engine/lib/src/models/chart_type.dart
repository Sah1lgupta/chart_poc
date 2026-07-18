// chart_type.dart

enum ChartType {
  line,
  stepLine,
  area,
  candle,
  heikinAshi,
  hollowCandle,
  bar,
  renko;

  String toJson() => name;

  static ChartType fromString(String val) {
    return ChartType.values.firstWhere(
      (e) => e.name == val,
      orElse: () => ChartType.candle,
    );
  }
}
