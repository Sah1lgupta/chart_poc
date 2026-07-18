// manage-indicators.js — UI interactions for the indicators modal and parameters configuration.

let selectedIndInstanceIdForEdit = null;

function filterIndCategory(cat) {
  document.querySelectorAll('#indTabs .ind-tab').forEach(b => b.classList.remove('active'));
  const activeTab = document.querySelector(`#indTabs [data-cat="${cat}"]`);
  if (activeTab) activeTab.classList.add('active');
  renderIndicatorList(cat, document.getElementById('indSearch').value);
}

function filterIndicators() {
  const query = document.getElementById('indSearch').value;
  const activeCatTab = document.querySelector('#indTabs .ind-tab.active');
  const cat = activeCatTab ? activeCatTab.dataset.cat : 'all';
  renderIndicatorList(cat, query);
}

function renderIndicatorList(categoryFilter = 'all', queryFilter = '') {
  const listEl = document.getElementById('indList');
  listEl.innerHTML = '';

  Object.entries(IndicatorRegistry.registry).forEach(([indicatorId, meta]) => {
    const matchesCategory = categoryFilter === 'all' || meta.category === categoryFilter;
    const matchesSearch = meta.displayName.toLowerCase().includes(queryFilter.toLowerCase());

    if (matchesCategory && matchesSearch) {
      const isFav = ChartState.favoriteIndicators.includes(indicatorId);
      const row = document.createElement('div');
      row.className = 'ind-item';
      row.innerHTML = `
        <button class="ind-fav-btn ${isFav ? 'active' : ''}" onclick="toggleIndicatorFav(event, '${indicatorId}')">${isFav ? '★' : '☆'}</button>
        <span class="ind-name">${meta.displayName}</span>
        <span class="ind-cat">${meta.category === 'main' ? 'Main' : 'Sub'}</span>
        <button class="ind-add-btn" onclick="IndicatorRegistry.addIndicator('${indicatorId}')">+</button>
      `;
      listEl.appendChild(row);
    }
  });
}

function toggleIndicatorFav(e, indicatorId) {
  e.stopPropagation();
  const idx = ChartState.favoriteIndicators.indexOf(indicatorId);
  if (idx === -1) {
    ChartState.favoriteIndicators.push(indicatorId);
  } else {
    ChartState.favoriteIndicators.splice(idx, 1);
  }
  
  // Re-render
  filterIndicators();
}

function updateActiveIndicatorsUI() {
  const activeListEl = document.getElementById('indActiveList');
  activeListEl.innerHTML = '';

  if (IndicatorRegistry.activeInstances.length === 0) {
    activeListEl.innerHTML = '<div style="color:#636980;font-size:12px;padding:8px 0">No indicators added yet</div>';
    return;
  }

  IndicatorRegistry.activeInstances.forEach(instance => {
    const row = document.createElement('div');
    row.className = 'ind-active-item';
    
    // Format parameters display string e.g. "SMA (9)"
    const paramStr = Object.values(instance.params).join(', ');
    const displayName = paramStr ? `${instance.displayName} (${paramStr})` : instance.displayName;

    row.innerHTML = `
      <span style="color: ${instance.color}; font-weight: 500">${displayName}</span>
      <div>
        <button class="ind-edit" onclick="openIndicatorSettings('${instance.id}')">⚙</button>
        <button class="ind-remove" onclick="IndicatorRegistry.removeIndicator('${instance.id}')">✕</button>
      </div>
    `;
    activeListEl.appendChild(row);
  });
}

// Indicator inline settings panel
function openIndicatorSettings(instanceId) {
  const instance = IndicatorRegistry.activeInstances.find(inst => inst.id === instanceId);
  if (!instance) return;

  selectedIndInstanceIdForEdit = instanceId;

  // Create or retrieve settings element
  let settingsBox = document.getElementById('indSettingsPopup');
  if (!settingsBox) {
    settingsBox = document.createElement('div');
    settingsBox.id = 'indSettingsPopup';
    settingsBox.className = 'ind-settings-popup';
    document.body.appendChild(settingsBox);
  }

  settingsBox.innerHTML = `
    <div style="font-size: 13px; font-weight: 600; margin-bottom: 12px; display: flex; justify-content: space-between;">
      <span>${instance.displayName} Parameters</span>
      <button onclick="closeIndicatorSettings()" style="background:none; border:none; color:#636980; cursor:pointer">✕</button>
    </div>
    <div id="indSettingsParamsList"></div>
    <div class="ind-param-row" style="margin-top: 12px;">
      <label>Line color</label>
      <input type="color" id="editIndColor" class="color-swatch" value="${instance.color}">
    </div>
    <button onclick="saveIndicatorSettings()" style="width: 100%; margin-top: 14px; background: #2962ff; color:#fff; border:none; padding:6px; border-radius:4px; cursor:pointer; font-size:12px">Apply</button>
  `;

  const paramsListEl = document.getElementById('indSettingsParamsList');
  Object.entries(instance.params).forEach(([key, val]) => {
    const row = document.createElement('div');
    row.className = 'ind-param-row';
    row.innerHTML = `
      <label>${key}</label>
      <input type="number" class="ind-param-input" data-param-key="${key}" value="${val}">
    `;
    paramsListEl.appendChild(row);
  });

  // Position settings modal box centered
  settingsBox.classList.add('open');
  settingsBox.style.top = '50%';
  settingsBox.style.left = '50%';
  settingsBox.style.transform = 'translate(-50%, -50%)';
}

function closeIndicatorSettings() {
  const settingsBox = document.getElementById('indSettingsPopup');
  if (settingsBox) {
    settingsBox.classList.remove('open');
  }
  selectedIndInstanceIdForEdit = null;
}

function saveIndicatorSettings() {
  if (!selectedIndInstanceIdForEdit) return;

  const instance = IndicatorRegistry.activeInstances.find(inst => inst.id === selectedIndInstanceIdForEdit);
  if (!instance) return;

  const updatedParams = {};
  document.querySelectorAll('#indSettingsParamsList .ind-param-input').forEach(input => {
    const key = input.dataset.paramKey;
    updatedParams[key] = parseFloat(input.value);
  });

  const updatedColor = document.getElementById('editIndColor').value;

  IndicatorRegistry.updateIndicator(selectedIndInstanceIdForEdit, updatedParams, updatedColor);
  updateActiveIndicatorsUI();
  closeIndicatorSettings();
}
