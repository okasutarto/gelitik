# Gelitik Development Plan (MVP+ V1 & V2)

This document outlines the scope and implementation plan for the Gelitik analytics dashboard, explicitly incorporating both core V1 features and advanced V2 features.

## 1. Authentication & Onboarding

- **Goal:** Allow users to securely access the platform and connect their social accounts.
- **Tasks:**
  - [ ] Standard User Login/Signup (Google OAuth / Email & Password).
  - [ ] **Instagram Account Connection** (via Meta Graph API).
  - [ ] **TikTok Account Connection** (via TikTok for Developers API).

## 2. Core Dashboard ("The Aha! Moment")

- **Goal:** Provide immediate, actionable value upon logging in.
- **Tasks:**
  - [ ] **Unified Overview Cards:** Display high-level aggregates (Total Followers, Total Engagement, Total Views) across all connected platforms.
  - [ ] **Recent Content Table:** A sortable table showing the most recent 10-20 posts/videos, detailing basic metrics (Likes, Comments, Shares, Views).
  - [ ] **Engagement Trend Chart:** A time-series chart (line or bar) displaying engagement trends over the last 7 to 30 days.

## 3. Data Syncing Infrastructure

- **Goal:** Keep user data fresh without requiring manual refreshes.
- **Tasks:**
  - [ ] Automated worker / cron job to periodically fetch account-level statistics and media metrics from connected APIs.

## 4. Deep Demographics (Advanced)

- **Goal:** Provide creators with a granular understanding of who is consuming their content.
- **Tasks (Integrating existing components):**
  - [ ] **Age Range Panel** (`AgeRangePanel.vue`)
  - [ ] **Gender Split Panel** (`GenderSplitPanel.vue`)
  - [ ] **Top Cities Panel** (`TopCitiesPanel.vue`)
  - [ ] **Territory Panel** (`TerritoryPanel.vue`)
  - [ ] **Device Type Panel** (`DeviceTypePanel.vue`)
  - [ ] Ensure robust data mapping from Instagram/TikTok API responses directly to these frontend components.

## 5. Advanced & Niche Analytics

- **Goal:** Offer premium-tier insights that help optimize content strategy.
- **Tasks:**
  - [ ] **Best Time Heatmap** (`BestTimeHeatmap.vue`): Visualizing optimal posting times based on historical engagement.
  - [ ] **Content Format Breakdown** (`ContentFormatBreakdown.vue`): Comparing performance between different media types (e.g., Reels vs. Carousels vs. Images).
  - [ ] **Platform Health Comparison** (`PlatformHealthComparison.vue`)
  - [ ] **Dual Chart Dashboard** (`DualChartDashboard.vue`).
  - [ ] **Engagement Doughnut Chart** (`EngagementDoughnutChart.vue`).

## 6. Edge Cases & Error Handling (Quality of Life)

- **Goal:** Ensure a robust and frustration-free experience for users when things go wrong.
- **Tasks:**
  - [x] Password visibility toggles (Eye icon).
  - [x] Clear API error messaging on Login/Signup (e.g., "Invalid Credentials", "Please verify your email").
  - [ ] Graceful 404 pages for undefined routes.
  - [x] Safe fallbacks when API returns no demographic data.

---

## Out of Scope (For Future Consideration)

- [ ] Exporting reports to PDF or CSV formats.
- [ ] Real-time WebSocket notifications for completed background jobs.
- [ ] Integration of additional platforms (e.g., Twitter/X, YouTube).

## Next Steps

- [x] Audit the data flow from the backend specifically for the **Deep Demographics** and **Advanced Analytics** charts.
- [x] Ensure the data matching between our `services/instagramGraph.service.ts` or `services/tiktokService.ts` and the expected structures for `vue-chartjs`.
- [x] Polish UI issues in these advanced components to ensure they match the Neo-Brutalist aesthetic.
