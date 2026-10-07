# Learning Dashboard

React Native (Expo SDK 57, TypeScript, Expo Router). Login → course dashboard → course details with lesson completion, working offline after the first load.

**Run:** `npm install && npx expo start` · **Test:** `npm test` · **Lint/types:** `npx expo lint && npx tsc --noEmit` · **APK:** `npx eas-cli@latest build -p android --profile preview`
**Demo login:** any valid email, password `password123`. Mock knobs (`.env`): `EXPO_PUBLIC_MOCK_FAILURE_RATE=1` (API failure), `EXPO_PUBLIC_MOCK_EMPTY=true` (empty state), `EXPO_PUBLIC_MOCK_LATENCY_MS`.

```
src/app/            screens (Expo Router) — render UI state only
src/features/       ViewModel hooks (useCoursesViewModel, …) + feature components
src/data/repository CourseRepository / AuthRepository — single source of truth
src/data/remote     CourseApi / AuthApi interfaces + mock backend
src/data/local      SQLite cache (migrations, outbox) + SecureStore session
src/domain          models, progress calculation, validation — pure, no RN imports
src/core/container  composition root (only place concrete implementations are chosen)
```

### 1. Architecture
MVVM + Repository: **Screen → ViewModel hook → Repository → API + local DB**. Screens are dumb; ViewModels expose a discriminated-union UI state (`loading | error | empty | success`) so impossible states can't be rendered. Repositories depend on interfaces (`CourseApi`, `CourseLocalDataSource`), so the mock backend can be replaced with an HTTP client in one file, and the repository is unit-tested with in-memory fakes. Business rules (progress %, validation) live in `domain/` as pure functions. I avoided Redux/Zustand: the DB is the state store and the repository publishes change events (completing a lesson updates the dashboard without refetching).

### 2. Offline support
**expo-sqlite** (`courses`, `lessons`, `meta`, versioned migrations via `PRAGMA user_version`). The UI is offline-first / stale-while-revalidate: cached data is shown instantly, then refreshed from the network and written back to the DB. If the network fails, cached data stays on screen with an offline banner; an error screen only appears when nothing was ever cached (`meta.last_synced_at` distinguishes "never loaded" from "server returned no courses"). Completing a lesson writes locally first with `pending_sync = 1` (an outbox), then pushes to the API; pending items are retried on the next refresh. Completion is monotonic, so merging server and local data is a simple OR — no conflict engine needed. The cache is wiped on logout.

### 3. Security
Tokens go in **expo-secure-store** (iOS Keychain with `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY`, Android Keystore-backed encryption) — never AsyncStorage/SQLite. In production: short-lived access token + rotating refresh token, refresh on 401 in a single HTTP interceptor, TLS (optionally certificate pinning), no secrets in the JS bundle, and clearing the token + cache on logout.

### 4. Scale (1M users, hundreds of courses)
1. **Pagination + server-driven sync**: cursor-paginated `/courses` with `updated_since` delta sync instead of full-list replacement; virtualised lists (FlashList) and per-course lazy lesson fetch.
2. **Server-state library** (TanStack Query with SQLite persister) for request de-duping, retry with backoff, and background refetch; idempotent `PUT /lessons/:id/completion` so outbox retries are safe.
3. **Backend/CDN**: cache course catalogue at the CDN (it's identical for everyone); keep only per-user progress dynamic; batch progress writes.
4. **Observability**: Sentry crash/error reporting, performance traces, analytics on funnel drop-off; feature flags for gradual rollout.
5. **Release safety**: EAS Update channels for staged OTA rollouts with rollback, CI running lint/types/tests + Maestro E2E on each PR.

### 5. Second platform
This codebase already targets **both Android and iOS** from one TypeScript codebase (`npx expo run:ios` / EAS build for iOS). If it had to be fully native on iOS: SwiftUI views + `@Observable` ViewModels, the same Repository protocol with `URLSession` async/await for the API, SwiftData (or GRDB/SQLite) for the cache, Keychain for tokens, `NWPathMonitor` for connectivity, and XCTest for the same repository test. On native Android: Compose + ViewModel/StateFlow, Retrofit, Room, EncryptedSharedPreferences/DataStore + Keystore, Hilt — the layering maps 1:1.
