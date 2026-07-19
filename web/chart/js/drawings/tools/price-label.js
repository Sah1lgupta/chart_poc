// price-label.js — Price Label drawing tool.

DrawingManager.registerTool('pricelabel', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null || p.y == null) return;

    const priceText = points[0].price.toFixed(2);
    ctx.font = 'bold 10px sans-serif';
    const textWidth = ctx.measureText(priceText).width;

    // Draw horizontal dotted line to the right edge
    ctx.beginPath();
    ctx.strokeStyle = style.color || '#e02424';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);
    ctx.moveTo(p.x, p.y);
    ctx.lineTo(overlay.width, p.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw connector dot at point A
    ctx.beginPath();
    ctx.fillStyle = style.color || '#e02424';
    ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Draw price tag pill at the right edge of the chart area
    const pillHeight = 16;
    const pillWidth = textWidth + 8;
    const pillX = overlay.width - pillWidth - 2;
    const pillY = p.y - pillHeight / 2;

    ctx.fillStyle = style.color || '#e02424';
    ctx.beginPath();
    // Fallback for older browsers if roundRect is missing
    if (ctx.roundRect) {
      ctx.roundRect(pillX, pillY, pillWidth, pillHeight, 3);
    } else {
      ctx.rect(pillX, pillY, pillWidth, pillHeight);
    }
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.fillText(priceText, pillX + 4, p.y + 3);

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

    // Hit if clicked close to the point or the horizontal extension line
    if (clickX >= p.x - 5 && clickX <= overlay.width && Math.abs(clickY - p.y) < 8) {
      return true;
    }
    return false;
  }
});
