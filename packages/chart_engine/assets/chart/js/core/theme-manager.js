// theme-manager.js — Centralized theme application.
// Applies ChartTheme properties to:
//   1. Lightweight Charts options (layout, grid, crosshair, scales)
//   2. CSS custom properties (for toolbar, toolrail, modals)
//   3. ChartState.theme (source of truth for other modules)

const ThemeManager = {
  /**
   * Applies a complete theme object to all chart UI surfaces.
   * @param {Object} theme - Full ChartTheme JSON from Dart
   */
  apply(theme) {
    // Merge into state (preserving any properties not sent)
    Object.assign(ChartState.theme, theme);
    const t = ChartState.theme;

    // ── 1. Lightweight Charts core options ──
    ChartState.chart.applyOptions({
      layout: {
        background: { color: t.background },
        textColor: t.text,
        fontFamily: t.fontFamily || "-apple-system, 'Segoe UI', Roboto, sans-serif",
        fontSize: t.fontSize || 12,
      },
      grid: {
        vertLines: { color: t.gridLineColor },
        horzLines: { color: t.gridLineColor },
      },
      crosshair: {
        vertLine: { color: t.crosshairColor },
        horzLine: { color: t.crosshairColor },
      },
      rightPriceScale: { borderColor: t.scaleBorderColor || t.toolbarBorder || '#2a2e39' },
      timeScale: { borderColor: t.scaleBorderColor || t.toolbarBorder || '#2a2e39' },
    });

    // ── 2. CSS custom properties for UI chrome ──
    const root = document.documentElement;
    root.style.setProperty('--chart-bg', t.background);
    root.style.setProperty('--toolbar-bg', t.toolbarBackground || '#1e222d');
    root.style.setProperty('--toolbar-border', t.toolbarBorder || '#2a2e39');
    root.style.setProperty('--toolbar-text', t.toolbarText || '#b2b5be');
    root.style.setProperty('--toolbar-active-bg', t.toolbarActiveBackground || '#2962ff33');
    root.style.setProperty('--toolbar-active-text', t.toolbarActiveText || '#5b9cf6');
    root.style.setProperty('--toolbar-hover-bg', t.toolbarHoverBackground || '#2a2e39');
    root.style.setProperty('--text-color', t.text);
    root.style.setProperty('--font-family', t.fontFamily || "-apple-system, 'Segoe UI', Roboto, sans-serif");
    root.style.setProperty('--font-size', (t.fontSize || 12) + 'px');
    root.style.setProperty('--up-color', t.upColor);
    root.style.setProperty('--down-color', t.downColor);

    // Layout dimensions
    if (t.toolbarHeight) root.style.setProperty('--toolbar-height', t.toolbarHeight + 'px');
    if (t.bottomBarHeight) root.style.setProperty('--bottombar-height', t.bottomBarHeight + 'px');
    if (t.toolRailWidth) root.style.setProperty('--toolrail-width', t.toolRailWidth + 'px');

    // Body background
    document.body.style.backgroundColor = t.background;
    document.body.style.fontFamily = t.fontFamily || "-apple-system, 'Segoe UI', Roboto, sans-serif";

    // ── 3. Sync settings modal color swatches ──
    this._syncColorSwatch('colorBg', t.background);
    this._syncColorSwatch('colorText', t.text);
    this._syncColorSwatch('colorUp', t.upColor);
    this._syncColorSwatch('colorDown', t.downColor);
    this._syncColorSwatch('colorGrid', t.gridLineColor);
    this._syncColorSwatch('colorCrosshair', t.crosshairColor);

    // ── 4. Re-apply series with new colors ──
    if (typeof setSeriesType === 'function') {
      setSeriesType(ChartState.currentSeriesType);
    }
    if (typeof redrawDrawings === 'function') {
      redrawDrawings();
    }
  },

  /** Helper: safely set a color input's value */
  _syncColorSwatch(elementId, value) {
    const el = document.getElementById(elementId);
    if (el && value) el.value = value;
  },
};
