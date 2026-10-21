/**
 * Ocean Climate & Currents Simulator Module
 * Interactive thermodynamic climate models, ocean acidification engine, and global current patterns.
 */

const ClimateModule = {
  activeCo2Ppm: 425,
  activeEnsoPhase: 'normal',

  init() {
    this.render();
    this.bindEvents();
    this.updateAcidificationMetrics(this.activeCo2Ppm);
  },

  render() {
    const container = document.getElementById('view-climate');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-pretitle">PLANETARY THERMODYNAMICS</div>
        <h1 class="view-title">Ocean Climate & Currents Simulation Studio</h1>
        <p class="view-description">
          The ocean is the thermal flywheel and carbon sink of planet Earth.
          Explore the Great Ocean Conveyor Belt, simulate the chemical impacts of rising atmospheric CO₂, and inspect the ENSO cycle.
        </p>
      </div>

      <!-- CO2 & Ocean Acidification Simulator Card -->
      <div class="climate-simulator-box">
        <div class="sim-header">
          <div class="sim-title-group">
            <span class="sim-badge">INTERACTIVE BIOCHEMICAL ENGINE</span>
            <h2 class="sim-title">Ocean Acidification & Carbon Absorption Model</h2>
            <p class="sim-desc">
              Adjust atmospheric CO₂ concentration to observe shifts in surface ocean pH, carbonate ion availability,
              and aragonite saturation for shell-building marine calcifiers.
            </p>
          </div>
        </div>

        <div class="sim-controls-row">
          <div class="co2-slider-box">
            <div class="slider-header-flex">
              <span class="slider-label">Atmospheric CO₂ Concentration:</span>
              <span class="co2-value-pill" id="co2PpmDisplay">425 ppm (Present Day)</span>
            </div>
            <input type="range" id="co2Slider" min="280" max="900" step="5" value="425" class="co2-range-slider">
            <div class="co2-preset-buttons">
              <button class="preset-btn" data-ppm="280">Pre-Industrial (280 ppm)</button>
              <button class="preset-btn active" data-ppm="425">Present Day (425 ppm)</button>
              <button class="preset-btn" data-ppm="550">Paris Target (550 ppm)</button>
              <button class="preset-btn" data-ppm="800">High Emission (800 ppm)</button>
            </div>
          </div>

          <!-- Dynamic Gauges Grid -->
          <div class="acidification-gauges-grid">
            <div class="gauge-card">
              <span class="gauge-icon">🧪</span>
              <span class="gauge-val" id="gaugePh">8.05</span>
              <span class="gauge-lbl">Surface Ocean pH</span>
              <span class="gauge-sub" id="gaugePhDelta">-0.11 vs Pre-Industrial</span>
            </div>

            <div class="gauge-card">
              <span class="gauge-icon">🔥</span>
              <span class="gauge-val" id="gaugeAcidity">+30%</span>
              <span class="gauge-lbl">Acidity (H⁺ Ions)</span>
              <span class="gauge-sub">Exponential increase</span>
            </div>

            <div class="gauge-card">
              <span class="gauge-icon">🐚</span>
              <span class="gauge-val" id="gaugeAragonite">2.9 Ω</span>
              <span class="gauge-lbl">Aragonite Saturation (Ω)</span>
              <span class="gauge-sub" id="gaugeAragoniteStatus">Corals Vulnerable</span>
            </div>

            <div class="gauge-card">
              <span class="gauge-icon">🌡️</span>
              <span class="gauge-val" id="gaugeHeat">380 ZJ</span>
              <span class="gauge-lbl">Ocean Heat Uptake</span>
              <span class="gauge-sub">> 90% excess planetary heat</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Major Ocean Currents Explorer -->
      <h3 class="section-subtitle" style="margin: 36px 0 16px;">Global Thermohaline Circulation & Surface Currents</h3>
      <div class="cards-grid">
        <div class="ocean-card current-card">
          <div class="card-top">
            <span class="card-num">ATLANTIC</span>
            <span class="card-icon">🌊</span>
          </div>
          <h3 class="card-title">The Gulf Stream & AMOC</h3>
          <p class="card-body">
            Transports over 100 Sv (million m³/s) of warm tropical water from the Gulf of Mexico toward Western Europe,
            yielding mild temperate climates. High salinity causes sinking near Greenland, driving the Atlantic Meridional Overturning Circulation.
          </p>
          <div class="card-footer">
            <span class="card-meta">Velocity: ~2.5 m/s • Volume: 100x all rivers</span>
          </div>
        </div>

        <div class="ocean-card current-card">
          <div class="card-top">
            <span class="card-num">SOUTHERN OCEAN</span>
            <span class="card-icon">❄️</span>
          </div>
          <h3 class="card-title">Antarctic Circumpolar Current (ACC)</h3>
          <p class="card-body">
            The only global ocean current that circles the entire planet unimpeded by landmasses. Transports 135 to 150 million m³/s
            of water eastward around Antarctica, thermally isolating the Antarctic ice sheets.
          </p>
          <div class="card-footer">
            <span class="card-meta">Length: 21,000 km • Largest current on Earth</span>
          </div>
        </div>

        <div class="ocean-card current-card">
          <div class="card-top">
            <span class="card-num">SOUTH PACIFIC</span>
            <span class="card-icon">🐟</span>
          </div>
          <h3 class="card-title">Humboldt (Peru) Upwelling Current</h3>
          <p class="card-body">
            A cold, nutrient-rich eastern boundary current running north along Chile and Peru. Ekman transport drives massive upwelling
            of nitrates and phosphates, powering the world\'s most productive single-species anchoveta fishery (up to 20% of global fish catch).
          </p>
          <div class="card-footer">
            <span class="card-meta">Biome: Eastern Boundary Upwelling System</span>
          </div>
        </div>

        <div class="ocean-card current-card">
          <div class="card-top">
            <span class="card-num">NORTH PACIFIC</span>
            <span class="card-icon">🌀</span>
          </div>
          <h3 class="card-title">Kuroshio Current</h3>
          <p class="card-body">
            The Pacific counterpart to the Gulf Stream, carrying warm equatorial water past Taiwan and Japan into the North Pacific.
            Moderates Japanese coastal climates and sustains diverse northern coral reefs.
          </p>
          <div class="card-footer">
            <span class="card-meta">Flow: ~50 Sv • Powers North Pacific Drift</span>
          </div>
        </div>
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('view-climate');
    if (!container) return;

    const slider = container.querySelector('#co2Slider');
    if (slider) {
      slider.addEventListener('input', (e) => {
        const ppm = parseInt(e.target.value, 10);
        this.updateAcidificationMetrics(ppm);
      });
    }

    const presetBtns = container.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const ppm = parseInt(btn.dataset.ppm, 10);
        if (slider) slider.value = ppm;
        this.updateAcidificationMetrics(ppm);
      });
    });
  },

  updateAcidificationMetrics(ppm) {
    this.activeCo2Ppm = ppm;

    // Thermodynamic pH formula based on dissolved carbonic acid equilibrium
    // Pre-industrial baseline: 280 ppm = pH 8.20
    const deltaPpm = ppm - 280;
    const ph = (8.20 - (deltaPpm / 620) * 0.42).toFixed(2);
    const phDelta = (ph - 8.20).toFixed(2);

    // Hydrogen ion concentration increases exponentially: 10^(8.20 - pH) - 1
    const acidityIncrease = Math.round((Math.pow(10, 8.20 - parseFloat(ph)) - 1) * 100);

    // Aragonite saturation (Ω_arag): 4.1 in pre-industrial down to 1.5 in high emissions
    const omega = Math.max(0.8, (4.1 - (deltaPpm / 600) * 2.6)).toFixed(1);

    // Ocean heat content in Zettajoules (ZJ)
    const heatZJ = Math.round(150 + (ppm - 280) * 1.4);

    const display = document.getElementById('co2PpmDisplay');
    const gaugePh = document.getElementById('gaugePh');
    const gaugePhDelta = document.getElementById('gaugePhDelta');
    const gaugeAcidity = document.getElementById('gaugeAcidity');
    const gaugeAragonite = document.getElementById('gaugeAragonite');
    const gaugeAragoniteStatus = document.getElementById('gaugeAragoniteStatus');
    const gaugeHeat = document.getElementById('gaugeHeat');

    if (display) {
      let desc = '';
      if (ppm < 300) desc = 'Pre-Industrial Level';
      else if (ppm <= 430) desc = 'Present Day Level';
      else if (ppm <= 560) desc = 'Paris 2°C Limit';
      else desc = 'Dangerous High Emissions';
      display.textContent = `${ppm} ppm (${desc})`;
    }

    if (gaugePh) gaugePh.textContent = ph;
    if (gaugePhDelta) gaugePhDelta.textContent = `${phDelta >= 0 ? '+' : ''}${phDelta} vs 1850 Baseline`;
    if (gaugeAcidity) gaugeAcidity.textContent = `+${acidityIncrease}%`;
    if (gaugeAragonite) gaugeAragonite.textContent = `${omega} Ω`;
    if (gaugeAragoniteStatus) {
      if (omega > 3.5) gaugeAragoniteStatus.textContent = 'Healthy Calcification';
      else if (omega >= 2.5) gaugeAragoniteStatus.textContent = 'Stress / Coral Bleaching';
      else if (omega >= 1.0) gaugeAragoniteStatus.textContent = 'Shell Dissolution Threat';
      else gaugeAragoniteStatus.textContent = 'Corrosive Water (Shells Dissolve)';
    }
    if (gaugeHeat) gaugeHeat.textContent = `${heatZJ} ZJ`;
  }
};
