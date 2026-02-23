# Gelitik MVP Test Cases

## 1. Authentication

| ID      | Feature             | Test Case                                       | Expected Result                               |
| ------- | ------------------- | ----------------------------------------------- | --------------------------------------------- |
| AUTH-01 | Google OAuth        | Click "Continue with Google" button             | Redirect to Google OAuth consent screen       |
| AUTH-02 | OAuth Callback      | Complete Google auth and redirect back          | User logged in, redirected to dashboard       |
| AUTH-03 | Session Persistence | Login, close browser, reopen                    | User remains logged in                        |
| AUTH-04 | Logout              | Click logout button                             | Redirected to login page, session cleared     |
| AUTH-05 | Protected Route     | Access dashboard without login                  | Redirected to login page                      |
| AUTH-06 | Invalid Login       | Login with unregistered email or wrong password | Show "Incorrect credentials" error message    |
| AUTH-07 | Unverified Login    | Login with unverified email                     | Show "Please verify your email address" error |
| AUTH-08 | Duplicate Signup    | Signup with already registered email            | Show "Email already in use" error             |
| AUTH-09 | Password Validation | Signup with password < 6 chars                  | HTML5 validation prevents submission          |
| AUTH-10 | Form UI             | Toggle password visibility (Eye Icon)           | Password switches between masked/plain text   |

---

## 2. Account Connection

| ID      | Feature           | Test Case                                   | Expected Result                          |
| ------- | ----------------- | ------------------------------------------- | ---------------------------------------- |
| CONN-01 | Connect TikTok    | Click "Connect TikTok" button               | Redirect to TikTok OAuth                 |
| CONN-02 | TikTok Callback   | Complete TikTok auth                        | Account shows as "Connected"             |
| CONN-03 | Disconnect TikTok | Click disconnect on connected account       | Account shows as "Not Connected"         |
| CONN-04 | Reconnect         | Connect same TikTok account again           | No duplicate entry created               |
| CONN-05 | No Account        | Access dashboard with no accounts connected | Show "Connect your first account" prompt |

---

## 3. Dashboard - Overview Cards

| ID      | Feature              | Test Case                            | Expected Result                        |
| ------- | -------------------- | ------------------------------------ | -------------------------------------- |
| DASH-01 | View Total Followers | Load dashboard with connected TikTok | Display follower count matching TikTok |
| DASH-02 | View Total Views     | Load dashboard                       | Display total views count              |
| DASH-03 | View Total Likes     | Load dashboard                       | Display total likes count              |
| DASH-04 | Empty State          | No data available                    | Show "--" or "No data"                 |
| DASH-05 | Loading State        | Data loading                         | Show skeleton loader                   |

---

## 4. Dashboard - Content Table

| ID    | Feature        | Test Case                   | Expected Result                                |
| ----- | -------------- | --------------------------- | ---------------------------------------------- |
| CT-01 | Display Videos | Load content table          | Show recent 10-20 videos                       |
| CT-02 | Video Columns  | Check table columns         | Thumbnail, Title, Views, Likes, Comments, Date |
| CT-03 | Sort by Views  | Click "Views" column header | Videos sorted by views (desc)                  |
| CT-04 | Sort by Likes  | Click "Likes" column header | Videos sorted by likes (desc)                  |
| CT-05 | Empty State    | No videos                   | Show "No content found" message                |
| CT-06 | Video Click    | Click on video row          | Open video detail modal                        |

---

## 5. Dashboard - Trend Chart

| ID       | Feature       | Test Case                  | Expected Result                  |
| -------- | ------------- | -------------------------- | -------------------------------- |
| CHART-01 | Display Chart | Load dashboard             | Line/bar chart renders with data |
| CHART-02 | 7-Day View    | Select "7 days" timeframe  | Chart shows last 7 days data     |
| CHART-03 | 30-Day View   | Select "30 days" timeframe | Chart shows last 30 days data    |
| CHART-04 | No Data       | No historical data         | Chart shows empty state          |
| CHART-05 | Tooltip Hover | Hover over chart point     | Shows exact values for that day  |

---

## 6. Manual Refresh

| ID         | Feature       | Test Case                   | Expected Result                 |
| ---------- | ------------- | --------------------------- | ------------------------------- |
| REFRESH-01 | Click Refresh | Click "Refresh Data" button | Show loading indicator          |
| REFRESH-02 | After Refresh | Complete refresh            | Dashboard shows updated data    |
| REFRESH-03 | Error State   | API fails during refresh    | Show error toast, keep old data |

---

## 7. Error Handling & Edge Cases

| ID     | Feature        | Test Case                          | Expected Result                    |
| ------ | -------------- | ---------------------------------- | ---------------------------------- |
| ERR-01 | Network Error  | Disconnect network, load dashboard | Show "Unable to load data" message |
| ERR-02 | Token Expired  | OAuth token expires                | Redirect to reconnect prompt       |
| ERR-03 | API Rate Limit | Hit TikTok/Instagram API limit     | Show friendly message, retry later |
| ERR-04 | Missing Data   | API returns partial demographics   | Graceful fallback (no crashes)     |
| ERR-05 | 404 Pages      | Navigate to non-existent route     | Show "Not Found" 404 page          |

---

## 8. Responsive Design

| ID      | Feature      | Test Case                   | Expected Result         |
| ------- | ------------ | --------------------------- | ----------------------- |
| RESP-01 | Mobile View  | Open on phone (< 640px)     | Layout adapts, readable |
| RESP-02 | Tablet View  | Open on tablet (640-1024px) | Layout adapts           |
| RESP-03 | Desktop View | Open on desktop (> 1024px)  | Full layout displays    |

---

## 9. Security

| ID     | Feature             | Test Case                                     | Expected Result                    |
| ------ | ------------------- | --------------------------------------------- | ---------------------------------- |
| SEC-01 | XSS Prevention      | Enter `<script>alert(1)</script>` as username | Script not executed                |
| SEC-02 | SQL Injection       | Enter `' OR '1'='1` in login                  | Treated as literal string          |
| SEC-03 | Protected API       | Call API without token                        | Returns 401 Unauthorized           |
| SEC-04 | User Data Isolation | User A's data                                 | User B cannot access User A's data |

---

## Test Environment Setup

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test

# Or run both
npm run test:all
```

## Test Coverage Target

| Area                | Minimum Coverage |
| ------------------- | ---------------- |
| Authentication      | 90%              |
| API Routes          | 80%              |
| Critical Components | 70%              |

---

## Manual Testing Checklist

- [ ] Login with Google OAuth
- [ ] Connect TikTok account
- [ ] View dashboard metrics
- [ ] Sort content table
- [ ] Change chart timeframe
- [ ] Refresh data manually
- [ ] Disconnect account
- [ ] Logout and verify session cleared
- [ ] Test on mobile device
- [ ] Test with invalid credentials
