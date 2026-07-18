// drawing-manager.js — Coordinates mouse/touch interaction for custom drawing tools.
// Manages placed drawings, draft points, active tool state, and callbacks.

const DrawingManager = {
  tools: {}, // Registry: toolId -> tool class
  selectedDrawing: null,
  draggedDrawing: null,
  draggedPointIndex: -1,
  dragStartPoint: null,
  hoveredDrawing: null,
  hoveredPointIndex: -1,

  registerTool(toolId, toolImpl) {
    this.tools[toolId] = toolImpl;
  },

  init() {
    overlay.addEventListener('mousedown', this.onMouseDown.bind(this));
    overlay.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('mouseup', this.onMouseUp.bind(this));
    
    // Add touch support for WebView / Mobile
    overlay.addEventListener('touchstart', this.onTouchStart.bind(this));
    overlay.addEventListener('touchmove', this.onTouchMove.bind(this));
    window.addEventListener('touchend', this.onTouchEnd.bind(this));
  },

  getMousePos(e) {
    const rect = overlay.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  },

  onMouseDown(e) {
    if (ChartState.drawingsHidden) return;
    const pos = this.getMousePos(e);
    const tp = pxToTimePrice(pos.x, pos.y);
    if (tp.time == null || tp.price == null) return;

    // Apply magnet snapping to the coordinates if magnet is enabled
    const price = Magnet.getSnappedPrice(tp.time, tp.price);
    const time = tp.time;

    // If a tool is active, place a point
    if (ChartState.activeTool !== 'cursor') {
      ChartState.draftPoints.push({ time, price });
      const tool = this.tools[ChartState.activeTool];
      if (tool && ChartState.draftPoints.length >= tool.minPoints) {
        const id = 'drawing_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const newDrawing = {
          id: id,
          type: ChartState.activeTool,
          points: [...ChartState.draftPoints],
          style: {
            color: '#5b9cf6',
            lineWidth: 2,
            fillOpacity: 0.15,
            fontSize: 12
          },
          locked: false,
          hidden: false,
          favorite: ChartState.favoriteTools.includes(ChartState.activeTool)
        };

        // Text tool requires text input popup
        if (ChartState.activeTool === 'text') {
          const label = prompt('Label text:', '');
          if (!label) {
            ChartState.draftPoints = [];
            return;
          }
          newDrawing.text = label;
        }

        ChartState.drawings.push(newDrawing);
        ChartState.draftPoints = [];
        
        // Reset active tool back to cursor
        document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
        const cursorBtn = document.querySelector('[data-tool="cursor"]');
        if (cursorBtn) cursorBtn.classList.add('active');
        ChartState.activeTool = 'cursor';
        overlay.classList.remove('drawing');

        this.selectedDrawing = newDrawing;
        redrawDrawings();
        emitEvent('drawingAdded', newDrawing);
      }
      return;
    }

    // Cursor mode: Check if user clicked on a drag handle (point) of selected drawing
    if (this.selectedDrawing && !ChartState.drawingsLocked && !this.selectedDrawing.locked) {
      for (let i = 0; i < this.selectedDrawing.points.length; i++) {
        const pt = this.selectedDrawing.points[i];
        const ptPx = timePriceToPx(pt.time, pt.price);
        if (ptPx.x != null && ptPx.y != null) {
          const dist = Math.hypot(pos.x - ptPx.x, pos.y - ptPx.y);
          if (dist < 8) {
            this.draggedDrawing = this.selectedDrawing;
            this.draggedPointIndex = i;
            return;
          }
        }
      }
    }

    // Check if clicked on any drawing body or points
    let found = false;
    for (let j = ChartState.drawings.length - 1; j >= 0; j--) {
      const d = ChartState.drawings[j];
      if (d.hidden) continue;

      const tool = this.tools[d.type];
      if (tool && tool.isHit(d.points, pos.x, pos.y)) {
        this.selectedDrawing = d;
        this.draggedDrawing = d;
        this.draggedPointIndex = -99; // -99 indicates dragging the entire object
        this.dragStartPoint = { time, price, x: pos.x, y: pos.y, originalPoints: JSON.parse(JSON.stringify(d.points)) };
        found = true;
        break;
      }
    }

    if (!found) {
      this.selectedDrawing = null;
    }
    redrawDrawings();
  },

  onMouseMove(e) {
    if (ChartState.drawingsHidden) return;
    const pos = this.getMousePos(e);
    const tp = pxToTimePrice(pos.x, pos.y);
    if (tp.time == null || tp.price == null) return;

    // Snapped mouse point for drawing updates
    const price = Magnet.getSnappedPrice(tp.time, tp.price);
    const time = tp.time;

    // Handle active dragging of drawings or drag points
    if (this.draggedDrawing && !ChartState.drawingsLocked && !this.draggedDrawing.locked) {
      if (this.draggedPointIndex >= 0) {
        // Dragging a specific point
        this.draggedDrawing.points[this.draggedPointIndex] = { time, price };
        redrawDrawings();
      } else if (this.draggedPointIndex === -99 && this.dragStartPoint) {
        // Dragging the entire drawing
        const timeDiff = time - this.dragStartPoint.time;
        const priceDiff = price - this.dragStartPoint.price;
        
        this.draggedDrawing.points = this.dragStartPoint.originalPoints.map(pt => ({
          time: pt.time + timeDiff,
          price: pt.price + priceDiff
        }));
        redrawDrawings();
      }
      return;
    }

    // Mouse hover checks for cursor styling and highlighting
    if (ChartState.activeTool === 'cursor') {
      let isOverPoint = false;
      let isOverBody = false;
      let hoveredD = null;
      let hoveredPtIdx = -1;

      // Check points of selected drawing first
      if (this.selectedDrawing) {
        for (let i = 0; i < this.selectedDrawing.points.length; i++) {
          const pt = this.selectedDrawing.points[i];
          const ptPx = timePriceToPx(pt.time, pt.price);
          if (ptPx.x != null && ptPx.y != null) {
            if (Math.hypot(pos.x - ptPx.x, pos.y - ptPx.y) < 8) {
              isOverPoint = true;
              hoveredPtIdx = i;
              hoveredD = this.selectedDrawing;
              break;
            }
          }
        }
      }

      // Check bodies of all drawings
      if (!isOverPoint) {
        for (let j = ChartState.drawings.length - 1; j >= 0; j--) {
          const d = ChartState.drawings[j];
          if (d.hidden) continue;
          const tool = this.tools[d.type];
          if (tool && tool.isHit(d.points, pos.x, pos.y)) {
            isOverBody = true;
            hoveredD = d;
            break;
          }
        }
      }

      this.hoveredDrawing = hoveredD;
      this.hoveredPointIndex = hoveredPtIdx;

      if (isOverPoint) {
        overlay.style.cursor = 'move';
      } else if (isOverBody) {
        overlay.style.cursor = 'pointer';
      } else {
        overlay.style.cursor = 'default';
      }
      
      // Request redraw to render hovered highlight states if needed
      redrawDrawings();
    }
  },

  onMouseUp(e) {
    if (this.draggedDrawing) {
      emitEvent('drawingUpdated', this.draggedDrawing);
      this.draggedDrawing = null;
      this.draggedPointIndex = -1;
      this.dragStartPoint = null;
    }
  },

  onTouchStart(e) {
    this.onMouseDown(e);
  },

  onTouchMove(e) {
    this.onMouseMove(e);
  },

  onTouchEnd(e) {
    this.onMouseUp(e);
  },

  deleteSelected() {
    if (this.selectedDrawing) {
      const id = this.selectedDrawing.id;
      ChartState.drawings = ChartState.drawings.filter(d => d.id !== id);
      this.selectedDrawing = null;
      redrawDrawings();
      emitEvent('drawingDeleted', { id });
    }
  },

  clearAll() {
    ChartState.drawings = [];
    this.selectedDrawing = null;
    redrawDrawings();
    emitEvent('drawingsCleared', {});
  }
};
