/**
 * Depth Module - Ocean Depth Zones & Bathyscaphe Dive Simulator
 * Interactive submarine descent through Earth's water column from surface to 11,000 meters.
 */

const DepthModule = {
  currentDepth: 50, // in meters

  init() {
    this.render();
    this.bindEvents();
    this.updateTelemetry(this.currentDepth);
  },

  render() {
    const container = document.getElementById('view-depth');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-pretitle">BATHYMETRIC STRATIFICATION</div>
        <h1 class="view-title">Ocean Depth Zones & Submersible Simulator</h1>
        <p class="view-description">
          Descent from the sunlit surface to the bottom of the Mariana Trench.
          Observe how sunlight diminishes, hydrostatic pressure skyrockets, and life adapts to the crushing abyss.
        </p>
      </div>

      <!-- Bathyscaphe Cockpit Display -->
      <div class="submersible-dashboard">
        <div class="dashboard-screen" id="depthViewport">
          <div class="telemetry-hud">
            <div class="hud-item">
              <span class="hud-label">DEPTH</span>
              <span class="hud-val" id="hudDepth">50 m</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">PRESSURE</span>
              <span class="hud-val" id="hudPressure">6.0 ATM</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">TEMPERATURE</span>
              <span class="hud-val" id="hudTemp">22.4 °C</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">LIGHT LEVEL</span>
              <span class="hud-val" id="hudLight">92% (Sunlit)</span>
            </div>
            <div class="hud-item">
              <span class="hud-label">CURRENT STRATUM</span>
              <span class="hud-val highlight" id="hudZoneName">Epipelagic Zone</span>
            </div>
          </div>

          <div class="sub-depth-control-panel">
            <div class="slider-wrapper">
              <div class="slider-labels">
                <span>Surface (0m)</span>
                <span>Twilight (200m)</span>
                <span>Midnight (1km)</span>
                <span>Abyss (4km)</span>
                <span>Challenger Deep (11km)</span>
              </div>
              <input type="range" id="depthSlider" min="0" max="11000" step="25" value="50" class="depth-range-slider">
            </div>

            <div class="quick-depth-buttons">
              <button class="depth-btn active" data-depth="50">☀️ Sunlit (50m)</button>
              <button class="depth-btn" data-depth="500">🌓 Twilight (500m)</button>
              <button class="depth-btn" data-depth="2500">🌌 Midnight (2,500m)</button>
              <button class="depth-btn" data-depth="5000">🪐 The Abyss (5,000m)</button>
              <button class="depth-btn" data-depth="10928">⚡ Mariana Trench (10,928m)</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Zone Detailed Card Container -->
      <div id="activeZoneCardContainer" class="active-zone-detail-card">
        <!-- Rendered by updateTelemetry -->
      </div>

      <!-- All Depth Strata Overview Grid -->
      <h3 class="section-subtitle" style="margin: 36px 0 16px;">All Bathymetric Strata Overview</h3>
      <div class="cards-grid">
        ${window.OCEAN_DEPTH_ZONES.map(z => `
          <div class="ocean-card depth-zone-card" data-zone-id="${z.id}">
            <div class="card-top">
              <span class="card-num">${z.range}</span>
              <span class="card-icon">${z.icon}</span>
            </div>
            <h3 class="card-title">${z.name}</h3>
            <p class="card-body">${z.summary}</p>
            <div class="card-footer">
              <span class="card-meta">Pressure: ${z.pressureRange}</span>
              <button class="btn-card-action" onclick="DepthModule.jumpToDepth(${(z.minDepth + z.maxDepth) / 2})">
                <span>Dive</span>
                <span>↓</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('view-depth');
    if (!container) return;

    const slider = container.querySelector('#depthSlider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const depth = parseInt(e.target.value, 10);
        this.updateTelemetry(depth);
      });
    }

    const quickBtns = container.querySelectorAll('.depth-btn');
    quickBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        quickBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const depth = parseInt(btn.dataset.depth, 10);
        if (slider) slider.value = depth;
        this.updateTelemetry(depth);
      });
    });
  },

  jumpToDepth(meters) {
    const slider = document.getElementById('depthSlider');
    if (slider) slider.value = meters;
    this.updateTelemetry(meters);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  },

  getZoneForDepth(meters) {
    if (meters < 200) return window.OCEAN_DEPTH_ZONES[0];
    if (meters < 1000) return window.OCEAN_DEPTH_ZONES[1];
    if (meters < 4000) return window.OCEAN_DEPTH_ZONES[2];
    if (meters < 6000) return window.OCEAN_DEPTH_ZONES[3];
    return window.OCEAN_DEPTH_ZONES[4];
  },

  updateTelemetry(depth) {
    this.currentDepth = depth;
    const zone = this.getZoneForDepth(depth);

    // Hydrostatic pressure: 1 ATM at surface + 1 ATM per 10 meters of seawater
    const pressureAtm = (1 + (depth / 10)).toFixed(1);
    const pressurePsi = (pressureAtm * 14.696).toFixed(0);

    // Temperature approximation based on depth
    let tempC;
    if (depth < 200) {
      tempC = (28 - (depth / 200) * 12).toFixed(1);
    } else if (depth < 1000) {
      tempC = (16 - ((depth - 200) / 800) * 11).toFixed(1);
    } else {
      tempC = (4 - Math.min(2.5, ((depth - 1000) / 10000) * 2.5)).toFixed(1);
    }

    // Light level
    let lightStr;
    if (depth <= 50) lightStr = `${Math.round(100 - (depth / 50) * 40)}% (Bright Sunlight)`;
    else if (depth < 200) lightStr = `${Math.round(60 - ((depth - 50) / 150) * 59)}% (Photosynthetic Limit)`;
    else if (depth < 1000) lightStr = `< 1% (Twilight Gloom)`;
    else lightStr = '0% (Total Darkness / Bioluminescent)';

    // Update HUD elements
    const hudDepth = document.getElementById('hudDepth');
    const hudPressure = document.getElementById('hudPressure');
    const hudTemp = document.getElementById('hudTemp');
    const hudLight = document.getElementById('hudLight');
    const hudZoneName = document.getElementById('hudZoneName');

    if (hudDepth) hudDepth.textContent = `${depth.toLocaleString()} m (${(depth * 3.28084).toFixed(0).toLocaleString()} ft)`;
    if (hudPressure) hudPressure.textContent = `${pressureAtm} ATM (${parseInt(pressurePsi).toLocaleString()} psi)`;
    if (hudTemp) hudTemp.textContent = `${tempC} °C`;
    if (hudLight) hudLight.textContent = lightStr;
    if (hudZoneName) hudZoneName.textContent = zone.name;

    // Update viewport background shading
    const viewport = document.getElementById('depthViewport');
    if (viewport) {
      const darkness = Math.min(0.96, (depth / 3500) * 0.95);
      viewport.style.background = `linear-gradient(180deg, rgba(4, 13, 33, ${0.4 + darkness * 0.5}) 0%, rgba(2, 6, 16, ${0.6 + darkness * 0.4}) 100%)`;
    }

    // Render active zone card
    const cardContainer = document.getElementById('activeZoneCardContainer');
    if (cardContainer) {
      cardContainer.innerHTML = `
        <div class="zone-focus-card">
          <div class="zone-focus-header">
            <span class="zone-focus-icon">${zone.icon}</span>
            <div>
              <h2 class="zone-focus-title">${zone.name}</h2>
              <span class="zone-focus-subtitle">Depth Range: ${zone.range} • Pressure: ${zone.pressureRange}</span>
            </div>
          </div>
          <p class="zone-focus-summary">${zone.summary}</p>
          
          <div class="zone-features-list">
            <h4 class="mini-header">Physical & Ecological Characteristics:</h4>
            <ul>
              ${zone.features.map(f => `<li>${f}</li>`).join('')}
            </ul>
          </div>

          <div class="zone-species-pills">
            <span class="mini-header" style="margin-right: 8px;">Key Organisms:</span>
            ${zone.residentSpecies.map(s => `<span class="species-chip">🐟 ${s}</span>`).join('')}
          </div>

          <div class="zone-fact-box">
            <strong>Marine Science Insight:</strong> ${zone.scientificFact}
          </div>
        </div>
      `;
    }
  }
};
