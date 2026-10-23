<div align="center">

# 🌊 Ocean Literacy: Gamified Maritime Operations (Phase 1 MVP)

**An Interactive Gamified Ocean Literacy & Decision Simulation Application**  
*Aligned with the Smart India Hackathon problem statement from the Ministry of Earth Sciences (MoES) and INCOIS*

[![CI Status](https://github.com/sahilshingate01/Ocean-Literacy/actions/workflows/verify-test.yml/badge.svg)](https://github.com/sahilshingate01/Ocean-Literacy/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Electron](https://img.shields.io/badge/Electron-v33.2.1-47848F.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20Browser-lightgrey.svg)]()

</div>

---

## 📖 Overview

**Ocean Literacy** is an interactive, gamified decision-making application designed to educate citizens, students, and maritime stakeholders by allowing them to step into real-world ocean roles. Players inspect simulated oceanographic data services from the **Indian National Centre for Ocean Information Services (INCOIS)**, evaluate environmental conditions, commit operational decisions, earn experience points (XP), unlock achievements, and climb local leaderboards.

Instead of functioning solely as an encyclopedia or static quiz, Ocean Literacy teaches responsible, safety-first ocean practices through gameplay.

> [!WARNING]
> **SIMULATION NOTICE:**  
> All scenario telemetry, forecasts, advisories, and metrics provided in Phase 1 are **educational simulation data**, not live INCOIS information. Never use this simulation for real-world maritime navigation, fishing, or coastal emergency safety decisions.

---

## 🎮 Five Playable Roles

Players can select from five distinct operational roles across Indian coastal and Indian Ocean regions:

| Role | Title | Core Mandate & Key Simulated Services |
| :--- | :--- | :--- |
| 🎣 | **Fisher** | Operates coastal motorized vessels. Uses simulated **Potential Fishing Zone (PFZ)** advisories, **Ocean State Forecasts (OSF)**, and small-craft safety warnings. Teaches that a rich PFZ does not guarantee sea safety—never sail into squalls or high waves for fish. |
| 🚢 | **Ship Captain** | Navigates merchant vessels and ferries along coastal shipping corridors. Interprets wave spectra, swell periods, surface currents, and monsoon drift alerts to chart safe passages, avoid lee shores, and maneuver around tropical depressions. |
| 🏖️ | **Coastal Tourism Operator** | Manages tourist beaches and water sports (jet skis, banana boats, scuba diving). Monitors **Kallakkadal (Swell Surge) Early Warnings**, rip current alerts, and thermocline shifts to enforce bathing zones and close beaches before deceptive swells strike. |
| 🛡️ | **Coastal Community Volunteer** | First responder for coastal settlements. Interprets **Tsunami Early Warning Services (TEWS)** bulletins and storm surge models. Coordinates orderly evacuations to high ground, refutes lethal shoreline rumors, and recognizes sudden water drawdown. |
| 🪸 | **Marine Conservation Ranger** | Protects Marine Protected Areas (MPAs) and coral reefs. Utilizes **Coral Bleaching Early Warning System (CBEWS)** Degree Heating Weeks (DHW), satellite Sea Surface Temperature (SST) anomalies, ghost net trajectories, and oil spill containment models. |

---

## 🕹️ Core User Journey & Gameplay Loop

1. **Mission Dashboard:** Review current Player Callsign, Level, XP track, score, and operational role.
2. **Role Selection:** Switch between the 5 roles to view custom role briefings and available scenarios.
3. **Mission Briefing:** Inspect the location (e.g., Ratnagiri, Gulf of Mannar, Kovalam, Sundarbans, Veraval, Rushikulya), operational objective, and situation context.
4. **Simulated Ocean Telemetry:** Review real-time simulated parameters (significant wave height, swell period, chlorophyll-a, currents, sea surface temperature, and official advisory status).
5. **Interactive Decision-Making:** Evaluate 2 to 4 distinct operational courses of action.
6. **Scientific Evaluation & Feedback:**
   - **Correct Decision:** Awards +100 mission score and +100 XP, increases consecutive streak.
   - **Partially Acceptable Decision:** Awards smaller configured reward (+40 pts, +40 XP).
   - **Suboptimal Decision:** Deducts points (-20 penalty) with 0 XP.
   - **Severe Hazard / Unsafe Decision:** Deducts larger hazard penalty (-60 to -80 pts), records safety incident, and explains why human life or ecological integrity was compromised.
   - **Score Floor:** Mission score is clamped so it never drops below 0.
7. **Anti-Exploit Replay Practice:** Players can replay any completed mission for practice. The engine prevents replaying the same mission repeatedly from inflating XP or daily leaderboard scores.
8. **Achievements & Leaderboard:** Earn milestone badges and inspect Daily and Weekly local leaderboards.

---

## 🏆 Progression, Levels & Achievements

### Level Progression
The level engine utilizes a deterministic formula: **every 500 XP unlocks the next rank**.

- **Level 1 (0–499 XP):** Ocean Cadet 🌱
- **Level 2 (500–999 XP):** Coastal Navigator 🧭
- **Level 3 (1,000–1,499 XP):** Marine Specialist 🔬
- **Level 4 (1,500–1,999 XP):** Ocean Scholar 🎓
- **Level 5 (2,000–2,499 XP):** Master Ocean Steward 🪸
- **Level 6+ (2,500+ XP):** Ocean Fleet Commander ⚓

### Key Achievements
- **🌊 First Tide:** Successfully complete your first simulated mission.
- **⭐ Ocean Sentinel:** Achieve 5 consecutive correct decisions without an error.
- **🧭 Master Navigator:** Complete missions across all 5 distinct ocean roles.
- **🎓 Ocean Scholar:** Advance through scientific study and operational mastery to Level 4 (1,500 XP).
- **⚡ Storm Survivor:** Successfully resolve an Advanced difficulty hazard scenario on the first attempt.
- **🛡️ Guardian of the Deep:** Complete 10 missions without incurring a single hazard penalty.

---

## 📊 Local Leaderboard & Offline Persistence

- **Offline-First:** All scenario datasets, game logic, and progress tracking run entirely locally without requiring internet connectivity or remote servers.
- **Dual Persistence Bridge:**
  - In **Electron Desktop**: Saves asynchronously via the secure context-isolated IPC bridge (`ocean:save-data`).
  - In **Web / Mobile Browsers**: Automatically falls back to `localStorage`.
  - **Non-Destructive Merging:** Seamlessly preserves existing application bookmarks, pledges, notes, and quiz records across schema versioning (`schemaVersion: 1`).
- **Local Daily & Weekly Leaderboards:** Aggregates completed local sessions by calendar date and calendar week, merged with clearly designated fictional demo competitors (`[Demo]`) to create an engaging experience on first launch.

---

## 🌊 Exploration & Learning Modules (Retained)

In addition to the gamified missions, all original UNESCO Ocean Literacy learning modules remain accessible in the app:
- **🌊 7 Ocean Principles:** Complete UNESCO IOC framework with concepts, metrics, and case studies.
- **⚓ Depth Zones Simulator:** Interactive vertical water column submersible dive (0m to 11,000m).
- **🐋 Marine Life Encyclopedia:** Specimen dossiers across all marine phyla with IUCN Red List data.
- **🌀 Climate & Ocean Currents:** Ocean acidification simulator (pH vs atmospheric CO₂) and thermohaline circulation.
- **🛡️ Conservation Tracker:** 30x30 targets, plastic pollution metrics, and personalized stewardship pledges.
- **🎓 Steward Assessment:** 10-question evaluation with verifiable certificate generation.

---

## 🏗️ Architecture & File Structure

```
Ocean-Literacy/
├── src/
│   ├── main/
│   │   └── main.js                  # Electron main process, window lifecycle, native menus, IPC
│   ├── preload/
│   │   └── preload.js               # Secure contextBridge exposing oceanAPI
│   └── renderer/
│       ├── index.html               # Responsive app shell with mobile-friendly navigation
│       ├── styles/
│       │   ├── variables.css        # Bioluminescent color tokens and glassmorphism definitions
│       │   └── app.css              # Dark oceanic styling, telemetry cards, and media queries
│       └── js/
│           ├── app.js               # App orchestrator, view routing, quick search
│           ├── data/
│           │   ├── gameScenarios.js # 15 simulated scenarios across 5 roles (UMD format)
│           │   ├── principles.js    # UNESCO 7 Principles dataset
│           │   ├── depthZones.js    # 5 bathymetric layers
│           │   └── marineLife.js    # Marine species records
│           └── modules/
│               ├── gameLogic.js     # Pure deterministic scoring, levels, and leaderboard logic
│               ├── gameStorage.js   # Resilient persistence adapter (Electron + localStorage)
│               ├── gameModule.js    # Missions UI, role selection, briefings, and telemetry
│               ├── principlesModule.js
│               ├── depthModule.js
│               ├── marineModule.js
│               ├── climateModule.js
│               ├── conservationModule.js
│               ├── quizModule.js
│               └── soundscape.js    # Synthesized ambient oceanic audio
├── test/
│   └── app.test.js                  # 18 automated unit and integration tests (zero extra deps)
├── scripts/
│   ├── verify-setup.js              # Environment and project integrity validator
│   └── build-desktop.js             # Compilation helper
└── package.json
```

---

## 🚀 Installation & Running

### Prerequisites
- [Node.js](https://nodejs.org) (v18.0.0 or higher)
- npm (v9.0.0 or higher)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Desktop Application (Electron)
```bash
npm start
```
Or in development mode with developer tools detached:
```bash
npm run dev
```

### 3. Run in Standard Browser
The renderer is designed with web compatibility. You can launch a static local server in `src/renderer`:
```bash
npx serve src/renderer
```
Then open `http://localhost:3000` in Google Chrome, Safari, Firefox, or Android Chrome.

---

## 🧪 Automated Testing

Execute the built-in Node.js test suite:
```bash
npm test
```
Run the full environment verification:
```bash
npm run verify
```

The test suite validates:
- Core Electron entry points, package configuration, and assets.
- UNESCO principles, depth zones, and marine life datasets.
- All 5 playable roles and complete metadata.
- 15 unique scenario datasets with mandatory simulation notices.
- Decision options, logic, and scientific takeaway completeness.
- Correct decision score and XP allocation.
- Incorrect and unsafe hazard penalty calculations.
- Score floor non-negativity constraint.
- XP and level boundary math (0, 499, 500, 999, 1000, 1500 XP).
- Anti-exploit protection against repeated replay XP inflation.
- Local daily and weekly leaderboard date grouping.
- Milestone achievement unlocks.
- Storage schema validation and corrupted data auto-repair.

---

## 🔭 Project Boundaries & Phase 2 Roadmap

### Current Scope (Phase 1 MVP)
- Single-player, offline-first execution.
- High-fidelity simulated INCOIS ocean services.
- Local daily and weekly leaderboard views.
- Secure local persistence (Electron user data + browser localStorage).

### Planned Roadmap (Phase 2)
- Cloud backend API and database infrastructure.
- User account authentication and profile synchronization.
- Genuine multi-player global daily and weekly leaderboards.
- Live INCOIS API integrations where authorized and available.
- Server-side score validation and anti-cheat telemetry.
- Institute content administration portal for creating custom training scenarios.
- Hosted web application and installable Progressive Web App (PWA).
- Multi-language localization, including support for Indian coastal regional languages (Hindi, Marathi, Gujarati, Tamil, Telugu, Malayalam, Bengali, Odia, and Kannada).

---

## 📜 License & Credits

- Licensed under the [MIT License](LICENSE).
- Aligned with the scientific frameworks of **UNESCO IOC**, **MoES**, and **INCOIS**.
- Maintained by [Sahil Shingate](https://github.com/sahilshingate01).
