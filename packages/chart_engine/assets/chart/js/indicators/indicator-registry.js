// indicator-registry.js — Registry, calculation binder, and rendering manager for technical indicators.

const IndicatorRegistry = {
  // Available indicators definition
  registry: {
    sma: {
      displayName: 'Simple Moving Average',
      category: 'main',
      defaultParams: { period: 9 },
      defaultColor: '#f0b90b',
      calc: calculateSMA
    },
    ema: {
      displayName: 'Exponential Moving Average',
      category: 'main',
      defaultParams: { period: 9 },
      defaultColor: '#e02424',
      calc: calculateEMA
    },
    rsi: {
      displayName: 'Relative Strength Index',
      category: 'sub',
      defaultParams: { period: 14 },
      defaultColor: '#a78bfa',
      calc: calculateRSI
    },
    macd: {
      displayName: 'MACD',
      category: 'sub',
      defaultParams: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 },
      defaultColor: '#3b82f6',
      calc: calculateMACD
    },
    bb: {
      displayName: 'Bollinger Bands',
      category: 'main',
      defaultParams: { period: 20, stdDev: 2 },
      defaultColor: '#10b981',
      calc: calculateBollingerBands
    },
    vwap: {
      displayName: 'VWAP',
      category: 'main',
      defaultParams: {},
      defaultColor: '#3b82f6',
      calc: calculateVWAP
    },
    atr: {
      displayName: 'Average True Range',
      category: 'sub',
      defaultParams: { period: 14 },
      defaultColor: '#f43f5e',
      calc: calculateATR
    }
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
      seriesList: []
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
      favorite: ChartState.favoriteIndicators.includes(instance.indicatorId)
    });

    this.recalculateInstance(instance);
    
    // Update active list UI in manage indicators modal
    if (typeof updateActiveIndicatorsUI === 'function') {
      updateActiveIndicatorsUI();
    }

    emitEvent('indicatorAdded', { id: instance.id, indicatorId: instance.indicatorId, params, color });
    return instanceId;
  },

  createSeriesForInstance(instance) {
    const chart = ChartState.chart;
    const cat = instance.category;
    
    // Manage priceScale assignments for sub-panes to stack them nicely
    let priceScaleId = 'right';
    if (cat === 'sub') {
      // Create a unique priceScale partition for each oscillator sub-pane
      priceScaleId = `scale_${instance.id}`;
      
      // Calculate layout slots (RSI, MACD etc. stack vertically in bottom margins)
      const count = this.activeInstances.filter(inst => inst.category === 'sub').length;
      const topMargin = 0.55 + count * 0.12;
      const bottomMargin = 0.3 - count * 0.12;

      chart.priceScale(priceScaleId).applyOptions({
        scaleMargins: {
          top: Math.min(0.9, topMargin),
          bottom: Math.max(0.01, bottomMargin)
        },
        borderVisible: false
      });
    }

    if (instance.indicatorId === 'macd') {
      // MACD needs 3 series: MACD Line (blue), Signal Line (orange), Histogram (bar)
      const macdLine = chart.addLineSeries({
        color: instance.color,
        lineWidth: 1.5,
        priceScaleId: priceScaleId,
        title: 'MACD'
      });
      const signalLine = chart.addLineSeries({
        color: '#f97316',
        lineWidth: 1.5,
        priceScaleId: priceScaleId,
        title: 'Signal'
      });
      const histSeries = chart.addHistogramSeries({
        priceScaleId: priceScaleId,
        title: 'Hist'
      });

      instance.seriesList.push(
        { name: 'macd', series: macdLine },
        { name: 'signal', series: signalLine },
        { name: 'hist', series: histSeries }
      );
    } else if (instance.indicatorId === 'bb') {
      // Bollinger Bands needs 3 series on main chart: Upper, Middle, Lower
      const upper = chart.addLineSeries({ color: instance.color, lineWidth: 1, lineStyle: 2, title: 'BB Upper' });
      const middle = chart.addLineSeries({ color: '#f59e0b', lineWidth: 1.5, title: 'BB Middle' });
      const lower = chart.addLineSeries({ color: instance.color, lineWidth: 1, lineStyle: 2, title: 'BB Lower' });

      instance.seriesList.push(
        { name: 'upper', series: upper },
        { name: 'middle', series: middle },
        { name: 'lower', series: lower }
      );
    } else {
      // Standard Line indicators (SMA, EMA, RSI, VWAP, ATR)
      const lineSeries = chart.addLineSeries({
        color: instance.color,
        lineWidth: 2,
        priceScaleId: priceScaleId,
        title: instance.displayName
      });
      instance.seriesList.push({ name: 'main', series: lineSeries });
    }
  },

  removeIndicator(instanceId) {
    const idx = this.activeInstances.findIndex(inst => inst.id === instanceId);
    if (idx === -1) return;

    const instance = this.activeInstances[idx];
    
    // Remove series from chart
    instance.seriesList.forEach(s => {
      ChartState.chart.removeSeries(s.series);
    });

    this.activeInstances.splice(idx, 1);
    ChartState.indicators = ChartState.indicators.filter(ind => ind.id !== instanceId);

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
      data = meta.calc(ChartState.candles);
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
        color: d.histogram >= 0 ? 'rgba(38, 166, 154, 0.6)' : 'rgba(239, 83, 80, 0.6)'
      })));
    } else if (instance.indicatorId === 'bb') {
      const upper = instance.seriesList.find(s => s.name === 'upper').series;
      const middle = instance.seriesList.find(s => s.name === 'middle').series;
      const lower = instance.seriesList.find(s => s.name === 'lower').series;

      upper.setData(data.map(d => ({ time: d.time, value: d.upper })));
      middle.setData(data.map(d => ({ time: d.time, value: d.middle })));
      lower.setData(data.map(d => ({ time: d.time, value: d.lower })));
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
  }
};
