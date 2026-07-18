// vwap.js — Volume Weighted Average Price calculator.

function calculateVWAP(candles) {
  const vwapData = [];
  if (candles.length === 0) return vwapData;

  let cumulativePV = 0;
  let cumulativeV = 0;
  let lastDay = null;

  for (let i = 0; i < candles.length; i++) {
    const bar = candles[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const volume = bar.volume || 0;

    // Check if new day boundary for intraday reset
    const date = new Date(bar.time * 1000);
    const dayString = date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate();

    if (lastDay !== null && dayString !== lastDay) {
      // New day: reset cumulative variables
      cumulativePV = 0;
      cumulativeV = 0;
    }
    lastDay = dayString;

    cumulativePV += typicalPrice * volume;
    cumulativeV += volume;

    const value = cumulativeV === 0 ? typicalPrice : cumulativePV / cumulativeV;
    
    vwapData.push({
      time: bar.time,
      value: value
    });
  }

  return vwapData;
}
