// ema.js — Exponential Moving Average calculator.

function calculateEMA(candles, period) {
  const emaData = [];
  if (candles.length < period) return emaData;

  const multiplier = 2 / (period + 1);
  
  // Calculate first SMA as the initial EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += candles[i].close;
  }
  let currentEma = sum / period;
  
  emaData.push({
    time: candles[period - 1].time,
    value: currentEma
  });

  for (let i = period; i < candles.length; i++) {
    const close = candles[i].close;
    currentEma = (close - currentEma) * multiplier + currentEma;
    emaData.push({
      time: candles[i].time,
      value: currentEma
    });
  }
  return emaData;
}
