# Gelitik Project Guidelines

## Version

- **Version**: 1.0.0
- **Purpose**: Social media analytics dashboard for TikTok, Instagram, and Google-connected content creators
- **Last Updated**: 2026-02-18

---

## Project Overview

Gelitik is a full-stack social media analytics platform that:

- Connects to TikTok and Instagram via OAuth
- Displays analytics (followers, engagement, views, demographics)
- Allows scheduling posts across platforms
- Provides a Neo-Brutalist UI with dark/light themes

---

## 🚀 Build & Run

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (PostgreSQL)

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Runs on: http://localhost:5173
- Stack: Vue 3 + Vite + TypeScript + Pinia + Tailwind CSS

### Backend

```bash
cd backend
npm install
npm run dev
```

- Runs on: http://localhost:3000
- Stack: Node.js + Express + TypeScript + Prisma

### Database

```bash
# Update schema (after changes to schema.prisma)
cd backend
npx prisma db push

# Generate Prisma client
npx prisma generate

# Open Prisma Studio (database GUI)
npx prisma studio
```

---

## 📁 Directory Structure

```
gelitik/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/          # Login-related components
│   │   │   ├── dashboard/    # Dashboard widgets (charts, tables, cards)
│   │   │   ├── layout/       # AppSidebar, PageHeader, MobileNav
│   │   │   ├── loading/      # Skeleton loaders
│   │   │   ├── schedule/     # Calendar, post scheduling
│   │   │   └── ui/           # Base UI components (Button, Input, etc.)
│   │   ├── composables/      # Vue composables (useTheme, useToast, etc.)
│   │   ├── layouts/          # Layout wrappers
│   │   ├── pages/            # Route pages
│   │   ├── router/           # Vue Router config
│   │   ├── services/         # API client (api.ts)
│   │   ├── stores/           # Pinia stores
│   │   ├── types/            # TypeScript interfaces
│   │   ├── App.vue
│   │   └── main.ts
│   └── index.html
├── backend/
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── src/
│       ├── config/           # env.ts, passport.ts, prisma.ts
│       ├── controllers/      # Route controllers
│       ├── jobs/             # Background jobs (token refresh)
│       ├── middleware/       # auth.ts, errorHandler.ts, validation.ts
│       ├── routes/           # Express routes
│       ├── services/         # Business logic (TikTok, Instagram services)
│       ├── types/            # TypeScript types
│       └── app.ts            # Express app entry
├── CLAUDE.md                 # This file
└── codeAudit.md              # Known issues and tech debt
```

---

## 🏗️ Architecture

### Frontend

- **State Management**: Pinia stores (`src/stores/`)
- **Routing**: Vue Router (`src/router/`)
- **Styling**: Tailwind CSS with custom Neo-Brutalist design
- **Charts**: Chart.js / vue-chartjs
- **API Client**: Axios instance in `src/services/api.ts`

### Backend

- **Framework**: Express + TypeScript
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Auth**: JWT-based authentication
- **OAuth**: TikTok, Instagram, Google

### Data Flow

```
Routes → Controllers → Services → Prisma/DB
         ↓
      Middleware (auth, validation, error handling)
```

---

## 🎨 Design System: Neo-Brutalism

The UI follows a strict Neo-Brutalist aesthetic.

### Core Principles

- **Borders**: Thick, hard borders. Default: `border-2` or `border-3` `border-black` (dark: `border-electric` or `border-white`)
- **Shadows**: Hard, non-blurred shadows (`shadow-brutal`, `shadow-neo`)
- **Corners**: Sharp (`rounded-none` or small, consistent radii)
- **Colors**:
  - **Light Mode**: High contrast. Black text on White/Pastel backgrounds
  - **Dark Mode**: Electric/Neon accents (`#00F0FF`, `#FF0099`, `#FFCC00`) on Deep Navy/Slate backgrounds
- **Typography**: Bold, uppercase headers. Monospaced fonts for numbers

### Key Tailwind Classes

- `shadow-brutal` - Hard offset shadow
- `shadow-neo` - Neo-brutalist soft shadow
- `border-electric` - Neon cyan border
- `rounded-brutal` - Sharp border radius

---

## 📝 Coding Standards

### TypeScript

- **Strict typing preferred**. Avoid `any`. Define interfaces for API responses
- Define shared types in `frontend/src/types/` and `backend/src/types/`

### Frontend

- **Components**: Use `<script setup lang="ts">`
- **API Calls**: Use `src/services/api.ts` (Axios instance). Do **not** use raw `fetch` or `axios` in components
- **Error Handling**: Use toast notifications (use `useToast()` composable), never `alert()`
- **Composables**: Extract reusable logic (e.g., `useVideoAnalytics.ts`, `useTheme.ts`)
- **Icons**: Use `lucide-vue-next`

### Backend

- **Structure**: `Routes` → `Controllers` → `Services` → `Prisma/DB`
- **Validation**: Validate inputs using Joi or zod before processing
- **Secrets**: Use `process.env`. **NEVER** hardcode secrets

### Formatting

- 2 spaces indentation
- Semicolons used
- Components: PascalCase (e.g., `VideoDetailModal.vue`)
- Utils/composables: camelCase (e.g., `useVideoAnalytics.ts`)

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                   | Description              |
| ------ | -------------------------- | ------------------------ |
| POST   | `/auth/register`           | Register new user        |
| POST   | `/auth/login`              | Login user               |
| GET    | `/auth/google`             | Google OAuth             |
| GET    | `/auth/google/callback`    | Google OAuth callback    |
| GET    | `/auth/tiktok`             | TikTok OAuth             |
| GET    | `/auth/tiktok/callback`    | TikTok OAuth callback    |
| GET    | `/auth/instagram`          | Instagram OAuth          |
| GET    | `/auth/instagram/callback` | Instagram OAuth callback |

### Analytics

| Method | Endpoint                          | Description             |
| ------ | --------------------------------- | ----------------------- |
| GET    | `/analytics/tiktok/:accountId`    | Get TikTok analytics    |
| GET    | `/analytics/instagram/:accountId` | Get Instagram analytics |
| GET    | `/analytics/overview`             | Get combined overview   |

### Social Accounts

| Method | Endpoint                   | Description                    |
| ------ | -------------------------- | ------------------------------ |
| GET    | `/social-accounts`         | List user's connected accounts |
| POST   | `/social-accounts/connect` | Connect new account            |
| DELETE | `/social-accounts/:id`     | Disconnect account             |

---

## 🗄️ Database Schema (Prisma)

### Models

- **User**: App users (email, password, OAuth IDs)
- **Session**: JWT tokens with expiration
- **SocialAccount**: Connected TikTok/Instagram accounts
- **Analytics**: Daily metrics per account
- **Content**: Imported content/videos from platforms
- **Post**: Scheduled posts for publishing

### Key Relationships

```
User 1→N Session
User 1→N SocialAccount
SocialAccount 1→N Analytics
SocialAccount 1→N Content
SocialAccount 1→N Post
```

---

## 🛡️ Security & Quality

### Critical Issues (See codeAudit.md)

1. **Hardcoded JWT Secret** - `auth.middleware.ts` and `auth.routes.ts` have fallback secret
2. **Mock Auth Bypass** - LoginPage.vue and auth store have mock bypass code
3. **Access Tokens in URL** - OAuth tokens passed in query params (security risk)
4. **No OAuth State Validation** - CSRF vulnerability
5. **No Rate Limiting** - Auth endpoints vulnerable to brute force

### Best Practices

- **No Hardcoded Secrets**: All secrets via environment variables
- **Environment**: `.env` should have no default values (fail fast if missing)
- **Error Handling**: Use centralized error handling in backend
- **Input Validation**: Validate all user inputs

---

## 📋 Known Issues

See `codeAudit.md` for the full list of 42 known issues. Key items:

### Critical

- Duplicate TikTokService (tiktok.service.ts vs tiktokService.ts)
- Hardcoded JWT secret fallback
- Mock auth bypass in production code
- Access tokens in URL query params

### Architecture

- Multiple PrismaClient instances (should be singleton)
- errorHandler middleware not registered
- Inconsistent error response format

### Code Quality

- formatNumber() duplicated across 3+ components
- Excessive use of `any` type (50+ occurrences)
- No ESLint/Prettier configuration

---

## 🔧 Environment Variables

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
VITE_FRONTEND_URL=http://localhost:5173
```

### Backend (.env)

```
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# JWT (REQUIRED - no fallback!)
JWT_SECRET=your-secret-key

# OAuth - TikTok
TIKTOK_CLIENT_ID=
TIKTOK_CLIENT_SECRET=

# OAuth - Instagram
INSTAGRAM_CLIENT_ID=
INSTAGRAM_CLIENT_SECRET=

# OAuth - Google
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## 🔄 Common Workflows

### Adding a New Feature

1. Check `codeAudit.md` for related issues
2. Add database model in `backend/prisma/schema.prisma` if needed
3. Run `npx prisma db push`
4. Create backend route/controller/service
5. Create frontend composable for API calls
6. Create Vue component(s)
7. Add route in `router/index.ts`
8. Test and verify

### Running Tests

```bash
# Frontend - no test framework configured yet
# Backend - no test framework configured yet
```

---

## 📦 Workflow

1. Check `codeAudit.md` for active tasks before starting work
2. When creating new components, ensure they match the Neo-Brutalist theme
3. Update `codeAudit.md` if new technical debt is introduced or resolved
4. Run `npx prisma generate` after schema changes
5. Test both frontend and backend after changes
