/**
 * Marine Life Encyclopedia Module
 * Taxonomic, physiological, and ecological specimen explorer.
 */

const MarineModule = {
  activeFilter: 'all',

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const container = document.getElementById('view-marine');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-pretitle">BIODIVERSITY & TAXONOMY</div>
        <h1 class="view-title">Marine Life Encyclopedia & Specimen Studio</h1>
        <p class="view-description">
          From the microscopic primary producers powering our atmosphere to the titan blue whale and alien abyssal fauna,
          explore physiological adaptations across marine phyla and conservation threat statuses.
        </p>
      </div>

      <div class="filter-bar" id="marineFilterBar">
        <button class="filter-chip active" data-filter="all">All Specimens (${window.MARINE_SPECIES.length})</button>
        <button class="filter-chip" data-filter="threatened">Threatened (CR / EN / VU)</button>
        <button class="filter-chip" data-filter="deep">Deep Abyss & Twilight</button>
        <button class="filter-chip" data-filter="pelagic">Open Pelagic Giants</button>
        <button class="filter-chip" data-filter="reef">Coral & Coastal</button>
      </div>

      <div class="cards-grid" id="marineCardsGrid">
        ${this.renderCards(window.MARINE_SPECIES)}
      </div>
    `;
  },

  renderCards(speciesList) {
    return speciesList.map(s => {
      let badgeClass = 'status-lc';
      if (s.iucnCode === 'CR') badgeClass = 'status-cr';
      else if (s.iucnCode === 'EN') badgeClass = 'status-en';
      else if (s.iucnCode === 'VU') badgeClass = 'status-vu';

      return `
        <div class="ocean-card marine-card" data-species-id="${s.id}" tabindex="0" role="button">
          <div class="card-top">
            <span class="card-num ${badgeClass}">${s.iucnCode} • ${s.iucnStatus}</span>
            <span class="card-icon">${s.icon}</span>
          </div>
          <h3 class="card-title">${s.commonName}</h3>
          <p class="card-subtitle-sci"><em>${s.scientificName}</em></p>
          <p class="card-body">${s.adaptations.substring(0, 130)}...</p>
          <div class="marine-spec-meta">
            <span class="mini-tag">🌊 ${s.depthZone}</span>
            <span class="mini-tag">📏 ${s.size.split(',')[0]}</span>
          </div>
          <div class="card-footer">
            <span class="card-meta">${s.phylum}</span>
            <button class="btn-card-action">
              <span>Specimen Dossier</span>
              <span>→</span>
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  bindEvents() {
    const container = document.getElementById('view-marine');
    if (!container) return;

    const filterBar = container.querySelector('#marineFilterBar');
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        this.applyFilter(chip.dataset.filter);
      });
    }

    container.addEventListener('click', (e) => {
      const card = e.target.closest('.marine-card');
      if (card) {
        const id = card.dataset.speciesId;
        this.openSpecimenDetail(id);
      }
    });
  },

  applyFilter(filter) {
    let list = window.MARINE_SPECIES;
    if (filter === 'threatened') {
      list = window.MARINE_SPECIES.filter(s => ['CR', 'EN', 'VU'].includes(s.iucnCode));
    } else if (filter === 'deep') {
      list = window.MARINE_SPECIES.filter(s => s.depthZone.includes('Meso') || s.depthZone.includes('Bathy') || s.depthZone.includes('Abyss'));
    } else if (filter === 'pelagic') {
      list = window.MARINE_SPECIES.filter(s => s.habitat.includes('Pelagic') || s.habitat.includes('Worldwide'));
    } else if (filter === 'reef') {
      list = window.MARINE_SPECIES.filter(s => s.habitat.includes('Reef') || s.habitat.includes('Coastal'));
    }

    const grid = document.getElementById('marineCardsGrid');
    if (grid) {
      grid.innerHTML = this.renderCards(list);
    }
  },

  openSpecimenDetail(id) {
    const s = window.MARINE_SPECIES.find(item => item.id === id);
    if (!s) return;

    const drawer = document.getElementById('detailDrawer');
    const drawerTag = document.getElementById('drawerTag');
    const drawerBody = document.getElementById('drawerBody');

    drawerTag.textContent = `SPECIMEN DOSSIER — ${s.phylum.toUpperCase()}`;
    drawerBody.innerHTML = `
      <div class="drawer-hero">
        <span class="drawer-hero-icon">${s.icon}</span>
        <h2 class="drawer-hero-title">${s.commonName}</h2>
        <p class="drawer-hero-tagline"><em>${s.scientificName}</em></p>
      </div>

      <div class="specimen-status-bar">
        <div class="status-badge-lg ${s.iucnCode.toLowerCase()}">
          IUCN Red List: ${s.iucnStatus} (${s.iucnCode})
        </div>
        <div class="specimen-depth-badge">
          Depth: ${s.depthZone}
        </div>
      </div>

      <div class="drawer-section">
        <h4 class="drawer-section-title">Physical Characteristics & Habitat</h4>
        <div class="specimen-traits-grid">
          <div class="trait-box">
            <span class="trait-lbl">Dimensions</span>
            <span class="trait-val">${s.size}</span>
          </div>
          <div class="trait-box">
            <span class="trait-lbl">Primary Diet</span>
            <span class="trait-val">${s.diet}</span>
          </div>
          <div class="trait-box" style="grid-column: span 2;">
            <span class="trait-lbl">Biogeographic Habitat</span>
            <span class="trait-val">${s.habitat}</span>
          </div>
        </div>
      </div>

      <div class="drawer-section">
        <h4 class="drawer-section-title">Evolutionary Adaptations</h4>
        <p class="drawer-prose">${s.adaptations}</p>
      </div>

      <div class="drawer-section">
        <div class="case-study-card">
          <div class="case-study-badge">ECOLOGICAL ROLE IN FOOD WEB</div>
          <p class="case-study-desc" style="margin-top: 8px;">${s.ecologicalRole}</p>
        </div>
      </div>
    `;

    drawer.hidden = false;
  }
};
