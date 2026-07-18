// chart_theme.dart

class ChartTheme {
  final String background;
  final String text;
  final String upColor;
  final String downColor;
  final String gridLineColor;
  final String crosshairColor;
  final String? wickUpColor;
  final String? wickDownColor;

  const ChartTheme({
    required this.background,
    required this.text,
    this.upColor = '#26a69a',
    this.downColor = '#ef5350',
    this.gridLineColor = '#202431',
    this.crosshairColor = '#758696',
    this.wickUpColor,
    this.wickDownColor,
  });

  Map<String, dynamic> toJson() => {
    'background': background,
    'text': text,
    'upColor': upColor,
    'downColor': downColor,
    'gridLineColor': gridLineColor,
    'crosshairColor': crosshairColor,
    if (wickUpColor != null) 'wickUpColor': wickUpColor,
    if (wickDownColor != null) 'wickDownColor': wickDownColor,
  };

  factory ChartTheme.fromJson(Map<String, dynamic> json) => ChartTheme(
    background: json['background'] as String,
    text: json['text'] as String,
    upColor: json['upColor'] as String? ?? '#26a69a',
    downColor: json['downColor'] as String? ?? '#ef5350',
    gridLineColor: json['gridLineColor'] as String? ?? '#202431',
    crosshairColor: json['crosshairColor'] as String? ?? '#758696',
    wickUpColor: json['wickUpColor'] as String?,
    wickDownColor: json['wickDownColor'] as String?,
  );
}
