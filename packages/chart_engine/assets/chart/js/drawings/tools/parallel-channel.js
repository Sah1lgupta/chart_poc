// parallel-channel.js — Parallel Channel drawing tool.

DrawingManager.registerTool('channel', {
  minPoints: 3,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    if (points.length < 2) return;
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    let priceOffset = 0;
    if (points.length >= 3) {
      // Calculate vertical shift in price space
      const tDiff = points[1].time - points[0].time;
      const slope = tDiff !== 0 ? (points[1].price - points[0].price) / tDiff : 0;
      const mainPriceAtPt2 = points[0].price + slope * (points[2].time - points[0].time);
      priceOffset = points[2].price - mainPriceAtPt2;
    } else {
      // Default price offset if 3rd point not placed yet (e.g. 2% of price)
      priceOffset = points[0].price * 0.02;
    }

    const aOffsetPrice = points[0].price + priceOffset;
    const bOffsetPrice = points[1].price + priceOffset;

    const aOffset = timePriceToPx(points[0].time, aOffsetPrice);
    const bOffset = timePriceToPx(points[1].time, bOffsetPrice);

    if (aOffset.y == null || bOffset.y == null) return;

    // Main line
    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    // Parallel line
    ctx.beginPath();
    ctx.moveTo(aOffset.x, aOffset.y);
    ctx.lineTo(bOffset.x, bOffset.y);
    ctx.stroke();

    // Channel fill
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.lineTo(bOffset.x, bOffset.y);
    ctx.lineTo(aOffset.x, aOffset.y);
    ctx.closePath();
    ctx.fillStyle = (style.color || '#5b9cf6') + '1a'; // ~10% opacity fill
    ctx.fill();

    // Center dotted line
    const aCenter = timePriceToPx(points[0].time, points[0].price + priceOffset / 2);
    const bCenter = timePriceToPx(points[1].time, points[1].price + priceOffset / 2);
    if (aCenter.y != null && bCenter.y != null) {
      ctx.beginPath();
      ctx.strokeStyle = style.color || '#5b9cf6';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.moveTo(aCenter.x, aCenter.y);
      ctx.lineTo(bCenter.x, bCenter.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    if (isSelected) {
      const handles = [a, b];
      if (points.length >= 3) {
        const c = timePriceToPx(points[2].time, points[2].price);
        if (c.x != null) handles.push(c);
      }
      this.drawHandles(ctx, handles, hoveredPtIdx);
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
    if (points.length < 2) return false;
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return false;

    const minX = Math.min(a.x, b.x);
    const maxX = Math.max(a.x, b.x);
    if (clickX < minX - 5 || clickX > maxX + 5) return false;

    const t = (clickX - a.x) / (b.x - a.x);
    const topY = a.y + t * (b.y - a.y);

    let priceOffset = 0;
    if (points.length >= 3) {
      const tDiff = points[1].time - points[0].time;
      const slope = tDiff !== 0 ? (points[1].price - points[0].price) / tDiff : 0;
      const mainPriceAtPt2 = points[0].price + slope * (points[2].time - points[0].time);
      priceOffset = points[2].price - mainPriceAtPt2;
    } else {
      priceOffset = points[0].price * 0.02;
    }

    const aOffsetPrice = points[0].price + priceOffset;
    const bOffsetPrice = points[1].price + priceOffset;
    const aOffset = timePriceToPx(points[0].time, aOffsetPrice);
    const bOffset = timePriceToPx(points[1].time, bOffsetPrice);
    if (aOffset.y == null || bOffset.y == null) return false;

    const bottomY = aOffset.y + t * (bOffset.y - aOffset.y);

    const yMin = Math.min(topY, bottomY);
    const yMax = Math.max(topY, bottomY);

    return clickY >= yMin - 8 && clickY <= yMax + 8;
  }
});
