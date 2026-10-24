/**
 * Ocean Literacy - Admin Content Management & Governance UI Module (Phase 2)
 *
 * Dedicated administrative interface for:
 * - Scenario draft authoring, previewing, and versioned publishing
 * - Role governance and user management
 * - Platform metrics and audit log inspection
 * - Leaderboard score moderation
 */

const AdminModule = {
  activeTab: 'scenarios', // 'scenarios' | 'new-scenario' | 'users' | 'audit' | 'stats'
  scenarios: [],
  selectedScenario: null,
  stats: null,

  async init() {
    // Only initialize if user has authorized role
    const user = ApiClient.getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'CONTENT_EDITOR')) {
      return;
    }
    await this.loadData();
    this.render();
  },

  async loadData() {
    try {
      this.scenarios = await ApiClient.getAdminMissions();
      const user = ApiClient.getCurrentUser();
      if (user && user.role === 'ADMIN') {
        const statsData = await ApiClient.getAdminStats();
        this.stats = statsData.metrics;
      }
    } catch (err) {
      console.warn('Failed to load admin data:', err);
    }
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  render() {
    const container = document.getElementById('view-admin');
    if (!container) return;

    const user = ApiClient.getCurrentUser();
    if (!user || (user.role !== 'ADMIN' && user.role !== 'CONTENT_EDITOR')) {
      container.innerHTML = `
        <div class="admin-unauthorized-card">
          <span class="unauth-icon">🔒</span>
          <h2>Restricted Operational Portal</h2>
          <p>This station is restricted to authorized Content Editors and Administrators.</p>
          <p class="unauth-sub">Sign in with an authorized institutional account to access scenario management and governance tools.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="admin-module-container">
        <!-- Admin Header -->
        <header class="admin-header">
          <div class="admin-title-row">
            <div>
              <span class="admin-badge">${user.role === 'ADMIN' ? 'Administrator Station' : 'Content Editor Studio'}</span>
              <h1 class="admin-title">Ocean Literacy Content Management &amp; Governance</h1>
            </div>
            <div class="admin-user-pill">
              <span class="user-role-dot"></span>
              <span class="user-email">${this.escapeHtml(user.email)}</span>
            </div>
          </div>

          <!-- Quick Metrics Ribbon (Admin only) -->
          ${this.stats ? `
            <div class="admin-metrics-ribbon">
              <div class="admin-metric-card">
                <span class="metric-num">${this.stats.totalScenarios}</span>
                <span class="metric-label">Total Missions</span>
              </div>
              <div class="admin-metric-card">
                <span class="metric-num">${this.stats.totalAttempts}</span>
                <span class="metric-label">Total Attempts</span>
              </div>
              <div class="admin-metric-card">
                <span class="metric-num">${this.stats.completionRate}%</span>
                <span class="metric-label">Completion Rate</span>
              </div>
              <div class="admin-metric-card">
                <span class="metric-num">${this.stats.totalUsers}</span>
                <span class="metric-label">Registered Cadets</span>
              </div>
            </div>
          ` : ''}

          <!-- Admin Navigation Tabs -->
          <nav class="admin-nav-tabs">
            <button class="admin-tab-btn ${this.activeTab === 'scenarios' ? 'active' : ''}" id="admTabScenarios">
              📚 Mission Scenarios (${this.scenarios.length})
            </button>
            <button class="admin-tab-btn ${this.activeTab === 'new-scenario' ? 'active' : ''}" id="admTabNewScenario">
              ✍️ Author New Scenario
            </button>
            ${user.role === 'ADMIN' ? `
              <button class="admin-tab-btn ${this.activeTab === 'users' ? 'active' : ''}" id="admTabUsers">
                👥 Cadet &amp; Role Management
              </button>
              <button class="admin-tab-btn ${this.activeTab === 'audit' ? 'active' : ''}" id="admTabAudit">
                🛡️ Audit Logs
              </button>
            ` : ''}
          </nav>
        </header>

        <!-- Admin Tab Body -->
        <main class="admin-body">
          ${this.renderTabContent()}
        </main>
      </div>
    `;

    this.bindEvents(container);
  },

  renderTabContent() {
    if (this.activeTab === 'new-scenario') {
      return this.renderAuthorScenarioForm();
    }
    if (this.activeTab === 'users') {
      return this.renderUsersTab();
    }
    if (this.activeTab === 'audit') {
      return this.renderAuditTab();
    }
    return this.renderScenariosList();
  },

  renderScenariosList() {
    return `
      <div class="admin-scenarios-panel">
        <div class="admin-panel-toolbar">
          <input type="text" id="adminScenarioSearch" class="admin-search-input" placeholder="Search scenarios by ID, title, or region...">
          <button class="btn-primary-action" id="btnAdminCreateTrigger">+ Author New Scenario</button>
        </div>

        <div class="admin-scenarios-table-wrapper">
          <table class="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Role</th>
                <th>Difficulty</th>
                <th>Version</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${this.scenarios.map(s => {
                const latest = s.versions && s.versions[0] ? s.versions[0] : {};
                const isPublished = s.status === 'PUBLISHED';
                return `
                  <tr>
                    <td class="font-mono text-cyan">${this.escapeHtml(s.id)}</td>
                    <td class="font-medium">${this.escapeHtml(latest.title || s.id)}</td>
                    <td><span class="role-pill">${this.escapeHtml(s.roleId)}</span></td>
                    <td><span class="diff-tag diff-${(latest.difficulty || 'Intermediate').toLowerCase()}">${this.escapeHtml(latest.difficulty || 'Intermediate')}</span></td>
                    <td>v${s.currentVersion}</td>
                    <td><span class="status-badge ${isPublished ? 'published' : 'draft'}">${s.status}</span></td>
                    <td class="action-cells">
                      <button class="btn-sm-action btn-preview-scenario" data-id="${s.id}">Preview</button>
                      ${isPublished ? `
                        <button class="btn-sm-action btn-unpublish-scenario" data-id="${s.id}">Unpublish</button>
                      ` : `
                        <button class="btn-sm-action btn-publish-scenario btn-accent" data-id="${s.id}">Publish v${s.currentVersion}</button>
                      `}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAuthorScenarioForm() {
    return `
      <div class="admin-form-panel">
        <div class="form-header">
          <h2>Author New Mission Scenario</h2>
          <p>Create a scientifically grounded ocean decision scenario. All new scenarios are saved as DRAFTS and validated before publication.</p>
        </div>

        <form id="authorScenarioForm" class="admin-form">
          <div class="form-grid-2">
            <div class="form-group">
              <label>Unique Scenario ID *</label>
              <input type="text" id="scenId" placeholder="e.g. scen-fisher-04" required class="form-input">
              <span class="input-hint">Unique identifier used for versioned tracking.</span>
            </div>
            <div class="form-group">
              <label>Target Maritime Role *</label>
              <select id="scenRoleId" class="form-select">
                <option value="fisher">Fisher (Marine Fisheries)</option>
                <option value="captain">Ship Captain (Maritime Navigation)</option>
                <option value="tourism_operator">Coastal Tourism Operator (Beach Safety)</option>
                <option value="community_volunteer">Community Volunteer (Disaster Prep)</option>
                <option value="conservation_ranger">Conservation Ranger (Marine Ecology)</option>
              </select>
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>Scenario Title *</label>
              <input type="text" id="scenTitle" placeholder="e.g. Nearshore Monsoon Swell Surge" required class="form-input">
            </div>
            <div class="form-group">
              <label>Geographic Region *</label>
              <input type="text" id="scenRegion" placeholder="e.g. Malabar Coast, Kerala (Arabian Sea)" required class="form-input">
            </div>
          </div>

          <div class="form-grid-2">
            <div class="form-group">
              <label>Topic / Concept *</label>
              <input type="text" id="scenTopic" placeholder="e.g. Swell Surge (Kallakkadal)" required class="form-input">
            </div>
            <div class="form-group">
              <label>Difficulty Level *</label>
              <select id="scenDifficulty" class="form-select">
                <option value="Beginner">Beginner (Foundational Awareness)</option>
                <option value="Intermediate" selected>Intermediate (Standard Operations)</option>
                <option value="Advanced">Advanced (Critical Hazard Assessment)</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Learning Objective *</label>
            <input type="text" id="scenObjective" placeholder="State the specific scientific or operational takeaway..." required class="form-input">
          </div>

          <div class="form-group">
            <label>Situation Briefing (Context &amp; Dilemma) *</label>
            <textarea id="scenBriefing" rows="4" placeholder="Detail the sea state, vessel condition, and operational decision dilemma..." required class="form-textarea"></textarea>
          </div>

          <div class="form-header-sub">
            <h3>Decision Options (Min 2 options, at least 1 Correct)</h3>
          </div>

          <!-- Option 1: Correct -->
          <div class="option-form-card correct-option">
            <span class="option-type-tag tag-correct">OPTION 1 (CORRECT CHOICE)</span>
            <div class="form-group">
              <label>Option Decision Text *</label>
              <input type="text" id="opt1Text" placeholder="Action the operator should responsibly take..." required class="form-input">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Operational Feedback *</label>
                <input type="text" id="opt1Feedback" placeholder="Immediate operational outcome..." required class="form-input">
              </div>
              <div class="form-group">
                <label>Scientific Takeaway *</label>
                <input type="text" id="opt1Science" placeholder="Core oceanographic principle explained..." required class="form-input">
              </div>
            </div>
          </div>

          <!-- Option 2: Hazardous / Unsafe -->
          <div class="option-form-card unsafe-option">
            <span class="option-type-tag tag-unsafe">OPTION 2 (HAZARDOUS / PENALTY CHOICE)</span>
            <div class="form-group">
              <label>Option Decision Text *</label>
              <input type="text" id="opt2Text" placeholder="Risky or unsafe action violating protocols..." required class="form-input">
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Hazard Feedback (Why this is dangerous) *</label>
                <input type="text" id="opt2Feedback" placeholder="Consequence of ignoring ocean forecast..." required class="form-input">
              </div>
              <div class="form-group">
                <label>Scientific Takeaway *</label>
                <input type="text" id="opt2Science" placeholder="Scientific safety rule explained..." required class="form-input">
              </div>
            </div>
          </div>

          <div class="form-actions-row">
            <button type="submit" class="btn-primary-action btn-lg">💾 Save Validated Draft Scenario</button>
            <button type="button" class="btn-cancel" id="btnCancelAuthoring">Cancel</button>
          </div>
        </form>
      </div>
    `;
  },

  renderUsersTab() {
    return `
      <div class="admin-users-panel">
        <div class="admin-panel-toolbar">
          <input type="text" id="adminUserSearch" class="admin-search-input" placeholder="Search cadets by email or callsign...">
          <button class="btn-sm-action" id="btnRefreshUsers">Refresh Cadets</button>
        </div>
        <div id="adminUsersTableContainer">
          <p class="text-secondary">Loading registered cadets and permissions...</p>
        </div>
      </div>
    `;
  },

  renderAuditTab() {
    return `
      <div class="admin-audit-panel">
        <div class="admin-panel-toolbar">
          <h3>Platform Security &amp; Administrative Audit Ledger</h3>
          <button class="btn-sm-action" id="btnRefreshAudit">Refresh Audit Logs</button>
        </div>
        <div id="adminAuditTableContainer">
          <p class="text-secondary">Loading audit trails...</p>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // Navigation Tabs
    const tabScenarios = container.querySelector('#admTabScenarios');
    const tabNewScenario = container.querySelector('#admTabNewScenario');
    const tabUsers = container.querySelector('#admTabUsers');
    const tabAudit = container.querySelector('#admTabAudit');

    if (tabScenarios) tabScenarios.addEventListener('click', () => { this.activeTab = 'scenarios'; this.render(); });
    if (tabNewScenario) tabNewScenario.addEventListener('click', () => { this.activeTab = 'new-scenario'; this.render(); });
    if (tabUsers) tabUsers.addEventListener('click', () => {
      this.activeTab = 'users';
      this.render();
      this.loadUsersList();
    });
    if (tabAudit) tabAudit.addEventListener('click', () => {
      this.activeTab = 'audit';
      this.render();
      this.loadAuditLogs();
    });

    const btnCreateTrigger = container.querySelector('#btnAdminCreateTrigger');
    if (btnCreateTrigger) btnCreateTrigger.addEventListener('click', () => { this.activeTab = 'new-scenario'; this.render(); });

    const btnCancel = container.querySelector('#btnCancelAuthoring');
    if (btnCancel) btnCancel.addEventListener('click', () => { this.activeTab = 'scenarios'; this.render(); });

    // Publish Scenario buttons
    container.querySelectorAll('.btn-publish-scenario').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm(`Publish scenario "${id}" to all players?`)) {
          try {
            await ApiClient.publishMission(id);
            alert(`Scenario "${id}" is now live and published!`);
            await this.loadData();
            this.render();
          } catch (err) {
            alert(`Publication failed: ${err.message}`);
          }
        }
      });
    });

    // Unpublish Scenario buttons
    container.querySelectorAll('.btn-unpublish-scenario').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.id;
        if (confirm(`Unpublish scenario "${id}"? It will return to draft status.`)) {
          try {
            await ApiClient.unpublishMission(id);
            await this.loadData();
            this.render();
          } catch (err) {
            alert(`Unpublish failed: ${err.message}`);
          }
        }
      });
    });

    // Preview Scenario buttons
    container.querySelectorAll('.btn-preview-scenario').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const scen = this.scenarios.find(s => s.id === id);
        if (scen) this.showPreviewModal(scen);
      });
    });

    // Author Scenario Form Submission
    const form = container.querySelector('#authorScenarioForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
          id: container.querySelector('#scenId').value.trim(),
          roleId: container.querySelector('#scenRoleId').value,
          title: container.querySelector('#scenTitle').value.trim(),
          region: container.querySelector('#scenRegion').value.trim(),
          topic: container.querySelector('#scenTopic').value.trim(),
          difficulty: container.querySelector('#scenDifficulty').value,
          objective: container.querySelector('#scenObjective').value.trim(),
          situationBriefing: container.querySelector('#scenBriefing').value.trim(),
          oceanConditions: [
            { label: 'Forecast Status', value: 'Monitored via INCOIS OSF', status: 'warning' },
            { label: 'Operational Level', value: 'Advisory in Force', status: 'danger' }
          ],
          simulationNotice: 'SIMULATION — Educational demo data, not live INCOIS information.',
          options: [
            {
              id: 'opt-1-correct',
              text: container.querySelector('#opt1Text').value.trim(),
              type: 'correct',
              score: 100,
              xp: 100,
              feedback: container.querySelector('#opt1Feedback').value.trim(),
              scienceTakeaway: container.querySelector('#opt1Science').value.trim()
            },
            {
              id: 'opt-2-unsafe',
              text: container.querySelector('#opt2Text').value.trim(),
              type: 'unsafe',
              score: -50,
              xp: 0,
              feedback: container.querySelector('#opt2Feedback').value.trim(),
              scienceTakeaway: container.querySelector('#opt2Science').value.trim()
            }
          ]
        };

        try {
          await ApiClient.createDraftMission(payload);
          alert(`Draft scenario "${payload.id}" created successfully! You can preview and publish it from the mission list.`);
          this.activeTab = 'scenarios';
          await this.loadData();
          this.render();
        } catch (err) {
          alert(`Failed to create scenario: ${err.message}`);
        }
      });
    }
  },

  async loadUsersList() {
    const tableContainer = document.getElementById('adminUsersTableContainer');
    if (!tableContainer) return;

    try {
      const data = await ApiClient.getAdminUsers();
      tableContainer.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Callsign</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Opt-In</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${data.users.map(u => `
              <tr>
                <td class="font-medium">${this.escapeHtml(u.profile?.callsign || 'Cadet')}</td>
                <td class="font-mono text-cyan">${this.escapeHtml(u.email)}</td>
                <td><span class="role-pill">${u.role}</span></td>
                <td><span class="status-badge ${u.isActive ? 'published' : 'draft'}">${u.isActive ? 'Active' : 'Disabled'}</span></td>
                <td>${u.leaderboardOptIn ? '✓ Yes' : '✕ No'}</td>
                <td class="action-cells">
                  ${u.role !== 'ADMIN' ? `
                    <button class="btn-sm-action btn-promote-user" data-id="${u.id}" data-role="CONTENT_EDITOR">Make Editor</button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      tableContainer.innerHTML = `<p class="text-danger">Failed to load users: ${err.message}</p>`;
    }
  },

  async loadAuditLogs() {
    const tableContainer = document.getElementById('adminAuditTableContainer');
    if (!tableContainer) return;

    try {
      const data = await ApiClient.getAdminAuditLogs();
      tableContainer.innerHTML = `
        <table class="admin-table">
          <thead>
            <tr>
              <th>Timestamp (UTC)</th>
              <th>Action</th>
              <th>User</th>
              <th>Resource</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            ${data.logs.map(l => `
              <tr>
                <td class="font-mono text-secondary">${new Date(l.createdAt).toISOString().replace('T', ' ').slice(0, 19)}</td>
                <td class="font-medium text-cyan">${this.escapeHtml(l.action)}</td>
                <td>${this.escapeHtml(l.user?.email || 'System')}</td>
                <td>${this.escapeHtml(l.resourceType || '-')}</td>
                <td class="font-mono text-xs">${this.escapeHtml(JSON.stringify(l.details || {}))}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      tableContainer.innerHTML = `<p class="text-danger">Failed to load audit logs: ${err.message}</p>`;
    }
  },

  showPreviewModal(scenario) {
    const modal = document.getElementById('detailDrawer');
    const drawerTag = document.getElementById('drawerTag');
    const drawerBody = document.getElementById('drawerBody');
    if (!modal || !drawerBody) return;

    const v = scenario.versions && scenario.versions[0] ? scenario.versions[0] : {};

    if (drawerTag) drawerTag.textContent = `PREVIEW: ${scenario.id} (v${scenario.currentVersion})`;

    drawerBody.innerHTML = `
      <div class="admin-preview-content">
        <div class="preview-banner">
          <span class="preview-badge">IMMUTABLE VERSION PREVIEW</span>
          <span class="preview-role">${this.escapeHtml(scenario.roleId)}</span>
        </div>
        <h2>${this.escapeHtml(v.title || scenario.id)}</h2>
        <p class="preview-objective"><strong>Objective:</strong> ${this.escapeHtml(v.objective || '')}</p>
        <div class="preview-briefing-box">
          <h4>Situation Briefing:</h4>
          <p>${this.escapeHtml(v.situationBriefing || '')}</p>
        </div>

        <h4>Decision Options Configured:</h4>
        <div class="preview-options-list">
          ${(v.options || []).map((o, idx) => `
            <div class="preview-option-pill ${o.type === 'correct' ? 'is-correct' : 'is-unsafe'}">
              <span class="opt-label">${idx + 1}. [${o.type.toUpperCase()}] (+${o.score} pts / +${o.xp} XP)</span>
              <p class="opt-text">${this.escapeHtml(o.text)}</p>
              <p class="opt-feedback"><strong>Feedback:</strong> ${this.escapeHtml(o.feedback)}</p>
              <p class="opt-takeaway"><strong>Takeaway:</strong> ${this.escapeHtml(o.scienceTakeaway)}</p>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    modal.hidden = false;
  }
};
