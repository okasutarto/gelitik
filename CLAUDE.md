# Gelitik Project Guidelines

## 🚀 Build & Run

- **Frontend**: `cd frontend && npm run dev`
  - Runs on: http://localhost:5173
- **Backend**: `cd backend && npm run dev`
  - Runs on: http://localhost:3000
- **Database**: Prisma with Supabase (PostgreSQL)
  - Update schema: `npx prisma db push`
  - Generate client: `npx prisma generate`

## 🏗️ Architecture

- **Frontend**: Vue 3 (Composition API) + Vite + TypeScript.
  - **State Management**: Pinia stores (`src/stores`).
  - **Routing**: Vue Router (`src/router`).
  - **Styling**: Tailwind CSS with a custom **Neo-Brutalist** design system.
  - **Charts**: Chart.js / vue-chartjs.
- **Backend**: Node.js + Express + TypeScript.
  - **ORM**: Prisma (`backend/prisma`).
  - **Auth**: JWT-based authentication.
  - **Integrations**: TikTok, Instagram, Google OAuth.

## 🎨 Design System: Neo-Brutalism

The UI follows a strict Neo-Brutalist aesthetic.

- **Borders**: Thick, hard borders. Default: `border-2` or `border-3` `border-black` (dark: `border-electric` or `border-white`).
- **Shadows**: Hard, non-blurred shadows (`shadow-brutal`, `shadow-neo`).
- **Corners**: Generally sharp (`rounded-none` or small, consistent radii). No pill shapes unless specific badges.
- **Colors**:
  - **Light Mode**: High contrast. Black text on White/Pastel backgrounds.
  - **Dark Mode**: Electric/Neon accents (`#00F0FF`, `#FF0099`, `#FFCC00`) on Deep Navy/Slate backgrounds.
- **Typography**: Bold, uppercase headers. Monospaced fonts for numbers.

## 📝 Coding Standards

### General

- **TypeScript**: Strict typing preferred. **Avoid `any`**. Define interfaces for API responses.
- **Formatting**: 2 spaces indentation. Semicolons used.
- **Naming**:
  - Components: PascalCase (e.g., `VideoDetailModal.vue`).
  - Files/dirs: camelCase for utils/composables, PascalCase for components.

### Frontend

- **Components**: Use `<script setup lang="ts">`.
- **API Calls**:
  - Use `src/services/api.ts` (Axios instance) for all requests.
  - Do **not** use raw `fetch` or `axios` in components.
  - Handle errors gracefully (use toast notifications, not `alert()`).
- **Composables**: Extract reusable logic (e.g., `useVideoAnalytics.ts`).
- **Icons**: Use `lucide-vue-next`.

### Backend

- **Structure**: `Routes` -> `Controllers` -> `Services` -> `Prisma/DB`.
- **Validation**: Validate inputs (zod/joi) before processing.
- **Secrets**: Use `process.env`. **NEVER** hardcode secrets (JWT keys, API tokens).

## 🛡️ Security & Quality

- **No Hardcoded Secrets**: Ensure `JWT_SECRET`, database URLs, and OAuth keys are environment variables.
- **Rate Limiting**: Ensure sensitive routes (auth) are rate-limited.
- **Error Handling**: Use centralized error handling in backend.
- **Audit**: Refer to `codeAudit.md` for known issues and tech debt to address.

## 📦 Workflow

1. Check `codeAudit.md` for active tasks.
2. When creating new components, ensure they match the Neo-Brutalist theme (check `main.css` for utility classes).
3. Update `codeAudit.md` if new technical debt is introduced or resolved.
