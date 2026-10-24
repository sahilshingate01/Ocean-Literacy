# Ocean Literacy Platform — REST API Specification (`/api/v1`)

```
===================================================================================
  OCEAN LITERACY PLATFORM — REST API REFERENCE (VERSION 1.0)
===================================================================================
```

Base URL: `http://localhost:3000/api/v1` (Production: `https://<domain>/api/v1`)

---

## 1. Protocol & Response Standards

### 1.1 Standard Success Envelope
All successful requests return a `2xx` HTTP status code formatted as:
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2026-10-24T18:30:00.000Z"
}
```

### 1.2 Standard Error Envelope
All client or server errors return appropriate `4xx` or `5xx` status codes without leaking stack traces or SQL details:
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description.",
    "statusCode": 400,
    "details": null
  },
  "timestamp": "2026-10-24T18:30:00.000Z"
}
```

### 1.3 Authentication Headers
Protected endpoints require either an **Authorization Header**:
```http
Authorization: Bearer <access_jwt_token>
```
or an **HttpOnly SameSite Cookie** named `ocean_access_token` automatically issued on browser login.

### 1.4 Idempotency Key
For mission start and decision actions, clients may include:
```http
Idempotency-Key: <unique-uuid-or-string>
```
If a request is retried with the same idempotency key, the server returns the existing result without executing duplicate logic or awarding duplicate score points.

---

## 2. Authentication Subsystem (`/auth`)

| Method | Endpoint | Access | Rate Limit | Description |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | 5 / 15m | Creates new user account and profile with default `LEARNER` role. |
| `POST` | `/auth/login` | Public | 5 / 15m | Authenticates credentials, issues access/refresh tokens. |
| `POST` | `/auth/logout` | Authenticated | 60 / min | Revokes active session and invalidates refresh token family. |
| `POST` | `/auth/refresh` | Public | 30 / min | Rotates refresh token, detects reuse, issues new credentials. |
| `GET` | `/auth/me` | Authenticated | 120 / min | Retrieves current user profile, level, streak, and role. |
| `PATCH` | `/auth/settings` | Authenticated | 30 / min | Updates user settings (e.g. `leaderboardOptIn`). |
| `POST` | `/auth/request-password-reset`| Public | 3 / hr | Issues expiring single-use reset token (simulated/email). |
| `POST` | `/auth/reset-password` | Public | 5 / hr | Resets password using token and revokes all active sessions. |
| `GET` | `/auth/export-data` | Authenticated | 2 / hr | **DPDP Act**: Exports full personal records and score history in JSON. |
| `DELETE`| `/auth/delete-account` | Authenticated | 1 / hr | **DPDP Act**: Completely deletes account and personal information. |

### Register Request Example
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "cadet@oceanliteracy.org",
  "password": "SecureCadetPassword123!",
  "callsign": "Cadet Navigator"
}
```

---

## 3. Game & Server-Authoritative Simulation Engine (`/game`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/game/roles` | Public / Auth | Lists the 5 maritime occupations and descriptions. |
| `GET` | `/game/missions` | Public / Auth | Lists published scenarios (options sanitized without answers). |
| `GET` | `/game/missions/:id` | Public / Auth | Retrieves individual scenario details. |
| `POST` | `/game/attempts/start` | Authenticated | Starts authoritative attempt; returns `attemptId` and sanitized options. |
| `POST` | `/game/attempts/:id/decision` | Authenticated | Submits decision; server evaluates outcome and records score. |
| `GET` | `/game/attempts/:id/resume` | Authenticated | Resumes in-progress attempt following temporary network drop. |
| `GET` | `/game/progress` | Authenticated | Retrieves personal level, stats, achievements, and attempt history. |

### Submit Decision Request Example
```http
POST /api/v1/game/attempts/9c765b2c-09c7-4a41-ab34-b1eb39472131/decision
Authorization: Bearer <token>
Content-Type: application/json

{
  "optionId": "opt-f1-b"
}
```
*Note: Any client-provided fields like `score`, `isCorrect`, or `earnedXp` are rejected or silently ignored by the server.*

---

## 4. Genuine Global Leaderboards (`/leaderboards`)

All ranking endpoints use UTC storage with `Asia/Kolkata` (UTC+05:30) operational date boundaries. Ties are resolved deterministically: `Score DESC`, `XP DESC`, `Earliest Completion ASC`, `Player ID ASC`.

| Method | Endpoint | Access | Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/leaderboards/daily` | Public / OptAuth | `page=1&limit=25` | Returns daily rankings for current IST day. |
| `GET` | `/leaderboards/weekly` | Public / OptAuth | `page=1&limit=25` | Returns weekly rankings for current IST Monday-Sunday cycle. |
| `GET` | `/leaderboards/overall`| Public / OptAuth | `page=1&limit=25` | Returns all-time aggregate global rankings. |
| `GET` | `/leaderboards/me` | Authenticated | None | Returns current user's standing across daily, weekly, and overall. |

---

## 5. INCOIS Operational Information Services (`/integrations/incois`)

All services provide strict metadata tracking (`sourceUrl`, `retrievalTimestamp`, `validityHorizon`, `geographicScope`, `provenance`, `isSimulated`, and `simulationNotice`).

| Method | Endpoint | Access | Parameters | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/integrations/incois/status` | Public | None | Monitors health and caching state across all 4 INCOIS feeds. |
| `GET` | `/integrations/incois/pfz` | Public | `region=Goa` | Returns Potential Fishing Zone advisory coordinates. |
| `GET` | `/integrations/incois/osf` | Public | `sector=West+Coast` | Returns Ocean State Forecast (wave height, swell, currents). |
| `GET` | `/integrations/incois/tsunami` | Public | None | Returns Indian Tsunami Early Warning System (ITEWS) status. |
| `GET` | `/integrations/incois/marine-heatwave` | Public | `reefArea=Gulf+of+Mannar` | Returns Degree Heating Weeks and coral bleaching alert levels. |

---

## 6. Admin Content Management System (`/admin`)

Requires authenticated user with `CONTENT_EDITOR` or `ADMIN` role.

| Method | Endpoint | Required Role | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/stats` | `ADMIN` | Platform metrics (user counts, completion rates, role breakdown). |
| `GET` | `/admin/users` | `ADMIN` | Paginated user management table with search and role filters. |
| `PATCH` | `/admin/users/:id/role` | `ADMIN` | Changes application role (`LEARNER`, `CONTENT_EDITOR`, `ADMIN`). |
| `PATCH` | `/admin/users/:id/status`| `ADMIN` | Deactivates/suspends or reactivates an account. |
| `GET` | `/admin/missions` | `CONTENT_EDITOR` | Lists all draft and published scenarios with version histories. |
| `POST` | `/admin/missions` | `CONTENT_EDITOR` | Creates a new draft scenario with completeness validation. |
| `PUT` | `/admin/missions/:id` | `CONTENT_EDITOR` | Updates draft. If attempts exist on current version, branches into version N+1. |
| `POST` | `/admin/missions/:id/publish`| `ADMIN` | Publishes draft scenario for immediate player availability. |
| `POST` | `/admin/missions/:id/unpublish`| `ADMIN` | Sets scenario status to DRAFT. |
| `POST` | `/admin/missions/:id/archive` | `ADMIN` | Soft-archives scenario from the platform. |
| `GET` | `/admin/audit-logs` | `ADMIN` | Retrieves immutable administrative audit log records. |
| `DELETE`| `/admin/leaderboards/moderation/:txId` | `ADMIN` | Revokes fraudulent score transactions and recalculates profiles. |

---

## 7. Operational Health Probes (`/health`)

| Method | Endpoint | Access | Purpose |
| :--- | :--- | :--- | :--- |
| `GET` | `/health/liveness` | Public | Returns `200 UP` if the Node.js process event loop is active. |
| `GET` | `/health/readiness`| Public | Executes `SELECT 1` on PostgreSQL. Returns `200 READY` or `503 NOT_READY`. |
| `GET` | `/health/diagnostic`| Public | Returns sanitized metrics (uptime, heap memory, timezone, version). |
