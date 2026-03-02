# Gelitik Code Review — March 2026

> Follow-up audit of the **Gelitik** social media analytics app, comparing the current state against the [previous audit (Feb 13, 2026)](file:///C:/Users/USER/.gemini/antigravity/brain/b8866cbc-d4de-4366-9099-523169ac8c07/audit_report.md) which found 27 issues.

---

## 📊 Previous Audit Resolution Summary

Of the **27 issues** reported in the Feb 2026 audit, **19 have been fully resolved**, 3 partially fixed, and 5 remain open. Additionally, **6 new issues** have been identified.

| Original # | Issue                                                     | Status                                                                                         |
| ---------- | --------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1          | Duplicate `TikTokService` — `tiktok.service.ts` dead code | ✅ **Fixed** — file deleted                                                                    |
| 2          | Hardcoded JWT secret fallback `'your-secret-key'`         | ✅ **Fixed** — `config/env.ts` crashes on startup if missing                                   |
| 3          | Verbose debug logging in auth middleware                  | ✅ **Fixed** — all `console.log` removed                                                       |
| 4          | Mock auth bypass in LoginPage / auth store / router       | ✅ **Fixed** — real auth flow implemented via API                                              |
| 5          | `useRouter()` called inside Pinia store                   | ✅ **Fixed** — removed from store                                                              |
| 6          | `errorHandler` middleware not registered                  | ✅ **Fixed** — registered at end of `app.ts`                                                   |
| 7          | Multiple `new PrismaClient()` instances                   | ✅ **Fixed** — singleton in `config/prisma.ts`                                                 |
| 8          | `AuthLayout.vue` dead code                                | ✅ **Fixed** — file deleted                                                                    |
| 9          | `formatNumber()` duplicated across 3+ components          | ✅ **Fixed** — centralized in `utils/format.ts`                                                |
| 10         | Heavy use of `alert()` for notifications                  | ✅ **Fixed** — all `alert()` calls removed                                                     |
| 11         | Inconsistent line endings (CRLF vs LF)                    | ⚠️ **Partial** — `.editorconfig` exists but mixed endings persist                              |
| 12         | Sidebar tooltips won't appear (`group` class missing)     | ✅ **Fixed** — `group` class added to nav buttons                                              |
| 13         | Hardcoded platform connection status                      | ✅ **Fixed** — fetched from API at mount                                                       |
| 14         | Unused functions in `ContentTable.vue`                    | ✅ **Fixed** — dead code removed                                                               |
| 15         | `useTheme` FOUC (flash of unstyled content)               | ✅ **Fixed** — `initTheme()` runs synchronously before mount                                   |
| 16         | Unused imports in `usePlatformAnalytics.ts`               | ✅ **Fixed** — cleaned up                                                                      |
| 17         | `useSchedule` state leak — module-level refs              | ⚠️ **Partial** — refs moved inside function, `resetSchedule()` added, but still uses mock data |
| 18         | TopVideosChart shows wrong metric in list                 | ✅ **Fixed** — now displays selected `sortBy` metric                                           |
| 19         | `truncate` CSS override in TopVideosChart                 | ✅ **Fixed** — removed custom `.truncate` class                                                |
| 20         | `font-black` and `font-bold` conflict on same element     | ✅ **Fixed** — conflict removed                                                                |
| 21         | Copyright says "© 2024"                                   | ✅ **Fixed** — uses `new Date().getFullYear()`                                                 |
| 22         | `handleForgotPassword` / `handleSignup` are stubs         | ✅ **Fixed** — now route to actual pages                                                       |
| 23         | `Bell` icon used for all settings items                   | ✅ **Fixed** — no longer used                                                                  |
| 24         | Dynamic Tailwind classes won't compile                    | ✅ **Fixed** — no more dynamic `bg-${color}` usage                                             |
| 25         | `placeholder.com` reference in TopVideosChart             | ✅ **Fixed** — replaced with base64 SVG fallback                                               |
| 26         | No global error boundary                                  | ❌ **Open** — still no global error boundary                                                   |
| 27         | Ascending button always shows "↓"                         | ✅ **Fixed** — now correctly shows ↑/↓                                                         |

---

## 🔴 Critical Issues (New + Remaining)

### N1. Duplicate Auth Middleware — Two Competing Files

Two middleware files implement JWT authentication with **different token payload shapes**:

| File                                                                                                  | Payload shape        | Used by                                |
| ----------------------------------------------------------------------------------------------------- | -------------------- | -------------------------------------- |
| [auth.middleware.ts](file:///d:/Personal%20Project/gelitik/backend/src/middleware/auth.middleware.ts) | `{ id: string }`     | `app.ts`, `auth.routes.ts` (✅ active) |
| [auth.ts](file:///d:/Personal%20Project/gelitik/backend/src/middleware/auth.ts)                       | `{ userId: string }` | Nothing (❌ dead code)                 |

`auth.ts` also directly uses `process.env.JWT_SECRET!` (non-null assertion) instead of the centralized `config/env.ts`, partially undermining the fix for issue #2. If someone imports from the wrong file and JWT payloads have `userId` instead of `id`, auth will silently fail.

> [!CAUTION]
> **Recommendation:** Delete `middleware/auth.ts` or consolidate into `auth.middleware.ts`.

---

### N2. Session Secret Hardcoded Fallback

[app.ts:73](file:///d:/Personal%20Project/gelitik/backend/src/app.ts#L73):

```typescript
secret: process.env.SESSION_SECRET || 'your-secret-key',
```

While the JWT secret was properly fixed to crash on startup, the **session secret** still has the same insecure fallback pattern. If `SESSION_SECRET` is missing, sessions can be forged.

> [!CAUTION]
> **Recommendation:** Add `SESSION_SECRET` to `config/env.ts` using `getRequiredEnvVar()`.

---

### N3. Inconsistent JWT Secret Access

Some files bypass the centralized `config/env.ts` and access `process.env.JWT_SECRET` directly:

| File                                                                                              | Line                      | Access Pattern     |
| ------------------------------------------------------------------------------------------------- | ------------------------- | ------------------ |
| [middleware/auth.ts:15](file:///d:/Personal%20Project/gelitik/backend/src/middleware/auth.ts#L15) | `process.env.JWT_SECRET!` | Non-null assertion |
| [middleware/auth.ts:38](file:///d:/Personal%20Project/gelitik/backend/src/middleware/auth.ts#L38) | `process.env.JWT_SECRET!` | Non-null assertion |
| [routes/auth.ts:13](file:///d:/Personal%20Project/gelitik/backend/src/routes/auth.ts#L13)         | `process.env.JWT_SECRET`  | No fallback        |

If `middleware/auth.ts` is deleted (per N1), the `routes/auth.ts` reference should import from `config/env.ts`.

> [!WARNING]
> **Recommendation:** All JWT secret usage should go through `JWT_SECRET` from `config/env.ts`.

---

### N4. Dashboard Route Auth Bypass Still Present

[router/index.ts:58](file:///d:/Personal%20Project/gelitik/frontend/src/router/index.ts#L58):

```typescript
requiresAuth: false, // Bypassed for dev
```

While the mock auth was properly removed (issue #4), **the dashboard route itself** still has `requiresAuth: false` with a dev bypass comment. This means unauthenticated users can still access the dashboard.

> [!WARNING]
> **Recommendation:** Change to `requiresAuth: true` and remove the comment.

---

## 🟠 Architecture & Design Issues

### N5. `instagramGraph.service.ts` is a 649-line Monolith

[instagramGraph.service.ts](file:///d:/Personal%20Project/gelitik/backend/src/services/instagramGraph.service.ts) is a single file handling:

- OAuth token exchange and refresh
- Account discovery (`getInstagramAccount`)
- Profile data fetching
- Account insights with 7 concurrent API calls
- Media insights with batch requests
- Media-specific insights
- Full analytics aggregation
- Engagement rate calculation

The `getInsights()` method alone is **~265 lines** with deeply nested `try/catch` blocks and 12+ local variables.

**Recommendation:** Extract into smaller modules:

- `instagramAuth.service.ts` — OAuth flows
- `instagramInsights.service.ts` — Insights fetching
- `instagramMedia.service.ts` — Media operations

---

### N6. Pervasive `any` Types in Backend Services

`instagramGraph.service.ts` uses `any` in **30+ locations**:

```typescript
async getInstagramAccount(accessToken: string): Promise<any>
async getProfile(accessToken: string, igAccount?: any): Promise<any>
async getInsights(...): Promise<any>
async getMedia(...): Promise<any>
```

Combined with `analytics.routes.ts` and `socialAccounts.ts`, this creates a type-unsafe API layer where runtime errors can easily occur.

**Recommendation:** Define proper interfaces for API responses (`InstagramProfile`, `InsightsData`, `MediaItem`, etc.).

---

### N7. No Global Error Boundary (Remaining from #26)

There is still no global error boundary on the frontend. Unhandled promise rejections in route guards, API interceptors, or async component setup will silently fail.

**Recommendation:** Add `app.config.errorHandler` in `main.ts` and consider a Vue `ErrorBoundary` component.

---

## 🟡 Code Quality Issues

### N8. `useSchedule` Still Uses Mock Data

[useSchedule.ts](file:///d:/Personal%20Project/gelitik/frontend/src/composables/useSchedule.ts) generates **hardcoded mock posts** (`generateMockPosts()`) and has no API integration. The composable even references a `linkedin` platform that doesn't exist in the app.

```typescript
posts.push({
  id: "3",
  platform: "linkedin", // Not a supported platform
  type: "text",
  status: "published",
});
```

**Recommendation:** Either integrate with a backend API or clearly mark as a demo feature with a visual indicator.

---

### N9. Placeholder Routes Still Present

[router/index.ts:96-107](file:///d:/Personal%20Project/gelitik/frontend/src/router/index.ts#L96-L107):

```typescript
// Future routes (placeholders)
{ path: "/inbox", component: () => import("@/pages/DashboardPage.vue") },  // Placeholder
{ path: "/audience", component: () => import("@/pages/DashboardPage.vue") }, // Placeholder
```

These routes load `DashboardPage.vue` as a placeholder, which can confuse users navigating to `/inbox` or `/audience`.

**Recommendation:** Either create dedicated "coming soon" pages or remove these routes until features are implemented.

---

### N10. Instagram Graph API Version Mismatch

`instagramGraph.service.ts` uses **two different Graph API versions**:

| Location                                                                                                             | Version |
| -------------------------------------------------------------------------------------------------------------------- | ------- |
| [Line 22](file:///d:/Personal%20Project/gelitik/backend/src/services/instagramGraph.service.ts#L22) — `graphUrl`     | `v25.0` |
| [Line 60](file:///d:/Personal%20Project/gelitik/backend/src/services/instagramGraph.service.ts#L60) — `exchangeCode` | `v18.0` |

Mixing API versions can cause subtle bugs when field formats change between versions.

**Recommendation:** Centralize the version string as a constant and use it consistently.

---

### N11. Empty `catch` Block in Media Insights

[instagramGraph.service.ts:501-503](file:///d:/Personal%20Project/gelitik/backend/src/services/instagramGraph.service.ts#L501-L503):

```typescript
} catch (e) {
    // Error parsing insight body for this item
}
```

Silent error swallowing in a loop that processes media insights. If JSON parsing fails, the error is completely hidden.

**Recommendation:** At minimum, log the error for debugging; consider adding a Sentry or similar error reporting integration.

---

### N12. `console.error` Used as Primary Error Logging

The backend uses `console.error` in 5+ locations for production error logging. There is no structured logging (e.g., Winston, Pino) with log levels, timestamps, or request correlation.

**Recommendation:** Introduce a structured logger (e.g., Pino) for better production debugging.

---

## 🔵 Minor / Style Issues

| #   | Issue                                                                                                     | Location                                                                                                                   |
| --- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| M1  | `getLatestMetricValue` defined but never called                                                           | [instagramGraph.service.ts:209](file:///d:/Personal%20Project/gelitik/backend/src/services/instagramGraph.service.ts#L209) |
| M2  | Mixed line endings still persist in some files                                                            | Various backend/frontend files                                                                                             |
| M3  | `benchmark_ig.ts`, `test-resend.ts`, `test_ig.ts` in backend root — test/debug scripts in production tree | [backend/](file:///d:/Personal%20Project/gelitik/backend)                                                                  |
| M4  | Multiple eslint output log files committed to frontend                                                    | [frontend/](file:///d:/Personal%20Project/gelitik/frontend)                                                                |
| M5  | Two `.prettierrc` config files (`.prettierrc` + `.prettierrc.json`)                                       | [frontend/](file:///d:/Personal%20Project/gelitik/frontend)                                                                |

---

## Summary

| Severity        | Previous (Remaining) | New    | Total  |
| --------------- | -------------------- | ------ | ------ |
| 🔴 Critical     | 0                    | 4      | **4**  |
| 🟠 Architecture | 1                    | 2      | **3**  |
| 🟡 Code Quality | 0                    | 5      | **5**  |
| 🔵 Minor        | 1                    | 4      | **5**  |
| **Total Open**  | **2**                | **15** | **17** |

### Priority Actions

1. **Delete `middleware/auth.ts`** — duplicate dead code with different payload shape (N1)
2. **Fix session secret fallback** — add to `getRequiredEnvVar()` in `config/env.ts` (N2)
3. **Set dashboard `requiresAuth: true`** — one-line fix for auth bypass (N4)
4. **Standardize JWT secret access** through `config/env.ts` (N3)
5. **Define TypeScript interfaces** for Instagram Graph API responses (N6)
6. **Remove placeholder routes** or create "coming soon" pages (N9)
