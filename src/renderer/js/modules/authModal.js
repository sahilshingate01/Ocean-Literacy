/**
 * Ocean Literacy - Authentication & Account Settings Dialog Controller (Phase 2)
 *
 * Provides accessible modal dialogs for:
 * - User Sign In & Registration
 * - Password Reset Requests
 * - Cadet Profile & Preferences (Callsign, Role, Sound, Reduced Motion)
 * - Global Leaderboard Privacy Opt-In
 * - DPDP Act Compliance (Personal Data Export & Permanent Account Deletion)
 */

const AuthModal = {
  isOpen: false,
  mode: 'signin', // 'signin' | 'register' | 'forgot' | 'profile'

  init() {
    this.createModals();
    this.bindGlobalTriggers();

    // Listen for auth state changes
    ApiClient.onAuthChange((user) => {
      this.updateTitlebarUser(user);
      if (typeof GameModule !== 'undefined' && GameModule.refreshOnlineState) {
        GameModule.refreshOnlineState();
      }
      if (typeof AdminModule !== 'undefined' && AdminModule.init) {
        AdminModule.init();
      }
    });

    // Initial check
    ApiClient.checkServerHealth().then(online => {
      this.updateStatusIndicator(online);
      if (online && ApiClient.getCurrentUser()) {
        ApiClient.getMe().catch(() => {});
      }
    });

    ApiClient.onStatusChange((online) => {
      this.updateStatusIndicator(online);
    });
  },

  createModals() {
    // 1. Auth Dialog Overlay (Sign In / Register / Reset)
    let authModal = document.getElementById('authModal');
    if (!authModal) {
      authModal = document.createElement('div');
      authModal.id = 'authModal';
      authModal.className = 'modal-overlay';
      authModal.hidden = true;
      document.body.appendChild(authModal);
    }

    // 2. Profile & Settings Dialog Overlay
    let profileModal = document.getElementById('profileModal');
    if (!profileModal) {
      profileModal = document.createElement('div');
      profileModal.id = 'profileModal';
      profileModal.className = 'modal-overlay';
      profileModal.hidden = true;
      document.body.appendChild(profileModal);
    }
  },

  bindGlobalTriggers() {
    const btnAuth = document.getElementById('btnAuthAccount');
    if (btnAuth) {
      btnAuth.addEventListener('click', () => {
        const user = ApiClient.getCurrentUser();
        if (user) {
          this.openProfile();
        } else {
          this.openAuth('signin');
        }
      });
    }

    // Allow clicking the status indicator to test server connection
    const statusInd = document.getElementById('statusIndicatorPill');
    if (statusInd) {
      statusInd.addEventListener('click', async () => {
        statusInd.classList.add('checking');
        const online = await ApiClient.checkServerHealth();
        statusInd.classList.remove('checking');
        this.updateStatusIndicator(online);
      });
    }
  },

  openAuth(mode = 'signin') {
    this.mode = mode;
    const modal = document.getElementById('authModal');
    if (!modal) return;
    this.renderAuthModalContent();
    modal.hidden = false;
  },

  closeAuth() {
    const modal = document.getElementById('authModal');
    if (modal) modal.hidden = true;
  },

  openProfile() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;
    this.renderProfileModalContent();
    modal.hidden = false;
  },

  closeProfile() {
    const modal = document.getElementById('profileModal');
    if (modal) modal.hidden = true;
  },

  updateTitlebarUser(user) {
    const btnText = document.getElementById('authButtonText');
    const authIcon = document.getElementById('authIcon');
    const adminNav = document.getElementById('nav-admin');

    if (user) {
      const callsign = user.profile?.callsign || user.email.split('@')[0];
      if (btnText) btnText.textContent = callsign;
      if (authIcon) authIcon.textContent = user.role === 'ADMIN' ? '👑' : (user.role === 'CONTENT_EDITOR' ? '✍️' : '🧑‍✈️');

      // Show/Hide Admin Nav Item in Sidebar
      if (adminNav) {
        adminNav.style.display = (user.role === 'ADMIN' || user.role === 'CONTENT_EDITOR') ? 'flex' : 'none';
      }
    } else {
      if (btnText) btnText.textContent = 'Sign In';
      if (authIcon) authIcon.textContent = '👤';
      if (adminNav) adminNav.style.display = 'none';
    }
  },

  updateStatusIndicator(isOnline) {
    const statusDot = document.querySelector('.status-indicator');
    const statusText = document.getElementById('statusMessage');

    if (statusDot) {
      statusDot.className = `status-indicator ${isOnline ? 'online' : 'offline'}`;
    }
    if (statusText) {
      const user = ApiClient.getCurrentUser();
      if (isOnline) {
        statusText.textContent = user
          ? `🟢 Server Authoritative Online (${user.profile?.callsign || user.email}) — PostgreSQL Connected`
          : '🟢 Server Online — Sign in for Authoritative Global Rankings';
      } else {
        statusText.textContent = '🟡 Offline Practice Mode (Local Simulation — Educational Non-Competitive)';
      }
    }
  },

  renderAuthModalContent() {
    const modal = document.getElementById('authModal');
    if (!modal) return;

    modal.innerHTML = `
      <div class="auth-modal-card">
        <div class="auth-modal-header">
          <div class="auth-brand-badge">
            <span class="auth-badge-icon">🌊</span>
            <span class="auth-badge-text">UNESCO Ocean Literacy Studio</span>
          </div>
          <button class="btn-close-modal" id="btnCloseAuthModal">✕</button>
        </div>

        <div class="auth-tabs-row">
          <button class="auth-tab ${this.mode === 'signin' ? 'active' : ''}" id="tabAuthSignIn">Sign In</button>
          <button class="auth-tab ${this.mode === 'register' ? 'active' : ''}" id="tabAuthRegister">Create Account</button>
        </div>

        <div id="authErrorMessage" class="auth-error-banner" style="display: none;"></div>

        <form id="authForm" class="auth-form-body">
          <div class="form-group">
            <label>Email Address</label>
            <input type="email" id="authEmail" required placeholder="cadet@oceanliteracy.org" class="form-input">
          </div>

          <div class="form-group">
            <label>Password</label>
            <input type="password" id="authPassword" required placeholder="••••••••••••" minlength="8" class="form-input">
            <span class="input-hint">Must be at least 8 characters.</span>
          </div>

          ${this.mode === 'register' ? `
            <div class="form-group">
              <label>Maritime Call Sign / Display Name</label>
              <input type="text" id="authCallsign" placeholder="e.g. Capt. Neelam" maxlength="32" class="form-input">
              <span class="input-hint">Public call sign shown on global leaderboards.</span>
            </div>
          ` : ''}

          <div class="auth-actions">
            <button type="submit" class="btn-primary-action btn-block">
              ${this.mode === 'signin' ? 'Sign In to Authoritative Platform' : 'Create Cadet Profile'}
            </button>
          </div>
        </form>

        <div class="auth-footer-notice">
          <p>🔒 Passwords hashed with high-security Argon2/Bcrypt. Global leaderboards adhere to the Digital Personal Data Protection (DPDP) framework.</p>
        </div>
      </div>
    `;

    // Bind modal events
    modal.querySelector('#btnCloseAuthModal').addEventListener('click', () => this.closeAuth());
    modal.addEventListener('click', (e) => { if (e.target === modal) this.closeAuth(); });

    modal.querySelector('#tabAuthSignIn').addEventListener('click', () => this.openAuth('signin'));
    modal.querySelector('#tabAuthRegister').addEventListener('click', () => this.openAuth('register'));

    const form = modal.querySelector('#authForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = modal.querySelector('#authEmail').value.trim();
      const password = modal.querySelector('#authPassword').value;
      const errorBox = modal.querySelector('#authErrorMessage');
      errorBox.style.display = 'none';

      try {
        if (this.mode === 'register') {
          const callsign = modal.querySelector('#authCallsign')?.value.trim();
          await ApiClient.register(email, password, callsign);
        } else {
          await ApiClient.login(email, password);
        }
        this.closeAuth();
      } catch (err) {
        errorBox.textContent = err.message || 'Authentication failed.';
        errorBox.style.display = 'block';
      }
    });
  },

  renderProfileModalContent() {
    const modal = document.getElementById('profileModal');
    if (!modal) return;

    const user = ApiClient.getCurrentUser();
    if (!user) {
      this.closeProfile();
      return;
    }

    const p = user.profile || {};

    modal.innerHTML = `
      <div class="profile-modal-card">
        <div class="auth-modal-header">
          <div class="auth-brand-badge">
            <span class="auth-badge-icon">🧑‍✈️</span>
            <span class="auth-badge-text">Cadet Profile &amp; Governance</span>
          </div>
          <button class="btn-close-modal" id="btnCloseProfileModal">✕</button>
        </div>

        <div class="profile-summary-header">
          <div class="profile-avatar">🪸</div>
          <div class="profile-meta">
            <h3>${this.escapeHtml(p.callsign || 'Cadet')}</h3>
            <span class="profile-email">${this.escapeHtml(user.email)}</span>
            <span class="role-pill">${user.role}</span>
          </div>
        </div>

        <form id="profileSettingsForm" class="profile-form-body">
          <div class="form-group">
            <label>Maritime Call Sign</label>
            <input type="text" id="prefCallsign" value="${this.escapeHtml(p.callsign || '')}" maxlength="32" class="form-input">
          </div>

          <div class="form-group-checkbox">
            <label class="checkbox-container">
              <input type="checkbox" id="prefLeaderboardOptIn" ${user.leaderboardOptIn ? 'checked' : ''}>
              <span class="checkmark"></span>
              <div class="checkbox-text">
                <strong>Participate in Global Leaderboards</strong>
                <p>Allow your verified mission scores and call sign to appear in daily, weekly, and overall global rankings.</p>
              </div>
            </label>
          </div>

          <div class="form-actions-row">
            <button type="submit" class="btn-primary-action">💾 Save Preferences</button>
            <button type="button" class="btn-cancel" id="btnSignOutTrigger">Sign Out</button>
          </div>
        </form>

        <!-- DPDP Compliance Section -->
        <div class="dpdp-compliance-card">
          <h4>🇮🇳 Digital Personal Data Protection (DPDP) Rights</h4>
          <p class="dpdp-desc">Under India's DPDP framework, you have the right to access, export, or permanently delete your operational records.</p>
          <div class="dpdp-actions-row">
            <button class="btn-sm-action" id="btnExportUserData">📥 Export My Data (JSON)</button>
            <button class="btn-sm-action btn-danger" id="btnDeleteUserAccount">🗑️ Permanently Delete Account</button>
          </div>
        </div>
      </div>
    `;

    modal.querySelector('#btnCloseProfileModal').addEventListener('click', () => this.closeProfile());
    modal.addEventListener('click', (e) => { if (e.target === modal) this.closeProfile(); });

    modal.querySelector('#btnSignOutTrigger').addEventListener('click', async () => {
      await ApiClient.logout();
      this.closeProfile();
    });

    const form = modal.querySelector('#profileSettingsForm');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const callsign = modal.querySelector('#prefCallsign').value.trim();
      const leaderboardOptIn = modal.querySelector('#prefLeaderboardOptIn').checked;

      try {
        await ApiClient.updateSettings({ callsign, leaderboardOptIn });
        alert('Preferences updated successfully!');
        this.closeProfile();
      } catch (err) {
        alert(`Failed to save preferences: ${err.message}`);
      }
    });

    modal.querySelector('#btnExportUserData').addEventListener('click', async () => {
      try {
        const data = await ApiClient.exportUserData();
        const blob = new Blob([JSON.stringify(data.data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ocean_literacy_data_${user.id.slice(0, 8)}.json`;
        a.click();
        URL.revokeObjectURL(url);
      } catch (err) {
        alert(`Export failed: ${err.message}`);
      }
    });

    modal.querySelector('#btnDeleteUserAccount').addEventListener('click', async () => {
      const password = prompt('Please enter your account password to confirm permanent deletion:');
      if (password) {
        try {
          await ApiClient.deleteAccount(password);
          alert('Your account and associated records have been permanently deleted.');
          this.closeProfile();
        } catch (err) {
          alert(`Account deletion failed: ${err.message}`);
        }
      }
    });
  },

  escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
};
