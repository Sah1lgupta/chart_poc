// indicator-registry.js — Registry, calculation binder, and rendering manager for technical indicators.
// FIX B6: RSI gets 70/30 overbought/oversold reference lines
// FIX B10: Sub-pane layout uses dynamic equal-division formula

const IndicatorRegistry = {
  // Available indicators definition
  registry: {
    sma: {
      displayName: 'Simple Moving Average',
      category: 'main',
      defaultParams: { period: 9 },
      defaultColor: '#f0b90b',
      calc: calculateSMA,
    },
    ema: {
      displayName: 'Exponential Moving Average',
      category: 'main',
      defaultParams: { period: 9 },
      defaultColor: '#e02424',
      calc: calculateEMA,
    },
    rsi: {
      displayName: 'Relative Strength Index',
      category: 'sub',
      defaultParams: { period: 14 },
      defaultColor: '#a78bfa',
      calc: calculateRSI,
    },
    macd: {
      displayName: 'MACD',
      category: 'sub',
      defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      defaultColor: '#3b82f6',
      calc: calculateMACD,
    },
    bb: {
      displayName: 'Bollinger Bands',
      category: 'main',
      defaultParams: { period: 20, stdDev: 2 },
      defaultColor: '#10b981',
      calc: calculateBollingerBands,
    },
    vwap: {
      displayName: 'VWAP',
      category: 'main',
      defaultParams: { sessionResetHour: 0, timezoneOffsetMinutes: 0 },
      defaultColor: '#3b82f6',
      calc: calculateVWAP,
    },
    atr: {
      displayName: 'Average True Range',
      category: 'sub',
      defaultParams: { period: 14 },
      defaultColor: '#f43f5e',
      calc: calculateATR,
    },
  },

  activeInstances: [], // [{ id, indicatorId, params, color, seriesList: [] }]

  addIndicator(indicatorId, customParams = null, customColor = null, id = null) {
    const meta = this.registry[indicatorId];
    if (!meta) return null;

    const instanceId = id || 'ind_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const params = customParams || { ...meta.defaultParams };
    const color = customColor || meta.defaultColor;

    const instance = {
      id: instanceId,
      indicatorId: indicatorId,
      displayName: meta.displayName,
      category: meta.category,
      params: params,
      color: color,
      seriesList: [],
    };

    // Instantiate Lightweight Charts series based on category & indicator type
    this.createSeriesForInstance(instance);
    this.activeInstances.push(instance);

    // Sync to state
    ChartState.indicators.push({
      id: instance.id,
      indicatorId: instance.indicatorId,
      displayName: instance.displayName,
      category: instance.category,
      params: instance.params,
      color: instance.color,
      favorite: ChartState.favoriteIndicators.includes(instance.indicatorId),
    });

    this.recalculateInstance(instance);

    // Rebalance all sub-pane layouts when a new sub indicator is added
    if (instance.category === 'sub') {
      this._rebalanceSubPaneLayouts();
    }

    // Update active list UI in manage indicators modal
    if (typeof updateActiveIndicatorsUI === 'function') {
      updateActiveIndicatorsUI();
    }

    emitEvent('indicatorAdded', { id: instance.id, indicatorId: instance.indicatorId, params, color });
    return instanceId;
  },

  /**
   * FIX B10: Dynamically rebalances all sub-pane indicator layouts.
   * Divides the bottom 45% of the chart equally among all sub-pane indicators.
   * Main chart gets the top 55%, sub-panes share the bottom 45%.
   */
  _rebalanceSubPaneLayouts() {
    const subInstances = this.activeInstances.filter(inst => inst.category === 'sub');
    const count = subInstances.length;
    if (count === 0) return;

    // Reserve 55% for main chart, distribute 45% among sub-panes
    const mainChartBottom = 0.55;
    const subRegionHeight = (1.0 - mainChartBottom) / count;

    subInstances.forEach((inst, idx) => {
      const top = mainChartBottom + (idx * subRegionHeight);
      const bottom = 1.0 - mainChartBottom - ((idx + 1) * subRegionHeight);
      const priceScaleId = `scale_${inst.id}`;

      ChartState.chart.priceScale(priceScaleId).applyOptions({
        scaleMargins: {
          top: Math.min(0.95, top),
          bottom: Math.max(0.01, bottom),
        },
        borderVisible: false,
      });
    });

    // Adjust main chart price scale to leave room for sub-panes
    ChartState.chart.priceScale('right').applyOptions({
      scaleMargins: {
        top: 0.05,
        bottom: 1.0 - mainChartBottom + 0.02,
      },
    });
  },

  createSeriesForInstance(instance) {
    const chart = ChartState.chart;
    const cat = instance.category;

    let priceScaleId = 'right';
    if (cat === 'sub') {
      priceScaleId = `scale_${instance.id}`;
      // Layout will be applied by _rebalanceSubPaneLayouts after creation
      chart.priceScale(priceScaleId).applyOptions({
        scaleMargins: { top: 0.7, bottom: 0.05 },
        borderVisible: false,
      });
    }

    if (instance.indicatorId === 'macd') {
      const macdLine = chart.addLineSeries({
        color: instance.color,
        lineWidth: 1.5,
        priceScaleId: priceScaleId,
        title: 'MACD',
      });
      const signalLine = chart.addLineSeries({
        color: '#f97316',
        lineWidth: 1.5,
        priceScaleId: priceScaleId,
        title: 'Signal',
      });
      const histSeries = chart.addHistogramSeries({
        priceScaleId: priceScaleId,
        title: 'Hist',
      });

      instance.seriesList.push(
        { name: 'macd', series: macdLine },
        { name: 'signal', series: signalLine },
        { name: 'hist', series: histSeries }
      );

    } else if (instance.indicatorId === 'bb') {
      const upper = chart.addLineSeries({ color: instance.color, lineWidth: 1, lineStyle: 2, title: 'BB Upper' });
      const middle = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5, title: 'BB Middle' });
      const lower = chart.addLineSeries({ color: instance.color, lineWidth: 1, lineStyle: 2, title: 'BB Lower' });

      instance.seriesList.push(
        { name: 'upper', series: upper },
        { name: 'middle', series: middle },
        { name: 'lower', series: lower }
      );

    } else if (instance.indicatorId === 'rsi') {
      // FIX B6: RSI gets the main line + dashed reference lines at 70 and 30
      const lineSeries = chart.addLineSeries({
        color: instance.color,
        lineWidth: 2,
        priceScaleId: priceScaleId,
        title: instance.displayName,
      });

      // Overbought line (70)
      const ob = chart.addLineSeries({
        color: '#ef535066',
        lineWidth: 1,
        lineStyle: 2, // dashed
        priceScaleId: priceScaleId,
        title: '',
        lastValueVisible: false,
        priceLineVisible: false,
      });

      // Oversold line (30)
      const os = chart.addLineSeries({
        color: '#26a69a66',
        lineWidth: 1,
        lineStyle: 2,
        priceScaleId: priceScaleId,
        title: '',
        lastValueVisible: false,
        priceLineVisible: false,
      });

      instance.seriesList.push(
        { name: 'main', series: lineSeries },
        { name: 'ob70', series: ob },
        { name: 'os30', series: os }
      );

    } else {
      // Standard Line indicators (SMA, EMA, VWAP, ATR)
      const lineSeries = chart.addLineSeries({
        color: instance.color,
        lineWidth: 2,
        priceScaleId: priceScaleId,
        title: instance.displayName,
      });
      instance.seriesList.push({ name: 'main', series: lineSeries });
    }
  },

  removeIndicator(instanceId) {
    const idx = this.activeInstances.findIndex(inst => inst.id === instanceId);
    if (idx === -1) return;

    const instance = this.activeInstances[idx];
    const wasSub = instance.category === 'sub';

    // Remove series from chart
    instance.seriesList.forEach(s => {
      ChartState.chart.removeSeries(s.series);
    });

    this.activeInstances.splice(idx, 1);
    ChartState.indicators = ChartState.indicators.filter(ind => ind.id !== instanceId);

    // Rebalance remaining sub-panes
    if (wasSub) {
      this._rebalanceSubPaneLayouts();
    }

    if (typeof updateActiveIndicatorsUI === 'function') {
      updateActiveIndicatorsUI();
    }

    emitEvent('indicatorRemoved', { id: instanceId });
  },

  updateIndicator(instanceId, params, color) {
    const instance = this.activeInstances.find(inst => inst.id === instanceId);
    if (!instance) return;

    instance.params = params;
    instance.color = color;

    // Apply visual option changes (color updates)
    instance.seriesList.forEach(s => {
      if (s.name === 'macd' || s.name === 'main' || s.name === 'upper' || s.name === 'lower') {
        s.series.applyOptions({ color: color });
      }
    });

    // Update state mirror
    const stateInd = ChartState.indicators.find(ind => ind.id === instanceId);
    if (stateInd) {
      stateInd.params = params;
      stateInd.color = color;
    }

    this.recalculateInstance(instance);
  },

  recalculateInstance(instance) {
    if (!ChartState.candles || ChartState.candles.length === 0) return;

    const meta = this.registry[instance.indicatorId];
    if (!meta) return;

    // Run math calculation
    let data;
    if (instance.indicatorId === 'macd') {
      data = meta.calc(ChartState.candles, instance.params.fastPeriod, instance.params.slowPeriod, instance.params.signalPeriod);
    } else if (instance.indicatorId === 'bb') {
      data = meta.calc(ChartState.candles, instance.params.period, instance.params.stdDev);
    } else if (instance.indicatorId === 'vwap') {
      data = meta.calc(ChartState.candles, instance.params.sessionResetHour || 0, instance.params.timezoneOffsetMinutes || 0);
    } else {
      data = meta.calc(ChartState.candles, instance.params.period);
    }

    // Bind values to series
    if (instance.indicatorId === 'macd') {
      const macdSeries = instance.seriesList.find(s => s.name === 'macd').series;
      const signalSeries = instance.seriesList.find(s => s.name === 'signal').series;
      const histSeries = instance.seriesList.find(s => s.name === 'hist').series;

      macdSeries.setData(data.map(d => ({ time: d.time, value: d.macd })));
      signalSeries.setData(data.map(d => ({ time: d.time, value: d.signal })));
      histSeries.setData(data.map(d => ({
        time: d.time,
        value: d.histogram,
        color: d.histogram >= 0 ? 'rgba(38, 166, 154, 0.6)' : 'rgba(239, 83, 80, 0.6)',
      })));

    } else if (instance.indicatorId === 'bb') {
      const upper = instance.seriesList.find(s => s.name === 'upper').series;
      const middle = instance.seriesList.find(s => s.name === 'middle').series;
      const lower = instance.seriesList.find(s => s.name === 'lower').series;

      upper.setData(data.map(d => ({ time: d.time, value: d.upper })));
      middle.setData(data.map(d => ({ time: d.time, value: d.middle })));
      lower.setData(data.map(d => ({ time: d.time, value: d.lower })));

    } else if (instance.indicatorId === 'rsi') {
      // FIX B6: Set RSI data + reference lines
      const lineSeries = instance.seriesList.find(s => s.name === 'main').series;
      lineSeries.setData(data);

      // Generate constant-value reference lines spanning the same time range
      if (data.length > 0) {
        const obData = data.map(d => ({ time: d.time, value: 70 }));
        const osData = data.map(d => ({ time: d.time, value: 30 }));
        const ob = instance.seriesList.find(s => s.name === 'ob70');
        const os = instance.seriesList.find(s => s.name === 'os30');
        if (ob) ob.series.setData(obData);
        if (os) os.series.setData(osData);
      }

    } else {
      const lineSeries = instance.seriesList.find(s => s.name === 'main').series;
      lineSeries.setData(data);
    }
  },

  recalculateAll() {
    this.activeInstances.forEach(instance => {
      this.recalculateInstance(instance);
    });
  },

  clearAll() {
    [...this.activeInstances].forEach(instance => {
      this.removeIndicator(instance.id);
    });
  },
};
