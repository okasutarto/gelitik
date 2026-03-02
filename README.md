<!-- BADGES -->
<div align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blue.svg?style=for-the-badge" alt="Version" />
  <img src="https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge" alt="License" />
  <img src="https://img.shields.io/badge/vue-3.5.13-4FC08D.svg?style=for-the-badge&logo=vue.js" alt="Vue" />
  <img src="https://img.shields.io/badge/node->=20.0.0-339933.svg?style=for-the-badge&logo=node.js" alt="Node" />
  <img src="https://img.shields.io/badge/typescript-5.6.3-3178C6.svg?style=for-the-badge&logo=typescript" alt="TypeScript" />
</div>

<h1 align="center" id="project-title-description">Gelitik</h1>

<p align="center">
  <b>Elevate your social media strategy with neo-brutalist analytics.</b>
</p>

Gelitik is a comprehensive web application designed to provide deep, actionable insights into your Instagram and TikTok performance. Built with a striking neo-brutalist aesthetic, it unifies engagement metrics, audience demographics, and connection tracking into a single, cohesive dashboard, giving creators and brands the edge they need to grow their audience.

---

## <a id="table-of-contents"></a>Table of Contents

1. [Features](#features)
2. [Demo](#demo)
3. [Tech Stack](#tech-stack)
4. [Prerequisites](#prerequisites)
5. [Installation](#installation)
6. [Configuration](#configuration)
7. [Usage](#usage)
8. [API Reference](#api-reference)
9. [Project Structure](#project-structure)
10. [Scripts](#scripts)
11. [Testing](#testing)
12. [Deployment](#deployment)
13. [Roadmap](#roadmap)
14. [Contributing](#contributing)
15. [License](#license)
16. [Acknowledgements](#acknowledgements)
17. [Contact / Support](#contact--support)

---

## <a id="features"></a>Features

- **Cross-Platform Analytics**: Seamlessly integrate and pull data from both Instagram Graph API and TikTok APIs.
- **Neo-Brutalist UI**: A stunning, modern, and highly responsive dark-mode compatible interface built with Tailwind CSS.
- **Historical Data Tracking**: Automatic daily database snapshots of follower counts and engagement metrics.
- **Interactive Data Visualization**: Rich, dynamic charts (Doughnut, Bar, Line) with custom date-range filtering (7D, 14D, 30D, 90D) powered by Chart.js.
- **KPI Delta Insights**: Real-time calculated growth indicators comparing current metrics against historical snapshots.
- **Secure OAuth Flows**: Robust authentication flows using Passport.js for Google, TikTok, and Instagram integrations.
- **Connection Management**: Custom UI and explicit confirmation modals for managing linked social accounts safely.
- **Automated Data Processing**: Background cron jobs powered by `node-cron` to periodically sync and cache social media analytics.
- **Security & Validation**: Built-in protections including API rate limiting, Joi input validation, CSRF state verification, and centralized error handling.
- **Type-Safe Backend**: Complete end-to-end type safety using TypeScript, Express, and Prisma ORM with a PostgreSQL database.

## <a id="demo"></a>Demo

Here is a glimpse of the Gelitik dashboard analyzing real-time Instagram and TikTok metrics:

![Gelitik Dashboard Demo](image-1.png)
_An overview of the main analytics dashboard highlighting user engagement and demographic charts in dark mode._

## <a id="tech-stack"></a>Tech Stack

| Technology                  | Role & Purpose in Project                                                        |
| :-------------------------- | :------------------------------------------------------------------------------- |
| **Vue 3 (Composition API)** | Frontend framework driving the reactive, component-based user interface.         |
| **Vite**                    | Lightning-fast frontend build tool and development server.                       |
| **Tailwind CSS**            | Utility-first CSS framework for styling the neo-brutalist interface.             |
| **Pinia**                   | State management library for handling global app state on the frontend.          |
| **Chart.js / vue-chartjs**  | Rendering beautiful, interactive data visualizations.                            |
| **Lucide Icons**            | Clean, crisp SVG icons used heavily across the dashboard.                        |
| **Node.js & Express**       | Backend runtime and framework for handling API requests and OAuth routes.        |
| **TypeScript**              | Static typing across both frontend and backend to prevent runtime errors.        |
| **Prisma**                  | Modern Next-Generation ORM for database modeling and migrations.                 |
| **PostgreSQL**              | Relational database for storing user, OAuth state, and snapshot analytics data.  |
| **Passport.js**             | Handling secure OAuth 2.0 authentication strategies (TikTok, Instagram, Google). |
| **Node-Cron**               | Automating daily database snapshots and external API background fetching.        |

## <a id="prerequisites"></a>Prerequisites

Before running this project, ensure you have the following installed on your local machine:

- **Node.js**: `v20.0.0` or higher
- **npm**: `v10.0.0` or higher
- **PostgreSQL**: `v14.0` or higher (or a Supabase account)
- Developer accounts for **Meta (Instagram Graph API)** and **TikTok for Developers**.

## <a id="installation"></a>Installation

Follow these step-by-step instructions to get a local copy up and running.

**1. Clone the repository**

```bash
git clone https://github.com/yourusername/gelitik.git
cd gelitik
```

**2. Install Frontend Dependencies**

```bash
cd frontend
npm install
```

**3. Install Backend Dependencies**

```bash
cd ../backend
npm install
```

**4. Generate Prisma Client**

```bash
# Inside the backend directory
npx prisma generate
```

## <a id="configuration"></a>Configuration

Proper configuration is essential for the OAuth flows and database connections to function. Create a `.env` file in the `backend/` directory.

| Variable                       | Type     | Default                 | Description                                                              |
| :----------------------------- | :------- | :---------------------- | :----------------------------------------------------------------------- |
| `NODE_ENV`                     | `string` | `development`           | The environment setting (`development` or `production`).                 |
| `PORT`                         | `number` | `3000`                  | The port on which the Express server will run.                           |
| `DATABASE_URL`                 | `string` | _Required_              | The PostgreSQL connection string for Prisma (e.g., Supabase Pooler).     |
| `DIRECT_URL`                   | `string` | _Required_              | The direct PostgreSQL connection string for Prisma migrations.           |
| `JWT_SECRET`                   | `string` | _Required_              | A strong, random string used to sign JSON Web Tokens.                    |
| `ENCRYPTION_KEY`               | `string` | _Required_              | A 64-character hex string used for encrypting stored access tokens.      |
| `GOOGLE_CLIENT_ID`             | `string` | _Optional_              | Your Google OAuth 2.0 Client ID.                                         |
| `GOOGLE_CLIENT_SECRET`         | `string` | _Optional_              | Your Google OAuth 2.0 Client Secret.                                     |
| `TIKTOK_CLIENT_ID`             | `string` | _Required_              | Your TikTok Developer App Client Key.                                    |
| `TIKTOK_CLIENT_SECRET`         | `string` | _Required_              | Your TikTok Developer App Client Secret.                                 |
| `TIKTOK_REDIRECT_URI`          | `string` | _Required_              | The callback URL configured in your TikTok Developer portal.             |
| `INSTAGRAM_GRAPH_APP_ID`       | `string` | _Required_              | Your Meta App ID for Instagram Graph API.                                |
| `INSTAGRAM_GRAPH_APP_SECRET`   | `string` | _Required_              | Your Meta App Secret for Instagram Graph API.                            |
| `INSTAGRAM_GRAPH_REDIRECT_URI` | `string` | _Required_              | The callback URL configured in your Meta Developer portal.               |
| `FRONTEND_URL`                 | `string` | `http://localhost:5173` | The URL where the Vue frontend is running (used for CORS).               |
| `SESSION_SECRET`               | `string` | _Required_              | A secret string used by `express-session` to sign the session ID cookie. |

## <a id="usage"></a>Usage

To run the application locally, you need to start both the backend server and the frontend development server.

**Starting the Backend**

```bash
cd backend
npm run dev
```

_Expected Output:_

```text
[nodemon] starting `ts-node src/app.ts`
🚀 Server is running on port 3000 in development mode.
🔌 Database connected successfully.
```

**Starting the Frontend**

```bash
cd frontend
npm run dev
```

_Expected Output:_

```text
  VITE v6.0.7  ready in 350 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

**Testing the API (Example Request)**
Once the server is running, you can verify it's responsive by hitting the health check endpoint:

```bash
curl -X GET http://localhost:3000/api/health
```

_Expected JSON Output:_

```json
{
  "status": "up",
  "timestamp": "2026-02-21T18:45:39.000Z"
}
```

## <a id="api-reference"></a>API Reference

The Gelitik backend exposes several RESTful endpoints for authentication and analytics data retrieval.

| Method   | Endpoint                         | Description                                                                            | Request Body              |
| :------- | :------------------------------- | :------------------------------------------------------------------------------------- | :------------------------ |
| `GET`    | `/auth/tiktok/connect`           | Initiates the TikTok OAuth 2.0 connection flow.                                        | None                      |
| `GET`    | `/auth/tiktok/callback`          | Handles the callback from TikTok, exchanges code for token, and redirects to frontend. | `?code=string`            |
| `GET`    | `/auth/instagram-graph/connect`  | Initiates the Meta/Instagram Graph API OAuth flow for Business Accounts.               | None                      |
| `GET`    | `/auth/instagram-graph/callback` | Handles the Meta OAuth callback and stores encrypted tokens.                           | `?code=string`            |
| `GET`    | `/api/accounts`                  | Lists all connected social media accounts for the authenticated user.                  | None (Requires JWT)       |
| `DELETE` | `/api/accounts/:id`              | Disconnects a social account and permanently deletes its associated analytics data.    | None (Requires JWT)       |
| `GET`    | `/api/accounts/status`           | Gets a brief connection status list (used for sidebar UI dots).                        | None (Requires JWT)       |
| `GET`    | `/api/analytics/history`         | Retrieves daily aggregated DB snapshots for follower growth & engagement filtering.    | `?days=number` (optional) |
| `GET`    | `/api/analytics/instagram-graph` | Fetches the latest live Instagram Business analytics (audience, engagement, media).    | None (Requires JWT)       |
| `GET`    | `/api/analytics/tiktok`          | Fetches the latest live TikTok Analytics (video metrics, profile views, followers).    | None (Requires JWT)       |
| `POST`   | `/api/auth/logout`               | Clears the session and invalidates the current JWT token.                              | None                      |

## <a id="project-structure"></a>Project Structure

```text
gelitik/
├── backend/                  # Node.js/Express application
│   ├── prisma/               # Database schema and seed files
│   │   ├── schema.prisma     # Prisma ORM data modeling
│   │   └── seed.ts           # Initial DB seeding script
│   ├── src/                  # Backend source code
│   │   ├── config/           # Environment and Passport configs
│   │   ├── controllers/      # Route logic and request handling
│   │   ├── jobs/             # Node-cron background jobs
│   │   ├── middleware/       # Express middlewares (auth, error handling)
│   │   ├── routes/           # API and Express route definitions
│   │   ├── services/         # Business logic and external API calls
│   │   ├── types/            # TypeScript interfaces
│   │   └── utils/            # Helper functions and logger
│   ├── .env                  # Environment variables (ignored)
│   └── package.json          # Backend dependencies
└── frontend/                 # Vue 3/Vite application
    ├── public/               # Static assets
    ├── src/                  # Frontend source code
    │   ├── assets/           # CSS files (Tailwind imports)
    │   ├── components/       # Reusable Vue components
    │   │   ├── dashboard/    # Complex domain widgets (Charts, KPI Cards, Tables)
    │   │   ├── layout/       # Structural components (Sidebar, PageHeader)
    │   │   └── loading/      # Specialized skeleton loaders for empty states
    │   ├── composables/      # Vue 3 custom hooks (e.g. useDashboardData)
    │   ├── layouts/          # Application shell wrappers (DashboardLayout)
    │   ├── pages/            # View components matching routes
    │   ├── router/           # Vue Router configuration
    │   ├── services/         # Axios config and API helper classes
    │   ├── stores/           # Pinia state management stores
    │   ├── types/            # TypeScript interfaces for frontend types
    │   └── utils/            # Shared utility functions (e.g. formatters)
    ├── index.html            # Vite entry point
    ├── vite.config.ts        # Vite build configuration
    └── package.json          # Frontend dependencies
```

## <a id="scripts"></a>Scripts

Several npm scripts are provided to streamline development, building, and database management.

### Frontend Scripts (`cd frontend`)

| Command            | Description                                                                      |
| :----------------- | :------------------------------------------------------------------------------- |
| `npm run dev`      | Starts the Vite development server with Hot Module Replacement (HMR).            |
| `npm run build`    | Validates TypeScript with `vue-tsc` and bundles the app for production via Vite. |
| `npm run preview`  | Serves the locally built production bundle for previewing.                       |
| `npm run lint`     | Runs ESLint across all `.vue`, `.js`, and `.ts` files to find and report errors. |
| `npm run lint:fix` | Runs ESLint and automatically fixes fixable code style issues.                   |
| `npm run format`   | Runs Prettier to format the entire codebase according to defined rules.          |

### Backend Scripts (`cd backend`)

| Command               | Description                                                                            |
| :-------------------- | :------------------------------------------------------------------------------------- |
| `npm run dev`         | Starts the Express server using `nodemon` and `ts-node` for live reloading.            |
| `npm run build`       | Compiles the TypeScript source code into standard JavaScript in the `dist/` directory. |
| `npm start`           | Runs the compiled production server (`node dist/app.js`).                              |
| `npm run db:generate` | Generates the Prisma Client based on the current `schema.prisma`.                      |
| `npm run db:migrate`  | Applies pending Prisma migrations to the development database.                         |
| `npm run db:studio`   | Opens Prisma Studio, a visual editor to view and edit database records.                |
| `npm run db:seed`     | Runs the `prisma/seed.ts` script to populate the database with initial data.           |

## <a id="testing"></a>Testing

Currently, Gelitik focuses on strong typing and strict linting to ensure code quality.

**Linting the Code**
To check for stylistic errors and potential bugs, run the linter in the frontend directory:

```bash
cd frontend
npm run lint
```

_Interpreting Results:_
If the linter outputs no text and exits with code `0`, the codebase meets all configured ESLint rules. Any warnings or errors will indicate the exact file, line number, and the specific rule violated. Use `npm run lint:fix` to automatically repair minor issues.

_(Note: Comprehensive unit testing suites using Vitest and backend testing using Jest are actively planned for future milestones.)_

## <a id="deployment"></a>Deployment

Deploying Gelitik requires setting up both the backend and frontend separately.

### Deploying the Backend (Render/Railway)

1. Commit all your changes and push them to your GitHub repository.
2. Log into Render or Railway and create a new **Web Service**.
3. Connect your GitHub repository and select the `backend` folder as the root directory.
4. Set the **Build Command** to: `npm install && npm run build && npm run db:generate`
5. Set the **Start Command** to: `npm start`
6. Enter all variables from your `.env` file into the platform's Environment Variables settings.
7. Click **Deploy**. Once finished, note the assigned deployment URL.

### Deploying the Frontend (Vercel)

1. Log into Vercel and create a **New Project**.
2. Connect your GitHub repository.
3. In the framework preset, select **Vite** (or Vue.js).
4. Set the Root Directory to `frontend`.
5. Under Environment Variables, add `VITE_API_URL` and point it to your deployed backend URL.
6. Click **Deploy**. Vercel will automatically run `npm run build` and host the static files globally.

## <a id="roadmap"></a>Roadmap

- [x] Initial setup and project scaffolding.
- [x] UI mockups and neo-brutalist theme implementation.
- [x] TikTok OAuth and Basic Analytics Integration.
- [x] Meta App approval and Instagram Graph API configuration.
- [x] Comprehensive security audit and code quality hardening.
- [x] Historical data tracking and date-range filtering mechanisms.
- [x] Enhanced connection management with custom confirmation modals.
- [ ] Comprehensive unit and integration testing setup.
- [ ] Export reports functionality (PDF/CSV).
- [ ] Real-time WebSocket notifications for completed background jobs.
- [ ] Implement Twitter/X analytics as a secondary data source.

## <a id="contributing"></a>Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. **Fork the Project** repository to your own GitHub account.
2. **Create your Feature Branch**:
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your Changes** following standard conventional commits:
   ```bash
   git commit -m "feat: Add some AmazingFeature"
   ```
4. **Push to the Branch**:
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request** against the `main` branch of this repository.

_Note: Please ensure all new code follows the existing style guidelines and passes the linter checks._

## <a id="license"></a>License

Distributed under the **MIT License**. This gives you permission for commercial use, modification, distribution, and private use. See the `LICENSE` file for more information.

## <a id="acknowledgements"></a>Acknowledgements

We extend our gratitude to these incredible open-source projects and resources that made Gelitik possible:

- [Vue.js](https://vuejs.org/) & [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Prisma ORM](https://www.prisma.io/)
- [Chart.js](https://www.chartjs.org/)
- [Passport.js](https://www.passportjs.org/)
- [Lucide Icons](https://lucide.dev/)

## <a id="contact--support"></a>Contact / Support

Maintainer: **Your Name** - [hello@yourdomain.com](mailto:hello@yourdomain.com)

Project Link: [https://github.com/yourusername/gelitik](https://github.com/yourusername/gelitik)

If you encounter any issues, bugs, or have feature requests, please [file an issue on the repository's issue tracker](https://github.com/yourusername/gelitik/issues).
