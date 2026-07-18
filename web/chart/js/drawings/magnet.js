// magnet.js — Snap drawing endpoints to the nearest high, low, open, or close of a bar.

const Magnet = {
  getSnappedPrice(time, price) {
    if (!ChartState.magnetEnabled) return price;
    if (!ChartState.candles || ChartState.candles.length === 0) return price;

    // Find the bar matching the time
    const bar = ChartState.candles.find(c => c.time === time);
    if (!bar) return price;

    const values = [bar.open, bar.high, bar.low, bar.close];
    let closestValue = values[0];
    let minDiff = Math.abs(price - closestValue);

    for (let i = 1; i < values.length; i++) {
      const diff = Math.abs(price - values[i]);
      if (diff < minDiff) {
        minDiff = diff;
        closestValue = values[i];
      }
    }

    return closestValue;
  }
};
