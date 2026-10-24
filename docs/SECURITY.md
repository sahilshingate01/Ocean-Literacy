# Ocean Literacy Platform — Security & Data Protection Specification

```
===================================================================================
  OCEAN LITERACY PLATFORM — SECURITY ARCHITECTURE & PRIVACY COMPLIANCE (PHASE 2)
===================================================================================
```

## 1. Threat Model & Security Posture

The **Ocean Literacy Platform** is architected to operate safely as a public-facing educational platform. It adheres to the **Principle of Least Privilege (PoLP)** and assumes that all incoming client requests (whether originating from browsers, Electron desktop clients, mobile viewports, or direct curl scripts) are untrusted.

Key Security Objectives:
1. Prevent score manipulation, XP inflation, and leaderboard falsification.
2. Prevent unauthorized administrative privilege escalation.
3. Protect user credentials against credential stuffing and brute-force attacks.
4. Prevent data leakage and adhere strictly to India's privacy framework.
5. Provide resilient defenses against Common Vulnerabilities and Exposures (OWASP Top 10).

---

## 2. Authentication & Credential Architecture

### 2.1 Password Hashing
- Passwords are never stored in plaintext or logged in server telemetry.
- Hashes are computed using **Bcrypt with work factor 12** (or Argon2id where native modules are configured).
- Password complexity requires at least 8 characters, with rejection of common trivial patterns.

### 2.2 Dual Authentication Strategy
- **Web Clients (Browsers)**: Utilizes short-lived JWT access tokens paired with `HttpOnly`, `SameSite=Lax`, `Secure` refresh cookies to protect against client-side script token theft (XSS).
- **Desktop Clients (Electron)**: Utilizes Bearer tokens transmitted over encrypted TLS (`Authorization: Bearer <token>`). Tokens are isolated within preload script bridges and never stored in unencrypted renderer `localStorage`.
- **Token Rotation & Family Reuse Detection**: Refresh tokens are single-use. When a refresh token is exchanged, a new token family member is issued. If a previously consumed refresh token is presented again (indicating token theft), the entire token family is immediately revoked and all active user sessions are terminated.

---

## 3. Role-Based Access Control (RBAC)

The platform distinguishes three rigid administrative tiers:
- **`LEARNER`**: Default registered player. Can play missions, view leaderboards, unlock achievements, manage account settings, export personal data, or delete their account. Cannot access `/api/v1/admin/*`.
- **`CONTENT_EDITOR`**: Authorized instructional designer. Can draft missions, update scenario versions, and preview educational content. Cannot publish directly or moderate user scores.
- **`ADMIN`**: Platform administrator. Can approve and publish scenario versions, manage user roles, deactivate abusive accounts, review audit logs, and moderate leaderboard score transactions.

*Note: In-game operational occupations (Fisher, Ship Captain, Ranger) are purely roleplay perspectives and convey zero administrative server privileges.*

---

## 4. Anti-Cheat & Gameplay Integrity

| Attack Vector | Server-Side Mitigation Mechanism |
| :--- | :--- |
| **Injected Client Scores** | Client payloads containing `score`, `pointsDelta`, or `earnedXp` are completely discarded. The server computes all score deltas strictly from the authoritative `ScenarioVersion` option record in PostgreSQL. |
| **Replay Point Farming** | Replaying a completed scenario triggers `isPractice = true`. Practice playthroughs award educational feedback but strictly grant `0 XP` and `0 competitive leaderboard points`. |
| **Duplicate Submissions** | The database transaction verifies `attempt.decisions.length == 0`. Subsequent decision requests for a finalized attempt are rejected with `400 Bad Request`. |
| **Network Retry Duplication**| Clients supply an `Idempotency-Key` header. Repeated requests return the identical initial decision record without duplicate ledger entries. |
| **Attempt Expiration** | Unfinished attempts expire automatically after 30 minutes (`expiresAt`), preventing stale answer hoarding. |

---

## 5. Network & Application Defenses

### 5.1 Strict CORS Policy
- Configured via `server/src/config/index.js` with an explicit origin allowlist (`http://localhost:3000`, `app://-`).
- Wildcard `*` CORS is strictly prohibited on credentialed routes.

### 5.2 Rate Limiting
In-memory sliding window rate limiters protect endpoints against automated abuse:
- Authentication (`/auth/login`, `/auth/register`): **5 attempts per 15 minutes** per IP.
- Decision Evaluation (`/game/attempts/*/decision`): **60 requests per minute**.
- Public Leaderboards and INCOIS Feeds: **120 requests per minute**.

### 5.3 Injection & XSS Mitigations
- **SQL Injection**: Prevented by design using **Prisma ORM**, which utilizes parameterized prepared statements for all database queries.
- **Cross-Site Scripting (XSS)**: All user-editable CMS strings and dynamic DOM injections use `textContent` and sanitized DOM constructors rather than unchecked `innerHTML`.
- **Security Headers**: Standardized via `helmet`, enforcing `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and restrictive Content Security Policy (CSP).

---

## 6. Privacy & Digital Personal Data Protection (DPDP) Act Compliance

The platform respects the legal data governance principles established under India's **Digital Personal Data Protection Act, 2023 (DPDP Act)**:

1. **Principle of Data Minimization**: The platform requires only an email address and a public player callsign. No Aadhaar, phone numbers, location tracking, or biometric data are collected.
2. **Leaderboard Privacy Consent**: Players maintain complete autonomy over public visibility. Setting `leaderboardOptIn: false` immediately excludes the user's score from public rankings while preserving their educational progress.
3. **Right to Access / Data Portability**: Through `GET /api/v1/auth/export-data`, users can download a complete, machine-readable JSON archive of their profile, attempts, scores, and achievement records.
4. **Right to Erasure / Right to be Forgotten**: Through `DELETE /api/v1/auth/delete-account`, users can irrevocably erase their account, authentication tokens, profile records, and personal associations from the database.
5. **No Commercial Profiling / Ad-Free**: INCOIS educational platforms do not display advertisements, track third-party behavioral telemetry, or monetize learner activity.

---

## 7. Audit Logging & Diagnostic Sanitization

- Every administrative action (`USER_ROLE_CHANGED`, `USER_ACCOUNT_DEACTIVATED`, `MISSION_PUBLISHED`, `LEADERBOARD_SCORE_MODERATED`) writes an immutable record to the `AuditLog` table.
- System logs (`server/src/middleware/logger.js`) automatically redact sensitive keys (`password`, `token`, `accessToken`, `refreshToken`, `secret`) before writing to console or file streams.
- Diagnostic probes (`/api/v1/health/diagnostic`) omit database connection strings, passwords, and internal paths.
