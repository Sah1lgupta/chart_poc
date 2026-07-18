// short-position.js — Short Position drawing tool.

DrawingManager.registerTool('shortPos', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    const entryPrice = points[0].price;
    const targetPrice = entryPrice * 0.95; // 5% target below
    const stopPrice = entryPrice * 1.025;  // 2.5% stop loss above

    const targetY = mainSeries.priceToCoordinate(targetPrice);
    const stopY = mainSeries.priceToCoordinate(stopPrice);
    if (targetY == null || stopY == null) return;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    const w = maxX - minX;

    // Draw Stop Box (Red)
    ctx.fillStyle = 'rgba(239, 83, 80, 0.2)';
    ctx.fillRect(minX, stopY, w, a.y - stopY);
    ctx.strokeStyle = '#ef5350';
    ctx.lineWidth = 1;
    ctx.strokeRect(minX, stopY, w, a.y - stopY);

    // Draw Target Box (Green)
    ctx.fillStyle = 'rgba(38, 166, 154, 0.2)';
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

    // Print text info
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px sans-serif';
    ctx.fillText('Stop Loss: +2.50%', minX + 4, stopY + 12);
    ctx.fillText('Risk/Reward: 2.00', minX + 4, a.y - 4);
    ctx.fillText('Target: -5.00%', minX + 4, targetY - 4);

    if (isSelected) {
      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 0 ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(a.x, a.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 1 ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(b.x, b.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  },

  isHit(points, clickX, clickY) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    const entryPrice = points[0].price;
    const targetPrice = entryPrice * 0.95;
    const stopPrice = entryPrice * 1.025;
    const targetY = mainSeries.priceToCoordinate(targetPrice);
    const stopY = mainSeries.priceToCoordinate(stopPrice);

    if (targetY == null || stopY == null) return false;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);

    return clickX >= minX - 5 && clickX <= maxX + 5 && clickY >= stopY - 5 && clickY <= targetY + 5;
  }
});
