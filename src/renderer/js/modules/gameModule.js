/**
 * Ocean Literacy - Gamified Missions UI Module (Phase 2 Full-Stack Integration)
 *
 * Coordinates:
 * - Server-Authoritative Online Gameplay (PostgreSQL + Express)
 * - Offline / Practice Mode Fallback (Local Simulation)
 * - Live INCOIS Ocean State Telemetry Cards with Official Attribution
 * - Database-backed Global Leaderboards (Daily, Weekly, Overall in Asia/Kolkata)
 * - Anti-Exploit Replay & Duplicate Prevention Badges
 * - Player Progression & Milestone Achievements
 */

const GameModule = {
  state: null,
  activeSubView: 'dashboard', // 'dashboard' | 'mission-play' | 'mission-result' | 'leaderboard' | 'achievements'
  activeMissionId: null,
  activeAttemptId: null,
  selectedOptionId: null,
  lastEvaluation: null,
  leaderboardPeriod: 'daily', // 'daily' | 'weekly' | 'overall'
  leaderboardData: null,
  incoisFeed: null,
  serverMissions: null,

  async init() {
    this.state = await GameStorage.loadGameState();
    this.checkInitialAchievements();

    // Check server status & sync online progress if available
    await this.refreshOnlineState();
    this.render();
  },

  async refreshOnlineState() {
    if (typeof ApiClient === 'undefined') return;

    try {
      const isOnline = await ApiClient.checkServerHealth();
      if (isOnline) {
        // Fetch published missions from server
        try {
          this.serverMissions = await ApiClient.getPublishedMissions();
        } catch (e) {
          console.warn('Could not fetch server missions:', e);
        }

        // Fetch INCOIS ocean state forecast for live feed widget
        try {
          const osf = await ApiClient.getIncoisOsf();
          this.incoisFeed = osf;
        } catch (e) {
          console.warn('Could not fetch INCOIS feed:', e);
        }

        // If authenticated user, sync remote progress
        const user = ApiClient.getCurrentUser();
        if (user) {
          try {
            const prog = await ApiClient.getUserProgress();
            if (prog && prog.profile) {
              this.state.score = prog.profile.totalScore;
              this.state.xp = prog.profile.totalXp;
              this.state.streak = prog.profile.currentStreak;
              this.state.maxStreak = prog.profile.maxStreak;
              this.state.hazardIncidents = prog.profile.hazardIncidents;
              this.state.completedMissions = prog.completedMissionIds || [];
              this.state.player.callsign = prog.profile.callsign || this.state.player.callsign;
              this.state.activeRoleId = prog.profile.activeRoleId || this.state.activeRoleId;
            }
          } catch (e) {
            console.warn('Could not sync user progress:', e);
          }
        }
      }
    } catch (err) {
      console.warn('Error refreshing online state:', err);
    }
  },

  checkInitialAchievements() {
    const newlyUnlocked = GameLogic.checkAchievements(
      {
        totalCompleted: this.state.completedMissions.length,
        xp: this.state.xp,
        streak: this.state.streak,
        maxStreak: this.state.maxStreak,
        hazardIncidents: this.state.hazardIncidents
      },
      this.state.history,
      this.state.unlockedAchievements
    );

    if (newlyUnlocked.length > 0) {
      newlyUnlocked.forEach(ach => {
        this.state.unlockedAchievements.push(ach.id);
        this.state.achievementDates[ach.id] = new Date().toISOString();
      });
      GameStorage.saveGameState(this.state);
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

  setActiveRole(roleId) {
    this.state.activeRoleId = roleId;
    GameStorage.saveGameState(this.state);
    if (typeof ApiClient !== 'undefined' && ApiClient.getCurrentUser()) {
      ApiClient.updateSettings({ activeRoleId: roleId }).catch(() => {});
    }
    this.activeSubView = 'dashboard';
    this.render();
  },

  switchSubView(viewName) {
    this.activeSubView = viewName;
    if (viewName === 'leaderboard') {
      this.loadLeaderboardData();
    }
    this.render();
  },

  async loadLeaderboardData() {
    if (typeof ApiClient !== 'undefined' && ApiClient.isOnline()) {
      try {
        let res;
        if (this.leaderboardPeriod === 'weekly') {
          res = await ApiClient.getWeeklyLeaderboard();
        } else if (this.leaderboardPeriod === 'overall') {
          res = await ApiClient.getOverallLeaderboard();
        } else {
          res = await ApiClient.getDailyLeaderboard();
        }
        this.leaderboardData = res;
        this.render();
      } catch (err) {
        console.warn('Failed to load global leaderboards:', err);
        this.leaderboardData = null;
      }
    }
  },

  async launchMission(scenarioId) {
    this.activeMissionId = scenarioId;
    this.selectedOptionId = null;
    this.lastEvaluation = null;
    this.activeAttemptId = null;

    // If online and authenticated, start an authoritative server attempt!
    if (typeof ApiClient !== 'undefined' && ApiClient.isOnline() && ApiClient.getCurrentUser()) {
      try {
        const attemptRes = await ApiClient.startAttempt(scenarioId);
        this.activeAttemptId = attemptRes.attemptId;
      } catch (err) {
        console.warn('Could not start server attempt, falling back to local practice:', err);
      }
    }

    this.activeSubView = 'mission-play';
    this.render();

    const container = document.getElementById('view-missions');
    if (container) container.scrollTop = 0;
  },

  async submitDecision() {
    if (!this.selectedOptionId || !this.activeMissionId) return;

    const isOnlineAuth = typeof ApiClient !== 'undefined' &&
      ApiClient.isOnline() &&
      ApiClient.getCurrentUser() &&
      this.activeAttemptId;

    if (isOnlineAuth) {
      try {
        const res = await ApiClient.submitDecision(this.activeAttemptId, this.selectedOptionId);
        const evalData = res.evaluation;

        this.lastEvaluation = {
          isCorrect: evalData.isCorrect,
          isHazardous: evalData.isHazardous,
          pointsDelta: evalData.pointsDelta,
          earnedXp: evalData.earnedXp,
          feedback: evalData.feedback,
          scienceTakeaway: evalData.scienceTakeaway,
          isReplay: res.isReplay,
          isServerConfirmed: true,
          timestamp: new Date().toISOString()
        };

        if (res.profile) {
          this.state.score = res.profile.totalScore;
          this.state.xp = res.profile.totalXp;
          this.state.streak = res.profile.currentStreak;
          this.state.maxStreak = res.profile.maxStreak;
          this.state.hazardIncidents = res.profile.hazardIncidents;
        }

        if (!this.state.completedMissions.includes(this.activeMissionId)) {
          this.state.completedMissions.push(this.activeMissionId);
        }

        this.activeSubView = 'mission-result';
        this.render();
        const container = document.getElementById('view-missions');
        if (container) container.scrollTop = 0;
        return;
      } catch (err) {
        console.warn('Server decision submission failed, falling back to local evaluation:', err);
      }
    }

    // Local / Offline Evaluation Fallback
    const data = window.OCEAN_GAME_DATA || {};
    const scenario = (data.SCENARIOS || []).find(s => s.id === this.activeMissionId);
    if (!scenario) return;

    const evaluation = GameLogic.evaluateDecision(scenario, this.selectedOptionId, {
      score: this.state.score,
      xp: this.state.xp,
      streak: this.state.streak,
      hazardCount: this.state.hazardIncidents,
      completedMissions: this.state.completedMissions
    });

    this.state.score = evaluation.newScore;
    this.state.xp = evaluation.newXp;
    this.state.streak = evaluation.newStreak;
    this.state.maxStreak = Math.max(this.state.maxStreak || 0, evaluation.newStreak);
    this.state.hazardIncidents = evaluation.newHazardCount;

    if (!this.state.completedMissions.includes(scenario.id)) {
      this.state.completedMissions.push(scenario.id);
    }

    const role = (data.ROLES || []).find(r => r.id === scenario.roleId);
    this.state.history.unshift({
      id: `att-${Date.now()}`,
      scenarioId: scenario.id,
      scenarioTitle: scenario.title,
      roleId: scenario.roleId,
      roleTitle: role ? role.title : 'Maritime Specialist',
      playerName: this.state.player.callsign,
      optionId: this.selectedOptionId,
      optionType: evaluation.optionType,
      isCorrect: evaluation.isCorrect,
      isHazardous: evaluation.isHazardous,
      isHazardousScenario: scenario.difficulty === 'Advanced',
      difficulty: scenario.difficulty,
      pointsDelta: evaluation.pointsDelta,
      earnedXp: evaluation.earnedXp,
      isReplay: evaluation.isReplay,
      timestamp: evaluation.timestamp
    });

    if (this.state.history.length > 60) {
      this.state.history = this.state.history.slice(0, 60);
    }

    const newlyUnlocked = GameLogic.checkAchievements(
      {
        totalCompleted: this.state.completedMissions.length,
        xp: this.state.xp,
        streak: this.state.streak,
        maxStreak: this.state.maxStreak,
        hazardIncidents: this.state.hazardIncidents
      },
      this.state.history,
      this.state.unlockedAchievements
    );

    newlyUnlocked.forEach(ach => {
      this.state.unlockedAchievements.push(ach.id);
      this.state.achievementDates[ach.id] = new Date().toISOString();
    });

    GameStorage.saveGameState(this.state);

    this.lastEvaluation = {
      ...evaluation,
      isServerConfirmed: false
    };
    this.activeSubView = 'mission-result';
    this.render();

    const container = document.getElementById('view-missions');
    if (container) container.scrollTop = 0;
  },

  editCallsign() {
    if (typeof AuthModal !== 'undefined') {
      const user = typeof ApiClient !== 'undefined' ? ApiClient.getCurrentUser() : null;
      if (user) {
        AuthModal.openProfile();
        return;
      }
    }
    const current = this.state.player?.callsign || 'Ocean Explorer';
    const input = prompt('Enter your local Maritime Call Sign / Display Name (Max 24 characters):', current);
    if (input !== null) {
      const sanitized = input.trim().slice(0, 24);
      if (sanitized) {
        this.state.player.callsign = sanitized;
        GameStorage.saveGameState(this.state);
        this.render();
      }
    }
  },

  async confirmResetProgress() {
    if (confirm('Are you sure you want to reset your local mission progress, score, and XP? This cannot be undone.')) {
      this.state = await GameStorage.resetGameState(true);
      this.activeSubView = 'dashboard';
      this.render();
    }
  },

  render() {
    const container = document.getElementById('view-missions');
    if (!container) return;

    if (!this.state) {
      container.innerHTML = `
        <div class="game-loading-panel">
          <div class="loading-spinner"></div>
          <p>Initializing Ocean Literacy Simulation Engine...</p>
        </div>
      `;
      return;
    }

    const data = window.OCEAN_GAME_DATA || { ROLES: [], SCENARIOS: [] };
    const progress = GameLogic.calculateProgress(this.state.xp);
    const isOnline = typeof ApiClient !== 'undefined' && ApiClient.isOnline();
    const currentUser = typeof ApiClient !== 'undefined' ? ApiClient.getCurrentUser() : null;

    container.innerHTML = `
      <div class="game-module-container">
        <!-- Top Gameplay Dashboard Header -->
        <header class="game-top-header">
          <div class="player-profile-bar">
            <div class="player-identity">
              <span class="player-avatar-badge">${progress.badge}</span>
              <div class="player-names">
                <div class="player-callsign-row">
                  <span class="player-callsign" id="playerCallsignLabel">${this.escapeHtml(this.state.player.callsign)}</span>
                  <button class="btn-subtle-edit" id="btnEditCallsign" title="Change Display Name">✎</button>
                  <span class="mode-badge ${isOnline && currentUser ? 'online' : 'offline'}">
                    ${isOnline && currentUser ? '🟢 Server Online' : '🟡 Practice Mode'}
                  </span>
                </div>
                <div class="player-rank">${progress.rankTitle} • Level ${progress.level}</div>
              </div>
            </div>

            <!-- XP Progression Bar -->
            <div class="player-xp-track">
              <div class="xp-labels">
                <span class="xp-current">${progress.xp} XP Total</span>
                <span class="xp-target">${progress.xpInLevel} / 500 XP to Level ${progress.level + 1}</span>
              </div>
              <div class="xp-progress-bar-bg">
                <div class="xp-progress-fill" style="width: ${progress.percent}%"></div>
              </div>
            </div>

            <!-- Key Quick Metrics -->
            <div class="player-stats-cluster">
              <div class="mini-stat-pill" title="Total Accumulated Mission Score">
                <span class="stat-symbol">⚓</span>
                <div class="mini-stat-content">
                  <span class="stat-num">${this.state.score}</span>
                  <span class="stat-tag">Score</span>
                </div>
              </div>
              <div class="mini-stat-pill" title="Unique Completed Scenarios">
                <span class="stat-symbol">🎯</span>
                <div class="mini-stat-content">
                  <span class="stat-num">${this.state.completedMissions.length} / ${data.SCENARIOS.length}</span>
                  <span class="stat-tag">Missions</span>
                </div>
              </div>
              <div class="mini-stat-pill" title="Current Consecutive Correct Decisions">
                <span class="stat-symbol">🔥</span>
                <div class="mini-stat-content">
                  <span class="stat-num">${this.state.streak}</span>
                  <span class="stat-tag">Streak</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Gameplay Sub-Navigation Tabs -->
          <nav class="game-sub-nav">
            <button class="game-tab-btn ${this.activeSubView === 'dashboard' || this.activeSubView === 'mission-play' || this.activeSubView === 'mission-result' ? 'active' : ''}" id="tabDashboard">
              🎮 Mission Operations
            </button>
            <button class="game-tab-btn ${this.activeSubView === 'leaderboard' ? 'active' : ''}" id="tabLeaderboard">
              🏆 Global Leaderboard
            </button>
            <button class="game-tab-btn ${this.activeSubView === 'achievements' ? 'active' : ''}" id="tabAchievements">
              🎖️ Achievements (${this.state.unlockedAchievements.length} / 6)
            </button>
          </nav>
        </header>

        <!-- Sub-View Content Body -->
        <main class="game-body-area">
          ${this.renderSubViewContent(data, progress)}
        </main>
      </div>
    `;

    this.bindEvents(container);
  },

  renderSubViewContent(data, progress) {
    if (this.activeSubView === 'mission-play') {
      return this.renderMissionPlayView(data);
    }
    if (this.activeSubView === 'mission-result') {
      return this.renderMissionResultView(data);
    }
    if (this.activeSubView === 'leaderboard') {
      return this.renderLeaderboardView(data);
    }
    if (this.activeSubView === 'achievements') {
      return this.renderAchievementsView(data);
    }
    return this.renderDashboardView(data);
  },

  renderDashboardView(data) {
    const activeRole = (data.ROLES || []).find(r => r.id === this.state.activeRoleId) || (data.ROLES || [])[0];
    const roleMissions = (data.SCENARIOS || []).filter(s => s.roleId === this.state.activeRoleId);
    const nextMission = roleMissions.find(m => !this.state.completedMissions.includes(m.id)) || roleMissions[0];

    const isOnline = typeof ApiClient !== 'undefined' && ApiClient.isOnline();
    const currentUser = typeof ApiClient !== 'undefined' ? ApiClient.getCurrentUser() : null;

    return `
      <!-- INCOIS Operational Ocean State Live Feed Widget -->
      ${this.renderIncoisLiveWidget()}

      <!-- Role Selection Carousel / Ribbon -->
      <section class="roles-selection-section">
        <div class="section-heading-row">
          <div>
            <h2 class="section-title">Select Operational Ocean Role</h2>
            <p class="section-subtitle">Each role navigates distinct simulated oceanographic services, decision hazards, and safety regulations.</p>
          </div>
          ${nextMission ? `
            <button class="btn-quick-launch" id="btnQuickContinue" data-scenario-id="${nextMission.id}">
              ▶ Quick Mission: ${this.escapeHtml(nextMission.title)}
            </button>
          ` : ''}
        </div>

        <div class="role-cards-grid">
          ${(data.ROLES || []).map(r => {
            const isSelected = r.id === this.state.activeRoleId;
            const completedCount = (data.SCENARIOS || []).filter(s => s.roleId === r.id && this.state.completedMissions.includes(s.id)).length;
            const totalCount = (data.SCENARIOS || []).filter(s => s.roleId === r.id).length;

            return `
              <div class="role-card ${isSelected ? 'selected' : ''}" data-role-id="${r.id}">
                <div class="role-card-header">
                  <span class="role-icon">${r.icon}</span>
                  <span class="role-badge">${r.badge}</span>
                </div>
                <h3 class="role-title">${this.escapeHtml(r.title)}</h3>
                <p class="role-desc">${this.escapeHtml(r.shortDesc)}</p>
                <div class="role-footer">
                  <span class="role-progress">${completedCount}/${totalCount} Missions</span>
                  <button class="btn-select-role">${isSelected ? 'Active Role ✓' : 'Select Role'}</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>

      <!-- Active Role Overview & Scenario Mission Board -->
      <section class="missions-board-section">
        <div class="active-role-summary-card">
          <div class="role-summary-header">
            <span class="summary-icon">${activeRole.icon}</span>
            <div>
              <span class="summary-category">${activeRole.category}</span>
              <h3 class="summary-title">${this.escapeHtml(activeRole.title)} Operational Station</h3>
            </div>
          </div>
          <p class="summary-text">${this.escapeHtml(activeRole.detailedDesc)}</p>
          <div class="service-tags-row">
            <span class="tags-label">Simulated Services Utilized:</span>
            ${(activeRole.keyServices || []).map(s => `<span class="service-pill">${this.escapeHtml(s)}</span>`).join('')}
          </div>
        </div>

        <!-- Scenarios Grid -->
        <div class="scenarios-grid-header">
          <h3 class="board-title">Operational Decision Missions (${roleMissions.length})</h3>
          <span class="board-subtitle">Decisions are evaluated against trusted oceanographic science rules</span>
        </div>

        <div class="scenarios-grid">
          ${roleMissions.map((s, idx) => {
            const isCompleted = this.state.completedMissions.includes(s.id);
            const diffClass = s.difficulty.toLowerCase();

            return `
              <div class="scenario-card ${isCompleted ? 'completed' : ''}" data-scenario-id="${s.id}">
                <div class="scenario-card-top">
                  <span class="scenario-number">Mission #${idx + 1}</span>
                  <span class="difficulty-badge ${diffClass}">${s.difficulty}</span>
                </div>
                <h4 class="scenario-title">${this.escapeHtml(s.title)}</h4>
                <div class="scenario-region">📍 ${this.escapeHtml(s.region)}</div>
                <p class="scenario-objective">${this.escapeHtml(s.objective)}</p>
                <div class="scenario-card-footer">
                  <span class="completion-status ${isCompleted ? 'done' : 'pending'}">
                    ${isCompleted ? 'Completed ✓' : 'Available'}
                  </span>
                  <button class="btn-launch-mission" data-scenario-id="${s.id}">
                    ${isCompleted ? 'Replay Mission' : 'Start Mission ➔'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  renderIncoisLiveWidget() {
    const feed = this.incoisFeed?.data?.forecastParameters;
    const provenance = this.incoisFeed?.provenance;

    return `
      <section class="incois-live-widget">
        <div class="incois-widget-header">
          <div class="incois-brand-group">
            <span class="incois-pulse-dot"></span>
            <div>
              <span class="incois-tag">INCOIS INFORMATION SERVICE</span>
              <h3 class="incois-widget-title">Simulated Coastal Ocean State &amp; Hazard Advisory</h3>
            </div>
          </div>
          <div class="incois-meta-links">
            <span class="incois-freshness-pill simulated">Simulated Educational Model</span>
            <a href="https://www.incois.gov.in" target="_blank" rel="noopener noreferrer" class="incois-ext-link">
              Official INCOIS Portal ↗
            </a>
          </div>
        </div>

        <div class="incois-telemetry-row">
          <div class="incois-pill-item">
            <span class="pill-title">Significant Wave Height</span>
            <span class="pill-value">${feed ? feed.significantWaveHeightMeters?.range || '2.1 m' : '1.8 - 2.5 m (Moderate)'}</span>
            <span class="pill-sub">West Coast Sector</span>
          </div>
          <div class="incois-pill-item">
            <span class="pill-title">Swell Period &amp; Dir</span>
            <span class="pill-value">${feed ? `${feed.swellWaveHeightMeters?.periodSeconds || 12.4}s (SSW)` : '12.4s (South-Southwest)'}</span>
            <span class="pill-sub">Kallakkadal Watch</span>
          </div>
          <div class="incois-pill-item">
            <span class="pill-title">Wind &amp; Gust Speed</span>
            <span class="pill-value">${feed ? `${feed.surfaceWindSpeedKmh?.value || 24} km/h (Gusts ${feed.surfaceWindSpeedKmh?.gustsKmh || 36})` : '24 km/h (Westerly)'}</span>
            <span class="pill-sub">Small Craft Caution</span>
          </div>
          <div class="incois-pill-item">
            <span class="pill-title">Tsunami Warning Level</span>
            <span class="pill-value text-emerald">NO THREAT / NORMAL</span>
            <span class="pill-sub">ITEWS Indian Ocean</span>
          </div>
        </div>

        <div class="incois-disclaimer-strip">
          ⚠️ <strong>EDUCATIONAL SIMULATION NOTICE:</strong> Ocean State telemetry is modeled for instructional gameplay and classroom awareness. For real-world maritime safety, vessels must strictly consult live <a href="https://www.incois.gov.in" target="_blank" class="incois-link-inline">INCOIS bulletins</a> and port authority VHF advisories.
        </div>
      </section>
    `;
  },

  renderMissionPlayView(data) {
    const scenario = (data.SCENARIOS || []).find(s => s.id === this.activeMissionId);
    if (!scenario) return `<p>Scenario not found.</p>`;

    const isReplay = this.state.completedMissions.includes(scenario.id);
    const isOnline = typeof ApiClient !== 'undefined' && ApiClient.isOnline();
    const currentUser = typeof ApiClient !== 'undefined' ? ApiClient.getCurrentUser() : null;

    return `
      <div class="mission-play-container">
        <!-- Navigation Breadcrumb -->
        <div class="mission-nav-bar">
          <button class="btn-nav-back" id="btnBackToDashboard">← Back to Mission Board</button>
          <div class="mission-meta-crumbs">
            <span class="crumb-role">${scenario.roleId.toUpperCase()}</span>
            <span class="crumb-sep">/</span>
            <span class="crumb-diff ${scenario.difficulty.toLowerCase()}">${scenario.difficulty}</span>
          </div>
        </div>

        <!-- Mandatory Simulation Notice Banner -->
        <div class="simulation-alert-banner">
          <span class="alert-icon">⚠️</span>
          <div class="alert-text">
            <strong>NOTICE:</strong> ${this.escapeHtml(scenario.simulationNotice)}
          </div>
        </div>

        ${isReplay ? `
          <div class="practice-mode-banner">
            ℹ️ <strong>Practice Run:</strong> You have previously completed this mission. Replaying allows decision practice without inflating competitive global rankings.
          </div>
        ` : ''}

        ${!isOnline || !currentUser ? `
          <div class="practice-mode-banner offline">
            🟡 <strong>Offline Practice Mode:</strong> Decisions are evaluated locally. Sign in to record authoritative attempts on the global leaderboard.
          </div>
        ` : ''}

        <!-- Mission Title & Regional Context -->
        <div class="mission-hero-card">
          <div class="hero-header-row">
            <div>
              <span class="hero-service-badge">📡 ${this.escapeHtml(scenario.serviceLabel || 'INCOIS Advisory')}</span>
              <h1 class="mission-hero-title">${this.escapeHtml(scenario.title)}</h1>
              <div class="mission-location-meta">📍 ${this.escapeHtml(scenario.region)}</div>
            </div>
            <div class="hero-points-badge">
              <span class="points-val">+100</span>
              <span class="points-lbl">Max Points</span>
            </div>
          </div>

          <div class="mission-briefing-block">
            <h4 class="briefing-title">Operational Objective</h4>
            <p class="briefing-text">${this.escapeHtml(scenario.objective)}</p>
          </div>

          <div class="mission-briefing-block situation">
            <h4 class="briefing-title">Situation Briefing</h4>
            <p class="briefing-text">${this.escapeHtml(scenario.situationBriefing)}</p>
          </div>
        </div>

        <!-- Simulated Ocean Information Telemetry Cards -->
        <div class="ocean-telemetry-section">
          <div class="telemetry-section-title">
            <span>🌊 Simulated Ocean Conditions & Services</span>
            <span class="telemetry-subtitle">Examine simulated parameters carefully before committing your vessel or team</span>
          </div>

          <div class="telemetry-grid">
            ${(scenario.oceanConditions || []).map(cond => {
              const statusClass = cond.status || 'info';
              return `
                <div class="telemetry-card ${statusClass}">
                  <div class="telemetry-label">${this.escapeHtml(cond.label)}</div>
                  <div class="telemetry-value">${this.escapeHtml(cond.value)}</div>
                  <div class="telemetry-indicator ${statusClass}"></div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <!-- Interactive Decision Section -->
        <div class="decision-making-section">
          <div class="decision-header">
            <h3 class="decision-title">Select Your Operational Decision:</h3>
            <span class="decision-prompt">Choose the safest and most scientifically responsible course of action</span>
          </div>

          <div class="decision-options-list">
            ${(scenario.options || []).map(opt => {
              const isSelected = this.selectedOptionId === opt.id;
              return `
                <div class="decision-option-card ${isSelected ? 'selected' : ''}" data-option-id="${opt.id}">
                  <div class="option-radio-indicator">
                    <span class="radio-dot"></span>
                  </div>
                  <div class="option-content">
                    <div class="option-text">${this.escapeHtml(opt.text)}</div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="decision-action-bar">
            <button class="btn-submit-decision ${!this.selectedOptionId ? 'disabled' : ''}" id="btnSubmitDecision" ${!this.selectedOptionId ? 'disabled' : ''}>
              Commit Operational Decision ➔
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderMissionResultView(data) {
    const scenario = (data.SCENARIOS || []).find(s => s.id === this.activeMissionId);
    const evaluation = this.lastEvaluation;
    if (!scenario || !evaluation) return `<p>No evaluation available.</p>`;

    const roleMissions = (data.SCENARIOS || []).filter(s => s.roleId === this.state.activeRoleId);
    const nextMission = roleMissions.find(m => !this.state.completedMissions.includes(m.id));

    return `
      <div class="mission-result-container">
        <!-- Outcome Banner -->
        <div class="result-banner ${evaluation.isCorrect ? 'correct' : (evaluation.isHazardous ? 'hazardous' : 'incorrect')}">
          <div class="result-banner-icon">
            ${evaluation.isCorrect ? '✅' : (evaluation.isHazardous ? '⚠️' : '❌')}
          </div>
          <div class="result-banner-text">
            <h2 class="result-title">
              ${evaluation.isCorrect ? 'Sound Maritime Decision!' : (evaluation.isHazardous ? 'Hazardous Choice / Critical Penalty!' : 'Suboptimal Operational Choice')}
            </h2>
            <p class="result-subtitle">
              ${evaluation.isCorrect ? 'Your decision adhered to oceanic safety limits and scientific recommendations.' : 'Your choice risked vessel safety, gear integrity, or coastal community welfare.'}
            </p>
          </div>
          <div class="result-score-tag ${evaluation.pointsDelta >= 0 ? 'positive' : 'negative'}">
            <span class="score-delta">${evaluation.pointsDelta >= 0 ? `+${evaluation.pointsDelta}` : evaluation.pointsDelta} pts</span>
            <span class="xp-delta">${evaluation.earnedXp > 0 ? `+${evaluation.earnedXp} XP` : '0 XP'}</span>
          </div>
        </div>

        ${evaluation.isServerConfirmed ? `
          <div class="server-confirmed-pill">
            🔒 <strong>Server-Authoritative Result:</strong> Transaction confirmed and written to PostgreSQL authoritative ledger.
          </div>
        ` : `
          <div class="practice-mode-banner offline">
            🟡 <strong>Practice Result:</strong> Evaluated locally in offline practice mode.
          </div>
        `}

        <!-- Detailed Feedback & Educational Science Takeaways -->
        <div class="result-details-card">
          <div class="detail-section">
            <h4 class="detail-subtitle">Operational Analysis</h4>
            <p class="detail-body">${this.escapeHtml(evaluation.feedback)}</p>
          </div>

          <div class="detail-section science-takeaway">
            <h4 class="detail-subtitle">Scientific & Safety Takeaway (INCOIS Framework)</h4>
            <p class="detail-body">${this.escapeHtml(evaluation.scienceTakeaway)}</p>
          </div>
        </div>

        <!-- Action Navigation Buttons -->
        <div class="result-action-bar">
          <button class="btn-result-action secondary" id="btnReplayCurrent">
            🔄 Replay This Scenario
          </button>
          <button class="btn-result-action secondary" id="btnReturnToBoard">
            📋 Mission Dashboard
          </button>
          ${nextMission ? `
            <button class="btn-result-action primary" id="btnLaunchNext" data-scenario-id="${nextMission.id}">
              Next Mission: ${this.escapeHtml(nextMission.title)} ➔
            </button>
          ` : `
            <button class="btn-result-action primary" id="btnViewLeaderboard">
              View Leaderboard 🏆
            </button>
          `}
        </div>
      </div>
    `;
  },

  renderLeaderboardView(data) {
    const isOnline = typeof ApiClient !== 'undefined' && ApiClient.isOnline();
    const period = this.leaderboardPeriod;

    let entries = [];
    let currentUserRank = null;
    let methodology = null;

    if (isOnline && this.leaderboardData) {
      entries = this.leaderboardData.leaderboard || [];
      currentUserRank = this.leaderboardData.currentUserRank;
      methodology = this.leaderboardData.methodology;
    } else {
      // Local fallback
      entries = GameLogic.groupLeaderboard(this.state.history, period, new Date());
    }

    return `
      <div class="leaderboard-container">
        <div class="leaderboard-header-row">
          <div>
            <h2 class="section-title">Global Ocean Literacy Leaderboard</h2>
            <p class="section-subtitle">
              ${isOnline ? 'Authoritative rankings verified by PostgreSQL server engine in Asia/Kolkata timezone (IST).' : 'Operating in offline practice mode. Sign in to view live global rankings.'}
            </p>
          </div>

          <!-- Period Toggle (Daily, Weekly, Overall) -->
          <div class="period-toggle-group">
            <button class="period-toggle-btn ${period === 'daily' ? 'active' : ''}" id="btnPeriodDaily">Daily (IST)</button>
            <button class="period-toggle-btn ${period === 'weekly' ? 'active' : ''}" id="btnPeriodWeekly">Weekly (IST)</button>
            <button class="period-toggle-btn ${period === 'overall' ? 'active' : ''}" id="btnPeriodOverall">Overall Global</button>
          </div>
        </div>

        ${currentUserRank ? `
          <div class="current-user-rank-card">
            <span class="user-rank-icon">⭐</span>
            <div class="user-rank-info">
              <span class="rank-title">Your Current Ranking:</span>
              <span class="rank-details">Rank #${currentUserRank.rank} • ${currentUserRank.score} pts • ${currentUserRank.xp} XP</span>
            </div>
          </div>
        ` : ''}

        <div class="leaderboard-notice-card">
          ℹ️ <strong>Scoring Policy:</strong> Deterministic tie-breaking (Score DESC ➔ XP DESC ➔ Earliest Timestamp ASC). Only finalized server-evaluated attempts enter competitive leaderboards. Unranked replays prevent point inflation.
        </div>

        <div class="leaderboard-table-card">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Navigator / Callsign</th>
                <th>Role Station</th>
                <th>Level</th>
                <th>Score</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              ${entries.length > 0 ? entries.map(e => `
                <tr class="${currentUserRank && e.userId === currentUserRank.userId ? 'my-rank-row' : ''}">
                  <td class="rank-col">
                    <span class="rank-circle rank-${e.rank}">${e.rank}</span>
                  </td>
                  <td class="name-col">
                    <strong>${this.escapeHtml(e.callsign || e.playerName)}</strong>
                  </td>
                  <td class="role-col">${this.escapeHtml(e.activeRoleId || e.roleTitle || 'Cadet')}</td>
                  <td class="level-col">Lvl ${e.level || 1}</td>
                  <td class="score-col"><strong>${e.score} pts</strong></td>
                  <td class="xp-col text-cyan">${e.xp || 0} XP</td>
                </tr>
              `).join('') : `
                <tr>
                  <td colspan="6" class="text-center p-4 text-secondary">No competitive score records found for this period. Complete a mission to set the first score!</td>
                </tr>
              `}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAchievementsView(data) {
    const list = GameLogic.ACHIEVEMENTS;

    return `
      <div class="achievements-container">
        <div class="achievements-header">
          <h2 class="section-title">Maritime Milestone Achievements</h2>
          <p class="section-subtitle">Earn recognition as you advance from novice Cadet to master Ocean Steward.</p>
        </div>

        <div class="achievements-grid">
          ${list.map(ach => {
            const isUnlocked = this.state.unlockedAchievements.includes(ach.id);
            const dateStr = this.state.achievementDates[ach.id];
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : '';

            return `
              <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="ach-icon-wrapper">
                  <span class="ach-icon">${ach.icon}</span>
                  ${isUnlocked ? '<span class="ach-unlocked-check">✓</span>' : ''}
                </div>
                <div class="ach-content">
                  <h3 class="ach-title">${this.escapeHtml(ach.title)}</h3>
                  <p class="ach-desc">${this.escapeHtml(ach.desc)}</p>
                  <div class="ach-meta">
                    <span class="ach-criteria">🎯 ${this.escapeHtml(ach.criteria)}</span>
                    <span class="ach-status ${isUnlocked ? 'done' : 'lock'}">
                      ${isUnlocked ? `Unlocked: ${formattedDate}` : 'Locked'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // Callsign editing
    const btnEdit = container.querySelector('#btnEditCallsign');
    if (btnEdit) btnEdit.addEventListener('click', () => this.editCallsign());

    // Sub-tab navigation
    const tabDash = container.querySelector('#tabDashboard');
    const tabLead = container.querySelector('#tabLeaderboard');
    const tabAch = container.querySelector('#tabAchievements');

    if (tabDash) tabDash.addEventListener('click', () => this.switchSubView('dashboard'));
    if (tabLead) tabLead.addEventListener('click', () => this.switchSubView('leaderboard'));
    if (tabAch) tabAch.addEventListener('click', () => this.switchSubView('achievements'));

    // Role card selection
    container.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        const roleId = card.dataset.roleId;
        if (roleId) this.setActiveRole(roleId);
      });
    });

    // Quick continue
    const btnQuick = container.querySelector('#btnQuickContinue');
    if (btnQuick) {
      btnQuick.addEventListener('click', () => {
        const id = btnQuick.dataset.scenarioId;
        if (id) this.launchMission(id);
      });
    }

    // Launch mission buttons
    container.querySelectorAll('.btn-launch-mission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.scenarioId;
        if (id) this.launchMission(id);
      });
    });

    // Back to dashboard
    const btnBack = container.querySelector('#btnBackToDashboard');
    if (btnBack) btnBack.addEventListener('click', () => this.switchSubView('dashboard'));

    const btnReturnToBoard = container.querySelector('#btnReturnToBoard');
    if (btnReturnToBoard) btnReturnToBoard.addEventListener('click', () => this.switchSubView('dashboard'));

    // Decision option card selection
    container.querySelectorAll('.decision-option-card').forEach(card => {
      card.addEventListener('click', () => {
        container.querySelectorAll('.decision-option-card').forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.selectedOptionId = card.dataset.optionId;

        const submitBtn = container.querySelector('#btnSubmitDecision');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.classList.remove('disabled');
        }
      });
    });

    // Submit decision
    const btnSubmit = container.querySelector('#btnSubmitDecision');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => this.submitDecision());
    }

    // Replay current mission
    const btnReplay = container.querySelector('#btnReplayCurrent');
    if (btnReplay && this.activeMissionId) {
      btnReplay.addEventListener('click', () => this.launchMission(this.activeMissionId));
    }

    // Launch next mission
    const btnNext = container.querySelector('#btnLaunchNext');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const id = btnNext.dataset.scenarioId;
        if (id) this.launchMission(id);
      });
    }

    // View Leaderboard from Result screen
    const btnViewLead = container.querySelector('#btnViewLeaderboard');
    if (btnViewLead) {
      btnViewLead.addEventListener('click', () => this.switchSubView('leaderboard'));
    }

    // Leaderboard period toggles
    const btnDaily = container.querySelector('#btnPeriodDaily');
    const btnWeekly = container.querySelector('#btnPeriodWeekly');
    const btnOverall = container.querySelector('#btnPeriodOverall');
    if (btnDaily) {
      btnDaily.addEventListener('click', () => {
        this.leaderboardPeriod = 'daily';
        this.loadLeaderboardData();
      });
    }
    if (btnWeekly) {
      btnWeekly.addEventListener('click', () => {
        this.leaderboardPeriod = 'weekly';
        this.loadLeaderboardData();
      });
    }
    if (btnOverall) {
      btnOverall.addEventListener('click', () => {
        this.leaderboardPeriod = 'overall';
        this.loadLeaderboardData();
      });
    }
  }
};
