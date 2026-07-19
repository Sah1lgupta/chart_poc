// extended-line.js — Extended Line drawing tool extending infinitely in both directions.

DrawingManager.registerTool('extline', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;

    if (Math.abs(b.x - a.x) < 0.01) {
      // Vertical line
      ctx.moveTo(a.x, 0);
      ctx.lineTo(a.x, overlay.height);
    } else {
      const m = (b.y - a.y) / (b.x - a.x);
      const yLeft = a.y - m * a.x;
      const yRight = a.y + m * (overlay.width - a.x);
      ctx.moveTo(0, yLeft);
      ctx.lineTo(overlay.width, yRight);
    }
    ctx.stroke();

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

    const A = clickX - a.x;
    const B = clickY - a.y;
    const C = b.x - a.x;
    const D = b.y - a.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    if (lenSq === 0) return false;
    const param = dot / lenSq;

    const xx = a.x + param * C;
    const yy = a.y + param * D;

    const dx = clickX - xx;
    const dy = clickY - yy;
    return Math.hypot(dx, dy) < 8;
  }
});
