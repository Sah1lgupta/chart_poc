// series-manager.js — Series type switching with full theme awareness.
// Extracted from chart-instance.js for clarity.
// FIX B12: Line/Area/StepLine colors now use ChartState.theme values.

/**
 * Removes the current main series and creates a new one of the specified type.
 * Applies all colors from ChartState.theme rather than hardcoded values.
 * 
 * @param {string} type - One of: candle, hollowCandle, heikinAshi, renko, bar, line, stepLine, area
 */
function setSeriesType(type) {
  ChartState.currentSeriesType = type;

  // Save current markers to re-apply after series swap
  let currentMarkers = [];
  try {
    currentMarkers = mainSeries.markers ? mainSeries.markers() : [];
  } catch (_) { /* markers() may throw if series is empty */ }

  chart.removeSeries(mainSeries);

  const colors = ChartState.theme;
  const wickUp = colors.wickUpColor || colors.upColor;
  const wickDown = colors.wickDownColor || colors.downColor;

  if (type === 'candle') {
    mainSeries = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: wickUp, wickDownColor: wickDown,
    });
    mainSeries.setData(ChartState.candles);

  } else if (type === 'hollowCandle') {
    mainSeries = chart.addCandlestickSeries({
      upColor: 'rgba(0,0,0,0)', downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: wickUp, wickDownColor: wickDown,
    });
    mainSeries.setData(ChartState.candles);

  } else if (type === 'heikinAshi') {
    mainSeries = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: wickUp, wickDownColor: wickDown,
    });
    mainSeries.setData(Transforms.heikinAshi(ChartState.candles));

  } else if (type === 'renko') {
    mainSeries = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: wickUp, wickDownColor: wickDown,
    });
    mainSeries.setData(Transforms.renko(ChartState.candles));

  } else if (type === 'bar') {
    mainSeries = chart.addBarSeries({
      upColor: colors.upColor,
      downColor: colors.downColor,
    });
    mainSeries.setData(ChartState.candles);

  } else if (type === 'line') {
    mainSeries = chart.addLineSeries({
      color: colors.lineSeriesColor || '#5b9cf6',
      lineWidth: colors.defaultLineWidth || 2,
    });
    mainSeries.setData(ChartState.candles.map(c => ({ time: c.time, value: c.close })));

  } else if (type === 'stepLine') {
    mainSeries = chart.addLineSeries({
      color: colors.lineSeriesColor || '#5b9cf6',
      lineWidth: colors.defaultLineWidth || 2,
      lineType: 1, // Steps
    });
    mainSeries.setData(ChartState.candles.map(c => ({ time: c.time, value: c.close })));

  } else if (type === 'area') {
    mainSeries = chart.addAreaSeries({
      lineColor: colors.lineSeriesColor || '#5b9cf6',
      topColor: colors.areaTopColor || '#5b9cf655',
      bottomColor: colors.areaBottomColor || '#5b9cf600',
    });
    mainSeries.setData(ChartState.candles.map(c => ({ time: c.time, value: c.close })));
  }

  ChartState.mainSeries = mainSeries;

  // Re-apply markers if they existed
  if (currentMarkers && currentMarkers.length > 0) {
    try { mainSeries.setMarkers(currentMarkers); } catch (_) {}
  }
}
