// horizontal-ray.js — Horizontal Ray drawing tool.

DrawingManager.registerTool('hray', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null || p.y == null) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(overlay.width, p.y);
    ctx.stroke();

    if (isSelected) {
      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 0 ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(p.x, p.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  },

  isHit(points, clickX, clickY) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null || p.y == null) return false;
    return clickX >= p.x - 5 && Math.abs(clickY - p.y) < 8;
  }
});
