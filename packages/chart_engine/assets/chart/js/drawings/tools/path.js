// path.js — Freehand path drawing tool.

DrawingManager.registerTool('path', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const first = timePriceToPx(points[0].time, points[0].price);
    if (first.x != null) {
      ctx.moveTo(first.x, first.y);
    }

    for (let i = 1; i < points.length; i++) {
      const p = timePriceToPx(points[i].time, points[i].price);
      if (p.x != null) {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();

    if (isSelected) {
      const handles = [];
      const start = timePriceToPx(points[0].time, points[0].price);
      const end = timePriceToPx(points[points.length - 1].time, points[points.length - 1].price);
      if (start.x != null) handles.push(start);
      if (end.x != null) handles.push(end);
      this.drawHandles(ctx, handles, hoveredPtIdx === 0 ? 0 : (hoveredPtIdx === points.length - 1 ? 1 : -1));
    }
  },

  drawHandles(ctx, pointsPx, hoveredPtIdx) {
    pointsPx.forEach((p, idx) => {
      ctx.beginPath();
      ctx.fillStyle = idx === hoveredPtIdx ? '#f0b90b' : '#ffffff';
      ctx.strokeStyle = '#2962ff';
      ctx.lineWidth = 2;
      ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    });
  },

  isHit(points, clickX, clickY) {
    for (let i = 0; i < points.length; i += Math.max(1, Math.floor(points.length / 50))) {
      const p = timePriceToPx(points[i].time, points[i].price);
      if (p.x != null && Math.hypot(clickX - p.x, clickY - p.y) < 12) {
        return true;
      }
    }
    return false;
  }
});
