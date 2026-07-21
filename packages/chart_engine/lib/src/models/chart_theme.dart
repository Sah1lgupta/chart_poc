// chart_theme.dart
// Comprehensive theme configuration for the chart engine.
// All color values are CSS-compatible hex strings (e.g. '#131722').
// Every property has a sensible default — consumers only override
// what they need for their brand.

class ChartTheme {
  // ── Core colors ──
  final String background;
  final String text;
  final String upColor;
  final String downColor;
  final String gridLineColor;
  final String crosshairColor;
  final String? wickUpColor;
  final String? wickDownColor;

  // ── Volume pane colors ──
  final String volumeUpColor;
  final String volumeDownColor;

  // ── Single-value series colors (Line / Area / StepLine / Baseline) ──
  final String lineSeriesColor;
  final String areaTopColor;
  final String areaBottomColor;

  // ── Toolbar / Chrome colors ──
  final String toolbarBackground;
  final String toolbarBorder;
  final String toolbarText;
  final String toolbarActiveBackground;
  final String toolbarActiveText;
  final String toolbarHoverBackground;

  // ── Drawing tool defaults ──
  final String drawingDefaultColor;

  // ── Typography ──
  final String fontFamily;
  final int fontSize;
  final int fontWeight;

  // ── Layout dimensions ──
  final int toolbarHeight;
  final int bottomBarHeight;
  final int toolRailWidth;

  // ── Line styles ──
  final int defaultLineWidth;

  // ── Scale / Axis ──
  final String scaleBorderColor;

  const ChartTheme({
    required this.background,
    required this.text,
    this.upColor = '#26a69a',
    this.downColor = '#ef5350',
    this.gridLineColor = '#202431',
    this.crosshairColor = '#758696',
    this.wickUpColor,
    this.wickDownColor,
    this.volumeUpColor = '#26a69a55',
    this.volumeDownColor = '#ef535055',
    this.lineSeriesColor = '#5b9cf6',
    this.areaTopColor = '#5b9cf655',
    this.areaBottomColor = '#5b9cf600',
    this.toolbarBackground = '#1e222d',
    this.toolbarBorder = '#2a2e39',
    this.toolbarText = '#b2b5be',
    this.toolbarActiveBackground = '#2962ff33',
    this.toolbarActiveText = '#5b9cf6',
    this.toolbarHoverBackground = '#2a2e39',
    this.drawingDefaultColor = '#5b9cf6',
    this.fontFamily = "-apple-system, 'Segoe UI', Roboto, sans-serif",
    this.fontSize = 12,
    this.fontWeight = 400,
    this.toolbarHeight = 44,
    this.bottomBarHeight = 30,
    this.toolRailWidth = 40,
    this.defaultLineWidth = 2,
    this.scaleBorderColor = '#2a2e39',
  });

  /// Dark theme preset — the default professional trading look.
  factory ChartTheme.dark() => const ChartTheme(
        background: '#131722',
        text: '#b2b5be',
      );

  /// Light theme preset.
  factory ChartTheme.light() => const ChartTheme(
        background: '#ffffff',
        text: '#131722',
        upColor: '#089981',
        downColor: '#f23645',
        gridLineColor: '#e0e3eb',
        crosshairColor: '#9598a1',
        volumeUpColor: '#08998155',
        volumeDownColor: '#f2364555',
        lineSeriesColor: '#2962ff',
        areaTopColor: '#2962ff55',
        areaBottomColor: '#2962ff00',
        toolbarBackground: '#f0f3fa',
        toolbarBorder: '#e0e3eb',
        toolbarText: '#131722',
        toolbarActiveBackground: '#2962ff22',
        toolbarActiveText: '#2962ff',
        toolbarHoverBackground: '#e0e3eb',
        drawingDefaultColor: '#2962ff',
        scaleBorderColor: '#e0e3eb',
      );

  Map<String, dynamic> toJson() => {
        'background': background,
        'text': text,
        'upColor': upColor,
        'downColor': downColor,
        'gridLineColor': gridLineColor,
        'crosshairColor': crosshairColor,
        if (wickUpColor != null) 'wickUpColor': wickUpColor,
        if (wickDownColor != null) 'wickDownColor': wickDownColor,
        'volumeUpColor': volumeUpColor,
        'volumeDownColor': volumeDownColor,
        'lineSeriesColor': lineSeriesColor,
        'areaTopColor': areaTopColor,
        'areaBottomColor': areaBottomColor,
        'toolbarBackground': toolbarBackground,
        'toolbarBorder': toolbarBorder,
        'toolbarText': toolbarText,
        'toolbarActiveBackground': toolbarActiveBackground,
        'toolbarActiveText': toolbarActiveText,
        'toolbarHoverBackground': toolbarHoverBackground,
        'drawingDefaultColor': drawingDefaultColor,
        'fontFamily': fontFamily,
        'fontSize': fontSize,
        'fontWeight': fontWeight,
        'toolbarHeight': toolbarHeight,
        'bottomBarHeight': bottomBarHeight,
        'toolRailWidth': toolRailWidth,
        'defaultLineWidth': defaultLineWidth,
        'scaleBorderColor': scaleBorderColor,
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
        volumeUpColor: json['volumeUpColor'] as String? ?? '#26a69a55',
        volumeDownColor: json['volumeDownColor'] as String? ?? '#ef535055',
        lineSeriesColor: json['lineSeriesColor'] as String? ?? '#5b9cf6',
        areaTopColor: json['areaTopColor'] as String? ?? '#5b9cf655',
        areaBottomColor: json['areaBottomColor'] as String? ?? '#5b9cf600',
        toolbarBackground:
            json['toolbarBackground'] as String? ?? '#1e222d',
        toolbarBorder: json['toolbarBorder'] as String? ?? '#2a2e39',
        toolbarText: json['toolbarText'] as String? ?? '#b2b5be',
        toolbarActiveBackground:
            json['toolbarActiveBackground'] as String? ?? '#2962ff33',
        toolbarActiveText:
            json['toolbarActiveText'] as String? ?? '#5b9cf6',
        toolbarHoverBackground:
            json['toolbarHoverBackground'] as String? ?? '#2a2e39',
        drawingDefaultColor:
            json['drawingDefaultColor'] as String? ?? '#5b9cf6',
        fontFamily: json['fontFamily'] as String? ??
            "-apple-system, 'Segoe UI', Roboto, sans-serif",
        fontSize: json['fontSize'] as int? ?? 12,
        fontWeight: json['fontWeight'] as int? ?? 400,
        toolbarHeight: json['toolbarHeight'] as int? ?? 44,
        bottomBarHeight: json['bottomBarHeight'] as int? ?? 30,
        toolRailWidth: json['toolRailWidth'] as int? ?? 40,
        defaultLineWidth: json['defaultLineWidth'] as int? ?? 2,
        scaleBorderColor:
            json['scaleBorderColor'] as String? ?? '#2a2e39',
      );

  /// Creates a copy with only specified fields overridden.
  ChartTheme copyWith({
    String? background,
    String? text,
    String? upColor,
    String? downColor,
    String? gridLineColor,
    String? crosshairColor,
    String? wickUpColor,
    String? wickDownColor,
    String? volumeUpColor,
    String? volumeDownColor,
    String? lineSeriesColor,
    String? areaTopColor,
    String? areaBottomColor,
    String? toolbarBackground,
    String? toolbarBorder,
    String? toolbarText,
    String? toolbarActiveBackground,
    String? toolbarActiveText,
    String? toolbarHoverBackground,
    String? drawingDefaultColor,
    String? fontFamily,
    int? fontSize,
    int? fontWeight,
    int? toolbarHeight,
    int? bottomBarHeight,
    int? toolRailWidth,
    int? defaultLineWidth,
    String? scaleBorderColor,
  }) =>
      ChartTheme(
        background: background ?? this.background,
        text: text ?? this.text,
        upColor: upColor ?? this.upColor,
        downColor: downColor ?? this.downColor,
        gridLineColor: gridLineColor ?? this.gridLineColor,
        crosshairColor: crosshairColor ?? this.crosshairColor,
        wickUpColor: wickUpColor ?? this.wickUpColor,
        wickDownColor: wickDownColor ?? this.wickDownColor,
        volumeUpColor: volumeUpColor ?? this.volumeUpColor,
        volumeDownColor: volumeDownColor ?? this.volumeDownColor,
        lineSeriesColor: lineSeriesColor ?? this.lineSeriesColor,
        areaTopColor: areaTopColor ?? this.areaTopColor,
        areaBottomColor: areaBottomColor ?? this.areaBottomColor,
        toolbarBackground: toolbarBackground ?? this.toolbarBackground,
        toolbarBorder: toolbarBorder ?? this.toolbarBorder,
        toolbarText: toolbarText ?? this.toolbarText,
        toolbarActiveBackground:
            toolbarActiveBackground ?? this.toolbarActiveBackground,
        toolbarActiveText: toolbarActiveText ?? this.toolbarActiveText,
        toolbarHoverBackground:
            toolbarHoverBackground ?? this.toolbarHoverBackground,
        drawingDefaultColor: drawingDefaultColor ?? this.drawingDefaultColor,
        fontFamily: fontFamily ?? this.fontFamily,
        fontSize: fontSize ?? this.fontSize,
        fontWeight: fontWeight ?? this.fontWeight,
        toolbarHeight: toolbarHeight ?? this.toolbarHeight,
        bottomBarHeight: bottomBarHeight ?? this.bottomBarHeight,
        toolRailWidth: toolRailWidth ?? this.toolRailWidth,
        defaultLineWidth: defaultLineWidth ?? this.defaultLineWidth,
        scaleBorderColor: scaleBorderColor ?? this.scaleBorderColor,
      );
}
