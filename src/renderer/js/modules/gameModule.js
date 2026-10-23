/**
 * Ocean Literacy - Gamified Missions UI Module (Phase 1)
 *
 * Coordinates the primary gameplay dashboard, role selection, mission briefings,
 * simulated oceanographic data cards, interactive decision evaluation,
 * local daily/weekly leaderboards, achievements, and player progress.
 */

const GameModule = {
  state: null,
  activeSubView: 'dashboard', // 'dashboard' | 'mission-play' | 'mission-result' | 'leaderboard' | 'achievements'
  activeMissionId: null,
  selectedOptionId: null,
  lastEvaluation: null,
  leaderboardPeriod: 'daily', // 'daily' | 'weekly'

  async init() {
    this.state = await GameStorage.loadGameState();
    this.checkInitialAchievements();
    this.render();
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
    this.activeSubView = 'dashboard';
    this.render();
  },

  switchSubView(viewName) {
    this.activeSubView = viewName;
    this.render();
  },

  launchMission(scenarioId) {
    this.activeMissionId = scenarioId;
    this.selectedOptionId = null;
    this.lastEvaluation = null;
    this.activeSubView = 'mission-play';
    this.render();

    // Scroll container to top
    const container = document.getElementById('view-missions');
    if (container) container.scrollTop = 0;
  },

  submitDecision() {
    if (!this.selectedOptionId || !this.activeMissionId) return;

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

    // Update state
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
      isHazardousScenario: scenario.difficulty === 'Advanced' && (scenario.serviceLabel.includes('Alert') || scenario.serviceLabel.includes('Warning')),
      difficulty: scenario.difficulty,
      pointsDelta: evaluation.pointsDelta,
      earnedXp: evaluation.earnedXp,
      isReplay: evaluation.isReplay,
      timestamp: evaluation.timestamp
    });

    // Cap history length to last 60 records
    if (this.state.history.length > 60) {
      this.state.history = this.state.history.slice(0, 60);
    }

    // Check newly unlocked achievements
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

    this.lastEvaluation = evaluation;
    this.activeSubView = 'mission-result';
    this.render();

    const container = document.getElementById('view-missions');
    if (container) container.scrollTop = 0;
  },

  editCallsign() {
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
              🏆 Local Leaderboard
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

    // Find next uncompleted mission for quick start
    const nextMission = roleMissions.find(m => !this.state.completedMissions.includes(m.id)) || roleMissions[0];

    return `
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
          <h3 class="scenarios-heading">Available Operational Scenarios (${roleMissions.length})</h3>
          <span class="simulation-tag-pill">Simulated Ocean Telemetry</span>
        </div>

        <div class="scenarios-grid">
          ${roleMissions.map((scen, idx) => {
            const isCompleted = this.state.completedMissions.includes(scen.id);
            const diffClass = scen.difficulty.toLowerCase();

            return `
              <div class="scenario-card ${isCompleted ? 'completed' : ''}" data-scenario-id="${scen.id}">
                <div class="scenario-card-top">
                  <span class="difficulty-badge ${diffClass}">${scen.difficulty}</span>
                  <span class="scenario-status-badge ${isCompleted ? 'done' : 'new'}">
                    ${isCompleted ? '✓ Completed' : 'Mission 0' + (idx + 1)}
                  </span>
                </div>
                <h4 class="scenario-card-title">${this.escapeHtml(scen.title)}</h4>
                <div class="scenario-region-tag">📍 ${this.escapeHtml(scen.region)}</div>
                <div class="scenario-service-tag">📡 ${this.escapeHtml(scen.serviceLabel)}</div>
                <p class="scenario-objective-snippet">${this.escapeHtml(scen.objective)}</p>
                <div class="scenario-card-bottom">
                  <span class="reward-hint">+100 pts • +100 XP</span>
                  <button class="btn-launch-mission ${isCompleted ? 'secondary' : 'primary'}" data-scenario-id="${scen.id}">
                    ${isCompleted ? 'Replay for Practice' : 'Launch Briefing ➔'}
                  </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </section>
    `;
  },

  renderMissionPlayView(data) {
    const scenario = (data.SCENARIOS || []).find(s => s.id === this.activeMissionId);
    if (!scenario) {
      return `
        <div class="error-panel">
          <p>Scenario not found. Return to dashboard.</p>
          <button class="btn-return-dashboard" id="btnReturnDashboard">Return</button>
        </div>
      `;
    }

    const isReplay = this.state.completedMissions.includes(scenario.id);

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
            ℹ️ <strong>Practice Run:</strong> You have previously completed this mission. You can practice decisions freely; repeated plays will not artificially inflate your leaderboard score.
          </div>
        ` : ''}

        <!-- Mission Title & Regional Context -->
        <div class="mission-hero-card">
          <div class="hero-header-row">
            <div>
              <span class="hero-service-badge">📡 ${this.escapeHtml(scenario.serviceLabel)}</span>
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
    const evaluation = this.lastEvaluation;
    if (!evaluation) {
      return this.renderDashboardView(data);
    }

    const scenario = (data.SCENARIOS || []).find(s => s.id === evaluation.scenarioId);
    let outcomeClass = 'incorrect';
    let outcomeHeading = 'Operational Choice Evaluated';
    let outcomeIcon = '❌';

    if (evaluation.isCorrect) {
      outcomeClass = 'correct';
      outcomeHeading = 'Optimal Decision! Mission Accomplished';
      outcomeIcon = '✅';
    } else if (evaluation.isPartial) {
      outcomeClass = 'partial';
      outcomeHeading = 'Partially Acceptable Course of Action';
      outcomeIcon = '⚠️';
    } else if (evaluation.isHazardous) {
      outcomeClass = 'hazardous';
      outcomeHeading = 'Severe Coastal & Maritime Hazard Triggered';
      outcomeIcon = '🚨';
    }

    const nextMission = (data.SCENARIOS || []).find(s => s.roleId === this.state.activeRoleId && !this.state.completedMissions.includes(s.id));

    return `
      <div class="mission-result-container">
        <!-- Prominent Outcome Banner -->
        <div class="result-banner ${outcomeClass}">
          <div class="result-icon">${outcomeIcon}</div>
          <div class="result-summary">
            <h2 class="result-heading">${outcomeHeading}</h2>
            <div class="result-metrics-row">
              <span class="score-delta ${evaluation.pointsDelta >= 0 ? 'pos' : 'neg'}">
                ${evaluation.pointsDelta >= 0 ? '+' + evaluation.pointsDelta : evaluation.pointsDelta} Score
              </span>
              <span class="xp-delta ${evaluation.earnedXp > 0 ? 'pos' : 'zero'}">
                +${evaluation.earnedXp} XP
              </span>
              ${evaluation.isReplay ? `
                <span class="replay-tag">Practice Run (No Duplicate XP)</span>
              ` : ''}
              ${evaluation.isCorrect ? `
                <span class="streak-tag">🔥 Streak: ${this.state.streak}</span>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Detailed Feedback & Explanation Card -->
        <div class="result-detail-card">
          <div class="detail-section">
            <h4 class="detail-subtitle">Operational Analysis</h4>
            <p class="detail-body">${this.escapeHtml(evaluation.feedback)}</p>
          </div>

          <div class="detail-section science-takeaway">
            <h4 class="detail-subtitle">Scientific & Safety Takeaway (INCOIS Framework)</h4>
            <p class="detail-body">${this.escapeHtml(evaluation.scienceTakeaway)}</p>
          </div>

          ${evaluation.sourceUrl ? `
            <div class="detail-section reference">
              <span class="ref-label">Official Reference:</span>
              <a href="${evaluation.sourceUrl}" target="_blank" rel="noopener noreferrer" class="ref-link">
                ${this.escapeHtml(evaluation.sourceUrl)}
              </a>
            </div>
          ` : ''}
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
    const period = this.leaderboardPeriod;
    const entries = GameLogic.groupLeaderboard(this.state.history, period, new Date());

    return `
      <div class="leaderboard-container">
        <div class="leaderboard-header-row">
          <div>
            <h2 class="section-title">Local Maritime Leaderboard</h2>
            <p class="section-subtitle">
              Calculated from local session performance on this machine and verified demo entries.
            </p>
          </div>

          <!-- Daily / Weekly Toggle -->
          <div class="period-toggle-group">
            <button class="period-toggle-btn ${period === 'daily' ? 'active' : ''}" id="btnPeriodDaily">Today's Local Rank</button>
            <button class="period-toggle-btn ${period === 'weekly' ? 'active' : ''}" id="btnPeriodWeekly">This Week's Local Rank</button>
          </div>
        </div>

        <div class="leaderboard-notice-card">
          ℹ️ <strong>Notice:</strong> Phase 1 runs in offline-first mode. All entries represent your local session and simulated demo competitors. Scores are never sent to external servers.
        </div>

        <div class="leaderboard-table-card">
          <table class="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Navigator / Callsign</th>
                <th>Role Station</th>
                <th>Session Score</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              ${entries.map(e => `
                <tr class="${e.isDemo ? 'demo-row' : 'player-row'}">
                  <td class="rank-col">
                    <span class="rank-circle rank-${e.rank}">${e.rank}</span>
                  </td>
                  <td class="name-col">
                    <strong>${this.escapeHtml(e.playerName)}</strong>
                  </td>
                  <td class="role-col">${this.escapeHtml(e.roleTitle)}</td>
                  <td class="score-col"><strong>${e.score} pts</strong></td>
                  <td class="type-col">
                    <span class="type-badge ${e.isDemo ? 'demo' : 'local'}">
                      ${e.isDemo ? 'Fictional Demo' : 'Local Attempt'}
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderAchievementsView(data) {
    const achievements = GameLogic.ACHIEVEMENTS || [];
    const unlockedSet = new Set(this.state.unlockedAchievements || []);

    return `
      <div class="achievements-container">
        <div class="section-heading-row">
          <div>
            <h2 class="section-title">Ocean Steward Achievements</h2>
            <p class="section-subtitle">Earn distinctions by demonstrating operational safety, endurance streaks, and scientific mastery.</p>
          </div>
          <div class="achievements-count-badge">
            ${unlockedSet.size} / ${achievements.length} Unlocked
          </div>
        </div>

        <div class="achievements-grid">
          ${achievements.map(ach => {
            const isUnlocked = unlockedSet.has(ach.id);
            const dateStr = this.state.achievementDates[ach.id];
            const formattedDate = dateStr ? new Date(dateStr).toLocaleDateString() : '';

            return `
              <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon-wrapper">
                  <span class="achievement-icon">${ach.icon}</span>
                </div>
                <div class="achievement-info">
                  <div class="achievement-title-row">
                    <h3 class="achievement-title">${this.escapeHtml(ach.title)}</h3>
                    <span class="status-indicator-tag">${isUnlocked ? 'Unlocked ✓' : 'Locked'}</span>
                  </div>
                  <p class="achievement-desc">${this.escapeHtml(ach.desc)}</p>
                  <div class="achievement-criteria">
                    <span>Criteria: ${this.escapeHtml(ach.criteria)}</span>
                    ${isUnlocked && formattedDate ? `<span class="unlocked-date">Unlocked ${formattedDate}</span>` : ''}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="reset-progress-area">
          <button class="btn-reset-danger" id="btnResetProgress">
            ⚠️ Reset Local Mission Progress
          </button>
        </div>
      </div>
    `;
  },

  bindEvents(container) {
    // 1. Callsign editing
    const btnEdit = container.querySelector('#btnEditCallsign');
    if (btnEdit) {
      btnEdit.addEventListener('click', () => this.editCallsign());
    }

    // 2. Sub-tab navigation
    const tabDash = container.querySelector('#tabDashboard');
    const tabLead = container.querySelector('#tabLeaderboard');
    const tabAch = container.querySelector('#tabAchievements');

    if (tabDash) tabDash.addEventListener('click', () => this.switchSubView('dashboard'));
    if (tabLead) tabLead.addEventListener('click', () => this.switchSubView('leaderboard'));
    if (tabAch) tabAch.addEventListener('click', () => this.switchSubView('achievements'));

    // 3. Role card selection
    container.querySelectorAll('.role-card').forEach(card => {
      card.addEventListener('click', () => {
        const roleId = card.dataset.roleId;
        if (roleId) this.setActiveRole(roleId);
      });
    });

    // 4. Quick continue
    const btnQuick = container.querySelector('#btnQuickContinue');
    if (btnQuick) {
      btnQuick.addEventListener('click', () => {
        const id = btnQuick.dataset.scenarioId;
        if (id) this.launchMission(id);
      });
    }

    // 5. Launch mission buttons
    container.querySelectorAll('.btn-launch-mission').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.scenarioId;
        if (id) this.launchMission(id);
      });
    });

    // 6. Navigation back to dashboard
    const btnBack = container.querySelector('#btnBackToDashboard');
    if (btnBack) {
      btnBack.addEventListener('click', () => this.switchSubView('dashboard'));
    }

    const btnReturn = container.querySelector('#btnReturnDashboard');
    if (btnReturn) {
      btnReturn.addEventListener('click', () => this.switchSubView('dashboard'));
    }

    const btnReturnToBoard = container.querySelector('#btnReturnToBoard');
    if (btnReturnToBoard) {
      btnReturnToBoard.addEventListener('click', () => this.switchSubView('dashboard'));
    }

    // 7. Decision option card selection
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

    // 8. Submit decision button
    const btnSubmit = container.querySelector('#btnSubmitDecision');
    if (btnSubmit) {
      btnSubmit.addEventListener('click', () => this.submitDecision());
    }

    // 9. Replay current mission
    const btnReplay = container.querySelector('#btnReplayCurrent');
    if (btnReplay && this.activeMissionId) {
      btnReplay.addEventListener('click', () => this.launchMission(this.activeMissionId));
    }

    // 10. Launch next mission
    const btnNext = container.querySelector('#btnLaunchNext');
    if (btnNext) {
      btnNext.addEventListener('click', () => {
        const id = btnNext.dataset.scenarioId;
        if (id) this.launchMission(id);
      });
    }

    // 11. View Leaderboard from Result screen
    const btnViewLead = container.querySelector('#btnViewLeaderboard');
    if (btnViewLead) {
      btnViewLead.addEventListener('click', () => this.switchSubView('leaderboard'));
    }

    // 12. Leaderboard period toggle
    const btnDaily = container.querySelector('#btnPeriodDaily');
    const btnWeekly = container.querySelector('#btnPeriodWeekly');
    if (btnDaily) {
      btnDaily.addEventListener('click', () => {
        this.leaderboardPeriod = 'daily';
        this.render();
      });
    }
    if (btnWeekly) {
      btnWeekly.addEventListener('click', () => {
        this.leaderboardPeriod = 'weekly';
        this.render();
      });
    }

    // 13. Reset progress
    const btnReset = container.querySelector('#btnResetProgress');
    if (btnReset) {
      btnReset.addEventListener('click', () => this.confirmResetProgress());
    }
  }
};
