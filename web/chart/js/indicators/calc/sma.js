// sma.js — Simple Moving Average calculator.

function calculateSMA(candles, period) {
  const smaData = [];
  if (candles.length < period) return smaData;

  for (let i = 0; i < candles.length; i++) {
    if (i < period - 1) {
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += candles[i - j].close;
    }
    smaData.push({
      time: candles[i].time,
      value: sum / period
    });
  }
  return smaData;
}
