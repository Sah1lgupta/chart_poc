// fibonacci.js — Fibonacci Retracement drawing tool.

DrawingManager.registerTool('fib', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    const priceStart = points[0].price;
    const priceEnd = points[1].price;
    const priceDiff = priceEnd - priceStart;

    const levels = [
      { ratio: 0.0, label: '0.0%' },
      { ratio: 0.236, label: '23.6%' },
      { ratio: 0.382, label: '38.2%' },
      { ratio: 0.5, label: '50.0%' },
      { ratio: 0.618, label: '61.8%' },
      { ratio: 0.786, label: '78.6%' },
      { ratio: 1.0, label: '100.0%' }
    ];

    ctx.font = '10px sans-serif';
    ctx.lineWidth = style.lineWidth || 1.5;

    levels.forEach(lvl => {
      const currentPrice = priceStart + priceDiff * lvl.ratio;
      const y = ChartState.mainSeries.priceToCoordinate(currentPrice);
      if (y == null) return;

      ctx.beginPath();
      ctx.strokeStyle = style.color || '#5b9cf6';
      if (lvl.ratio === 0.0 || lvl.ratio === 1.0) {
        ctx.setLineDash([]);
      } else {
        ctx.setLineDash([4, 4]);
      }
      ctx.moveTo(Math.min(a.x, b.x), y);
      ctx.lineTo(Math.max(a.x, b.x), y);
      ctx.stroke();

      // Text labels
      ctx.fillStyle = style.color || '#5b9cf6';
      ctx.setLineDash([]);
      const text = `${lvl.label} (${currentPrice.toFixed(2)})`;
      ctx.fillText(text, Math.max(a.x, b.x) - ctx.measureText(text).width - 4, y - 4);
    });

    if (isSelected) {
      ctx.beginPath();
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 0 ? '#f0b90b' : '#ffffff';
      ctx.arc(a.x, a.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 1 ? '#f0b90b' : '#ffffff';
      ctx.arc(b.x, b.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  },

  isHit(points, clickX, clickY) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    const priceStart = points[0].price;
    const priceEnd = points[1].price;
    const priceDiff = priceEnd - priceStart;
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);

    if (clickX < minX - 5 || clickX > maxX + 5) return false;

    const levels = [0.0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
    for (let ratio of levels) {
      const currentPrice = priceStart + priceDiff * ratio;
      const y = ChartState.mainSeries.priceToCoordinate(currentPrice);
      if (y != null && Math.abs(clickY - y) < 8) {
        return true;
      }
    }
    return false;
  }
});
