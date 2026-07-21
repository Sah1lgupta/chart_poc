// chart-instance.js — Lightweight Charts initialization, resize handling,
// coordinate conversion, and drawing renderer.
// All state is read/written through ChartState (state.js).
// Series type switching → series-manager.js
// Data transforms → transforms.js
// OHLC readout → ohlc-readout.js
// Theme application → theme-manager.js

const chartEl = document.getElementById('chart');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');
const ohlcEl = document.getElementById('ohlc');

// ---- Chart creation ----

const chart = LightweightCharts.createChart(chartEl, {
  layout: {
    background: { color: ChartState.theme.background },
    textColor: ChartState.theme.text,
  },
  grid: {
    vertLines: { color: ChartState.theme.gridLineColor },
    horzLines: { color: ChartState.theme.gridLineColor },
  },
  crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
  rightPriceScale: { borderColor: ChartState.theme.scaleBorderColor || '#2a2e39' },
  timeScale: { borderColor: ChartState.theme.scaleBorderColor || '#2a2e39', timeVisible: true, secondsVisible: false },
});
ChartState.chart = chart;

let mainSeries = chart.addCandlestickSeries({
  upColor: ChartState.theme.upColor,
  downColor: ChartState.theme.downColor,
  borderUpColor: ChartState.theme.upColor,
  borderDownColor: ChartState.theme.downColor,
  wickUpColor: ChartState.theme.upColor,
  wickDownColor: ChartState.theme.downColor,
});
ChartState.mainSeries = mainSeries;

const volumeSeries = chart.addHistogramSeries({
  priceFormat: { type: 'volume' },
  priceScaleId: 'volume',
});
ChartState.volumeSeries = volumeSeries;
chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.2 } });

// ---- Resize ----

function resize() {
  const r = chartEl.getBoundingClientRect();
  chart.applyOptions({ width: r.width, height: r.height });
  overlay.width = r.width;
  overlay.height = r.height;
  redrawDrawings();
}
new ResizeObserver(resize).observe(chartEl);
resize();

// ---- Coordinate conversion helpers ----

/** Converts pixel coordinates to time/price values. */
function pxToTimePrice(x, y) {
  const time = chart.timeScale().coordinateToTime(x);
  const price = mainSeries.coordinateToPrice(y);
  return { time, price };
}

/** Converts time/price values to pixel coordinates. */
function timePriceToPx(time, price) {
  const x = chart.timeScale().timeToCoordinate(time);
  const y = mainSeries.priceToCoordinate(price);
  return { x, y };
}

// ---- Drawing renderer ----

/** Throttle utility for performance-critical redraws. */
let _redrawScheduled = false;
let _lastRedrawTime = 0;
const REDRAW_THROTTLE_MS = 16; // ~60fps max

function redrawDrawings() {
  const now = performance.now();
  if (now - _lastRedrawTime < REDRAW_THROTTLE_MS) {
    if (!_redrawScheduled) {
      _redrawScheduled = true;
      requestAnimationFrame(_doRedraw);
    }
    return;
  }
  _doRedraw();
}

function _doRedraw() {
  _redrawScheduled = false;
  _lastRedrawTime = performance.now();

  octx.clearRect(0, 0, overlay.width, overlay.height);
  if (ChartState.drawingsHidden) return;

  ChartState.drawings.forEach(d => {
    if (d.hidden) return;
    const tool = DrawingManager.tools[d.type];
    if (tool) {
      const isSelected = DrawingManager.selectedDrawing === d;
      const hoveredPtIdx = DrawingManager.hoveredDrawing === d ? DrawingManager.hoveredPointIndex : -1;
      tool.draw(octx, d.points, d.style, isSelected, hoveredPtIdx, d.text);
    }
  });

  // Render draft points being placed for active tool
  if (ChartState.activeTool !== 'cursor' && ChartState.draftPoints.length > 0) {
    octx.fillStyle = '#2962ff';
    ChartState.draftPoints.forEach(pt => {
      const ptPx = timePriceToPx(pt.time, pt.price);
      if (ptPx.x != null && ptPx.y != null) {
        octx.beginPath();
        octx.arc(ptPx.x, ptPx.y, 4, 0, 2 * Math.PI);
        octx.fill();
      }
    });
  }
}

chart.timeScale().subscribeVisibleTimeRangeChange(redrawDrawings);
chart.subscribeCrosshairMove(redrawDrawings);

// ---- Initialize OHLC readout ----
initOhlcReadout();

// ---- Mock data (standalone browser testing only) ----
// Only seeds mock data when NOT running inside Flutter's WebView/iframe.
// When Flutter calls setData(), this mock data gets replaced immediately.

(function seedMockData() {
  // Skip if ChartBridge.setData has already been called (Flutter context)
  if (ChartState.candles.length > 0) return;

  const now = Math.floor(Date.now() / 1000);
  let price = 64000;
  const mock = [];
  for (let i = 200; i >= 0; i--) {
    const t = now - i * 60;
    const open = price;
    const change = (Math.random() - 0.5) * 40;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * 15;
    const low = Math.min(open, close) - Math.random() * 15;
    price = close;
    mock.push({ time: t, open, high, low, close, volume: Math.random() * 2 });
  }
  window.ChartBridge.setData(JSON.stringify(mock));
})();
