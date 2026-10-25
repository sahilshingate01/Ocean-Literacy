/**
 * Principles Module
 * Handles rendering, filtering, and deep-dive interactions for the 7 Ocean Literacy Principles.
 */

const PrinciplesModule = {
  activeCategory: 'all',

  init() {
    this.render();
    this.bindEvents();
  },

  render() {
    const container = document.getElementById('view-principles');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-pretitle">UNESCO IOC FRAMEWORK</div>
        <h1 class="view-title">The 7 Essential Principles of Ocean Literacy</h1>
        <p class="view-description">
          Ocean literacy is an understanding of the ocean's influence on you and your influence on the ocean.
          Explore the seven scientific cornerstones defining our blue planet.
        </p>
      </div>

      <div class="filter-bar" id="principlesFilterBar">
        <button class="filter-chip active" data-category="all">All Principles (7)</button>
        <button class="filter-chip" data-category="physical">Physical Ocean (1, 2)</button>
        <button class="filter-chip" data-category="climate">Climate & Weather (3)</button>
        <button class="filter-chip" data-category="life">Origins & Diversity (4, 5)</button>
        <button class="filter-chip" data-category="human">Society & Frontiers (6, 7)</button>
      </div>

      <div class="cards-grid" id="principlesCardsGrid">
        ${this.renderCards(window.OCEAN_PRINCIPLES)}
      </div>
    `;
  },

  renderCards(principles) {
    return principles.map(p => `
      <div class="ocean-card principle-card" data-id="${p.id}" tabindex="0" role="button" aria-label="Open Principle ${p.number}">
        <div class="card-top">
          <span class="card-num">PRINCIPLE 0${p.number}</span>
          <span class="card-icon">${p.icon}</span>
        </div>
        <h3 class="card-title">${p.title}</h3>
        <p class="card-body">${p.shortDesc}</p>
        <div class="principle-metrics-pills">
          ${p.metrics.slice(0, 2).map(m => `
            <span class="mini-pill"><strong>${m.label}:</strong> ${m.value}</span>
          `).join('')}
        </div>
        <div class="card-footer">
          <span class="card-meta">${p.tagline}</span>
          <button class="btn-card-action">
            <span>Explore</span>
            <span>→</span>
          </button>
        </div>
      </div>
    `).join('');
  },

  bindEvents() {
    const container = document.getElementById('view-principles');
    if (!container) return;

    // Filter chip clicks
    const filterBar = container.querySelector('#principlesFilterBar');
    if (filterBar) {
      filterBar.addEventListener('click', (e) => {
        const chip = e.target.closest('.filter-chip');
        if (!chip) return;

        filterBar.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        const cat = chip.dataset.category;
        this.filterPrinciples(cat);
      });
    }

    // Card click opens drawer
    container.addEventListener('click', (e) => {
      const card = e.target.closest('.principle-card');
      if (card) {
        const id = card.dataset.id;
        this.openPrincipleDetail(id);
      }
    });
  },

  filterPrinciples(category) {
    let filtered = window.OCEAN_PRINCIPLES;
    if (category === 'physical') {
      filtered = window.OCEAN_PRINCIPLES.filter(p => p.number === 1 || p.number === 2);
    } else if (category === 'climate') {
      filtered = window.OCEAN_PRINCIPLES.filter(p => p.number === 3);
    } else if (category === 'life') {
      filtered = window.OCEAN_PRINCIPLES.filter(p => p.number === 4 || p.number === 5);
    } else if (category === 'human') {
      filtered = window.OCEAN_PRINCIPLES.filter(p => p.number === 6 || p.number === 7);
    }

    const grid = document.getElementById('principlesCardsGrid');
    if (grid) {
      grid.style.opacity = '0.3';
      grid.style.transform = 'translateY(6px)';
      grid.style.transition = 'opacity 160ms ease, transform 160ms ease';
      setTimeout(() => {
        grid.innerHTML = this.renderCards(filtered);
        grid.style.opacity = '1';
        grid.style.transform = 'translateY(0)';
      }, 140);
    }
  },

  openPrincipleDetail(principleId) {
    const p = window.OCEAN_PRINCIPLES.find(item => item.id === principleId);
    if (!p) return;

    const drawer = document.getElementById('detailDrawer');
    const drawerTag = document.getElementById('drawerTag');
    const drawerBody = document.getElementById('drawerBody');

    drawerTag.textContent = `PRINCIPLE 0${p.number} — UNESCO CURRICULUM`;
    drawerBody.innerHTML = `
      <div class="drawer-hero">
        <span class="drawer-hero-icon">${p.icon}</span>
        <h2 class="drawer-hero-title">${p.title}</h2>
        <p class="drawer-hero-tagline">${p.tagline}</p>
      </div>

      <div class="drawer-section">
        <h4 class="drawer-section-title">Core Scientific Overview</h4>
        <p class="drawer-prose">${p.fullDesc}</p>
      </div>

      <div class="drawer-metrics-grid">
        ${p.metrics.map(m => `
          <div class="drawer-metric-box">
            <span class="metric-val">${m.value}</span>
            <span class="metric-lbl">${m.label}</span>
          </div>
        `).join('')}
      </div>

      <div class="drawer-section">
        <h4 class="drawer-section-title">Fundamental Concepts & Tenets</h4>
        <div class="concepts-list">
          ${p.concepts.map(c => `
            <div class="concept-item">
              <span class="concept-code">${c.code}</span>
              <div class="concept-content">
                <strong>${c.title}</strong>
                <p>${c.body}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="drawer-section">
        <div class="case-study-card">
          <div class="case-study-badge">FEATURED CASE STUDY</div>
          <h4 class="case-study-title">${p.caseStudy.title}</h4>
          <p class="case-study-desc">${p.caseStudy.description}</p>
        </div>
      </div>
    `;

    drawer.hidden = false;
  }
};
