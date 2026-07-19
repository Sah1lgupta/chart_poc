// flag.js — Flag drawing tool.

DrawingManager.registerTool('flag', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null || p.y == null) return;

    const flagHeight = 12;
    const flagWidth = 18;
    const poleHeight = 28;

    // Draw flagpole (vertical line going upwards)
    ctx.beginPath();
    ctx.strokeStyle = style.color || '#f59e0b';
    ctx.lineWidth = 2;
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(p.x, p.y - poleHeight);
    ctx.stroke();

    // Draw flag banner
    ctx.beginPath();
    ctx.moveTo(p.x, p.y - poleHeight);
    ctx.lineTo(p.x + flagWidth, p.y - poleHeight + flagHeight / 2);
    ctx.lineTo(p.x, p.y - poleHeight + flagHeight);
    ctx.closePath();

    ctx.fillStyle = style.color || '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
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
    if (p.x == null || p.y == null) return;

    const poleHeight = 28;
    // Hit if clicked close to the flagpole/banner
    return Math.abs(clickX - p.x) < 8 && clickY <= p.y + 5 && clickY >= p.y - poleHeight - 5;
  }
});
