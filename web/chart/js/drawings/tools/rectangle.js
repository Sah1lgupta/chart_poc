// rectangle.js — Rectangle drawing tool.

DrawingManager.registerTool('rect', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.strokeRect(x, y, w, h);

    ctx.fillStyle = (style.color || '#5b9cf6') + '26'; // add ~15% opacity (hex 26)
    ctx.fillRect(x, y, w, h);

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

    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    const w = Math.abs(b.x - a.x);
    const h = Math.abs(b.y - a.y);

    // Hit if clicked inside rectangle (including handles/boundaries)
    return clickX >= x - 5 && clickX <= x + w + 5 && clickY >= y - 5 && clickY <= y + h + 5;
  }
});
