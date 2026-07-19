// ray.js — Ray drawing tool starting at point A and extending infinitely through point B.

DrawingManager.registerTool('ray', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    const end = this.getEndPoint(a, b);

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(end.x, end.y);
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

  getEndPoint(a, b) {
    if (Math.abs(b.x - a.x) < 0.01) {
      const yEnd = b.y >= a.y ? overlay.height : 0;
      return { x: a.x, y: yEnd };
    }
    const isRight = b.x > a.x;
    const targetX = isRight ? overlay.width + 1000 : -1000;
    const yEnd = a.y + (b.y - a.y) * ((targetX - a.x) / (b.x - a.x));
    return { x: targetX, y: yEnd };
  },

  isHit(points, clickX, clickY) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    const end = this.getEndPoint(a, b);

    const A = clickX - a.x;
    const B = clickY - a.y;
    const C = end.x - a.x;
    const D = end.y - a.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    if (param < 0 || param > 1) return false;

    const xx = a.x + param * C;
    const yy = a.y + param * D;

    const dx = clickX - xx;
    const dy = clickY - yy;
    return Math.hypot(dx, dy) < 8;
  }
});
