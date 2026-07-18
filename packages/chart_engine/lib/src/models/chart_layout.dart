// chart_layout.dart

import 'chart_type.dart';
import 'interval.dart';
import 'chart_theme.dart';
import 'drawing.dart';
import 'indicator_config.dart';

class LayoutToggles {
  final bool drawingToolbarEnabled;
  final bool magnetEnabled;
  final bool drawingsHidden;
  final bool drawingsLocked;
  final bool showFavoritesOnly;
  final bool ohlcLegendVisible;
  final bool volumePaneVisible;
  final bool lastPriceLineVisible;

  const LayoutToggles({
    required this.drawingToolbarEnabled,
    required this.magnetEnabled,
    required this.drawingsHidden,
    required this.drawingsLocked,
    required this.showFavoritesOnly,
    required this.ohlcLegendVisible,
    required this.volumePaneVisible,
    required this.lastPriceLineVisible,
  });

  Map<String, dynamic> toJson() => {
    'drawingToolbarEnabled': drawingToolbarEnabled,
    'magnetEnabled': magnetEnabled,
    'drawingsHidden': drawingsHidden,
    'drawingsLocked': drawingsLocked,
    'showFavoritesOnly': showFavoritesOnly,
    'ohlcLegendVisible': ohlcLegendVisible,
    'volumePaneVisible': volumePaneVisible,
    'lastPriceLineVisible': lastPriceLineVisible,
  };

  factory LayoutToggles.fromJson(Map<String, dynamic> json) => LayoutToggles(
    drawingToolbarEnabled: json['drawingToolbarEnabled'] as bool? ?? true,
    magnetEnabled: json['magnetEnabled'] as bool? ?? false,
    drawingsHidden: json['drawingsHidden'] as bool? ?? false,
    drawingsLocked: json['drawingsLocked'] as bool? ?? false,
    showFavoritesOnly: json['showFavoritesOnly'] as bool? ?? false,
    ohlcLegendVisible: json['ohlcLegendVisible'] as bool? ?? true,
    volumePaneVisible: json['volumePaneVisible'] as bool? ?? true,
    lastPriceLineVisible: json['lastPriceLineVisible'] as bool? ?? true,
  );
}

class ChartLayout {
  final ChartType chartType;
  final ChartInterval interval;
  final ChartTheme theme;
  final List<Drawing> drawings;
  final List<IndicatorConfig> indicators;
  final LayoutToggles toggles;

  const ChartLayout({
    required this.chartType,
    required this.interval,
    required this.theme,
    required this.drawings,
    required this.indicators,
    required this.toggles,
  });

  Map<String, dynamic> toJson() => {
    'chartType': chartType.toJson(),
    'interval': interval.toJson(),
    'theme': theme.toJson(),
    'drawings': drawings.map((d) => d.toJson()).toList(),
    'indicators': indicators.map((ind) => ind.toJson()).toList(),
    'toggles': toggles.toJson(),
  };

  factory ChartLayout.fromJson(Map<String, dynamic> json) => ChartLayout(
    chartType: ChartType.fromString(json['chartType'] as String),
    interval: ChartInterval.fromJson(json['interval'] as Map<String, dynamic>),
    theme: ChartTheme.fromJson(json['theme'] as Map<String, dynamic>),
    drawings: (json['drawings'] as List)
        .map((d) => Drawing.fromJson(d as Map<String, dynamic>))
        .toList(),
    indicators: (json['indicators'] as List)
        .map((ind) => IndicatorConfig.fromJson(ind as Map<String, dynamic>))
        .toList(),
    toggles: LayoutToggles.fromJson(json['toggles'] as Map<String, dynamic>),
  );
}
