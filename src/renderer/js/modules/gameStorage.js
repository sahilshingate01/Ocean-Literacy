/**
 * Ocean Literacy - Persistence & Local Storage Adapter (Phase 1)
 *
 * Provides a resilient, versioned storage layer that operates seamlessly
 * in both Electron desktop (via the secure contextBridge oceanAPI) and standard
 * web/mobile browsers (via localStorage).
 *
 * Non-destructively preserves existing application user data (bookmarks, notes,
 * quiz records, pledges) during saves and schema migrations.
 */

(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.GameStorage = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const STORAGE_KEY = 'ocean_literacy_game_state_v1';
  const CURRENT_SCHEMA_VERSION = 1;

  function createDefaultState() {
    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      player: {
        callsign: 'Ocean Explorer',
        createdAt: new Date().toISOString()
      },
      activeRoleId: 'fisher',
      score: 0,
      xp: 0,
      streak: 0,
      maxStreak: 0,
      hazardIncidents: 0,
      completedMissions: [],
      history: [],
      unlockedAchievements: [],
      achievementDates: {},
      settings: {
        soundAtmosphere: false,
        reducedMotion: false
      }
    };
  }

  /**
   * Sanitizes and validates a loaded game state against the versioned schema.
   * Auto-repairs missing properties, NaN numbers, or malformed arrays.
   */
  function validateAndMigrateState(candidate) {
    if (!candidate || typeof candidate !== 'object') {
      return createDefaultState();
    }

    const base = createDefaultState();

    const safeCallsign = typeof candidate.player?.callsign === 'string' && candidate.player.callsign.trim()
      ? candidate.player.callsign.trim().slice(0, 32)
      : base.player.callsign;

    const safePlayer = {
      callsign: safeCallsign,
      createdAt: candidate.player?.createdAt || base.player.createdAt
    };

    const validRoles = ['fisher', 'captain', 'tourism_operator', 'community_volunteer', 'conservation_ranger'];
    const safeRoleId = validRoles.includes(candidate.activeRoleId) ? candidate.activeRoleId : 'fisher';

    const safeScore = Math.max(0, Number(candidate.score) || 0);
    const safeXp = Math.max(0, Number(candidate.xp) || 0);
    const safeStreak = Math.max(0, Number(candidate.streak) || 0);
    const safeMaxStreak = Math.max(safeStreak, Number(candidate.maxStreak) || 0);
    const safeHazardIncidents = Math.max(0, Number(candidate.hazardIncidents) || 0);

    const safeCompletedMissions = Array.isArray(candidate.completedMissions)
      ? Array.from(new Set(candidate.completedMissions.filter(id => typeof id === 'string')))
      : [];

    const safeHistory = Array.isArray(candidate.history)
      ? candidate.history.filter(h => h && typeof h === 'object' && h.scenarioId)
      : [];

    const safeUnlockedAchievements = Array.isArray(candidate.unlockedAchievements)
      ? Array.from(new Set(candidate.unlockedAchievements.filter(id => typeof id === 'string')))
      : [];

    const safeAchievementDates = (candidate.achievementDates && typeof candidate.achievementDates === 'object')
      ? candidate.achievementDates
      : {};

    const safeSettings = {
      soundAtmosphere: Boolean(candidate.settings?.soundAtmosphere),
      reducedMotion: Boolean(candidate.settings?.reducedMotion)
    };

    return {
      schemaVersion: CURRENT_SCHEMA_VERSION,
      player: safePlayer,
      activeRoleId: safeRoleId,
      score: safeScore,
      xp: safeXp,
      streak: safeStreak,
      maxStreak: safeMaxStreak,
      hazardIncidents: safeHazardIncidents,
      completedMissions: safeCompletedMissions,
      history: safeHistory,
      unlockedAchievements: safeUnlockedAchievements,
      achievementDates: safeAchievementDates,
      settings: safeSettings
    };
  }

  /**
   * Loads player game state asynchronously from Electron IPC or fallback localStorage.
   */
  async function loadGameState() {
    let raw = null;

    // 1. Try Electron native bridge
    if (typeof window !== 'undefined' && window.oceanAPI && typeof window.oceanAPI.loadUserData === 'function') {
      try {
        const fullData = await window.oceanAPI.loadUserData();
        if (fullData && fullData.gameState) {
          raw = fullData.gameState;
        }
      } catch (err) {
        console.warn('GameStorage: Error loading from Electron storage bridge, checking fallback:', err);
      }
    }

    // 2. Fallback to localStorage if not loaded from Electron
    if (!raw && typeof window !== 'undefined' && window.localStorage) {
      try {
        const item = window.localStorage.getItem(STORAGE_KEY);
        if (item) {
          raw = JSON.parse(item);
        }
      } catch (err) {
        console.warn('GameStorage: Error reading localStorage:', err);
      }
    }

    return validateAndMigrateState(raw);
  }

  /**
   * Persists player game state into Electron IPC storage and synchronizes with localStorage.
   */
  async function saveGameState(state) {
    const validated = validateAndMigrateState(state);

    // 1. Persist to localStorage for immediate offline browser recovery
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
      } catch (err) {
        console.warn('GameStorage: Could not write to localStorage:', err);
      }
    }

    // 2. Persist to Electron disk storage without overwriting other modules (pledges, bookmarks, etc.)
    if (typeof window !== 'undefined' && window.oceanAPI && typeof window.oceanAPI.saveUserData === 'function') {
      try {
        const existingData = (await window.oceanAPI.loadUserData()) || {};
        existingData.gameState = validated;
        await window.oceanAPI.saveUserData(existingData);
      } catch (err) {
        console.warn('GameStorage: Could not save via Electron storage bridge:', err);
      }
    }

    return validated;
  }

  /**
   * Resets local gameplay state back to factory defaults while preserving player name.
   */
  async function resetGameState(keepCallsign = true) {
    const current = await loadGameState();
    const fresh = createDefaultState();
    if (keepCallsign && current.player?.callsign) {
      fresh.player.callsign = current.player.callsign;
    }
    return await saveGameState(fresh);
  }

  return {
    STORAGE_KEY,
    CURRENT_SCHEMA_VERSION,
    createDefaultState,
    validateAndMigrateState,
    loadGameState,
    saveGameState,
    resetGameState
  };
}));
