# Gelitik — Dashboard & Analytics Redesign Plan

> Refined component-level Vue implementation plan — includes props, emits, data shapes, composables, and component hierarchy for each page.

---

## 1. Project Context

**Product:** Gelitik — a social media management platform combining TikTok and Instagram analytics into a single dashboard.

**Stack:** Vue 3 (Composition API), Tailwind CSS (utility + custom neo-brutalist tokens), Chart.js via `vue-chartjs`, Pinia stores, TypeScript.

**Current state:** Three analytics pages exist — Overview Dashboard, TikTok Analytics, Instagram Insights. Instagram Graph API and TikTok API integrations are live. Design tokens are established (`#FFD000` yellow accent, `#1A1A2E` dark navy, `#FF4B8B` Instagram pink, `#00F0FF` electric blue for dark mode).

**Goal for this sprint:** Redesign and improve the Dashboard (Overview) page and both Analytics pages — adding missing metrics, fixing layout gaps, and making the pages more actionable.

---

## 2. Resolved Questions from Codebase Audit

These questions from the original plan have been answered by inspecting the actual project:

| #   | Question           | Answer                                                                                                                                                                                                                                                                            |
| --- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Chart library**  | **Chart.js** via `vue-chartjs` (`Bar`, `Doughnut`, `Line` component imports). Registered globally in `composables/useChart.ts`.                                                                                                                                                   |
| 2   | **API data shape** | See §2.1 below for exact backend response shapes.                                                                                                                                                                                                                                 |
| 3   | **Heatmap data**   | Instagram Graph API returns `follower_demographics` and audience activity by age/gender/city, but **not** by hour/day. TikTok API does not expose hourly audience data. The `<BestTimeHeatmap />` section needs a **derived data fallback** using `create_time` from media posts. |
| 4   | **Watch Time API** | TikTok's `getVideos` does **not** return `avg_watch_time` or `completion_rate` per-video in the current response. These columns should be left as placeholders (`—`) until the TikTok Research API is enabled.                                                                    |
| 5   | **Vue Router**     | Routes: `/dashboard` → `DashboardPage.vue`, `/dashboard/tiktok` → `TikTokAnalyticsPage.vue`, `/dashboard/instagram` → `InstagramAnalyticsPage.vue`, `/dashboard/instagram-graph` → same component.                                                                                |
| 6   | **Error handling** | Toast notifications via `useToast()` composable. 404 errors on analytics redirect to `/connections`.                                                                                                                                                                              |

### 2.1 Backend API Response Shapes

**Instagram Graph API** (`GET /api/analytics/instagram-graph`):

```ts
// instagramGraph.service.ts → getAnalytics()
{
  profile: {
    id: string;
    name: string;
    username: string;
    profile_picture_url: string;
    followers_count: number;
    follows_count: number;
    media_count: number;
  };
  insights: {
    followers: number;
    reach: number;
    impressions: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    totalInteractions: number;
    profileViews: number;
    accountsEngaged: number;
    following: number;
    mediaCount: number;
  };
  media: MediaItem[]; // array of media objects with per-post insights
}
```

**TikTok API** (`GET /api/analytics/tiktok`):

```ts
// tiktokService.ts → getAnalytics()
{
  videos: TikTokVideo[];  // id, video_description, view_count, like_count, comment_count, share_count, cover_image_url, create_time, duration
  analytics: {
    followers: number;
    following: number;
    totalLikes: number;
    totalComments: number;
    totalShares: number;
    totalViews: number;
    engagementRate: number;
  };
  userInfo: {
    id: string;
    display_name: string;
    avatar_url: string;
    bio_description: string;
    follower_count: number;
    following_count: number;
    likes_count: number;
    video_count: number;
    is_verified: boolean;
  };
}
```

---

## 3. Existing Component Inventory

Before adding new components, here is what already exists and can be reused:

| Component                 | Location                                | Reusable? | Notes                                                                          |
| ------------------------- | --------------------------------------- | --------- | ------------------------------------------------------------------------------ |
| `StatCard`                | `dashboard/StatCard.vue`                | ✅        | Accepts `title`, `value`, `icon`, `subtitle`. **Missing delta/trend support.** |
| `AudienceChart`           | `dashboard/AudienceChart.vue`           | ✅        | Bar chart with platform prop. **Missing timeframe toggle & metric toggle.**    |
| `ContentTable`            | `dashboard/ContentTable.vue`            | ✅        | Sortable table, accepts `platform` and `videos` props.                         |
| `TopVideosChart`          | `dashboard/TopVideosChart.vue`          | ✅        | Horizontal bar chart, sorts by views/likes/shares/engagement.                  |
| `UserProfile`             | `dashboard/UserProfile.vue`             | ✅        | Avatar, name, follower/following/likes/video counts.                           |
| `TopCitiesPanel`          | `dashboard/TopCitiesPanel.vue`          | ✅        | Horizontal bar chart for top cities.                                           |
| `AgeRangePanel`           | `dashboard/AgeRangePanel.vue`           | ✅        | Vertical bar chart for age distribution.                                       |
| `DualChartDashboard`      | `dashboard/DualChartDashboard.vue`      | ✅        | Contains `TopVideosChart` + export button.                                     |
| `EngagementDoughnutChart` | `dashboard/EngagementDoughnutChart.vue` | ✅        | Doughnut chart for engagement breakdown.                                       |
| `VideoDetailModal`        | `dashboard/VideoDetailModal.vue`        | ✅        | Modal with detailed video analytics + demographics.                            |
| `DeviceTypePanel`         | `dashboard/DeviceTypePanel.vue`         | ✅        | Device type breakdown panel.                                                   |
| `TerritoryPanel`          | `dashboard/TerritoryPanel.vue`          | ✅        | Geography/territory breakdown panel.                                           |

### Existing Composables

| Composable             | Purpose                                                                                                          |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `usePlatformAnalytics` | Fetches analytics for a given platform, returns `{ loading, error, accountData, fetchAnalytics, fetchOverview }` |
| `useToast`             | Shows toast notifications (success, error, info, warning)                                                        |
| `useTheme`             | Dark/light mode with `isDark` reactive ref                                                                       |
| `useChart`             | Registers Chart.js components globally                                                                           |
| `usePlatform`          | Platform connection status                                                                                       |
| `useVideoAnalytics`    | Video-specific analytics logic                                                                                   |

### Existing Pinia Stores

| Store              | Purpose                                               |
| ------------------ | ----------------------------------------------------- |
| `auth.ts`          | User authentication, login/logout, session management |
| `notifications.ts` | Notification state management                         |

> ⚠️ **No analytics stores exist yet.** All analytics data is fetched directly in page components via `usePlatformAnalytics`. The plan proposes adding dedicated stores with TTL caching.

---

## 4. Page 1 — Overview Dashboard

### 4.1 Current Problems

- KPI cards show **hardcoded** values — no API data is fetched
- `AudienceChart` exists but has no timeframe/metric toggle controls
- `ContentTable` renders but may show "No content yet" if no platform data is passed
- No cross-platform comparison or actionable insights
- No posting time recommendation
- No `useDashboardData()` composable exists — data is inline

### 4.2 Target Layout (top to bottom)

```
┌─────────────────────────────────────────────────────┐
│  PAGE HEADER — "Overview / Welcome back"            │
├─────────────────────────────────────────────────────┤
│  KPI STATS BAR (4 cards, full width)                │
├─────────────────────────────────────────────────────┤
│  AUDIENCE GROWTH CHART (full width)                 │
├────────────────────────┬────────────────────────────┤
│  PLATFORM HEALTH       │  BEST TIME TO POST         │
│  COMPARISON            │  HEATMAP                   │
│  (left half)           │  (right half)              │
├─────────────────────────────────────────────────────┤
│  TOP PERFORMING CONTENT (full width, cross-platform)│
└─────────────────────────────────────────────────────┘
```

---

### 4.3 Component Hierarchy

```
DashboardPage.vue
├── DashboardLayout (existing)
├── PageHeader (existing)
├── DashboardKpiBar [MODIFY StatCard — add delta support]
│   └── StatCard × 4 (existing, needs delta props)
├── AudienceGrowthChart [MODIFY AudienceChart — add controls]
│   └── ChartTimeframeControl [NEW]
├── PlatformHealthComparison [NEW]
├── BestTimeHeatmap [NEW]
└── TopPerformingContent [MODIFY ContentTable — add cross-platform badge]
```

---

### 4.4 Component Specifications

#### [MODIFY] `<StatCard />` — Add Delta Support

The existing `StatCard` only shows `title`, `value`, `icon`, `subtitle`. Needs delta indicator.

**Updated Props:**

```ts
import type { Component } from "vue";

interface Props {
  title: string;
  value: string | number;
  icon?: Component;
  subtitle?: string;
  // NEW — Delta support
  delta?: number; // absolute change, e.g. +24000
  deltaPercent?: number; // percentage change, e.g. 1.3
  deltaLabel?: string; // e.g. "vs last week"
  loading?: boolean;
}
```

**Behavior:**

- When `delta` is provided, show it below the value as `+24k` or `-1.2k` in green/red
- When `deltaPercent` is provided, show `▲ 1.3%` or `▼ 0.5%` next to delta
- When `loading` is true, show a skeleton placeholder instead of content
- Count-up animation on first load using `requestAnimationFrame`

---

#### [MODIFY] `<AudienceChart />` → `<AudienceGrowthChart />`

Rename and extend the existing `AudienceChart` component. Currently a basic bar chart.

**Updated Props:**

```ts
interface Props {
  instagramData: { date: string; value: number }[];
  tiktokData: { date: string; value: number }[];
  loading?: boolean;
  // Existing props kept
  platform?: "all" | "instagram" | "tiktok";
  title?: string;
  subtitle?: string;
}
```

**Emits:**

```ts
emits: {
  "timeframe-change": [value: "7d" | "30d" | "90d"];
  "metric-change": [value: "new" | "cumulative"];
}
```

**Controls (top right of card):**

- `ChartTimeframeControl` component: `7D | 30D | 90D` pill buttons
- Metric toggle: `New Followers | Cumulative Followers` dropdown

**Chart behavior:**

- Grouped bar chart in "New Followers" mode (current behavior)
- Stacked area/line chart in "Cumulative Followers" mode
- Instagram bars: `#FF4B8B`, TikTok bars: `#1A1A2E` (light) / `#00F0FF` (dark)
- Y-axis: K/M abbreviations via existing `formatNumber()`
- X-axis: day labels for 7D, week labels for 30D, month labels for 90D

---

#### [NEW] `<ChartTimeframeControl />`

Reusable `7D | 30D | 90D` toggle pill component.

**Props:**

```ts
interface Props {
  modelValue: "7d" | "30d" | "90d";
  options?: { label: string; value: string }[];
}
```

**Emits:**

```ts
emits: {
  "update:modelValue": [value: string];
}
```

**Style:** Neo-brutalist pill buttons with `border-2 border-black` active state.

---

#### [NEW] `<PlatformHealthComparison />`

Side-by-side card comparing Instagram and TikTok performance this week.

**Props:**

```ts
interface PlatformSnapshot {
  platform: "instagram" | "tiktok";
  followers: number;
  followerGrowth: number;
  followerGrowthPercent: number;
  engagementRate: number;
  postsThisWeek: number;
}

interface Props {
  instagram: PlatformSnapshot | null;
  tiktok: PlatformSnapshot | null;
  loading?: boolean;
}
```

**Insight logic (rule-based):**

- If one platform's engagement rate is >2× the other → "Platform X has significantly higher engagement"
- If posts on platform A is >2× platform B → "You're posting X times more on Platform A"
- If follower growth is negative → "Platform X lost followers this week"
- Default: "Both platforms are performing consistently"

**Layout:** Two columns (IG left, TikTok right), with insight banner at bottom.

---

#### [NEW] `<BestTimeHeatmap />`

7×24 heatmap grid showing the best days and times to post.

> ⚠️ **Data limitation:** Neither Instagram Graph API nor TikTok API exposes audience activity by hour/day. We derive this from `create_time` of published media posts to show **when the user's highest-performing content was published**, which serves as a proxy for best posting times.

**Props:**

```ts
interface Props {
  heatmapData: { day: number; hour: number; score: number }[]; // score 0–100
  loading?: boolean;
  hasData: boolean;
}
```

**Fallback:** If `hasData` is false, show: `"Post more content to unlock posting time recommendations"`

**Rendering:** Use a CSS Grid with colored `div` cells (light yellow → deep yellow gradient). Top 3 slots get a ring border and tooltip.

---

#### [MODIFY] `<ContentTable />` — Cross-Platform Badge

Add a platform badge column when `platform="all"` to differentiate Instagram vs TikTok posts.

**New Internal Column:**

- Platform icon (Instagram pink / TikTok dark) shown as a small badge next to the thumbnail

---

### 4.5 Dashboard Page Composable — `useDashboardData()`

**File:** `composables/useDashboardData.ts` [NEW]

```ts
interface DashboardData {
  kpiCards: KpiCardData[];
  audienceGrowth: {
    instagram: { date: string; value: number }[];
    tiktok: { date: string; value: number }[];
  };
  platformHealth: {
    instagram: PlatformSnapshot | null;
    tiktok: PlatformSnapshot | null;
  };
  heatmapData: { day: number; hour: number; score: number }[];
  topContent: ContentItem[];
}

// Usage in DashboardPage.vue
const {
  kpiCards,
  audienceGrowth,
  platformHealth,
  heatmapData,
  topContent,
  isLoading,
  lastUpdated,
  refresh,
} = useDashboardData();
```

**Fetch strategy:**

- Fetch both platform analytics in parallel via `Promise.all([fetchTikTok(), fetchInstagram()])`
- Merge results into unified dashboard data
- Cache results in `dashboardStore` (Pinia) with a TTL of 15 minutes
- Show skeleton loaders per-section (not a global page spinner)
- On error, show per-section error states with a retry button

**Transformation layer:**

- Backend returns platform-specific shapes → composable normalizes to `KpiCardData[]`, `PlatformSnapshot`, etc.
- `kpiCards[0].value = formatNumber(instagram.insights.followers + tiktok.analytics.followers)`

---

## 5. Page 2 — TikTok Analytics

### 5.1 Current Problems

- Right half of the Views Trend section is blank — only `TopVideosChart` renders in `DualChartDashboard`, no second chart
- TikTok shows engagement stats but **no follower growth chart** (Instagram has `AudienceChart` — inconsistent)
- Content table missing Watch Time, Completion Rate columns
- Stat cards have empty `change` and `subtitle` fields — no delta context
- No `EngagementDoughnutChart` is used on the right side of `DualChartDashboard`

### 5.2 Target Layout

```
┌─────────────────────────────────────────────────────┐
│  PAGE HEADER                                        │
├─────────────────────────────────────────────────────┤
│  USER PROFILE (avatar, name, followers, etc.)       │
├─────────────────────────────────────────────────────┤
│  KPI STATS BAR (4 cards)                            │
├────────────────────────┬────────────────────────────┤
│  TOP VIDEOS CHART      │  ENGAGEMENT DOUGHNUT       │
│  (left half)           │  (right half — fix blank)  │
├────────────────────────┴────────────────────────────┤
│  FOLLOWER GROWTH CHART (full width) [NEW]           │
├─────────────────────────────────────────────────────┤
│  TOP PERFORMING CONTENT TABLE (full width)          │
└─────────────────────────────────────────────────────┘
```

### 5.3 Component Hierarchy

```
TikTokAnalyticsPage.vue
├── DashboardLayout (existing)
├── PageHeader (existing)
├── UserProfile (existing)
├── StatCard × 4 (existing, update to show delta)
├── DualChartDashboard (existing — fix right panel)
│   ├── TopVideosChart (existing)
│   └── EngagementDoughnutChart (existing, wire it in)
├── AudienceChart [ADD — reuse existing component]
│   └── ChartTimeframeControl [NEW]
└── ContentTable (existing)
```

### 5.4 Component Specifications

#### [MODIFY] `<DualChartDashboard />` — Fix Blank Right Panel

The right half of the two-column grid is currently empty. The `EngagementDoughnutChart` component **already exists** but is not wired into `DualChartDashboard.vue`.

**Fix:** Add `<EngagementDoughnutChart :videos="videos" />` to fill the right column.

#### [ADD] `<AudienceChart />` to TikTok Page

Reuse the existing `AudienceChart` component with `platform="tiktok"`. Currently only used on Instagram page.

> ⚠️ **Data limitation:** TikTok API does not provide historical follower growth data. The chart will need to show derived data from cached daily snapshots (requires backend cron job to store daily follower counts). For now, show a placeholder state: `"Follower growth tracking will begin after 7 days of data collection."`

#### Updated `<ContentTable />` Column Order for TikTok

Current columns work. Future additions (when TikTok Research API is enabled):

- **Watch Time** (placeholder: `—`)
- **Completion Rate** (placeholder: `—`)
- **Followers Gained** (placeholder: `—`)

---

## 6. Page 3 — Instagram Insights

### 6.1 Current Problems

- **Saves** metric is missing from the KPI stat cards (API returns it, frontend doesn't display it)
- Followers card was removed — need to add it back or confirm removal is intentional
- Age Range panel renders but may appear empty if API data isn't mapped correctly
- No gender split in audience demographics
- No content format breakdown (Reels vs Feed Posts vs Stories)
- `FollowerNetGrowthChart` placeholder exists in layout but data isn't time-series

### 6.2 Target Layout

```
┌─────────────────────────────────────────────────────┐
│  PAGE HEADER                                        │
├─────────────────────────────────────────────────────┤
│  USER PROFILE                                       │
├─────────────────────────────────────────────────────┤
│  KPI STATS BAR (6 cards — add Saves + Followers)    │
├─────────────────────────────────────────────────────┤
│  FOLLOWER NET GROWTH CHART (keep existing)          │
├────────────────────────┬────────────────────────────┤
│  AUDIENCE DEMOGRAPHICS │  CONTENT FORMAT BREAKDOWN  │
│  (Top Cities, Age,     │  (Reels vs Feed vs Stories)│
│  Gender)               │  [NEW]                     │
├─────────────────────────────────────────────────────┤
│  TOP PERFORMING CONTENT TABLE                       │
└─────────────────────────────────────────────────────┘
```

### 6.3 Component Hierarchy

```
InstagramAnalyticsPage.vue
├── DashboardLayout (existing)
├── PageHeader (existing)
├── UserProfile (existing)
├── StatCard × 6 (existing, add Saves + Followers back)
├── AudienceChart (existing, platform="instagram")
├── Audience Demographics Row
│   ├── TopCitiesPanel (existing)
│   ├── AgeRangePanel (existing — fix data mapping)
│   └── GenderSplitPanel [NEW]
├── ContentFormatBreakdown [NEW]
└── ContentTable (existing)
```

### 6.4 Component Specifications

#### [MODIFY] Instagram KPI Bar — Add Saves + Followers

Current stat cards (after user removed Followers): `Impressions | Accounts Reached | Profile Views | Accounts Engaged | Engagement Rate`

**Updated card order (6 cards):**
`Followers | Impressions | Accounts Reached | Profile Views | Accounts Engaged | Saves | Engagement Rate`

> Note: The layout grid should change from `lg:grid-cols-5` to `lg:grid-cols-7` or wrap into 2 rows.

**Data mapping from `insights`:**

```ts
{ title: "Followers",        value: insights.followers,        icon: Users }
{ title: "Impressions",      value: insights.impressions,      icon: Eye }
{ title: "Accounts Reached", value: insights.reach,            icon: UserPlus }
{ title: "Profile Views",    value: insights.profileViews,     icon: UserCheck }
{ title: "Accounts Engaged", value: insights.accountsEngaged,  icon: Activity }
{ title: "Saves",            value: insights.saves,            icon: Bookmark } // NEW
{ title: "Engagement Rate",  value: engagementRate,            icon: Heart }
```

#### [NEW] `<GenderSplitPanel />`

Simple donut chart or horizontal split bar showing Male / Female / Other percentages.

**Props:**

```ts
interface Props {
  data: { gender: string; percentage: number }[];
  loading?: boolean;
}
```

> ⚠️ **Data availability:** Instagram Graph API provides gender breakdown via `audience_gender_age` metric, but this requires the `instagram_manage_insights` scope and a minimum of 100 followers. If unavailable, show a placeholder.

#### [NEW] `<ContentFormatBreakdown />`

Doughnut chart showing performance split by content type using data from the `media` array.

**Props:**

```ts
interface ContentFormat {
  type: "REELS" | "IMAGE" | "CAROUSEL_ALBUM" | "VIDEO";
  count: number;
  avgReach: number;
  avgEngagement: number;
}

interface Props {
  formats: ContentFormat[];
  loading?: boolean;
}
```

**Derivation logic (in composable):**

- Group `media[]` by `media_type` and `media_product_type`
- Calculate count, average reach, and average engagement per group
- Render as a doughnut chart with a table legend

---

## 7. Shared Components (used across pages)

| Component                      | Status | Description                                     |
| ------------------------------ | ------ | ----------------------------------------------- |
| `<StatCard />`                 | MODIFY | Add `delta`, `deltaPercent`, `loading` props    |
| `<ContentTable />`             | MODIFY | Add platform badge column when `platform="all"` |
| `<ChartTimeframeControl />`    | NEW    | Reusable `7D / 30D / 90D` toggle pill           |
| `<GenderSplitPanel />`         | NEW    | Gender distribution donut chart                 |
| `<ContentFormatBreakdown />`   | NEW    | Content type performance breakdown              |
| `<PlatformHealthComparison />` | NEW    | Side-by-side platform comparison card           |
| `<BestTimeHeatmap />`          | NEW    | 7×24 posting time heatmap grid                  |

---

## 8. State Management (Pinia)

### New Stores Required

```
stores/
├── auth.ts              // existing — user authentication
├── notifications.ts     // existing — notification state
├── dashboardStore.ts    // NEW — combined overview data, TTL cache
├── tiktokStore.ts       // NEW — TikTok-specific analytics data
└── instagramStore.ts    // NEW — Instagram-specific analytics data
```

Each new store should have:

```ts
interface AnalyticsStore {
  data: PlatformData | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: number | null; // timestamp

  // Actions
  fetch(): Promise<void>; // fetch if TTL expired
  refresh(): Promise<void>; // force re-fetch ignoring TTL
  clear(): void; // clear on logout
}
```

**TTL strategy:** 15-minute cache. Check `Date.now() - lastFetched > 15 * 60 * 1000` before fetching.

**`dashboardStore`** aggregates data from both platform stores and computes cross-platform KPIs.

---

## 9. Implementation Progress

### Phase 1: Quick Wins (~3 hrs)

| Status | Branch                            | Task                                          | Effort |
| ------ | --------------------------------- | --------------------------------------------- | ------ |
| ✅     | `feature/statcard-delta`          | Add delta/trend props to `StatCard`           | 1 hr   |
| ✅     | `feature/chart-timeframe-control` | Create `ChartTimeframeControl` component      | 1 hr   |
| ✅     | `feature/fix-dual-chart`          | Fix blank right panel in `DualChartDashboard` | 30 min |
| ✅     | `feature/instagram-saves-card`    | Add Saves + Followers to Instagram stat cards | 30 min |

### Phase 2: State Management & Data Layer (~7 hrs)

| Status | Branch                         | Task                                   | Effort |
| ------ | ------------------------------ | -------------------------------------- | ------ |
| ✅     | `feature/analytics-stores`     | Create Pinia stores with TTL caching   | 3 hrs  |
| ✅     | `feature/dashboard-composable` | Create `useDashboardData()` composable | 2 hrs  |
| ✅     | `feature/dashboard-live-data`  | Wire DashboardPage to real API data    | 2 hrs  |

### Phase 3: New Components (~8 hrs)

| Status | Branch                             | Task                                     | Effort |
| ------ | ---------------------------------- | ---------------------------------------- | ------ |
| ✅     | `feature/platform-health`          | Build `PlatformHealthComparison`         | 3 hrs  |
| ✅     | `feature/content-format-breakdown` | Build `ContentFormatBreakdown`           | 2 hrs  |
| ✅     | `feature/gender-split-panel`       | Build `GenderSplitPanel`                 | 1 hr   |
| ✅     | `feature/tiktok-follower-chart`    | Add follower growth chart to TikTok page | 2 hrs  |

### Phase 4: Advanced Features (~5 hrs)

| Status | Branch                            | Task                                            | Effort |
| ------ | --------------------------------- | ----------------------------------------------- | ------ |
| ✅     | `feature/best-time-heatmap`       | Build `BestTimeHeatmap`                         | 3 hrs  |
| ✅     | `feature/audience-chart-controls` | Add timeframe/metric toggles to `AudienceChart` | 2 hrs  |

**Total estimated effort:** ~23 hours

> **Legend:** ☐ = Not started · 🔄 = In progress · ✅ = Merged to `main`

---

## 10. Out of Scope for This Sprint

- Unified comment/DM inbox
- Competitor benchmarking
- Auto-publishing / cross-posting
- AI content suggestions
- Export / PDF reports
- New platforms beyond TikTok and Instagram
- TikTok Research API integration (Watch Time, Completion Rate fields)
- Backend cron job for daily follower snapshots (tracked as future work)

---

_End of refined plan._
