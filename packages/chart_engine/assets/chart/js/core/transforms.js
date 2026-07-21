// transforms.js — Chart data transformations for alternative chart types.
// Heikin Ashi and Renko calculations live here, separate from the
// chart instance so they can be tested and modified independently.

const Transforms = {
  /**
   * Converts standard OHLCV candles to Heikin Ashi candles.
   * HA Close = (O+H+L+C) / 4
   * HA Open  = (prevHAOpen + prevHAClose) / 2
   * HA High  = max(H, HAOpen, HAClose)
   * HA Low   = min(L, HAOpen, HAClose)
   */
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
        volume: c.volume,
      });

      prevOpen = open;
      prevClose = close;
    }
    return haCandles;
  },

  /**
   * Converts standard OHLCV candles to Renko bricks.
   * 
   * @param {Array} candles - Raw OHLCV data
   * @param {number|null} boxSize - Fixed box size (if null, auto-calculates from ATR)
   * @returns {Array} Renko brick data suitable for a candlestick series
   * 
   * FIX B2: Box size is now dynamic — defaults to ATR(14) of the data.
   * FIX B3: Each brick from the same source candle gets an incrementing
   *         synthetic timestamp (1-second offsets) to avoid duplicate time errors.
   */
  renko(candles, boxSize = null) {
    const renkoCandles = [];
    if (candles.length === 0) return renkoCandles;

    // Auto-calculate box size from ATR(14) if not provided
    if (boxSize === null || boxSize <= 0) {
      boxSize = this._calculateATRBoxSize(candles, 14);
    }

    // Absolute minimum — prevent infinite loops on flat data
    if (boxSize <= 0) boxSize = 1;

    let lastPrice = candles[0].close;
    let lastBrickTime = candles[0].time;
    let syntheticOffset = 0; // Incrementing offset for same-candle bricks

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

          // Ensure strictly ascending timestamps
          let brickTime = c.time;
          if (brickTime <= lastBrickTime && renkoCandles.length > 0) {
            syntheticOffset++;
            brickTime = lastBrickTime + syntheticOffset;
          } else {
            syntheticOffset = 0;
          }
          lastBrickTime = brickTime;

          renkoCandles.push({
            time: brickTime,
            open,
            high,
            low,
            close,
            volume: c.volume,
          });

          lastPrice = close;
        }
      }
    }
    return renkoCandles;
  },

  /**
   * Calculates ATR(period) to derive a reasonable Renko box size.
   * Returns ATR value rounded to a human-friendly number.
   */
  _calculateATRBoxSize(candles, period) {
    if (candles.length < period + 1) {
      // Not enough data — fall back to 0.5% of average price
      const avgPrice = candles.reduce((s, c) => s + c.close, 0) / candles.length;
      return Math.max(avgPrice * 0.005, 0.01);
    }

    const trValues = [];
    trValues.push(candles[0].high - candles[0].low);

    for (let i = 1; i < candles.length; i++) {
      const high = candles[i].high;
      const low = candles[i].low;
      const prevClose = candles[i - 1].close;
      trValues.push(Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      ));
    }

    // Simple ATR as average of last `period` TR values
    let trSum = 0;
    const start = Math.max(0, trValues.length - period);
    for (let i = start; i < trValues.length; i++) {
      trSum += trValues[i];
    }
    const atr = trSum / Math.min(period, trValues.length - start);

    // Round to a clean number for display
    return parseFloat(atr.toFixed(Math.max(0, 2 - Math.floor(Math.log10(atr)))));
  },
};
