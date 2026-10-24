/**
 * Ocean Literacy - Client API Service (Phase 2)
 *
 * Central HTTP client for Electron desktop, standard web browsers, and mobile viewports.
 * Manages authentication tokens, token refreshing, network failure detection,
 * and server-authoritative API communications.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.ApiClient = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  // Default API Base URL:
  // - In Web Browser: uses current origin (e.g. http://localhost:3000/api/v1)
  // - In Electron (file:// protocol): defaults to http://127.0.0.1:3000/api/v1
  const isBrowserHosted = typeof window !== 'undefined' &&
    window.location &&
    window.location.protocol &&
    window.location.protocol.startsWith('http');

  const DEFAULT_BASE_URL = isBrowserHosted
    ? `${window.location.origin}/api/v1`
    : 'http://127.0.0.1:3000/api/v1';

  let baseUrl = DEFAULT_BASE_URL;
  let accessToken = null;
  let currentUser = null;
  let isOnline = false;
  let authListeners = [];
  let statusListeners = [];

  // Initialize token from storage if available
  try {
    if (typeof localStorage !== 'undefined') {
      accessToken = localStorage.getItem('ocean_access_token');
      const savedUser = localStorage.getItem('ocean_current_user');
      if (savedUser) currentUser = JSON.parse(savedUser);
    }
  } catch (err) {
    console.warn('Could not read saved auth credentials:', err);
  }

  async function checkServerHealth() {
    try {
      const res = await fetch(`${baseUrl}/health/liveness`, {
        method: 'GET',
        signal: AbortSignal.timeout(3000)
      });
      const onlineNow = res.ok;
      if (onlineNow !== isOnline) {
        isOnline = onlineNow;
        notifyStatusListeners(isOnline);
      }
      return onlineNow;
    } catch (err) {
      if (isOnline) {
        isOnline = false;
        notifyStatusListeners(false);
      }
      return false;
    }
  }

  function notifyAuthListeners(user) {
    authListeners.forEach(fn => {
      try { fn(user); } catch (e) { console.error('Auth listener error:', e); }
    });
  }

  function notifyStatusListeners(online) {
    statusListeners.forEach(fn => {
      try { fn(online); } catch (e) { console.error('Status listener error:', e); }
    });
  }

  async function request(endpoint, options = {}) {
    const url = `${baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config = {
      ...options,
      headers,
      credentials: 'include' // Send cookies for web clients
    };

    let response;
    try {
      response = await fetch(url, config);
    } catch (netErr) {
      isOnline = false;
      notifyStatusListeners(false);
      throw new Error('Network error: Unable to connect to Ocean Literacy server. Operating in offline practice mode.');
    }

    // Attempt token refresh on 401
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      const refreshed = await tryRefreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${accessToken}`;
        return fetch(url, { ...config, headers }).then(r => r.json());
      }
    }

    const json = await response.json().catch(() => ({}));
    if (!response.ok) {
      const msg = json.error?.message || `HTTP ${response.status} Server Error`;
      const err = new Error(msg);
      err.status = response.status;
      err.details = json.error?.details;
      throw err;
    }

    return json;
  }

  async function tryRefreshToken() {
    try {
      const storedRefresh = typeof localStorage !== 'undefined' ? localStorage.getItem('ocean_refresh_token') : null;
      const res = await fetch(`${baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefresh })
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.data.accessToken, data.data.refreshToken, data.data.user);
        return true;
      }
    } catch (e) {
      // Refresh failed
    }
    clearSession();
    return false;
  }

  function setSession(token, refreshToken, user) {
    accessToken = token;
    currentUser = user;
    try {
      if (typeof localStorage !== 'undefined') {
        if (token) localStorage.setItem('ocean_access_token', token);
        if (refreshToken) localStorage.setItem('ocean_refresh_token', refreshToken);
        if (user) localStorage.setItem('ocean_current_user', JSON.stringify(user));
      }
    } catch (e) {}
    notifyAuthListeners(user);
  }

  function clearSession() {
    accessToken = null;
    currentUser = null;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('ocean_access_token');
        localStorage.removeItem('ocean_refresh_token');
        localStorage.removeItem('ocean_current_user');
      }
    } catch (e) {}
    notifyAuthListeners(null);
  }

  return {
    setBaseUrl(newUrl) {
      baseUrl = newUrl;
    },
    getBaseUrl() {
      return baseUrl;
    },
    isOnline() {
      return isOnline;
    },
    getCurrentUser() {
      return currentUser;
    },
    onAuthChange(fn) {
      authListeners.push(fn);
      return () => { authListeners = authListeners.filter(l => l !== fn); };
    },
    onStatusChange(fn) {
      statusListeners.push(fn);
      return () => { statusListeners = statusListeners.filter(l => l !== fn); };
    },
    checkServerHealth,

    // Authentication Endpoints
    async register(email, password, callsign) {
      const res = await request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, callsign })
      });
      setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
      return res.data;
    },

    async login(email, password) {
      const res = await request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      setSession(res.data.accessToken, res.data.refreshToken, res.data.user);
      return res.data;
    },

    async logout() {
      try {
        await request('/auth/logout', { method: 'POST' });
      } catch (e) {}
      clearSession();
      return true;
    },

    async getMe() {
      const res = await request('/auth/me');
      currentUser = res.data.user;
      notifyAuthListeners(currentUser);
      return res.data.user;
    },

    async updateSettings(settings) {
      const res = await request('/auth/settings', {
        method: 'PATCH',
        body: JSON.stringify(settings)
      });
      if (res.data?.user) {
        currentUser = res.data.user;
        notifyAuthListeners(currentUser);
      }
      return res.data;
    },

    async exportUserData() {
      return request('/auth/export-data');
    },

    async deleteAccount(password) {
      const res = await request('/auth/delete-account', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      clearSession();
      return res;
    },

    // Game & Server-Authoritative Gameplay Endpoints
    async getRoles() {
      const res = await request('/game/roles');
      return res.data.roles;
    },

    async getPublishedMissions(filters = {}) {
      const query = new URLSearchParams(filters).toString();
      const endpoint = query ? `/game/missions?${query}` : '/game/missions';
      const res = await request(endpoint);
      return res.data.missions;
    },

    async getMissionById(scenarioId) {
      const res = await request(`/game/missions/${scenarioId}`);
      return res.data.mission;
    },

    async startAttempt(scenarioId) {
      const idempotencyKey = `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const res = await request('/game/attempts/start', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ scenarioId })
      });
      return res.data;
    },

    async submitDecision(attemptId, optionId) {
      const idempotencyKey = `dec_${attemptId}_${optionId}`;
      const res = await request(`/game/attempts/${attemptId}/decision`, {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify({ optionId })
      });
      return res.data;
    },

    async resumeAttempt(attemptId) {
      const res = await request(`/game/attempts/${attemptId}/resume`);
      return res.data;
    },

    async getUserProgress() {
      const res = await request('/game/progress');
      return res.data;
    },

    // Leaderboards Endpoints
    async getDailyLeaderboard(page = 1) {
      const res = await request(`/leaderboards/daily?page=${page}`);
      return res.data;
    },

    async getWeeklyLeaderboard(page = 1) {
      const res = await request(`/leaderboards/weekly?page=${page}`);
      return res.data;
    },

    async getOverallLeaderboard(page = 1) {
      const res = await request(`/leaderboards/overall?page=${page}`);
      return res.data;
    },

    async getMyStanding() {
      const res = await request('/leaderboards/me');
      return res.data;
    },

    // INCOIS Integration Endpoints
    async getIncoisStatus() {
      const res = await request('/integrations/incois/status');
      return res.data;
    },

    async getIncoisPfz(region = 'Maharashtra') {
      const res = await request(`/integrations/incois/pfz?region=${encodeURIComponent(region)}`);
      return res.data;
    },

    async getIncoisOsf(sector = 'West Coast') {
      const res = await request(`/integrations/incois/osf?sector=${encodeURIComponent(sector)}`);
      return res.data;
    },

    async getIncoisTsunami() {
      const res = await request('/integrations/incois/tsunami');
      return res.data;
    },

    async getIncoisMarineHeatwave(reefArea = 'Gulf of Mannar') {
      const res = await request(`/integrations/incois/marine-heatwave?reefArea=${encodeURIComponent(reefArea)}`);
      return res.data;
    },

    // Admin CMS & Governance Endpoints
    async getAdminStats() {
      const res = await request('/admin/stats');
      return res.data;
    },

    async getAdminUsers(page = 1, search = '', role = '') {
      const q = new URLSearchParams({ page, search, role }).toString();
      const res = await request(`/admin/users?${q}`);
      return res.data;
    },

    async getAdminMissions() {
      const res = await request('/admin/missions');
      return res.data.scenarios;
    },

    async getAdminMissionDetail(id) {
      const res = await request(`/admin/missions/${id}`);
      return res.data.scenario;
    },

    async createDraftMission(data) {
      const res = await request('/admin/missions', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.data.scenario;
    },

    async updateDraftMission(id, data) {
      const res = await request(`/admin/missions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res.data;
    },

    async publishMission(id) {
      const res = await request(`/admin/missions/${id}/publish`, {
        method: 'POST'
      });
      return res.data.scenario;
    },

    async unpublishMission(id) {
      const res = await request(`/admin/missions/${id}/unpublish`, {
        method: 'POST'
      });
      return res.data.scenario;
    },

    async archiveMission(id) {
      const res = await request(`/admin/missions/${id}/archive`, {
        method: 'POST'
      });
      return res.data.scenario;
    },

    async getAdminAuditLogs(page = 1) {
      const res = await request(`/admin/audit-logs?page=${page}`);
      return res.data;
    }
  };
}));
