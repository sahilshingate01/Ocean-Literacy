/**
 * Ocean Conservation Tracker & Action Hub Module
 * Global 30x30 biodiversity tracker, threat monitoring, and personal steward pledge.
 */

const ConservationModule = {
  pledges: [
    { id: 'p1', title: 'Eliminate Single-Use Plastics', desc: 'Transition to reusable alternatives and prevent microplastics from reaching waterways.', checked: true },
    { id: 'p2', title: 'Choose Certified Sustainable Seafood', desc: 'Consult Monterey Bay Aquarium Seafood Watch or MSC/ASC certifications before purchasing.', checked: false },
    { id: 'p3', title: 'Support Marine Protected Areas (MPAs)', desc: 'Advocate for 30x30 fully protected sanctuaries and the ratification of the High Seas BBNJ Treaty.', checked: true },
    { id: 'p4', title: 'Conserve Blue Carbon Habitats', desc: 'Back coastal wetland, mangrove, and kelp reforestation initiatives.', checked: false },
    { id: 'p5', title: 'Spread Ocean Literacy in your Community', desc: 'Educate peers and classrooms about the 7 essential principles and marine preservation.', checked: true }
  ],

  init() {
    this.loadPledges();
    this.render();
    this.bindEvents();
  },

  async loadPledges() {
    if (window.oceanAPI && window.oceanAPI.loadUserData) {
      try {
        const data = await window.oceanAPI.loadUserData();
        if (data && data.pledges) {
          this.pledges = data.pledges;
        }
      } catch (err) {
        console.warn('Could not load user pledges from storage:', err);
      }
    }
  },

  async savePledges() {
    if (window.oceanAPI && window.oceanAPI.saveUserData) {
      try {
        const data = (await window.oceanAPI.loadUserData()) || {};
        data.pledges = this.pledges;
        await window.oceanAPI.saveUserData(data);
      } catch (err) {
        console.warn('Could not save user pledges:', err);
      }
    }
  },

  render() {
    const container = document.getElementById('view-conservation');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-pretitle">GLOBAL ACTION & RESTORATION</div>
        <h1 class="view-title">Ocean Conservation & Threat Monitor</h1>
        <p class="view-description">
          The ocean faces unprecedented anthropogenic stressors.
          Monitor real-time global protection benchmarks (30x30 target), review core environmental pressures, and commit to stewardship.
        </p>
      </div>

      <!-- 30x30 Global Target Gauge -->
      <div class="target-card-wrapper">
        <div class="target-card">
          <div class="target-card-info">
            <span class="target-badge">GLOBAL BIODIVERSITY FRAMEWORK</span>
            <h2 class="target-title">30x30 Target: Protecting 30% of Global Oceans by 2030</h2>
            <p class="target-desc">
              Adopted at COP15, the 30x30 initiative is the world's pledge to safeguard 30% of coastal and high-seas marine territory in effective Marine Protected Areas (MPAs).
            </p>
            <div class="target-progress-stats">
              <div class="stat-group">
                <span class="stat-number">8.3%</span>
                <span class="stat-name">Current Global Marine Protection</span>
              </div>
              <div class="stat-group">
                <span class="stat-number">2.9%</span>
                <span class="stat-name">Highly / Fully Protected (No-Take)</span>
              </div>
              <div class="stat-group">
                <span class="stat-number highlight">21.7%</span>
                <span class="stat-name">Protection Gap to Achieve by 2030</span>
              </div>
            </div>
          </div>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" style="width: 27.6%;">
              <span class="progress-marker">Current (8.3% of 30%)</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Core Marine Threats Grid -->
      <h3 class="section-subtitle" style="margin: 36px 0 16px;">Critical Oceanic Anthropogenic Stressors</h3>
      <div class="cards-grid">
        <div class="ocean-card threat-card">
          <div class="card-top">
            <span class="card-num status-cr">THREAT 01</span>
            <span class="card-icon">🚯</span>
          </div>
          <h3 class="card-title">Marine Plastic Pollution & Gyres</h3>
          <p class="card-body">
            Over 11 million metric tons of plastic waste leak into oceans annually. Photodegradation fragments plastics into toxic microplastics
            and nanoplastics that bioaccumulate across the food chain, reaching commercial seafood and human tissues.
          </p>
          <div class="card-footer">
            <span class="card-meta">Great Pacific Garbage Patch: 1.6 Million km²</span>
          </div>
        </div>

        <div class="ocean-card threat-card">
          <div class="card-top">
            <span class="card-num status-en">THREAT 02</span>
            <span class="card-icon">🎣</span>
          </div>
          <h3 class="card-title">Overfishing & Destructive Bottom Trawling</h3>
          <p class="card-body">
            35% of assessed commercial fish stocks are harvested beyond sustainable biological limits. Heavy weighted bottom trawl nets
            bulldoze millennia-old cold-water coral and sponge habitats on continental margins, releasing stored benthic carbon.
          </p>
          <div class="card-footer">
            <span class="card-meta">Bycatch: Millions of marine animals discarded</span>
          </div>
        </div>

        <div class="ocean-card threat-card">
          <div class="card-top">
            <span class="card-num status-vu">THREAT 03</span>
            <span class="card-icon">🌡️</span>
          </div>
          <h3 class="card-title">Marine Heatwaves & Coral Bleaching</h3>
          <p class="card-body">
            Prolonged sea surface thermal anomalies cause coral polyps to expel their vital zooxanthellae endosymbionts, causing rapid bleaching.
            Over 50% of the world's shallow-water coral reefs have been degraded over the last three decades.
          </p>
          <div class="card-footer">
            <span class="card-meta">Reefs support > 25% of all marine life</span>
          </div>
        </div>
      </div>

      <!-- Blue Carbon & Restoration Solutions -->
      <h3 class="section-subtitle" style="margin: 36px 0 16px;">High-Impact Regenerative Solutions</h3>
      <div class="cards-grid">
        <div class="ocean-card solution-card">
          <div class="card-top">
            <span class="card-num status-lc">BLUE CARBON</span>
            <span class="card-icon">🌿</span>
          </div>
          <h3 class="card-title">Mangrove & Seagrass Reforestation</h3>
          <p class="card-body">
            Coastal blue carbon ecosystems sequester carbon at rates up to 10 times higher per hectare than mature tropical terrestrial rainforests,
            trapping organic matter in oxygen-depleted marine soils for millennia.
          </p>
        </div>

        <div class="ocean-card solution-card">
          <div class="card-top">
            <span class="card-num status-lc">TREATY</span>
            <span class="card-icon">📜</span>
          </div>
          <h3 class="card-title">UN High Seas BBNJ Treaty</h3>
          <p class="card-body">
            The historic 2023 agreement enables the legal creation of Marine Protected Areas in international waters beyond national jurisdictions,
            closing a legal vacuum that previously left two-thirds of the planet's oceans vulnerable to unregulated exploitation.
          </p>
        </div>
      </div>

      <!-- Interactive Ocean Steward Pledge Hub -->
      <div class="pledge-container" style="margin-top: 36px;">
        <h3 class="section-subtitle">Your Ocean Steward Action Commitment</h3>
        <p class="view-description" style="margin-bottom: 16px;">
          Select your personal actions. Your commitments are recorded locally to track your path toward certified ocean stewardship.
        </p>

        <div class="pledge-list" id="pledgeListContainer">
          ${this.pledges.map(p => `
            <label class="pledge-item ${p.checked ? 'active' : ''}">
              <input type="checkbox" data-id="${p.id}" ${p.checked ? 'checked' : ''}>
              <div class="pledge-text">
                <span class="pledge-title">${p.title}</span>
                <span class="pledge-desc">${p.desc}</span>
              </div>
            </label>
          `).join('')}
        </div>
      </div>
    `;
  },

  bindEvents() {
    const container = document.getElementById('view-conservation');
    if (!container) return;

    container.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"][data-id]')) {
        const id = e.target.dataset.id;
        const checked = e.target.checked;
        const pledge = this.pledges.find(p => p.id === id);
        if (pledge) {
          pledge.checked = checked;
          const label = e.target.closest('.pledge-item');
          if (label) label.classList.toggle('active', checked);
          this.savePledges();
        }
      }
    });
  }
};
