// parallel-channel.js — Parallel Channel drawing tool.

DrawingManager.registerTool('channel', {
  minPoints: 2,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    const offsetVal = 40; // 40-pixel offset for the parallel channel boundary

    // Main line
    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // Parallel line
    ctx.beginPath();
    ctx.moveTo(a.x, a.y + offsetVal);
    ctx.lineTo(b.x, b.y + offsetVal);
    ctx.stroke();

    // Channel fill
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(b.x, b.y + offsetVal);
    ctx.lineTo(a.x, a.y + offsetVal);
    ctx.closePath();
    ctx.fillStyle = (style.color || '#5b9cf6') + '1a'; // ~10% opacity fill
    ctx.fill();

    // Center dotted line
    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(a.x, a.y + offsetVal / 2);
    ctx.lineTo(b.x, b.y + offsetVal / 2);
    ctx.stroke();
    ctx.setLineDash([]);

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
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    // Check hit within the channel polygon (defined by y and y + 40 offset)
    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    if (clickX < minX - 5 || clickX > maxX + 5) return false;

    // Interpolate the y value of top line at clickX
    const t = (clickX - a.x) / (b.x - a.x);
    const topY = a.y + t * (b.y - a.y);
    const bottomY = topY + 40;

    return clickY >= topY - 8 && clickY <= bottomY + 8;
  }
});
