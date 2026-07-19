// vertical-line.js — Vertical Line drawing tool.

DrawingManager.registerTool('vline', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.setLineDash([4, 3]);
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, overlay.height);
    ctx.stroke();
    ctx.setLineDash([]);

    if (isSelected) {
      ctx.beginPath();
      ctx.fillStyle = hoveredPtIdx === 0 ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(p.x, p.y != null ? p.y : overlay.height / 2, 5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  },

  isHit(points, clickX, clickY) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null) return false;
    return Math.abs(clickX - p.x) < 8;
  }
});
