// text.js — Text annotation drawing tool.

DrawingManager.registerTool('text', {
  minPoints: 1,

  draw(ctx, points, style, isSelected, hoveredPtIdx, textVal) {
    const p = timePriceToPx(points[0].time, points[0].price);
    if (p.x == null || p.y == null) return;

    // Retrieve text value (fallback to generic label if missing)
    const text = textVal || 'Text';

    ctx.font = `${style.fontSize || 12}px sans-serif`;
    ctx.fillStyle = style.color || '#5b9cf6';
    ctx.fillText(text, p.x + 6, p.y + 4);

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
    
    // Quick rectangular approximation of text hit zone
    return clickX >= p.x - 5 && clickX <= p.x + 80 && clickY >= p.y - 12 && clickY <= p.y + 8;
  }
});
