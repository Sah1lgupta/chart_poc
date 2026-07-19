// ui-handlers.js — General browser interaction wiring for toolbars, dropdowns, full screen, and layouts.

// ---- Dropdowns toggle logic ----

function setupDropdown(btnId, menuId) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if (!btn || !menu) return;

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    // Close other open dropdowns first
    document.querySelectorAll('.dropdown, .tools-menu').forEach(el => {
      if (el !== menu) el.classList.remove('open');
    });
    const isOpen = menu.classList.toggle('open');
    if (isOpen) {
      positionDropdown(btn, menu);
    }
  });
}

function positionDropdown(btn, menu) {
  const rect = btn.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = rect.bottom + 'px';
  
  const viewportWidth = window.innerWidth;
  const menuWidth = menu.offsetWidth || 160;
  let left = rect.left;
  if (left + menuWidth > viewportWidth - 8) {
    left = viewportWidth - menuWidth - 8;
  }
  if (left < 8) left = 8;
  
  menu.style.left = left + 'px';
}

runOnInit(() => {
  setupDropdown('tfDropdownBtn', 'tfDropdown');
  setupDropdown('ctDropdownBtn', 'ctDropdown');
  setupDropdown('toolsMenuBtn', 'toolsMenu');

  // Close dropdowns on outside click
  document.addEventListener('click', () => {
    document.querySelectorAll('.dropdown, .tools-menu').forEach(el => {
      el.classList.remove('open');
    });
    if (typeof closeContextMenu === 'function') closeContextMenu();
  });

  // Close dropdowns when scrolling the topbar
  const topbar = document.getElementById('topbar');
  if (topbar) {
    topbar.addEventListener('scroll', () => {
      document.querySelectorAll('.dropdown, .tools-menu').forEach(el => {
        el.classList.remove('open');
      });
    });
  }

  // Wire quick timeframe button selectors
  document.querySelectorAll('#topbar > .tb-btn[data-tf]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('#topbar > .tb-btn[data-tf]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      emitTimeframeEvent(btn.dataset.tf);
    });
  });

  // Wire timeframe dropdown items
  document.querySelectorAll('#tfDropdown .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('#tfDropdown .dropdown-item').forEach(b => b.classList.remove('active'));
      item.classList.add('active');
      emitTimeframeEvent(item.dataset.tf);
    });
  });

  // Wire chart type dropdown items
  document.querySelectorAll('#ctDropdown .dropdown-item').forEach(item => {
    item.addEventListener('click', (e) => {
      document.querySelectorAll('#ctDropdown .dropdown-item').forEach(b => b.classList.remove('active'));
      item.classList.add('active');
      const type = item.dataset.ct;
      
      const span = document.querySelector('#ctDropdownBtn span');
      if (span) {
        span.textContent = item.textContent.trim();
      }

      setSeriesType(type);
      emitEvent('chartTypeChanged', { type: type });
    });
  });

  // Wire Settings gear button
  const settingsBtn = document.getElementById('settingsBtn');
  if (settingsBtn) {
    settingsBtn.addEventListener('click', () => openModal('settingsModal'));
  }

  // Wire Indicators fx button
  const indicatorsBtn = document.getElementById('indicatorsBtn');
  if (indicatorsBtn) {
    indicatorsBtn.addEventListener('click', () => openModal('indicatorsModal'));
  }

  // Wire Fullscreen button
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }

  // Wire Navigation Controls
  document.getElementById('zoomIn').addEventListener('click', () => {
    const ts = ChartState.chart.timeScale();
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const span = range.to - range.from;
    const shrink = span * 0.2; // zoom in by 20%
    ts.setVisibleLogicalRange({ from: range.from + shrink, to: range.to - shrink });
  });
  document.getElementById('zoomOut').addEventListener('click', () => {
    const ts = ChartState.chart.timeScale();
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const span = range.to - range.from;
    const grow = span * 0.2; // zoom out by 20%
    ts.setVisibleLogicalRange({ from: range.from - grow, to: range.to + grow });
  });
  document.getElementById('panLeft').addEventListener('click', () => {
    const ts = ChartState.chart.timeScale();
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const span = range.to - range.from;
    const shift = span * 0.15; // pan by 15% of visible range
    ts.setVisibleLogicalRange({ from: range.from - shift, to: range.to - shift });
  });
  document.getElementById('panRight').addEventListener('click', () => {
    const ts = ChartState.chart.timeScale();
    const range = ts.getVisibleLogicalRange();
    if (!range) return;
    const span = range.to - range.from;
    const shift = span * 0.15;
    ts.setVisibleLogicalRange({ from: range.from + shift, to: range.to + shift });
  });
  document.getElementById('resetView').addEventListener('click', () => {
    ChartState.chart.timeScale().fitContent();
  });

  // Wire Range buttons (Bottom bar)
  document.querySelectorAll('#bottombar .rng-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#bottombar .rng-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      const range = btn.dataset.range;
      emitTimeframeEvent(ChartState.interval.value + ChartState.interval.unit[0], range);
    });
  });

  // Wire click listener for drawings list items
  document.querySelectorAll('#toolsMenu .tools-menu-item').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.tool;
      selectActiveDrawingTool(toolId);
    });
  });

  // Wire left tool rail buttons click listeners
  document.querySelectorAll('#toolrail .tool-btn[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.dataset.tool;
      selectActiveDrawingTool(toolId);
    });
  });

  // Wire crosshair mode toggle button
  const crosshairBtn = document.getElementById('crosshairBtn');
  if (crosshairBtn) {
    crosshairBtn.addEventListener('click', () => {
      const currentMode = ChartState.crosshairMode || 'normal';
      let nextMode, lcMode;
      if (currentMode === 'normal') {
        nextMode = 'magnet';
        lcMode = LightweightCharts.CrosshairMode.Magnet;
        crosshairBtn.classList.add('active');
      } else {
        nextMode = 'normal';
        lcMode = LightweightCharts.CrosshairMode.Normal;
        crosshairBtn.classList.remove('active');
      }
      ChartState.crosshairMode = nextMode;
      ChartState.chart.applyOptions({ crosshair: { mode: lcMode } });
    });
  }

  // Wire keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Delete / Backspace — remove selected drawing
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (DrawingManager.selectedDrawing) {
        e.preventDefault();
        DrawingManager.deleteSelected();
      }
    }
    // Escape — cancel active tool, return to cursor, deselect drawing
    if (e.key === 'Escape') {
      if (ChartState.activeTool !== 'cursor') {
        selectActiveDrawingTool('cursor');
      } else if (DrawingManager.selectedDrawing) {
        DrawingManager.selectedDrawing = null;
        redrawDrawings();
      }
      // Close any open dropdowns/menus
      document.querySelectorAll('.dropdown, .tools-menu').forEach(el => {
        el.classList.remove('open');
      });
    }
    // Ctrl+Z — undo last drawing
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      if (ChartState.drawings.length > 0) {
        const removed = ChartState.drawings.pop();
        if (!ChartState._undoStack) ChartState._undoStack = [];
        ChartState._undoStack.push(removed);
        DrawingManager.selectedDrawing = null;
        redrawDrawings();
        emitEvent('drawingDeleted', { id: removed.id });
      }
    }
    // Ctrl+Shift+Z or Ctrl+Y — redo
    if (((e.ctrlKey || e.metaKey) && e.key === 'z' && e.shiftKey) ||
        ((e.ctrlKey || e.metaKey) && e.key === 'y')) {
      e.preventDefault();
      if (ChartState._undoStack && ChartState._undoStack.length > 0) {
        const restored = ChartState._undoStack.pop();
        ChartState.drawings.push(restored);
        DrawingManager.selectedDrawing = restored;
        redrawDrawings();
        emitEvent('drawingAdded', restored);
      }
    }
  });
});

function emitTimeframeEvent(tfValue, rangeShortcut = null) {
  // Parse tf values e.g. "1" -> 1m, "D" -> 1d
  let unit = 'minute';
  let val = parseInt(tfValue);
  if (isNaN(val)) {
    val = 1;
    if (tfValue === 'D') unit = 'day';
    else if (tfValue === 'W') unit = 'week';
    else if (tfValue === 'M') unit = 'month';
  } else {
    if (tfValue.endsWith('H') || tfValue === '60' || tfValue === '240') unit = 'hour';
  }

  ChartState.interval = { label: tfValue, value: val, unit };
  emitEvent('timeframeChanged', { tf: tfValue, interval: val, unit, rangeShortcut });
}

function selectActiveDrawingTool(toolId) {
  // Highlight active button in rail if matching
  document.querySelectorAll('#toolrail .tool-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.tool === toolId);
  });
  
  ChartState.activeTool = toolId;
  ChartState.draftPoints = [];
  overlay.classList.toggle('drawing', toolId !== 'cursor');
}

// Favorites stars selection updates
function toggleFav(starEl, toolId) {
  starEl.classList.toggle('active');
  const isFav = starEl.classList.contains('active');
  starEl.textContent = isFav ? '★' : '☆';

  const idx = ChartState.favoriteTools.indexOf(toolId);
  if (isFav && idx === -1) {
    ChartState.favoriteTools.push(toolId);
  } else if (!isFav && idx !== -1) {
    ChartState.favoriteTools.splice(idx, 1);
  }

  renderFavoritesRail();
}

function renderFavoritesRail() {
  if (!ChartState.showFavoritesOnly) {
    document.querySelectorAll('#toolrail .tool-btn, #toolrail .tool-divider').forEach(el => {
      el.style.display = 'flex';
    });
    return;
  }

  // Filter tools to only favorites
  document.querySelectorAll('#toolrail .tool-btn').forEach(b => {
    const tool = b.dataset.tool;
    if (tool === 'cursor' || ChartState.favoriteTools.includes(tool)) {
      b.style.display = 'flex';
    } else {
      b.style.display = 'none';
    }
  });
}

// Tools Menu option click actions
function toggleDrawingToolbar() {
  const btn = document.getElementById('toggleToolbar');
  btn.classList.toggle('on');
  const isEnabled = btn.classList.contains('on');
  ChartState.drawingToolbarEnabled = isEnabled;
  document.getElementById('toolrail').classList.toggle('hidden', !isEnabled);
}

function toggleMagnetMode() {
  const btn = document.getElementById('toggleMagnet');
  btn.classList.toggle('on');
  ChartState.magnetEnabled = btn.classList.contains('on');
}

function toggleHideDrawings() {
  const btn = document.getElementById('toggleHide');
  btn.classList.toggle('on');
  const isHidden = btn.classList.contains('on');
  ChartState.drawingsHidden = isHidden;
  overlay.style.display = isHidden ? 'none' : 'block';
  redrawDrawings();
}

function toggleLockDrawings() {
  const btn = document.getElementById('toggleLock');
  btn.classList.toggle('on');
  ChartState.drawingsLocked = btn.classList.contains('on');
  redrawDrawings();
}

function toggleShowFavourites() {
  const btn = document.getElementById('toggleFavs');
  btn.classList.toggle('on');
  ChartState.showFavoritesOnly = btn.classList.contains('on');
  renderFavoritesRail();
}

// Fullscreen API implementation
function toggleFullscreen() {
  const root = document.getElementById('root');
  if (!document.fullscreenElement) {
    root.requestFullscreen().then(() => {
      root.classList.add('fullscreen');
      emitEvent('fullscreenChanged', { isFullscreen: true });
    }).catch(err => {
      console.error('Error enabling fullscreen', err);
    });
  } else {
    document.exitFullscreen().then(() => {
      root.classList.remove('fullscreen');
      emitEvent('fullscreenChanged', { isFullscreen: false });
    });
  }
}
