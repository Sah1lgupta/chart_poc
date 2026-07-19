// chart-instance.js — Lightweight Charts init, series management, resize,
// drawing tools, crosshair OHLC readout, and mock data seeder.
// Reads/writes all state through ChartState (state.js).

const chartEl = document.getElementById('chart');
const overlay = document.getElementById('overlay');
const octx = overlay.getContext('2d');
const ohlcEl = document.getElementById('ohlc');

// ---- Chart creation ----

const chart = LightweightCharts.createChart(chartEl, {
  layout: { background: { color: '#131722' }, textColor: '#b2b5be' },
  grid: {
    vertLines: { color: '#202431' },
    horzLines: { color: '#202431' },
  },
  crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
  rightPriceScale: { borderColor: '#2a2e39' },
  timeScale: { borderColor: '#2a2e39', timeVisible: true, secondsVisible: false },
});
ChartState.chart = chart;

let mainSeries = chart.addCandlestickSeries({
  upColor: '#26a69a', downColor: '#ef5350',
  borderUpColor: '#26a69a', borderDownColor: '#ef5350',
  wickUpColor: '#26a69a', wickDownColor: '#ef5350',
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
  overlay.width = r.width; overlay.height = r.height;
  redrawDrawings();
}
new ResizeObserver(resize).observe(chartEl);
resize();

// ---- Transforms (Heikin Ashi & Renko) ----

const Transforms = {
  heikinAshi(candles) {
    const haCandles = [];
    if (candles.length === 0) return haCandles;

    let prevOpen = candles[0].open;
    let prevClose = candles[0].close;

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const close = (c.open + c.high + c.low + c.close) / 4;
      const open = i === 0 ? (c.open + c.close) / 2 : (prevOpen + prevClose) / 2;
      const high = Math.max(c.high, open, close);
      const low = Math.min(c.low, open, close);

      haCandles.push({
        time: c.time,
        open,
        high,
        low,
        close,
        volume: c.volume
      });

      prevOpen = open;
      prevClose = close;
    }
    return haCandles;
  },

  renko(candles, boxSize = 20) {
    const renkoCandles = [];
    if (candles.length === 0) return renkoCandles;

    let lastPrice = candles[0].close;
    
    for (let i = 0; i < candles.length; i++) {
      const c = candles[i];
      const price = c.close;
      const diff = price - lastPrice;

      if (Math.abs(diff) >= boxSize) {
        const numBricks = Math.floor(Math.abs(diff) / boxSize);
        for (let j = 0; j < numBricks; j++) {
          const isUp = diff > 0;
          const open = lastPrice;
          const close = isUp ? lastPrice + boxSize : lastPrice - boxSize;
          const high = Math.max(open, close);
          const low = Math.min(open, close);

          renkoCandles.push({
            time: c.time,
            open,
            high,
            low,
            close,
            volume: c.volume
          });

          lastPrice = close;
        }
      }
    }
    return renkoCandles;
  }
};

// ---- Series type switching ----

function setSeriesType(type) {
  ChartState.currentSeriesType = type;
  
  // Save current markers configuration to re-apply
  const currentMarkers = mainSeries.markers ? mainSeries.markers() : [];
  
  chart.removeSeries(mainSeries);

  const colors = ChartState.theme;

  if (type === 'candle') {
    mainSeries = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: colors.upColor, wickDownColor: colors.downColor,
    });
    mainSeries.setData(ChartState.candles);
  } else if (type === 'hollowCandle') {
    mainSeries = chart.addCandlestickSeries({
      upColor: 'rgba(0,0,0,0)', downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: colors.upColor, wickDownColor: colors.downColor,
    });
    mainSeries.setData(ChartState.candles);
  } else if (type === 'heikinAshi') {
    mainSeries = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: colors.upColor, wickDownColor: colors.downColor,
    });
    mainSeries.setData(Transforms.heikinAshi(ChartState.candles));
  } else if (type === 'renko') {
    mainSeries = chart.addCandlestickSeries({
      upColor: colors.upColor, downColor: colors.downColor,
      borderUpColor: colors.upColor, borderDownColor: colors.downColor,
      wickUpColor: colors.upColor, wickDownColor: colors.downColor,
    });
    mainSeries.setData(Transforms.renko(ChartState.candles));
  } else if (type === 'bar') {
    mainSeries = chart.addBarSeries({
      upColor: colors.upColor,
      downColor: colors.downColor
    });
    mainSeries.setData(ChartState.candles);
  } else if (type === 'line') {
    mainSeries = chart.addLineSeries({
      color: '#5b9cf6',
      lineWidth: 2
    });
    mainSeries.setData(ChartState.candles.map(c => ({ time: c.time, value: c.close })));
  } else if (type === 'stepLine') {
    mainSeries = chart.addLineSeries({
      color: '#5b9cf6',
      lineWidth: 2,
      lineType: 1 // Steps
    });
    mainSeries.setData(ChartState.candles.map(c => ({ time: c.time, value: c.close })));
  } else if (type === 'area') {
    mainSeries = chart.addAreaSeries({
      lineColor: '#5b9cf6',
      topColor: '#5b9cf655',
      bottomColor: '#5b9cf600'
    });
    mainSeries.setData(ChartState.candles.map(c => ({ time: c.time, value: c.close })));
  }

  ChartState.mainSeries = mainSeries;

  // Re-apply markers if they existed
  if (currentMarkers && currentMarkers.length > 0) {
    mainSeries.setMarkers(currentMarkers);
  }
}

// ---- OHLC crosshair readout ----

chart.subscribeCrosshairMove(param => {
  if (!ChartState.ohlcLegendVisible) { ohlcEl.innerHTML = ''; return; }

  // Helper to render OHLC + Volume + %Chg for a given bar object
  function renderOhlcBar(d, barData) {
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

  if (param.time && param.seriesData.size) {
    const d = param.seriesData.get(mainSeries);
    if (!d) return;
    // Find matching candle for volume data
    const bar = ChartState.candles.find(c => c.time === param.time);
    renderOhlcBar(d, bar);
  } else {
    // Idle state: show latest bar data
    if (ChartState.candles.length > 0) {
      const lastBar = ChartState.candles[ChartState.candles.length - 1];
      renderOhlcBar(lastBar, lastBar);
    } else {
      ohlcEl.innerHTML = '';
    }
  }
});

function pxToTimePrice(x, y) {
  const time = chart.timeScale().coordinateToTime(x);
  const price = mainSeries.coordinateToPrice(y);
  return { time, price };
}
function timePriceToPx(time, price) {
  const x = chart.timeScale().timeToCoordinate(time);
  const y = mainSeries.priceToCoordinate(price);
  return { x, y };
}

// ---- Drawing renderer ----

function redrawDrawings() {
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

// ---- Mock data (standalone browser testing) ----

(function seedMockData() {
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
