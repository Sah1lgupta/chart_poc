// state.js — Single source of truth for all mutable chart state.
// No other JS module stores state directly; everything reads/writes
// through this module's exports.

function runOnInit(fn) {
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(fn, 1); // execute async to keep behaviour consistent
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

const ChartState = {
  // --- OHLCV data ---
  candles: [],         // [{time, open, high, low, close, volume}]

  // --- Series type ---
  currentSeriesType: 'candle',

  // --- Drawing tools ---
  drawings: [],        // [{id, type, points:[{time,price}], style, locked, hidden}]
  draftPoints: [],     // points being placed for the current drawing
  activeTool: 'cursor',
  favoriteTools: ['trendline', 'hline', 'rect'], // default starred tools

  // --- Toggles & View Options ---
  drawingToolbarEnabled: true,
  magnetEnabled: false,
  drawingsHidden: false,
  drawingsLocked: false,
  showFavoritesOnly: false,
  ohlcLegendVisible: true,
  volumePaneVisible: true,
  lastPriceLineVisible: true,
  crosshairLabelVisible: true,

  // --- Indicators ---
  indicators: [],      // [{id, indicatorId, displayName, category, params, color, favorite}]
  favoriteIndicators: [], // array of indicatorIds

  // --- Chart + series references (set by chart-instance.js) ---
  chart: null,
  mainSeries: null,
  volumeSeries: null,

  // --- Chart Layout Save State ---
  symbol: 'BTCUSDT',
  interval: { label: '1 min', value: 1, unit: 'minute' },
  theme: {
    background: '#131722',
    text: '#b2b5be',
    upColor: '#26a69a',
    downColor: '#ef5350',
    gridLineColor: '#202431',
    crosshairColor: '#758696',
  }
};
