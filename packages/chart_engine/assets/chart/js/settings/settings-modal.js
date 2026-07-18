// settings-modal.js — Logic for Settings modal tabs and visual preferences changes.

function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('open');
    if (id === 'indicatorsModal') {
      renderIndicatorList('all', '');
      updateActiveIndicatorsUI();
    }
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('open');
}

function switchSettingsTab(tabName) {
  // Tabs styling
  document.querySelectorAll('#settingsModal .modal-tab').forEach(btn => {
    btn.classList.remove('active');
  });
  const activeTab = document.querySelector(`#settingsModal .modal-tab[data-stab="${tabName}"]`);
  if (activeTab) activeTab.classList.add('active');

  // Tab content visibility
  document.querySelectorAll('#settingsModal .settings-tab-content').forEach(pane => {
    pane.style.display = 'none';
  });
  
  const targetPane = document.getElementById(`settings${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
  if (targetPane) targetPane.style.display = 'block';
}

function selectChartType(type) {
  // Settings card highlight
  document.querySelectorAll('#settingsChartType .chart-type-card').forEach(card => {
    card.classList.remove('active');
  });
  const activeCard = document.querySelector(`#settingsChartType .chart-type-card[data-ct="${type}"]`);
  if (activeCard) activeCard.classList.add('active');

  // Sync quick dropdown toolbar value
  document.querySelectorAll('#ctDropdown .dropdown-item').forEach(item => {
    item.classList.toggle('active', item.dataset.ct === type);
  });
  
  const span = document.querySelector('#ctDropdownBtn span');
  if (span) {
    span.textContent = type.charAt(0).toUpperCase() + type.slice(1);
  }

  setSeriesType(type);
  closeModal('settingsModal');
  emitEvent('chartTypeChanged', { type: type });
}

// Bind custom styles options inputs
runOnInit(() => {
  const colorUp = document.getElementById('colorUp');
  const colorDown = document.getElementById('colorDown');
  const colorBg = document.getElementById('colorBg');
  const colorGrid = document.getElementById('colorGrid');
  const colorText = document.getElementById('colorText');
  const colorCrosshair = document.getElementById('colorCrosshair');

  const applyColors = () => {
    ChartState.theme.upColor = colorUp.value;
    ChartState.theme.downColor = colorDown.value;
    ChartState.theme.background = colorBg.value;
    ChartState.theme.gridLineColor = colorGrid.value;
    ChartState.theme.text = colorText.value;
    ChartState.theme.crosshairColor = colorCrosshair.value;

    document.body.style.backgroundColor = colorBg.value;

    // Apply color values to charts options
    ChartState.chart.applyOptions({
      layout: {
        background: { color: colorBg.value },
        textColor: colorText.value
      },
      grid: {
        vertLines: { color: colorGrid.value },
        horzLines: { color: colorGrid.value }
      },
      crosshair: {
        vertLine: { color: colorCrosshair.value },
        horzLine: { color: colorCrosshair.value }
      }
    });

    // Re-apply series colors
    setSeriesType(ChartState.currentSeriesType);
    
    // Trigger indicators color recalculations
    IndicatorRegistry.recalculateAll();
  };

  if (colorUp) colorUp.addEventListener('change', applyColors);
  if (colorDown) colorDown.addEventListener('change', applyColors);
  if (colorBg) colorBg.addEventListener('change', applyColors);
  if (colorGrid) colorGrid.addEventListener('change', applyColors);
  if (colorText) colorText.addEventListener('change', applyColors);
  if (colorCrosshair) colorCrosshair.addEventListener('change', applyColors);
});

function toggleViewOption(option, isChecked) {
  if (option === 'ohlc') {
    ChartState.ohlcLegendVisible = isChecked;
    ohlcEl.style.display = isChecked ? 'flex' : 'none';
  } else if (option === 'volume') {
    ChartState.volumePaneVisible = isChecked;
    ChartState.volumeSeries.applyOptions({ visible: isChecked });
  } else if (option === 'lastPrice') {
    ChartState.lastPriceLineVisible = isChecked;
    ChartState.mainSeries.applyOptions({ lastValueVisible: isChecked });
  } else if (option === 'crosshairLabel') {
    ChartState.crosshairLabelVisible = isChecked;
    ChartState.chart.applyOptions({
      localization: {
        // Lightweight Charts specific parameters for price scale values visibility
      }
    });
    // Adjust scale details
    ChartState.chart.priceScale('right').applyOptions({
      borderVisible: isChecked
    });
  }
}
