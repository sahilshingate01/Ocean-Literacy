/**
 * About & Architecture Module
 * Displays desktop system specs, version metadata, and UNESCO framework credentials.
 */

const AboutModule = {
  appInfo: {
    name: 'Ocean Literacy Desktop',
    version: '1.0.0',
    platform: typeof process !== 'undefined' ? process.platform : 'darwin',
    nodeVersion: typeof process !== 'undefined' ? process.versions.node : 'v26.x',
    electronVersion: '33.x',
    chromeVersion: '130.x'
  },

  async init() {
    if (window.oceanAPI && window.oceanAPI.getAppInfo) {
      try {
        this.appInfo = await window.oceanAPI.getAppInfo();
      } catch (e) {
        console.warn('Could not query desktop app info:', e);
      }
    }
    this.render();
  },

  render() {
    const container = document.getElementById('view-about');
    if (!container) return;

    container.innerHTML = `
      <div class="view-header">
        <div class="view-pretitle">SYSTEM & CREDENTIALS</div>
        <h1 class="view-title">About Ocean Literacy Desktop</h1>
        <p class="view-description">
          An open-source desktop engineering project dedicated to advancing the UN Decade of Ocean Science
          through interactive software design and computational literacy.
        </p>
      </div>

      <div class="cards-grid">
        <div class="ocean-card system-card">
          <div class="card-top">
            <span class="card-num">RUN-TIME</span>
            <span class="card-icon">⚡</span>
          </div>
          <h3 class="card-title">Desktop Engine Specifications</h3>
          <div class="spec-list">
            <div class="spec-row">
              <span class="spec-k">Application Name</span>
              <span class="spec-v">Ocean Literacy Desktop</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Software Version</span>
              <span class="spec-v">v1.0.0 (Release)</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Target Platform</span>
              <span class="spec-v">${this.appInfo.platform || 'macOS (Darwin)'}</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Electron Core</span>
              <span class="spec-v">${this.appInfo.electronVersion || 'v33.2.1'}</span>
            </div>
            <div class="spec-row">
              <span class="spec-k">Node.js Engine</span>
              <span class="spec-v">${this.appInfo.nodeVersion || 'v26.9.0'}</span>
            </div>
          </div>
        </div>

        <div class="ocean-card system-card">
          <div class="card-top">
            <span class="card-num">FRAMEWORK</span>
            <span class="card-icon">🏛️</span>
          </div>
          <h3 class="card-title">UNESCO Ocean Literacy Network</h3>
          <p class="card-body">
            Developed in alignment with the scientific criteria published by the Intergovernmental Oceanographic Commission (IOC)
            of UNESCO, the National Marine Educators Association (NMEA), and the Ocean Literacy Network.
          </p>
          <div class="card-footer">
            <span class="card-meta">UN Ocean Decade: 2021 – 2030</span>
          </div>
        </div>
      </div>
    `;
  }
};
