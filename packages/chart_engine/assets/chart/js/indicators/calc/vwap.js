// vwap.js — Volume Weighted Average Price calculator.
// FIX B4: Uses UTC-based day boundary for session reset (configurable).
// Professional VWAP resets at session open — this defaults to UTC midnight
// but accepts sessionResetHour + timezoneOffsetMinutes for exchange-specific resets.

/**
 * Calculates VWAP with intraday session resets.
 * 
 * @param {Array} candles - OHLCV data array
 * @param {number} sessionResetHour - Hour (0-23) at which the session resets (default 0 = midnight)
 * @param {number} timezoneOffsetMinutes - Offset from UTC in minutes (default 0 = UTC)
 *   Examples: IST = 330 (UTC+5:30), EST = -300 (UTC-5), JST = 540 (UTC+9)
 * @returns {Array} VWAP data points [{time, value}]
 */
function calculateVWAP(candles, sessionResetHour = 0, timezoneOffsetMinutes = 0) {
  const vwapData = [];
  if (candles.length === 0) return vwapData;

  let cumulativePV = 0;
  let cumulativeV = 0;
  let lastSessionKey = null;

  for (let i = 0; i < candles.length; i++) {
    const bar = candles[i];
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const volume = bar.volume || 0;

    // Calculate the session key using UTC + timezone offset
    // Convert bar timestamp to local exchange time
    const utcMs = bar.time * 1000;
    const localMs = utcMs + (timezoneOffsetMinutes * 60 * 1000);
    const localDate = new Date(localMs);

    // Determine session: if hour < sessionResetHour, it belongs to the previous day's session
    let sessionDay = localDate.getUTCDate();
    let sessionMonth = localDate.getUTCMonth();
    let sessionYear = localDate.getUTCFullYear();
    const localHour = localDate.getUTCHours();

    if (localHour < sessionResetHour) {
      // This bar is before today's session open — belongs to yesterday's session
      const prevDay = new Date(localMs - 86400000);
      sessionDay = prevDay.getUTCDate();
      sessionMonth = prevDay.getUTCMonth();
      sessionYear = prevDay.getUTCFullYear();
    }

    const sessionKey = `${sessionYear}-${sessionMonth}-${sessionDay}`;

    if (lastSessionKey !== null && sessionKey !== lastSessionKey) {
      // New session: reset cumulative variables
      cumulativePV = 0;
      cumulativeV = 0;
    }
    lastSessionKey = sessionKey;

    cumulativePV += typicalPrice * volume;
    cumulativeV += volume;

    const value = cumulativeV === 0 ? typicalPrice : cumulativePV / cumulativeV;

    vwapData.push({
      time: bar.time,
      value: value,
    });
  }

  return vwapData;
}
