# Aakif — Blood Donation & Coordination Platform

A modern, accessible, and human-centered blood donation coordination web platform built to connect voluntary donors, recipients, and coordination coordinators seamlessly.

---

## 🌟 Overview & Key Features

* **Instant Blood Request Workflow**: Patients and families can submit requests with specific urgency levels (Standard, Urgent, Critical), hospital details, and patient requirements.
* **Smart Donor Discovery**: Search donors by blood group and locality with automatic ABO/Rh compatibility matching.
* **Donation Camps & Drives**: Discover verified upcoming community donation camps with timings, locations, and directions.
* **Live Status Tracking**: Track submitted blood requests transparently through verification, donor outreach, and fulfillment.
* **Coordination Dashboard (Admin Panel)**: Dedicated staff panel for reviewing requests, executing status transitions, adding audit notes, and managing community camps.
* **Privacy & Safety First**: Privacy-safe donor initials, anonymized location proximity, and explicit consent mechanisms.
* **Accessibility (WCAG AA Compliant)**: Full keyboard navigation, semantic ARIA roles, high-contrast healthcare palette, and screen-reader live regions.

---

## 🛠️ Tech Stack

### Frontend & Core
* **React 19** (`react`, `react-dom`) — Component-driven architecture using modern hooks (`useState`, `useEffect`, `useCallback`, `useId`, `useRef`).
* **TypeScript 5.7** — Strict static typing for all blood groups, requests, camps, and coordinator workflows.
* **React Router v7** (`react-router`) — Client-side declarative routing and navigation.

### Styling & Design System
* **Tailwind CSS v4** (`@tailwindcss/vite`) — Utility-first styling configured in `src/index.css`.
* **Lucide React** (`lucide-react`) — Clean, accessible SVG iconography.
* **Custom Design System** — Burgundy/crimson healthcare theme (`#b91c3b`, `#851025`), smooth card micro-interactions, responsive grids, and subtle SVG animations.

### Data & State Architecture
* **React Context API + Custom Store** — Central state engine managing blood requests, staff audit logs, toast notifications, and `localStorage` persistence.
* **Zero Backend Dependency (Prototype)** — Runs completely in-browser with mock data seeds and simulated workflows.

---

## 📁 Project Structure

```
├── public/                 # Static assets and icons
├── src/
│   ├── assets/             # Images and visual illustrations
│   ├── pages/              # Main view components
│   │   ├── Home.tsx        # Hero section, statistics, camps preview & benefits
│   │   ├── Request.tsx     # Blood request submission form
│   │   ├── FindDonor.tsx   # Compatibility matcher & donor list
│   │   ├── Track.tsx       # Live status tracker for submitted requests
│   │   ├── Camps.tsx       # Blood donation camps and drives directory
│   │   ├── Admin.tsx       # Coordinator / staff verification dashboard
│   │   └── About.tsx       # Mission, safety standards, and team info
│   ├── App.tsx             # Root layout, navigation bar, and footer
│   ├── data.ts             # Blood groups, mock seeds, and status definitions
│   ├── store.tsx           # Context store & localStorage synchronization
│   ├── ui.tsx              # Reusable UI primitives (Buttons, Badges, Modals, Chips)
│   ├── index.css           # Tailwind CSS v4 entrypoint & theme variables
│   └── main.tsx            # Application entrypoint
├── index.html              # HTML shell
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
└── vite.config.ts          # Vite build and plugin configuration
```

---

## 🚀 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **pnpm**

### Installation

1. Clone or open the repository folder:
   ```bash
   cd "Blood Donation Platform Prototype"
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open the preview URL shown in your terminal (default is `http://localhost:8443` or `http://localhost:5173`).

---

## 📜 Available Scripts

* `npm run dev` — Starts the Vite development server with Hot Module Replacement (HMR).
* `npm run build` — Type-checks and creates an optimized production bundle in the `dist` directory.
* `npm run preview` — Locally preview the production build.
* `npm run format` — Formats source code using `oxfmt`.

---

## 🔒 Note on Prototype Data & Privacy

This application is a **frontend prototype**. All donor names, patient requests, and camp details are simulated for demonstration purposes. In production, this can be connected to any standard REST or GraphQL backend (e.g., Node.js/Express, FastAPI, Supabase, Firebase, or PostgreSQL).
