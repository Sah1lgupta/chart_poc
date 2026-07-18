// rsi.js — Relative Strength Index calculator.

function calculateRSI(candles, period) {
  const rsiData = [];
  if (candles.length <= period) return rsiData;

  let gains = 0;
  let losses = 0;

  // First change values
  for (let i = 1; i <= period; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    if (diff > 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  let rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  let rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

  rsiData.push({ time: candles[period].time, value: rsi });

  for (let i = period + 1; i < candles.length; i++) {
    const diff = candles[i].close - candles[i - 1].close;
    
    // Wilder's smoothing technique
    avgGain = (avgGain * (period - 1) + (diff > 0 ? diff : 0)) / period;
    avgLoss = (avgLoss * (period - 1) + (diff < 0 ? -diff : 0)) / period;

    rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi = avgLoss === 0 ? 100 : 100 - (100 / (1 + rs));

    rsiData.push({ time: candles[i].time, value: rsi });
  }

  return rsiData;
}
