# Gold Loan Tracker — Project Documentation

**Last updated:** July 2026
**Maintainer:** Ashish Sarraf
**Repo:** `https://github.com/ashishsarraf021/goldloan-app`

This document exists to keep future development, debugging, and onboarding fast. It covers the full stack, exact versions, every non-obvious deployment fix applied, and the file structure — so nobody (including future-you) has to rediscover these things from scratch.

---

## 1. Tech Stack & Versions

| Layer | Technology | Version |
|---|---|---|
| Frontend | React Native (Expo) | Expo SDK **54** |
| Frontend build tool | EAS CLI | `>= 20.5.1` |
| Navigation | `@react-navigation/native-stack` + `bottom-tabs` | v6.x |
| Backend | Go | 1.26.4 (as built on Render) |
| Backend framework | Gin | v1.9.1 |
| ORM | GORM | v1.25.5 |
| Backend DB (local dev) | SQLite | via `gorm.io/driver/sqlite` |
| Backend DB (production) | PostgreSQL | via `gorm.io/driver/postgres` + `jackc/pgx/v5` |
| Auth | JWT | `golang-jwt/jwt/v5` |
| Secure token storage (mobile) | `expo-secure-store` | — |
| Hosting (backend + DB) | Render.com | Web Service (Free tier) + PostgreSQL (Free tier) |
| App distribution | EAS Build → standalone `.apk` (internal distribution) | — |

**Note on SDK jump:** the project was originally built on Expo SDK 50, then upgraded to SDK 54 mid-development (see Section 4.2 for the exact upgrade steps used).

---

## 2. Project File Structure

```
App/                              # repo root
├── .gitignore                    # excludes node_modules, .env, .expo/, *.db, data/
├── README.md
├── PROJECT_DOCUMENTATION.md       # ← this file
│
├── backend/
│   ├── cmd/
│   │   └── server/
│   │       └── main.go            # entrypoint; router setup, route registration
│   ├── internal/
│   │   ├── config/
│   │   │   └── config.go          # reads env vars (PORT, DB_DRIVER, DATABASE_URL, JWT_SECRET, etc.)
│   │   ├── database/
│   │   │   └── database.go        # GORM connection + AutoMigrate (sqlite/postgres switch)
│   │   ├── handlers/               # AuthHandler, CustomerHandler, LoanHandler, DashboardHandler, ReminderHandler
│   │   └── models/                 # Shopkeeper, Customer, Loan, JewelryItem, ReminderLog
│   ├── .env.example
│   ├── go.mod / go.sum
│   └── data/                      # local sqlite file lives here (gitignored)
│
└── frontend/
    ├── App.js                     # root component
    ├── index.js                   # Expo entry
    ├── app.json                   # Expo config (name, slug, owner, extra.eas.projectId)
    ├── eas.json                   # EAS build profiles (development/preview/production)
    ├── .env.example
    ├── src/
    │   ├── api/
    │   │   └── client.js          # ApiClient class — all HTTP calls, token handling
    │   ├── components/
    │   │   └── UI.js              # Button, Input, Card, StatCard, LoadingScreen
    │   ├── context/
    │   │   └── AuthContext.js     # login/register/logout state, bootstrap on app load
    │   ├── navigation/
    │   │   └── AppNavigator.js    # switches AuthStack ↔ AppStack based on `shopkeeper` state
    │   ├── screens/
    │   │   ├── LoginScreen.js
    │   │   ├── RegisterScreen.js
    │   │   ├── DashboardScreen.js
    │   │   ├── CustomersScreen.js
    │   │   ├── AddCustomerScreen.js
    │   │   ├── LoansScreen.js
    │   │   ├── AddLoanScreen.js
    │   │   ├── LoanDetailScreen.js
    │   │   └── SettingsScreen.js
    │   └── utils/
    │       └── constants.js       # COLORS, formatCurrency, formatDate, **API_URL** (see Section 5.1)
    └── assets/                    # icon.png, splash.png, adaptive-icon.png
```

---

## 3. API Reference (summary)

Base URL (production): `https://goldloan-app.onrender.com/api/v1`
Health check (no `/api/v1` prefix — registered separately in router): `https://goldloan-app.onrender.com/health`

| Method | Endpoint | Auth required |
|---|---|---|
| GET | `/health` | No |
| POST | `/api/v1/auth/register` | No |
| POST | `/api/v1/auth/login` | No |
| GET/PUT | `/api/v1/profile` | Yes |
| GET | `/api/v1/dashboard` | Yes |
| GET/POST/PUT/DELETE | `/api/v1/customers[/:id]` | Yes |
| GET/POST/PUT | `/api/v1/loans[/:id]` | Yes |
| GET | `/api/v1/loans/:id/summary` | Yes |
| POST | `/api/v1/loans/:id/send-reminder` | Yes |
| GET | `/api/v1/loans/:id/reminders` | Yes |
| POST | `/api/v1/reminders/run` | Yes |

Full request/response shapes are documented in `API.md`.

---

## 4. Deployment History — What Was Done and Why

### 4.1 Local Dev Environment Fixes

**Problem: `EMFILE: too many open files, watch` on macOS**
Metro's default file watcher hit the OS file descriptor limit (common with large `node_modules`).
**Fix:** Installed Watchman.
```bash
brew install watchman
watchman watch-del-all
```

**Problem: Watchman watching entire home directory + permission warnings on `~/Library/Containers/.../Recents`**
`watchman watch-project` walked up to `$HOME` instead of stopping at the project folder.
**Fix:**
```bash
watchman watch-del '/Users/<user>'
watchman watch-del-all
cd frontend
watchman watch .
```

**Problem: `Failed to resolve the Android SDK path` / `spawn adb ENOENT`**
No Android Studio/SDK installed locally — not needed for Expo Go or web testing.
**Resolution:** Not fixed (intentionally) — development is done via Expo Go on a physical device or web preview (`w` key), not the Android emulator.

### 4.2 Expo SDK Upgrade (50 → 54)

```bash
npx expo install expo@^54.0.0
npx expo install --fix
rm -rf node_modules package-lock.json
npm install
npx expo-doctor
npx expo start -c
```

**Problem after upgrade: `Cannot find module 'babel-preset-expo'`**
Dependency resolution issue during the SDK jump.
**Fix:**
```bash
npx expo install babel-preset-expo
rm -rf node_modules package-lock.json && npm install
```

**Problem: `expo doctor` flagged `.expo/` not gitignored**
**Fix:** added `.expo/` to `.gitignore` and removed it from tracking:
```bash
git rm -r --cached .expo
```

### 4.3 Backend: Local Testing & DB Location

Backend config (`.env`):
```env
PORT=8080
GIN_MODE=debug
DB_DRIVER=sqlite
DATABASE_URL=./data/goldloan.db
JWT_SECRET=change-this-to-a-long-random-secret-in-production
JWT_EXPIRY_HOURS=72
```

Verified locally via:
```bash
curl http://localhost:8080/health
curl -i -X POST http://localhost:8080/api/v1/auth/register -H "Content-Type: application/json" -d '{...}'
sqlite3 ./data/goldloan.db   # inspect tables directly: .tables / SELECT * FROM shopkeepers;
```

**Key gotcha:** `DATABASE_URL` as a relative path is resolved relative to the **current working directory when the binary runs**, not the project root — running the server from different folders can create multiple divergent `.db` files. Use an absolute path locally if this becomes confusing.

### 4.4 Backend Deployment — Render.com

**Why Postgres in production:** Render's free-tier filesystem is ephemeral — a SQLite file gets wiped on every redeploy/restart. The backend already supported Postgres via `DB_DRIVER` switch in `database.go`, so no code changes were needed — only env vars.

**Steps taken:**
1. Created a Render **PostgreSQL** instance (`goldloan-db`, Free tier).
2. Created a Render **Web Service**, connected to the GitHub repo, root directory set to `backend`.
3. Build command: `go build -o app ./cmd/server`
   Start command: `./app`
4. Environment variables set on the Web Service:
   ```
   DB_DRIVER=postgres
   DATABASE_URL=<Render's internal Postgres connection string>
   JWT_SECRET=<generated via `openssl rand -base64 48`>
   JWT_EXPIRY_HOURS=72
   PORT=10000
   GIN_MODE=release
   DEFAULT_GOLD_RATE_PER_GRAM=6500
   DEFAULT_SILVER_RATE_PER_GRAM=85
   WHATSAPP_ENABLED=false
   ```

**Critical gotcha — Render's injected PORT:** Render web services listen on port **10000** by default (injected automatically). The Go code must read `PORT` from env (via `cfg.Port`) and bind with `router.Run(":" + cfg.Port)` — never hardcode `:8080` in production, or the deploy will fail health checks.

**Result — live URL:** `https://goldloan-app.onrender.com`
(Note: the service name on Render came from the initial service name chosen during setup, not automatically from the repo name — always confirm the actual assigned URL from the deploy log rather than assuming a name.)

**Verified working via:**
```bash
curl https://goldloan-app.onrender.com/health
curl -i -X POST https://goldloan-app.onrender.com/api/v1/auth/register -H "Content-Type: application/json" -d '{...}'
```

### 4.5 Frontend: Connecting to the Live Backend

**Problem: "Network request failed" on physical device (Expo Go)**
`localhost` in the API URL pointed to the phone itself, not the dev machine.
**Fix (dev-time):** used the Mac's LAN IP (`ipconfig getifaddr en0`) instead of `localhost`, with phone and Mac on the same WiFi.

**Problem (the big one): API URL never actually changed in built APKs, despite editing `.env` and later `app.json`**
Root cause, found in `src/utils/constants.js`:
```javascript
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080/api/v1';
```
`.env` is (correctly) gitignored, so it is **not present** on Expo's remote EAS build servers — meaning `process.env.EXPO_PUBLIC_API_URL` was always `undefined` in the cloud build, silently falling back to the hardcoded `localhost` default. This explains why prior attempts to fix the URL via `app.json`'s `extra.apiUrl` field had **no effect at all** — the code never read from there.

**Correct fix:** inject the env var directly in `eas.json` per build profile:
```json
"preview": {
  "distribution": "internal",
  "developmentClient": false,
  "android": { "buildType": "apk" },
  "env": {
    "EXPO_PUBLIC_API_URL": "https://goldloan-app.onrender.com/api/v1"
  }
}
```

**Takeaway for future changes:** any `EXPO_PUBLIC_*` variable used at build time must be set either (a) in `eas.json`'s per-profile `env` block, or (b) as an EAS **secret/environment variable** configured on expo.dev — never rely on a gitignored local `.env` file being present during a cloud build.

### 4.6 EAS Build Configuration Issues

**Problem: Installed APK opened to a "Development Servers" screen instead of the app itself**
This meant the build produced a **development client**, not a standalone build.
**Fix:** ensured `eas.json`'s `preview` profile explicitly set:
```json
"developmentClient": false,
"android": { "buildType": "apk" }
```
Also checked for and removed `expo-dev-client` from `package.json` if not needed for local native debugging.

**Problem: `eas login` — "username or password incorrect"**
Account was created via "Continue with Google" on expo.dev, so no traditional password existed.
**Fix:** set a password via expo.dev account settings, or use `eas login --sso`.

**Problem: Project/owner mismatches during `eas build`**
```
Project config: Owner of project identified by "extra.eas.projectId" (X) does not match owner specified in the "owner" field (Y)
```
Root cause: two separate Expo accounts existed (`ashishsarraf021` and `shishsarraf021a`), and the project (ID `b9a0844a-f5fa-4e3a-9ca0-4588ddba8c44`) was linked to one specific account.
**Fix:** ran `eas whoami` to see all linked accounts, then ran `eas project:info` to get the **authoritative** owner of the linked project, and set `app.json`'s `"owner"` field to match exactly.
```bash
eas whoami
eas project:info
```

### 4.7 Route Convention Note

`/health` is intentionally registered **outside** the `/api/v1` group in the Go router (common convention for infra health checks / load balancers). Every other route the frontend actually calls is under `/api/v1`. This caused repeated confusion — remember:
- `GET /health` → no prefix
- Everything else → `/api/v1/...` prefix required

---

## 5. Known Gotchas / Quick Reference (read this before debugging similar issues again)

| Symptom | Root Cause | Fix |
|---|---|---|
| `EMFILE: too many open files` | macOS FD watch limit | Install Watchman |
| `spawn adb ENOENT` | No Android SDK installed | Use Expo Go / web preview instead |
| SDK mismatch error in Expo Go | App built on older SDK than installed Expo Go | `npx expo install expo@^54.0.0` + `expo install --fix` |
| `Cannot find module 'babel-preset-expo'` | Dependency dropped during SDK jump | `npx expo install babel-preset-expo`, clean reinstall |
| `404` on `/api/v1/health` | `/health` isn't under the `/api/v1` group | Use plain `/health` |
| `409 Conflict` on register | Duplicate phone/email already in DB | Check via `sqlite3`/psql, use a fresh test account |
| App stuck on Login screen after successful API login | `expo-secure-store` throws on web (no browser implementation) | Add `Platform.OS === 'web'` fallback to `localStorage` in `client.js` |
| "Network request failed" on physical device | `localhost` in API URL points to the phone itself | Use Mac's LAN IP (dev) or public backend URL (production) |
| APK opens to "Development Servers" screen | Build produced a dev-client, not standalone | Set `developmentClient: false` + `buildType: "apk"` in `eas.json` |
| API URL changes to `app.json`/`.env` have no effect on built APK | `.env` is gitignored → not present on EAS remote build servers | Set `EXPO_PUBLIC_API_URL` inside `eas.json`'s per-profile `env` block |
| `eas build` — owner mismatch error | Two Expo accounts exist; `app.json`'s `owner` doesn't match the account that owns the linked project | Run `eas project:info` for the authoritative owner, update `app.json` |
| `git checkout -b main/version001` fails | Git can't have a branch `main` and `main/version001` coexist (ref namespace collision) | Use a non-nested name, e.g. `version001` or `release-version001` |

---

## 6. Versioning / Branching Convention

- `main` — stable, deployable branch
- Feature/version branches use flat naming (no `main/` prefix) to avoid git ref conflicts, e.g.:
  ```bash
  git checkout -b version001
  git push -u origin version001
  ```
- Backend deploys to Render automatically track the connected branch (confirm which branch Render is set to auto-deploy from in the Render dashboard before merging changes).

---

## 7. Open Items / Future Improvements

- [ ] Consolidate the two Expo accounts (`ashishsarraf021` vs `shishsarraf021a`) to avoid future owner-mismatch errors
- [ ] Render free tier: backend spins down after 15 min inactivity — first request after idle will be slow (~30-60s). Consider a paid tier or a keep-alive ping before wider pilot rollout
- [ ] Render Postgres free tier expires after 90 days — plan a migration/upgrade path before that date
- [ ] Add proper crash/error logging (e.g. Sentry) before wider pilot testing
- [ ] Add CI (GitHub Actions) to run `expo-doctor` and Go build checks on every push, catching config regressions like the ones above automatically
