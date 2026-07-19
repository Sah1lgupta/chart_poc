// bridge.js — The ONLY file that knows about Flutter.
// Handles: emitEvent (JS→Dart), window.ChartBridge (Dart→JS).

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

// ---- Bridge object (Dart → JS) ----

window.ChartBridge = {
  setData(candlesJson) {
    try {
      ChartState.candles = JSON.parse(candlesJson);
      
      // Update main series data
      setSeriesType(ChartState.currentSeriesType);

      // Update volume series data
      ChartState.volumeSeries.setData(ChartState.candles.map(c => ({
        time: c.time, value: c.volume || 0,
        color: c.close >= c.open ? '#26a69a55' : '#ef535055',
      })));

      // Recalculate indicators
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

      // Live bar update
      if (ChartState.currentSeriesType === 'candle' || ChartState.currentSeriesType === 'bar' || ChartState.currentSeriesType === 'hollowCandle') {
        ChartState.mainSeries.update(bar);
      } else if (ChartState.currentSeriesType === 'heikinAshi') {
        const ha = Transforms.heikinAshi(ChartState.candles);
        if (ha.length > 0) ChartState.mainSeries.update(ha[ha.length - 1]);
      } else if (ChartState.currentSeriesType === 'renko') {
        const renko = Transforms.renko(ChartState.candles);
        if (renko.length > 0) ChartState.mainSeries.update(renko[renko.length - 1]);
      } else {
        ChartState.mainSeries.update({ time: bar.time, value: bar.close });
      }

      ChartState.volumeSeries.update({
        time: bar.time,
        value: bar.volume || 0,
        color: bar.close >= bar.open ? '#26a69a55' : '#ef535055'
      });

      // Live indicator updates
      IndicatorRegistry.recalculateAll();
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
      Object.assign(ChartState.theme, theme);

      document.body.style.backgroundColor = ChartState.theme.background;

      ChartState.chart.applyOptions({
        layout: {
          background: { color: ChartState.theme.background },
          textColor: ChartState.theme.text
        },
        grid: {
          vertLines: { color: ChartState.theme.gridLineColor },
          horzLines: { color: ChartState.theme.gridLineColor }
        },
        crosshair: {
          vertLine: { color: ChartState.theme.crosshairColor },
          horzLine: { color: ChartState.theme.crosshairColor }
        }
      });

      // Apply to UI config dialogs color swatches immediately
      const colorBg = document.getElementById('colorBg');
      if (colorBg) colorBg.value = ChartState.theme.background;
      const colorText = document.getElementById('colorText');
      if (colorText) colorText.value = ChartState.theme.text;
      const colorUp = document.getElementById('colorUp');
      if (colorUp) colorUp.value = ChartState.theme.upColor;
      const colorDown = document.getElementById('colorDown');
      if (colorDown) colorDown.value = ChartState.theme.downColor;
      const colorGrid = document.getElementById('colorGrid');
      if (colorGrid) colorGrid.value = ChartState.theme.gridLineColor;
      const colorCrosshair = document.getElementById('colorCrosshair');
      if (colorCrosshair) colorCrosshair.value = ChartState.theme.crosshairColor;

      setSeriesType(ChartState.currentSeriesType);
      redrawDrawings();
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
      // We can use these to render buttons dynamically if needed
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
          crosshairLabelVisible: ChartState.crosshairLabelVisible
        }
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
          rangeShortcut: null
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
        if (t.drawingToolbarEnabled !== undefined) {
          const btn = document.getElementById('toggleToolbar');
          if (btn && btn.classList.contains('on') !== t.drawingToolbarEnabled) {
            toggleDrawingToolbar();
          }
        }
        if (t.magnetEnabled !== undefined) {
          const btn = document.getElementById('toggleMagnet');
          if (btn && btn.classList.contains('on') !== t.magnetEnabled) {
            toggleMagnetMode();
          }
        }
        if (t.drawingsHidden !== undefined) {
          const btn = document.getElementById('toggleHide');
          if (btn && btn.classList.contains('on') !== t.drawingsHidden) {
            toggleHideDrawings();
          }
        }
        if (t.drawingsLocked !== undefined) {
          const btn = document.getElementById('toggleLock');
          if (btn && btn.classList.contains('on') !== t.drawingsLocked) {
            toggleLockDrawings();
          }
        }
        if (t.showFavoritesOnly !== undefined) {
          const btn = document.getElementById('toggleFavs');
          if (btn && btn.classList.contains('on') !== t.showFavoritesOnly) {
            toggleShowFavourites();
          }
        }
      }
    } catch (err) {
      reportToFlutter('jsError', { message: 'applyLayout failed: ' + err.message });
    }
  }
};
