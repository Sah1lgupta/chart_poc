// short-position.js — Short Position drawing tool.

DrawingManager.registerTool('shortPos', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    // Initialize stop loss point (points[2]) if not present
    if (points.length < 3) {
      const entryPrice = points[0].price;
      const defaultStopPrice = entryPrice * 1.025; // +2.5% stop loss above
      points.push({ time: points[1].time, price: defaultStopPrice });
    }

    // Align point 2 time with point 1 time
    points[2].time = points[1].time;
    const c = timePriceToPx(points[2].time, points[2].price);

    const entryPrice = points[0].price;
    const targetPrice = points[1].price;
    const stopPrice = points[2].price;

    const targetY = mainSeries.priceToCoordinate(targetPrice);
    const stopY = mainSeries.priceToCoordinate(stopPrice);
    if (targetY == null || stopY == null) return;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const w = maxX - minX;

    // Draw Stop Box (Red)
    ctx.fillStyle = 'rgba(239, 83, 80, 0.15)';
    ctx.fillRect(minX, stopY, w, a.y - stopY);
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 1;
    ctx.strokeRect(minX, stopY, w, a.y - stopY);

    // Draw Target Box (Green)
    ctx.fillStyle = 'rgba(38, 166, 154, 0.15)';
    ctx.fillRect(minX, a.y, w, targetY - a.y);
    ctx.strokeStyle = '#26a69a';
    ctx.strokeRect(minX, a.y, w, targetY - a.y);

    // Draw entry line
    ctx.beginPath();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.moveTo(minX, a.y);
    ctx.lineTo(maxX, a.y);
    ctx.stroke();

    // Calculations for labels
    const targetDiff = entryPrice - targetPrice;
    const targetPct = ((targetDiff / entryPrice) * 100).toFixed(2);
    const stopDiff = stopPrice - entryPrice;
    const stopPct = ((stopDiff / entryPrice) * 100).toFixed(2);
    const rrRatio = stopDiff !== 0 ? (targetDiff / stopDiff).toFixed(2) : '0.00';

    // Print text info
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`Stop Loss: +${stopPct}% (${stopPrice.toFixed(2)})`, minX + 4, stopY + 12);
    ctx.fillText(`R:R Ratio: ${rrRatio}`, minX + 4, a.y - 4);
    ctx.fillText(`Target: -${targetPct}% (${targetPrice.toFixed(2)})`, minX + 4, targetY - 4);

    if (isSelected) {
      this.drawHandles(ctx, [a, b, c], hoveredPtIdx);
    }
  },

  drawHandles(ctx, pointsPx, hoveredPtIdx) {
    pointsPx.forEach((p, idx) => {
      ctx.beginPath();
      ctx.fillStyle = idx === hoveredPtIdx ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  },

  isHit(points, clickX, clickY) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    const stopPrice = points.length >= 3 ? points[2].price : points[0].price * 1.025;
    const targetPrice = points[1].price;

    const targetY = mainSeries.priceToCoordinate(targetPrice);
    const stopY = mainSeries.priceToCoordinate(stopPrice);

    if (targetY == null || stopY == null) return false;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);

    const yMin = Math.min(targetY, stopY);
    const yMax = Math.max(targetY, stopY);

    return clickX >= minX - 5 && clickX <= maxX + 5 && clickY >= yMin - 5 && clickY <= yMax + 5;
  }
});
