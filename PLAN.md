# Gelitik Development Plan (MVP Complete)

This document outlines the scope and implementation plan for the Gelitik analytics dashboard. The MVP has been successfully implemented with the following features:

## 1. Authentication & Onboarding ✅ COMPLETE

- **Goal:** Allow users to securely access the platform and connect their social accounts.
- **Completed Tasks:**
  - [x] Standard User Login/Signup (Google OAuth / Email & Password).
  - [x] **Instagram Account Connection** (via Meta Graph API).
  - [x] **TikTok Account Connection** (via TikTok for Developers API).
  - [x] Connections Page for managing connected accounts.

## 2. Core Dashboard ("The Aha! Moment") ✅ COMPLETE

- **Goal:** Provide immediate, actionable value upon logging in.
- **Completed Tasks:**
  - [x] **Unified Overview Cards:** Display high-level aggregates (Total Followers, Total Engagement, Total Views) across all connected platforms.
  - [x] **Recent Content Table:** A sortable table showing the most recent 10-20 posts/videos, detailing basic metrics (Likes, Comments, Shares, Views).
  - [x] **Engagement Trend Chart:** A time-series chart (line or bar) displaying engagement trends over the last 7 to 30 days.
  - [x] Date range selector (7, 14, 30, 90 days)
  - [x] Manual refresh functionality
  - [x] Error handling with retry functionality

## 3. Data Syncing Infrastructure ✅ COMPLETE

- **Goal:** Keep user data fresh without requiring manual refreshes.
- **Completed Tasks:**
  - [x] Background token refresh job (`/backend/src/jobs/tokenRefresh.ts`)
  - [x] Token manager service for OAuth token lifecycle

## 4. Deep Demographics ✅ COMPLETE

- **Goal:** Provide creators with a granular understanding of who is consuming their content.
- **Completed Tasks:**
  - [x] **Age Range Panel** (`AgeRangePanel.vue`)
  - [x] **Gender Split Panel** (`GenderSplitPanel.vue`)
  - [x] **Top Cities Panel** (`TopCitiesPanel.vue`)
  - [x] **Territory Panel** (`TerritoryPanel.vue`)
  - [x] **Device Type Panel** (`DeviceTypePanel.vue`)

## 5. Advanced & Niche Analytics ✅ COMPLETE

- **Goal:** Offer premium-tier insights that help optimize content strategy.
- **Completed Tasks:**
  - [x] **Best Time Heatmap** (`BestTimeHeatmap.vue`)
  - [x] **Content Format Breakdown** (`ContentFormatBreakdown.vue`)
  - [x] **Platform Health Comparison** (`PlatformHealthComparison.vue`)
  - [x] **Dual Chart Dashboard** (`DualChartDashboard.vue`)
  - [x] **Engagement Doughnut Chart** (`EngagementDoughnutChart.vue`)

## 6. Edge Cases & Error Handling ✅ COMPLETE

- **Goal:** Ensure a robust and frustration-free experience for users when things go wrong.
- **Completed Tasks:**
  - [x] Password visibility toggles (Eye icon).
  - [x] Clear API error messaging on Login/Signup (e.g., "Invalid Credentials", "Please verify your email").
  - [x] Graceful 404 pages for undefined routes.
  - [x] Safe fallbacks when API returns no demographic data.
  - [x] Loading skeletons for all components
  - [x] Toast notifications for user feedback
  - [x] Error boundaries for component-level error handling

## 7. Platform Analytics Pages ✅ COMPLETE

- **Goal:** Detailed analytics per platform.
- **Completed Tasks:**
  - [x] TikTok Analytics Page (`TikTokAnalyticsPage.vue`)
  - [x] Instagram Analytics Page (`InstagramAnalyticsPage.vue`)
  - [x] User profile display with stats
  - [x] Video performance charts
  - [x] Content tables with detailed metrics

## 8. Additional Features ✅ COMPLETE

- **Completed Tasks:**
  - [x] Schedule Page with calendar view (`SchedulePage.vue`)
  - [x] Post creation modal (`CreatePostModal.vue`)
  - [x] Settings page (`SettingsPage.vue`)
  - [x] Notifications page (`NotificationsPage.vue`)
  - [x] Dark/Light theme toggle
  - [x] Mobile responsive design
  - [x] Neo-Brutalist UI design system

---

## Out of Scope (For Future Consideration)

- [ ] Real-time WebSocket notifications for completed background jobs.
- [ ] Integration of additional platforms (e.g., Twitter/X, YouTube).
- [ ] Post scheduling to social platforms (frontend exists, backend publishing not implemented)
- [ ] Competitor benchmarking (track rival accounts)
- [ ] AI-powered content suggestions
- [ ] Social listening / brand mentions
- [ ] Comment / inbox management

---

## MVP 2: Launch-Critical Features (Commercial Readiness)

> **Goal:** Close the gaps that would block a paying customer on Day 1.  
> **Target:** Self-hosted analytics tool sold as a one-time license ($29–49).  
> **Priority:** Ship these before any public launch or listing.

### Phase 1: Report Export (PDF / CSV) 📄

- **Goal:** Allow users to download and share their analytics with clients or teams.
- **Tasks:**
  - [ ] **Backend — Export API endpoint** (`/api/reports/export`)
    - [ ] Create `reportExport.service.ts` — aggregate analytics data into exportable format
    - [ ] Create `reports.controller.ts` — handle `GET /api/reports/export?format=pdf|csv&platform=instagram|tiktok|all&days=7|14|30|90`
    - [ ] Create `reports.routes.ts` — wire up auth-protected export routes
    - [ ] CSV generation using `json2csv` or `csv-stringify`
    - [ ] PDF generation using `pdfkit` or `jspdf` (server-side)
    - [ ] Include: KPI summary, top content table, engagement chart snapshot, demographic breakdown
  - [ ] **Frontend — Export button UI**
    - [ ] Add export button to `DashboardPage.vue` header area
    - [ ] Add export button to `InstagramAnalyticsPage.vue` and `TikTokAnalyticsPage.vue`
    - [ ] Format selector dropdown (PDF / CSV)
    - [ ] Loading state while generating report
    - [ ] Trigger browser download on completion

### Phase 2: Story & Reels Analytics 📱

- **Goal:** Surface Instagram Story and Reels-specific metrics that drive ~50% of IG engagement.
- **Tasks:**
  - [ ] **Backend — Story insights service**
    - [ ] Create `instagramStories.service.ts` — fetch Stories via Graph API (`/me/stories` endpoint)
    - [ ] Pull story-specific metrics: impressions, reach, replies, exits, taps_forward, taps_back
    - [ ] Extend `instagramInsights.service.ts` — add `story_completion_rate` calculation
  - [ ] **Backend — Reels enhancement**
    - [ ] Extend `instagramMedia.service.ts` — filter and enrich Reels data separately
    - [ ] Add Reels-specific metrics: plays, reel_interactions, initial_plays_vs_replays
  - [ ] **Frontend — Stories panel**
    - [ ] Create `StoriesPanel.vue` — show active/expired stories with metrics
    - [ ] Create `StoryCompletionChart.vue` — visualize drop-off rates across story slides
  - [ ] **Frontend — Reels section**
    - [ ] Create `ReelsPerformancePanel.vue` — dedicated Reels metrics view
    - [ ] Add Reels filter to `ContentTable.vue` (filter by `media_product_type === 'REELS'`)
    - [ ] Integrate panels into `InstagramAnalyticsPage.vue`

### Phase 3: Hashtag Analytics 🏷️

- **Goal:** Track which hashtags drive reach and engagement — essential for content strategy.
- **Tasks:**
  - [ ] **Backend — Hashtag extraction & tracking**
    - [ ] Create `hashtagAnalytics.service.ts` — parse hashtags from media captions
    - [ ] Aggregate metrics per hashtag: total reach, avg engagement, usage count
    - [ ] Create Prisma model `HashtagSnapshot` for historical hashtag performance
    - [ ] Add hashtag aggregation to daily cron job (`jobs/`)
  - [ ] **Backend — Hashtag API endpoints**
    - [ ] `GET /api/analytics/hashtags` — return ranked hashtags with metrics
    - [ ] `GET /api/analytics/hashtags/:tag` — return detail for specific hashtag
  - [ ] **Frontend — Hashtag dashboard**
    - [ ] Create `HashtagRankingPanel.vue` — sortable table of top hashtags by reach/engagement
    - [ ] Create `HashtagTrendChart.vue` — line chart showing hashtag performance over time
    - [ ] Integrate into `InstagramAnalyticsPage.vue` and `TikTokAnalyticsPage.vue`

### Phase 4: Payment & Licensing (Stripe / Lemon Squeezy) 💳

- **Goal:** Enable monetization with a simple one-time or subscription payment flow.
- **Tasks:**
  - [ ] **Backend — Payment integration**
    - [ ] Create `payment.service.ts` — Stripe Checkout session creation
    - [ ] Create `payment.controller.ts` — handle checkout + webhook events
    - [ ] Create `payment.routes.ts` — `POST /api/payment/checkout`, `POST /api/payment/webhook`
    - [ ] Prisma model updates: add `license_status`, `license_key`, `payment_date` to User model
    - [ ] Webhook handler for `checkout.session.completed` event
    - [ ] License validation middleware — gate premium features behind active license
  - [ ] **Frontend — Payment UI**
    - [ ] Create `PricingPage.vue` — display pricing tiers and "Buy Now" CTA
    - [ ] Create `LicenseStatusBanner.vue` — show trial/active/expired state in sidebar
    - [ ] Redirect flow: checkout → Stripe → success page → dashboard
    - [ ] License key display in `SettingsPage.vue`
  - [ ] **Legal pages**
    - [ ] Update `TermsOfServicePage.vue` with real refund policy and usage terms
    - [ ] Update `PrivacyPolicyPage.vue` with real data collection disclosures

### Phase 5: Test Coverage Hardening 🧪

- **Goal:** Achieve sufficient test coverage to ship with confidence.
- **Existing tests to build on:**
  - `frontend/src/__tests__/` — 8 test files (StatCard, LoginForm, SignupForm, ContentTable, auth store, dashboard store, api service, format utils)
  - `backend/src/__tests__/` — 3 test files (auth service, auth routes, analytics routes)
- **Tasks:**
  - [ ] **Backend tests**
    - [ ] Test `reportExport.service.ts` — verify CSV/PDF generation output
    - [ ] Test `hashtagAnalytics.service.ts` — verify hashtag parsing & aggregation
    - [ ] Test `payment.controller.ts` — verify webhook handling & license activation
    - [ ] Test token refresh edge cases (expired tokens, revoked access)
  - [ ] **Frontend tests**
    - [ ] Test export button flow — verify API call and download trigger
    - [ ] Test `HashtagRankingPanel.vue` — verify sorting and rendering
    - [ ] Test `StoriesPanel.vue` — verify story metrics display
    - [ ] Test license banner states (trial, active, expired)
  - [ ] **Integration / E2E (stretch goal)**
    - [ ] End-to-end login → dashboard → export flow
    - [ ] Payment flow (Stripe test mode)

---

### MVP 2 Summary

| Phase | Feature                 | Est. Effort     | Priority    |
| :---- | :---------------------- | :-------------- | :---------- |
| 1     | Report Export (PDF/CSV) | 2–3 days        | 🔴 Critical |
| 2     | Story & Reels Analytics | 3–5 days        | 🔴 Critical |
| 3     | Hashtag Analytics       | 2–3 days        | 🟠 High     |
| 4     | Payment & Licensing     | 3–5 days        | 🔴 Critical |
| 5     | Test Coverage           | 2–3 days        | 🟠 High     |
|       | **Total**               | **~12–19 days** |             |

> **Launch checklist (minimum before selling):** Phases 1, 2, and 4 must be complete.  
> Phases 3 and 5 are strongly recommended but can follow shortly after initial launch.
