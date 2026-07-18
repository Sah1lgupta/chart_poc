// atr.js — Average True Range calculator.

function calculateATR(candles, period) {
  const atrData = [];
  if (candles.length < period) return atrData;

  const trValues = [];
  
  // First TR is simply high - low
  trValues.push(candles[0].high - candles[0].low);

  for (let i = 1; i < candles.length; i++) {
    const high = candles[i].high;
    const low = candles[i].low;
    const prevClose = candles[i - 1].close;

    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trValues.push(tr);
  }

  // First ATR value is SMA of TR
  let trSum = 0;
  for (let i = 0; i < period; i++) {
    trSum += trValues[i];
  }
  let currentAtr = trSum / period;
  atrData.push({
    time: candles[period - 1].time,
    value: currentAtr
  });

  // Calculate subsequent ATR values using Wilder's smoothing
  for (let i = period; i < candles.length; i++) {
    currentAtr = (currentAtr * (period - 1) + trValues[i]) / period;
    atrData.push({
      time: candles[i].time,
      value: currentAtr
    });
  }

  return atrData;
}
