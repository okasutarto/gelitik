# Full-stack code quality audit of the **Gelitik** social media analytics app.

Audited on: 2026-02-13
Updated on: 2026-02-17 (New issues added)

---

## **Critical Issues**

### **1. Duplicate TikTokService class — Two competing implementations**

Two files implement the **same class name** with **different logic**:

| **File**              | **LOC** | **Used by**                                             |
| --------------------- | ------- | ------------------------------------------------------- |
| **tiktokService.ts**  | 247     | **auth.routes.ts**, **analytics.routes.ts** (active) |
| **tiktok.service.ts** | 135     | Nothing (dead code)                                      |

tiktok.service.ts is **dead code** — the entire routes import from **tiktokService.ts**. This is a maintenance risk; someone may import the wrong file.

**Recommendation:** Delete tiktok.service.ts.

---

### **2. Hardcoded JWT Secret Fallback**

```typescript
// auth.middleware.ts:6
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// auth.routes.ts:30
jwt.sign({id:user.id}, process.env.JWT_SECRET || 'your-secret-key',...)
```

If `JWT_SECRET` env var is missing, the app silently falls back to a **public, guessable secret**. This allows token forgery.

**Recommendation:** Crash on startup if `JWT_SECRET` is not set. Remove `'your-secret-key'` fallback.

---

### **3. Verbose Debug Logging in Auth Middleware**

auth.middleware.ts has **6 `console.log` calls** that print auth headers, token lengths, user IDs, and emails on **every authenticated request**.

This is a security and performance concern — sensitive data is logged in production and floods the console.

**Recommendation:** Remove or gate behind `NODE_ENV === 'development'`.

---

### **4. Mock Auth Bypass Left in Production Code**

LoginPage.vue bypasses backend authentication entirely:

```typescript
// Bypass backend auth for now
const mockUser = {id:'dev_user', email:data.email,...};
localStorage.setItem('token', 'mock-token-123');
authStore.setAuth(mockUser, 'mock-token-123');
```

auth.ts store also has this corresponding bypass:

```typescript
// Mock session check for dev bypass
if (token.value.startsWith('mock-')) return true
```

And in router/index.ts:

```typescript
requiresAuth: false // Bypassed for dev
```

**Recommendation:** These must be removed or gated behind an environment variable before any deployment.

---

## **Architecture & Design Issues**

### **5. `useRouter()` Called Inside Pinia Store**

stores/auth.ts:17:
```typescript
const router = useRouter()
```

`useRouter()` only works inside Vue component `setup()` functions. Calling it inside a Pinia store definition can throw errors when the store is used outside a component context (e.g., in route guards, interceptors).

**Recommendation:** The `router` in this store is actually **unused** — remove it. If routing is needed, accept it as a parameter or use `window.location.href` (which logout() already does).

---

### **6. errorHandler Middleware Not Registered**

errorHandler.ts defines **errorHandler** and **notFoundHandler**, but **app.ts** **never registers them**. Express errors fall through to the default handler.

**Recommendation:** Add `app.use(errorHandler)` and `app.use(notFoundHandler)` at the end of app.ts.

---

### **7. Multiple `new PrismaClient()` Instances**

`PrismaClient` is instantiated independently in:
- **auth.middleware.ts**
- **auth.routes.ts**
- **analytics.routes.ts**
- **socialAccounts.ts**
- **passport.ts**
- **tokenRefresh.ts**
- **auth.controller.ts**

Each `new PrismaClient()` opens its own connection pool — this wastes resources and can hit database connection limits.

**Recommendation:** Create a shared singleton (e.g., `src/config/prisma.ts`) and import it everywhere.

---

### **8. AuthLayout.vue is Dead Code**

AuthLayout.vue is never imported or used. LoginPage.vue builds its own split-screen layout inline.

**Recommendation:** Either delete it or refactor LoginPage.vue to use it.

---

## **Code Quality & DRY Violations**

### **9. formatNumber() Duplicated Across 3+ Components**

The exact same function is duplicated in:
- **TikTokAnalyticsPage.vue:74**
- **InstagramAnalyticsPage.vue:57**
- **ContentTable.vue:26**
- **TopVideosChart.vue:72**

**Recommendation:** Extract to a shared utility (e.g., `src/utils/format.ts`).

---

### **10. Heavy Use of `alert()` for User Notifications**

`alert()` is used in:
- **router/index.ts:120** — TikTok connection success
- **TikTokAnalyticsPage.vue:83** — Account not connected
- **InstagramAnalyticsPage.vue:66** — Same
- **ConnectionsPage.vue:57-61** — Connection failures

`alert()` blocks the UI thread and looks unprofessional.

**Recommendation:** Replace with a toast/notification system component.

---

### **11. Inconsistent Line Endings (CRLF vs LF)**

Many files mix `CRLF` and `LF` line endings, even within the same file (e.g., router/index.ts, app.ts).

**Recommendation:** Add an `.editorconfig` and configure Git: `git config core.autocrlf true`.

---

### **12. Sidebar Tooltips Will Never Appear**

AppSidebar.vue sidebar items use `group-hover:opacity-100` for tooltips, but none of the parent `<button>` elements have the `group` class.

**Recommendation:** Add `group` to each nav button: `class="group w-full flex..."`.

---

### **13. Hardcoded Platform Connection Status**

AppSidebar.vue:56-63:
```typescript
const platformItems: PlatformItem[] = [
  {name:'Instagram',...,connected:true},
  {name:'TikTok',...,connected:true},
];
```

The `connected` field is hardcoded to `true`. It should be derived from actual account connection state.

---

### **14. Unused Functions & Dead Code in ContentTable.vue**

- **getStatusBadge()** — defined but **never called** in the template
- **ContentItem** interface — defined but objects of this type are **never created**
- **capitalize()** — only used once, could be inlined

---

### **15. useTheme Uses `onMounted` Inside Composable**

useTheme.ts:59 calls `onMounted()` inside the composable. This is fine semantically, but means theme initialization only happens when the component mounts — a FOUC (flash of unstyled content) will occur since the dark class is applied late.

**Recommendation:** Call initTheme() synchronously instead, or move it to **main.ts**.

---

### **16. Unused Imports in usePlatformAnalytics.ts**

usePlatformAnalytics.ts:
- `onMounted` is imported but never used
- `useAuthStore` is imported but never used

---

### **17. useSchedule State Leak — Module-Level Refs**

useSchedule.ts:67-68:
```typescript
const scheduledPosts = ref<Post[]>(generateMockPosts())
const selectedDate = ref(new Date())
```

These refs are **module-level singletons**, meaning all components share the same state. This is likely intentional for global state, but if a user logs out and another logs in, stale data persists.

---

### **18. TopVideosChart Video List Shows Wrong Metric**

TopVideosChart.vue:240: The video list always shows `view_count` regardless of the selected `sortBy` metric. When sorted by "likes", the number shown is still views.

---

### **19. truncate CSS Override in TopVideosChart**

TopVideosChart.vue:253-261: The component redefines `.truncate` with `-webkit-line-clamp: 2`, which conflicts with Tailwind's built-in `.truncate` utility (single-line ellipsis). This breaks the expected behavior of **truncate** throughout the component.

---

## **Minor / Style Issues**

| **#** | **Issue** | **Location** |
| ----- | --------- | ------------- |
| 20 | `font-black` and `font-bold` used together on same element (`p` tag) — they conflict | **AppSidebar.vue:294** |
| 21 | Copyright says "© 2024" — should be 2025/2026 or use dynamic year | **LoginPage.vue:130** |
| 22 | **handleForgotPassword** and **handleSignup** are empty `console.log` stubs | **LoginPage.vue:34-40** |
| 23 | `Bell` icon used as generic indicator for all setting items — should vary per item type | **SettingsPage.vue:144** |
| 24 | Dynamic Tailwind classes in **ConnectionsPage.vue** (`bg-${color}-100`) won't be compiled by Tailwind's JIT — they need to be safelisted or use static classes | **ConnectionsPage.vue:105-110** |
| 25 | `placeholder.com` reference in **TopVideosChart.vue** — this service is unreliable | **TopVideosChart.vue:226** |
| 26 | No global error boundary — unhandled promise rejections in route guards or API calls will silently fail | General |
| 27 | Ascending button always shows "↓" regardless of direction | **TopVideosChart.vue:195** |

---

## **NEW: Additional Issues Found (2026-02-17)**

### **Security Issues (Not in Original Audit)**

#### **28. Access Tokens Passed in URL Query Parameters**

`socialAccounts.ts:42-47` passes access tokens in URL query strings:
```typescript
res.redirect(`${process.env.FRONTEND_URL}/auth/tiktok/callback?` +
  `access_token=${tokenData.access_token}`
```
This exposes tokens in server logs, browser history, and referrer headers.

**Recommendation:** Use session-based token storage or HTTP-only cookies instead.

---

#### **29. OAuth State Parameter Not Validated (CSRF Vulnerability)**

`auth.routes.ts` passes state to OAuth providers but never validates it on callback, allowing CSRF attacks.

**Recommendation:** Generate and store state in session, validate on OAuth callback.

---

#### **30. No Rate Limiting on Auth Endpoints**

Despite `express-rate-limit` being installed, no rate limiting is applied to `/auth/login` or `/auth/register`, making them vulnerable to brute force attacks.

**Recommendation:** Apply rate limiting to auth endpoints.

---

#### **31. Missing Input Validation**

Registration accepts any email/password without validation. No email format checking, no password strength requirements.

**Recommendation:** Add validation using Joi (already installed).

---

#### **32. No Authorization Checks on Analytics Routes**

`analytics.routes.ts` doesn't verify that requested videos belong to the authenticated user's connected accounts. Any user could access any video by ID.

**Recommendation:** Add ownership verification before returning video data.

---

#### **33. Hardcoded Secrets in .env File**

`.env` contains hardcoded secrets:
- `JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"`
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- `TIKTOK_CLIENT_ID` and `TIKTOK_CLIENT_SECRET`
- `DATABASE_URL` with actual Supabase credentials

**Recommendation:** Remove default values, require all secrets to be set via environment.

---

#### **34. Hardcoded Ngrok URLs in Production Code**

- `app.ts:23` - hardcoded ngrok URL
- `vite.config.ts:8` - hardcoded allowedHosts

**Recommendation:** Use environment variables only.

---

### **Architecture Issues (Not in Original Audit)**

#### **35. Inconsistent Error Response Format**

Some routes return `{ error: string }`, others return `{ success: false, error: string }`. No standardized format.

**Recommendation:** Standardize all error responses to `{ success: false, message: string, code?: string }`.

---

#### **36. No Centralized API Error Handling**

Frontend `api.ts` doesn't have centralized error handling. Each component handles errors differently.

**Recommendation:** Add interceptors in api.ts for consistent error handling and toast notifications.

---

### **Code Quality Issues (Not in Original Audit)**

#### **37. Excessive Use of `any` Type**

Found 50+ occurrences of `any` type:
- `tiktokService.ts` - multiple methods return `Promise<any>`
- `instagram.service.ts` - same issue
- `usePlatformAnalytics.ts` - uses `any` for userInfo and videos
- Multiple `(req.user as any)` casts

**Recommendation:** Define proper interfaces for all API responses.

---

#### **38. Console.log in Frontend Code**

Frontend has console.log in 7 files:
- `ConnectionsPage.vue`
- `ContentTable.vue`
- `LoginPage.vue`
- `useVideoAnalytics.ts`
- `CalendarView.vue`
- `usePlatformAnalytics.ts`
- `stores/auth.ts`

**Recommendation:** Remove or gate behind `import.meta.env.DEV`.

---

#### **39. No ESLint/Prettier Configuration**

Both frontend and backend lack ESLint and Prettier configurations.

**Recommendation:** Add proper linting and formatting configs.

---

#### **40. TypeScript Version Mismatch**

- Backend: `"typescript": "^5.3.3"`
- Frontend: `"typescript": "~5.6.3"`

**Recommendation:** Align versions across projects.

---

#### **41. Empty Catch Blocks / Generic Error Handling**

Many catch blocks are empty or just re-throw without logging:
```typescript
} catch (error) {
  // empty
}
```

**Recommendation:** Add proper error logging and user-friendly messages.

---

## **Summary**

### Original Issues (from 2026-02-13)

| **Severity** | **Count** |
|--------------|-----------|
| Critical     | 4         |
| Architecture | 4         |
| Code Quality | 11        |
| Minor / Style | 8        |
| **Total**    | **27**    |

### New Issues Found (2026-02-17)

| **Severity** | **Count** |
|--------------|-----------|
| Security     | 7         |
| Architecture | 2         |
| Code Quality | 6        |
| **Total New**| **15**    |

### Combined Total

| **Severity**        | **Count** |
|---------------------|-----------|
| Critical + Security | 11        |
| Architecture        | 6         |
| Code Quality        | 17        |
| Minor / Style       | 8         |
| **Grand Total**     | **42**    |

---

## **Recommended Priority Order**

### Phase 1: Critical Security (Do First)
1. Delete duplicate tiktok.service.ts
2. Fix hardcoded JWT secret fallback
3. Remove mock auth bypass
4. **Fix access tokens in URL (NEW #28)**
5. **Add OAuth state validation (NEW #29)**
6. **Add rate limiting (NEW #30)**
7. **Add input validation (NEW #31)**
8. **Remove hardcoded secrets from .env (NEW #33)**

### Phase 2: Architecture
9. Remove verbose debug logging
10. Register errorHandler middleware
11. Create shared PrismaClient singleton
12. **Standardize error responses (NEW #35)**
13. **Add centralized API error handling (NEW #36)**

### Phase 3: Code Quality
14. Extract formatNumber to shared utility
15. Replace alert() with toast
16. Fix sidebar tooltips
17. **Fix excessive use of any (NEW #37)**
18. **Add ESLint/Prettier (NEW #39)**
19. Fix TypeScript versions

### Phase 4: Minor Improvements
20. Fix line endings
21. Fix remaining minor issues
