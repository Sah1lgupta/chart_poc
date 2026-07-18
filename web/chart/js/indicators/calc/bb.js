// bb.js — Bollinger Bands calculator.

function calculateBollingerBands(candles, period, stdDevMultiplier) {
  const bbData = [];
  if (candles.length < period) return bbData;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      continue;
    }

    // SMA (Middle Band)
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    const middle = sum / period;

    // Standard deviation
    let varianceSum = 0;
    for (let j = 0; j < period; j++) {
      const diff = candles[i - j].close - middle;
      varianceSum += diff * diff;
    }
    const stdDev = Math.sqrt(varianceSum / period);

    bbData.push({
      time: candles[i].time,
      upper: middle + stdDevMultiplier * stdDev,
      middle: middle,
      lower: middle - stdDevMultiplier * stdDev
    });
  }
  return bbData;
}
