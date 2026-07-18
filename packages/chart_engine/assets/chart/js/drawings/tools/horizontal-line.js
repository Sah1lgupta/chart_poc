// horizontal-line.js — Horizontal Line drawing tool.

DrawingManager.registerTool('hline', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.y == null) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(0, p.y);
    ctx.lineTo(overlay.width, p.y);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isSelected) {
      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 0 ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(p.x != null ? p.x : overlay.width / 2, p.y, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  },

  isHit(points, clickX, clickY) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.y == null) return false;
    return Math.abs(clickY - p.y) < 8;
  }
});
