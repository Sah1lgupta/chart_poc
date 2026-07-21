// ohlc-readout.js — OHLC crosshair readout display.
// Extracted from chart-instance.js for clarity.

/**
 * Subscribes to crosshair movement and updates the OHLC legend bar.
 * Shows O H L C V %chg for OHLC series, or just Value for line series.
 * Falls back to the latest bar when the crosshair is idle.
 */
function initOhlcReadout() {
  chart.subscribeCrosshairMove(param => {
    if (!ChartState.ohlcLegendVisible) { ohlcEl.innerHTML = ''; return; }

    if (param.time && param.seriesData.size) {
      const d = param.seriesData.get(mainSeries);
      if (!d) return;
      // Find matching candle for volume data
      const bar = ChartState.candles.find(c => c.time === param.time);
      _renderOhlcBar(d, bar);
    } else {
      // Idle state: show latest bar data
      if (ChartState.candles.length > 0) {
        const lastBar = ChartState.candles[ChartState.candles.length - 1];
        _renderOhlcBar(lastBar, lastBar);
      } else {
        ohlcEl.innerHTML = '';
      }
    }
  });
}

/**
 * Renders OHLC + Volume + %Change into the ohlcEl container.
 * @param {Object} d - Data point from the series (may have open/high/low/close or value)
 * @param {Object} barData - Raw bar from ChartState.candles (for volume)
 */
function _renderOhlcBar(d, barData) {
  if (d.open !== undefined) {
    const dir = d.close >= d.open ? 'up' : 'down';
    const chg = d.close - d.open;
    const chgPct = d.open !== 0 ? ((chg / d.open) * 100).toFixed(2) : '0.00';
    const vol = barData && barData.volume !== undefined
      ? barData.volume.toFixed(barData.volume >= 1 ? 2 : 4)
      : '';
    ohlcEl.innerHTML =
      `<span>O <b class="${dir}">${d.open.toFixed(2)}</b></span>` +
      `<span>H <b class="${dir}">${d.high.toFixed(2)}</b></span>` +
      `<span>L <b class="${dir}">${d.low.toFixed(2)}</b></span>` +
      `<span>C <b class="${dir}">${d.close.toFixed(2)}</b></span>` +
      (vol ? `<span>V <b>${vol}</b></span>` : '') +
      `<span>%chg: <b class="${dir}">${chg >= 0 ? '+' : ''}${chg.toFixed(2)}(${chgPct}%)</b></span>`;
  } else if (d.value !== undefined) {
    ohlcEl.innerHTML = `<span>Value <b>${d.value.toFixed(2)}</b></span>`;
  }
}
