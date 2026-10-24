<div align="center">

# 🌊 Ocean Literacy: Production-Ready Full-Stack Platform (Phase 2)

**An Interactive Gamified Ocean Literacy & Server-Authoritative Decision Simulation Platform**  
*Aligned with the Smart India Hackathon problem statement from the Ministry of Earth Sciences (MoES) and INCOIS*

[![CI Status](https://github.com/sahilshingate01/Ocean-Literacy/actions/workflows/verify-test.yml/badge.svg)](https://github.com/sahilshingate01/Ocean-Literacy/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v20%20%7C%20v22-green.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16%2B-blue.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748.svg)](https://www.prisma.io/)
[![Electron](https://img.shields.io/badge/Electron-v33.2.1-47848F.svg)](https://www.electronjs.org/)
[![Platform](https://img.shields.io/badge/Platform-macOS%20%7C%20Windows%20%7C%20Linux%20%7C%20Browser%20%7C%20Android-lightgrey.svg)]()

</div>

---

## 📖 Overview

**Ocean Literacy (Phase 2)** transforms the single-player desktop educational decision game into a secure, scalable, multi-user platform suitable for deployment and operation by the **Indian National Centre for Ocean Information Services (INCOIS)** or an authorized host institution.

The platform retains the lightweight, responsive **Electron + HTML5 + CSS3 + Vanilla JavaScript** desktop and web frontend, while introducing a high-performance **Node.js / Express / PostgreSQL / Prisma** authoritative backend service. Players evaluate authentic simulated oceanographic advisories, make critical decisions, unlock milestone achievements, and compete on genuine database-backed global leaderboards.

> [!WARNING]
> **SIMULATION NOTICE & OPERATIONAL DISCLAIMER:**  
> All scenario telemetry, forecasts, advisories, and metrics provided in default educational modules are **simulation data models**, not live INCOIS operational warnings. Never use this educational game for real-world maritime navigation, fishing, or coastal emergency safety decisions.

---

## 🏛️ Comprehensive Architecture & Documentation Suite

Detailed architectural specifications, API contracts, database schemas, and operator runbooks are maintained in the [`docs/`](docs/) directory:

- 📐 [**Architecture Specification (`docs/ARCHITECTURE.md`)**](docs/ARCHITECTURE.md): System topology, dual-client design, data flows, and offline degradation strategy.
- 📡 [**REST API Reference (`docs/API.md`)**](docs/API.md): Complete specification of all `/api/v1` endpoints (Auth, Game, Leaderboards, INCOIS, Admin, Health).
- 🗄️ [**Database Architecture (`docs/DATABASE.md`)**](docs/DATABASE.md): PostgreSQL schema models, Prisma migrations, indexes, constraints, and disaster rollback procedures.
- 🌐 [**INCOIS Integrations (`docs/INCOIS-INTEGRATION.md`)**](docs/INCOIS-INTEGRATION.md): Reference portals (PFZ, OSF, ITEWS, Marine Heatwave), provenance metadata, and caching policies.
- 🚀 [**Deployment & Operations (`docs/DEPLOYMENT.md`)**](docs/DEPLOYMENT.md): Containerized Docker Compose deployment, systemd configuration, and routine operator runbook.
- 🛡️ [**Security & DPDP Compliance (`docs/SECURITY.md`)**](docs/SECURITY.md): Threat model, RBAC tiers, token rotation, anti-cheat mechanisms, and DPDP Act 2023 compliance.

---

## ✨ Key Phase 2 Highlights

1. **Server-Authoritative Game Engine**: Clients are completely untrusted. Score transactions, XP progression, attempt lifecycles, and anti-cheat validations are executed inside atomic PostgreSQL transactions.
2. **Dual-Client Compatibility**: Powers both the packaged Electron desktop client (via Node-isolated context bridges) and standard web browsers (desktop / Android viewports) using unified REST endpoints.
3. **Genuine Global Leaderboards**: Daily, Weekly, and All-Time leaderboards calculated in the `Asia/Kolkata` (IST = UTC+05:30) timezone with deterministic tie-breaking and opt-in privacy consent.
4. **INCOIS Integration Layer**: Modular adapters for Potential Fishing Zones (PFZ), Ocean State Forecasts (OSF), Indian Tsunami Early Warning System (ITEWS), and Marine Heatwaves with strict provenance tracking and caching.
5. **Integrated Admin Content Management (CMS)**: Authorized Content Editors and Administrators can create, validate, preview, and publish missions without modifying source code or redeploying services.
6. **Immutable Version Snapshots**: Modifying a scenario with historical player attempts automatically branches into a new version, preserving auditability and score integrity.
7. **DPDP Act (India) Compliance**: Players have full autonomy over data portability (`/api/v1/auth/export-data`), complete account erasure (`/api/v1/auth/delete-account`), and leaderboard privacy opt-out.

---

## 🎮 Five Playable Roles

| Role | Title | Core Mandate & Key Simulated Services |
| :--- | :--- | :--- |
| 🎣 | **Fisher** | Operates coastal motorized vessels. Interprets Potential Fishing Zone (PFZ) advisories and Ocean State Forecasts (OSF). Teaches that rich fishing zones never override sea safety limits. |
| 🚢 | **Ship Captain** | Navigates coastal cargo and passenger vessels. Analyzes wave spectra, swell periods, surface currents, and monsoon drift alerts to chart safe passages. |
| 🏖️ | **Coastal Tourism Operator** | Manages tourist beaches and water sports. Monitors Kallakkadal (Swell Surge) Early Warnings, rip currents, and tidal alerts to protect visitors. |
| 🛡️ | **Coastal Community Volunteer** | First responder for coastal settlements. Interprets Tsunami Early Warning System (ITEWS) bulletins and storm surge advisories for rapid evacuation. |
| 🪸 | **Marine Conservation Ranger** | Protects Marine Protected Areas (MPAs) and coral reefs. Utilizes satellite Degree Heating Weeks (DHW), SST anomalies, and ghost net drift models. |

---

## 🕹️ Core User Journey & Gameplay Loop

1. **Account Registration / Login:** Sign in using an existing account or continue in offline guest practice mode.
2. **Role Selection:** Select from 5 maritime occupations to view role briefings and published scenarios.
3. **Mission Retrieval:** Fetch published missions evaluated dynamically from the PostgreSQL backend.
4. **Authoritative Playthrough:** Start a timed mission attempt (`expiresAt: 30m`), evaluate simulated oceanographic parameters, and commit a decision.
5. **Server Evaluation & Ledger Update:** The backend evaluates the decision against the immutable scenario version, updates streaks/levels, and records a permanent `ScoreTransaction`.
6. **Global Leaderboard Standing:** Finalized competitive attempts immediately reflect on Daily and Weekly leaderboards in the `Asia/Kolkata` operational window.

---

## 🚀 Quickstart & Local Setup

### Prerequisites
- [Node.js](https://nodejs.org) (v20.x or higher)
- [PostgreSQL](https://www.postgresql.org/) (v16.x) or [Docker Desktop](https://www.docker.com/)

### 1. Install Dependencies
```bash
# Install root desktop and frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment Variables
```bash
cp server/.env.example server/.env
```
Ensure `DATABASE_URL`, `JWT_SECRET`, and `JWT_REFRESH_SECRET` are configured in `server/.env`.

### 3. Initialize Database Migrations & Seed Data
```bash
npm run db:migrate
npm run db:seed
```

### 4. Bootstrap Initial Administrator Account
```bash
npm run bootstrap:admin -- admin@oceanliteracy.org "SecureAdminPass2026!" "Director General"
```

### 5. Launch Backend Server & Desktop App
In terminal 1 (Start Backend Server on Port 3000):
```bash
npm run server
# or in development watch mode:
npm run server:dev
```

In terminal 2 (Start Electron Desktop Client):
```bash
npm start
```

### 6. Run via Docker Compose (Optional)
To run the full backend stack (PostgreSQL 16 + Node.js API) in Docker:
```bash
docker compose up -d --build
```
Access the REST API at `http://localhost:3000/api/v1/health/liveness`.

---

## 🧪 Automated Testing Suite

The repository includes a comprehensive 26-test verification suite covering desktop modules, cryptography, authentication, anti-cheat gameplay, global leaderboards, INCOIS feeds, Admin CMS, and operational health probes:

```bash
# Run all tests (Phase 1 Desktop + Phase 2 Backend)
npm run test:all

# Run backend unit and integration test runner (8 suites)
npm run test:backend

# Run desktop standalone test suite (18 tests)
npm test
```

### Verification Matrix
- ✅ **18/18 Desktop Tests**: Validates Electron preloads, UNESCO datasets, scoring math, replay anti-exploit, and storage repair.
- ✅ **8/8 Backend Suites**: Validates Bcrypt/Argon2id hashing, IST timezone math, token rotation/reuse revocation, server-authoritative score calculations, anti-cheat payload sanitization, deterministic tie-breaking, INCOIS provenance & caching, Admin CMS version branching, and health probes.

---

## 📜 License & Institutional Credits

- Licensed under the [MIT License](LICENSE).
- Aligned with the scientific framework of the **Ministry of Earth Sciences (MoES)** and **INCOIS**, Government of India.
- Maintained by [Sahil Shingate](https://github.com/sahilshingate01).
