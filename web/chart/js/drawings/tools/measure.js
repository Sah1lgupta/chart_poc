// measure.js — Measure/Ruler drawing tool showing price/percentage/bars counts.

DrawingManager.registerTool('measure', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    const priceStart = points[0].price;
    const priceEnd = points[1].price;
    const diff = priceEnd - priceStart;
    const pct = (diff / priceStart) * 100;

    // Estimate bars count (or query state.candles if possible)
    let barsCount = 0;
    if (ChartState.candles) {
      const idxA = ChartState.candles.findIndex(c => c.time === points[0].time);
      const idxB = ChartState.candles.findIndex(c => c.time === points[1].time);
      if (idxA !== -1 && idxB !== -1) {
        barsCount = Math.abs(idxB - idxA);
      }
    }

    // Ruler line (dashed blue)
    ctx.beginPath();
    ctx.strokeStyle = '#2962ff';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Measurement readout card
    const text = `${diff.toFixed(2)} (${pct.toFixed(2)}%) | ${barsCount} bars`;
    ctx.font = '10px sans-serif';
    const textWidth = ctx.measureText(text).width;

    const cardX = b.x - textWidth / 2;
    const cardY = b.y - 20;

    // Draw dark background card
    ctx.fillStyle = 'rgba(30, 34, 45, 0.85)';
    ctx.fillRect(cardX - 6, cardY - 12, textWidth + 12, 18);
    ctx.strokeStyle = '#2a2e39';
    ctx.lineWidth = 1;
    ctx.strokeRect(cardX - 6, cardY - 12, textWidth + 12, 18);

    // Text details
    ctx.fillStyle = pct >= 0 ? '#26a69a' : '#ef5350';
    ctx.fillText(text, cardX, cardY);

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
    // Let's use the line segment hit test for trendline
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    const A = clickX - a.x;
    const B = clickY - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = a.x;
      yy = a.y;
    } else if (param > 1) {
      xx = b.x;
      yy = b.y;
    } else {
      xx = a.x + param * C;
      yy = a.y + param * D;
    }

    const dx = clickX - xx;
    const dy = clickY - yy;
    return Math.hypot(dx, dy) < 12; // slightly larger hit threshold for measure ruler
  }
});
