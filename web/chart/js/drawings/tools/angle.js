// angle.js — Angle measurement drawing tool.

DrawingManager.registerTool('angle', {
  minPoints: 3,

  draw(ctx, points, style, isSelected, hoveredPtIdx) {
    if (points.length < 2) return;
    const a = timePriceToPx(points[0].time, points[0].price);
    const b = timePriceToPx(points[1].time, points[1].price);
    if (a.x == null || b.x == null) return;

    ctx.beginPath();
    ctx.strokeStyle = style.color || '#5b9cf6';
    ctx.lineWidth = style.lineWidth || 2;
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    if (points.length >= 3) {
      const c = timePriceToPx(points[2].time, points[2].price);
      if (c.x != null) {
        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(c.x, c.y);
        ctx.stroke();

        // Calculate angle between vectors BA (b->a) and BC (b->c)
        const v1x = a.x - b.x;
        const v1y = a.y - b.y;
        const v2x = c.x - b.x;
        const v2y = c.y - b.y;

        const len1 = Math.hypot(v1x, v1y);
        const len2 = Math.hypot(v2x, v2y);
        if (len1 > 0 && len2 > 0) {
          const dot = v1x * v2x + v1y * v2y;
          let cosTheta = dot / (len1 * len2);
          cosTheta = Math.max(-1, Math.min(1, cosTheta));
          const angleRad = Math.acos(cosTheta);
          const angleDeg = angleRad * (180 / Math.PI);

          const text = `${angleDeg.toFixed(1)}°`;
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#ffffff';
          ctx.fillText(text, b.x + 8, b.y - 8);
        }
      }
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

    if (this.isPointNearSegment(clickX, clickY, a, b)) return true;

    if (points.length >= 3) {
      const c = timePriceToPx(points[2].time, points[2].price);
      if (c.x != null && this.isPointNearSegment(clickX, clickY, b, c)) return true;
    }
    return false;
  },

  isPointNearSegment(px, py, p1, p2) {
    const A = px - p1.x;
    const B = py - p1.y;
    const C = p2.x - p1.x;
    const D = p2.y - p1.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = p1.x;
      yy = p1.y;
    } else if (param > 1) {
      xx = p2.x;
      yy = p2.y;
    } else {
      xx = p1.x + param * C;
      yy = p1.y + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    return Math.hypot(dx, dy) < 8;
  }
});
