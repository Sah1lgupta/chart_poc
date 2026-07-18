// macd.js — Moving Average Convergence Divergence calculator.

function calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod) {
  // MACD Line = 12-day EMA - 26-day EMA
  // Signal Line = 9-day EMA of MACD Line
  // Histogram = MACD Line - Signal Line

  const macdData = [];
  if (candles.length < slowPeriod) return macdData;

  const fastEmaVals = calculateEMARaw(candles, fastPeriod);
  const slowEmaVals = calculateEMARaw(candles, slowPeriod);

  // We align them by time
  const macdLinePoints = [];
  for (let i = 0; i < candles.length; i++) {
    const time = candles[i].time;
    const fastVal = fastEmaVals[time];
    const slowVal = slowEmaVals[time];
    if (fastVal !== undefined && slowVal !== undefined) {
      macdLinePoints.push({
        time: time,
        value: fastVal - slowVal
      });
    }
  }

  if (macdLinePoints.length < signalPeriod) return macdData;

  // Signal Line is EMA of macdLinePoints
  const signalEmaVals = calculateEMAForPoints(macdLinePoints, signalPeriod);

  for (let j = 0; j < macdLinePoints.length; j++) {
    const time = macdLinePoints[j].time;
    const macdVal = macdLinePoints[j].value;
    const signalVal = signalEmaVals[time];
    if (signalVal !== undefined) {
      macdData.push({
        time: time,
        macd: macdVal,
        signal: signalVal,
        histogram: macdVal - signalVal
      });
    }
  }

  return macdData;
}

// Helpers
function calculateEMARaw(candles, period) {
  const map = {};
  if (candles.length < period) return map;
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let currentEma = sum / period;
  map[candles[period - 1].time] = currentEma;

  for (let i = period; i < candles.length; i++) {
    currentEma = (candles[i].close - currentEma) * multiplier + currentEma;
    map[candles[i].time] = currentEma;
  }
  return map;
}

function calculateEMAForPoints(points, period) {
  const map = {};
  if (points.length < period) return map;
  const multiplier = 2 / (period + 1);
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += points[i].value;
  }
  let currentEma = sum / period;
  map[points[period - 1].time] = currentEma;

  for (let i = period; i < points.length; i++) {
    currentEma = (points[i].value - currentEma) * multiplier + currentEma;
    map[points[i].time] = currentEma;
  }
  return map;
}
