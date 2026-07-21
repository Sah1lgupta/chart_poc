// bridge.js — The ONLY file that knows about Flutter.
// Handles: emitEvent (JS→Dart), window.ChartBridge (Dart→JS).
// All bug fixes: B1 (volume colors), B7 (HA live update), B8 (throttled recalculations)

// ---- Event emission (JS → Dart) ----

function reportToFlutter(name, payload) {
  if (window.onChartEvent) {
    window.onChartEvent(name, payload);
  } else if (window.FlutterBridge) {
    window.FlutterBridge.postMessage(JSON.stringify({ event: name, payload }));
  } else {
    console.log("Event:", name, payload);
  }
}

function emitEvent(name, payload) {
  reportToFlutter(name, payload);
}

function notifyDrawingAdded(d) {
  emitEvent('drawingAdded', d);
}

// ---- Throttle utility (FIX B8) ----
let _recalcTimer = null;
const RECALC_THROTTLE_MS = 200;

function throttledRecalculate() {
  if (_recalcTimer) return; // Already scheduled
  _recalcTimer = setTimeout(() => {
    _recalcTimer = null;
    IndicatorRegistry.recalculateAll();
  }, RECALC_THROTTLE_MS);
}

// ---- Volume color helper (FIX B1) ----

function getVolumeColor(bar) {
  const t = ChartState.theme;
  const up = t.volumeUpColor || (t.upColor + '55');
  const down = t.volumeDownColor || (t.downColor + '55');
  return bar.close >= bar.open ? up : down;
}

// ---- Bridge object (Dart → JS) ----

window.ChartBridge = {
  setData(candlesJson) {
    try {
      ChartState.candles = JSON.parse(candlesJson);

      // Update main series data
      setSeriesType(ChartState.currentSeriesType);

      // Update volume series data (FIX B1: theme-aware colors)
      ChartState.volumeSeries.setData(ChartState.candles.map(c => ({
        time: c.time,
        value: c.volume || 0,
        color: getVolumeColor(c),
      })));

      // Recalculate indicators (full recalc is fine on setData)
      IndicatorRegistry.recalculateAll();

      // Redraw overlays
      redrawDrawings();

      ChartState.chart.timeScale().fitContent();
    } catch (err) {
      reportToFlutter('jsError', { message: 'setData failed: ' + err.message });
    }
  },

  addOrUpdateBar(barJson) {
    try {
      const bar = JSON.parse(barJson);
      const last = ChartState.candles[ChartState.candles.length - 1];
      if (last && last.time === bar.time) {
        ChartState.candles[ChartState.candles.length - 1] = bar;
      } else {
        ChartState.candles.push(bar);
      }

      // Live bar update (FIX B7: handle all series types correctly)
      const seriesType = ChartState.currentSeriesType;

      if (seriesType === 'candle' || seriesType === 'bar' || seriesType === 'hollowCandle') {
        ChartState.mainSeries.update(bar);

      } else if (seriesType === 'heikinAshi') {
        // Recalculate entire HA series for the last few bars
        const ha = Transforms.heikinAshi(ChartState.candles);
        if (ha.length > 0) {
          const lastHA = ha[ha.length - 1];
          // Check if this is a new candle period or update to current
          try {
            ChartState.mainSeries.update(lastHA);
          } catch (_) {
            // If update fails (e.g., time already exists differently), do a full setData
            ChartState.mainSeries.setData(ha);
          }
        }

      } else if (seriesType === 'renko') {
        // Renko must always recalculate from scratch since bricks depend on
        // cumulative price movement, not individual candles
        const renko = Transforms.renko(ChartState.candles);
        ChartState.mainSeries.setData(renko);

      } else {
        // Line, StepLine, Area — single-value series
        ChartState.mainSeries.update({ time: bar.time, value: bar.close });
      }

      // Volume update (FIX B1: theme-aware colors)
      ChartState.volumeSeries.update({
        time: bar.time,
        value: bar.volume || 0,
        color: getVolumeColor(bar),
      });

      // Throttled indicator recalculation (FIX B8)
      throttledRecalculate();

      // Throttled drawing redraw (handled by redrawDrawings' internal throttle)
      redrawDrawings();
    } catch (err) {
      reportToFlutter('jsError', { message: 'addOrUpdateBar failed: ' + err.message });
    }
  },

  setPatternMarkers(markersJson) {
    try {
      const markers = JSON.parse(markersJson);
      ChartState.mainSeries.setMarkers(markers);
    } catch (err) {
      reportToFlutter('jsError', { message: 'setPatternMarkers failed: ' + err.message });
    }
  },

  setTheme(themeJson) {
    try {
      const theme = JSON.parse(themeJson);
      ThemeManager.apply(theme);
    } catch (err) {
      reportToFlutter('jsError', { message: 'setTheme failed: ' + err.message });
    }
  },

  setChartType(type) {
    setSeriesType(type);

    // UI update
    const activeCard = document.querySelector(`#settingsChartType .chart-type-card[data-ct="${type}"]`);
    if (activeCard) {
      document.querySelectorAll('#settingsChartType .chart-type-card').forEach(c => c.classList.remove('active'));
      activeCard.classList.add('active');
    }
  },

  setAvailableIntervals(intervalsJson) {
    try {
      const intervals = JSON.parse(intervalsJson);
      // Future: dynamically render toolbar buttons from this list
    } catch (err) {
      reportToFlutter('jsError', { message: 'setAvailableIntervals failed: ' + err.message });
    }
  },

  setDrawings(drawingsJson) {
    try {
      ChartState.drawings = JSON.parse(drawingsJson);
      redrawDrawings();
    } catch (err) {
      reportToFlutter('jsError', { message: 'setDrawings failed: ' + err.message });
    }
  },

  setIndicators(indicatorsJson) {
    try {
      const configs = JSON.parse(indicatorsJson);
      IndicatorRegistry.clearAll();
      configs.forEach(cfg => {
        IndicatorRegistry.addIndicator(cfg.indicatorId, cfg.params, cfg.color, cfg.id);
      });
    } catch (err) {
      reportToFlutter('jsError', { message: 'setIndicators failed: ' + err.message });
    }
  },

  getLayout() {
    try {
      const layout = {
        chartType: ChartState.currentSeriesType,
        interval: ChartState.interval,
        theme: ChartState.theme,
        drawings: ChartState.drawings,
        indicators: ChartState.indicators,
        toggles: {
          drawingToolbarEnabled: ChartState.drawingToolbarEnabled,
          magnetEnabled: ChartState.magnetEnabled,
          drawingsHidden: ChartState.drawingsHidden,
          drawingsLocked: ChartState.drawingsLocked,
          showFavoritesOnly: ChartState.showFavoritesOnly,
          ohlcLegendVisible: ChartState.ohlcLegendVisible,
          volumePaneVisible: ChartState.volumePaneVisible,
          lastPriceLineVisible: ChartState.lastPriceLineVisible,
          crosshairLabelVisible: ChartState.crosshairLabelVisible,
        },
      };

      emitEvent('layoutSnapshot', layout);
      return JSON.stringify(layout);
    } catch (err) {
      reportToFlutter('jsError', { message: 'getLayout failed: ' + err.message });
    }
  },

  applyLayout(layoutJson) {
    try {
      const layout = JSON.parse(layoutJson);
      if (layout.interval) {
        ChartState.interval = layout.interval;
        const tf = layout.interval.label;
        document.querySelectorAll('#topbar > .tb-btn[data-tf]').forEach(b => {
          b.classList.toggle('active', b.dataset.tf === tf);
        });
        document.querySelectorAll('#tfDropdown .dropdown-item').forEach(b => {
          b.classList.toggle('active', b.dataset.tf === tf);
        });
        emitEvent('timeframeChanged', {
          tf: tf,
          interval: layout.interval.value,
          unit: layout.interval.unit,
          rangeShortcut: null,
        });
      }
      if (layout.chartType) {
        this.setChartType(layout.chartType);
      }
      if (layout.theme) {
        this.setTheme(JSON.stringify(layout.theme));
      }
      if (layout.drawings) {
        this.setDrawings(JSON.stringify(layout.drawings));
      }
      if (layout.indicators) {
        this.setIndicators(JSON.stringify(layout.indicators));
      }
      if (layout.toggles) {
        const t = layout.toggles;
        const togglePairs = [
          ['toggleToolbar', 'drawingToolbarEnabled', toggleDrawingToolbar],
          ['toggleMagnet', 'magnetEnabled', toggleMagnetMode],
          ['toggleHide', 'drawingsHidden', toggleHideDrawings],
          ['toggleLock', 'drawingsLocked', toggleLockDrawings],
          ['toggleFavs', 'showFavoritesOnly', toggleShowFavourites],
        ];
        togglePairs.forEach(([btnId, key, fn]) => {
          if (t[key] !== undefined) {
            const btn = document.getElementById(btnId);
            if (btn && btn.classList.contains('on') !== t[key]) {
              fn();
            }
          }
        });
      }
    } catch (err) {
      reportToFlutter('jsError', { message: 'applyLayout failed: ' + err.message });
    }
  },
};
