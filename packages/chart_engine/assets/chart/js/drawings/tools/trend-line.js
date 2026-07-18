// trend-line.js — Trend Line drawing tool.

DrawingManager.registerTool('trendline', {
  minPoints: 2,
  
  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // Draw handles if selected
    if (isSelected) {
      this.drawHandles(ctx, [a, b], hoveredPtIdx);
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

    // Distance from point (clickX, clickY) to line segment AB
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
    return Math.hypot(dx, dy) < 8; // 8-pixel threshold
  }
});
