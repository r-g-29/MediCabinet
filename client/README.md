# 💻 MediCabinet Frontend (Client)

> The modern, interactive React Single Page Application (SPA) for **MediCabinet**. Built with Vite, modern Vanilla CSS design tokens, and a clean White + Crimson Red light theme.

[![React 18](https://img.shields.io/badge/React-18.3-61DAFB.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF.svg)](https://vitejs.dev/)
[![CSS3](https://img.shields.io/badge/Styling-Vanilla%20CSS%20Tokens-1572B6.svg)](#-design-system--tokens)

---

## 🎨 Design System & Theme

MediCabinet features a tailored **Light Mode** design system centered around clinical cleanliness, warmth, and high-contrast usability:

- **Primary Canvas**: Clean white (`#ffffff`) with subtle cool-grey backgrounds (`#f8f9fc`).
- **Brand Accent**: Radiant Crimson Red (`#dc2626` / `--accent`) symbolizing emergency medical readiness.
- **Semantic Colors**:
  - Success: `#059669` (Dose taken, medicine fresh & valid)
  - Warning: `#d97706` (Expiring soon, threshold near)
  - Danger: `#dc2626` (Expired, low stock)
  - Info: `#2563eb` (Scheduled dose, active profile)
- **Typography**:
  - **Headings**: `Outfit` / `Plus Jakarta Sans` via Google Fonts (`--font-display`)
  - **Body**: `Inter` via Google Fonts (`--font-sans`)
- **Micro-Animations**:
  - Subtle pulse indicators for live status radar
  - Floating badge HUD on the landing page
  - Smooth sidebar expand/collapse transitions
  - Sound-free visual feedback upon marking doses

---

## 📱 Pages & Features

### 1. Brand New Landing Page (`/`)
- **Hero Section**: 3D smart cabinet render (`/hero-3d.jpg`), floating live alert pills, high-converting CTAs.
- **Live Interactive Medicine Sandbox**: Test-drive medicine cards with tabs (*All*, *Expiring Soon*, *Low Stock*, *Arthur's Box*) and simulate dose tracking.
- **Interactive AI Scanner Simulation**: Modal simulation demonstrating laser scan lines, neural parsing, and automated field population.
- **Feature Deep Dives**: Multi-member profile segregation (`/family-profiles.jpg`) and optical packaging recognition (`/ocr-scan.jpg`).
- **Social Proof**: Real physician testimonials, key reliability statistics, and an expandable FAQ accordion.

### 2. Dashboard (`/dashboard`)
- **KPI Summary Cards**: Total medicines, medicines expiring within 30 days, expired items, and low-stock count.
- **Visual Analytics**:
  - 30-day compliance rate bar chart (Recharts)
  - Financial waste spend on expired medications
- **Actionable Radar**: Quick-action cards for items requiring immediate attention.

### 3. Medicine Cabinet & OCR Scanner (`/medicines`)
- **Comprehensive Grid**: Displays medicine name, generic composition, dosage form, remaining quantity, batch number, and expiry date.
- **Packaging OCR Uploader**:
  - Dropzone for photos of blister strips or packaging boxes.
  - Instant pre-fill of medicine name, generic composition, active ingredients, batch number, and expiry date.
  - Amber highlighting on uncertain values for human verification before saving.
- **Duplicate Ingredient Detection**: Warns if a new medicine shares active salts with an existing cabinet item.

### 4. Family Profiles (`/profiles`)
- Individual profiles for Seniors, Adults, Children, and Pets.
- Captures blood type, known allergies, medical notes, and designated emergency contacts.

### 5. Dose Schedules (`/schedules`)
- Daily timelines organized by morning, afternoon, evening, and bedtime.
- 1-click **"Mark Taken"** logs adherence and auto-decrements medicine stock.

### 6. Emergency Medical Summary (`/emergency`)
- Clean, print-friendly emergency card detailing profile demographics, known allergies, and active medications.

---

## 🧩 Key Component Hierarchy

```
App
├── AuthProvider (JWT authentication state & user session)
├── ToastProvider (Global notification toasts)
└── BrowserRouter
    ├── /           → Landing Page (Public)
    ├── /login      → Login Form (Public)
    ├── /register   → Registration Form (Public)
    └── ProtectedRoute
        └── AppLayout
            ├── Sidebar (Collapsible icon-only mode + mobile drawer)
            ├── Top Navbar
            │   ├── NotificationDropdown (Unread badge & email dispatch tags)
            │   └── AccountModal (Edit profile name, email, credentials)
            └── Route Content (Dashboard, Medicines, Profiles, Schedules, Emergency)
```

---

## 🛠️ Getting Started Locally

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Configure Environment
Create a `.env` file in `client/`:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server
```bash
npm run dev
```
The application will launch with Hot Module Replacement (HMR) at **http://localhost:5173**.

### 4. Build for Production
```bash
npm run build
```
Generates optimized static assets in the `dist/` folder.

---

## 📂 Directory Structure

```
client/
├── public/                 # Static images and icons
│   ├── hero-3d.jpg         # 3D smart cabinet render
│   ├── ocr-scan.jpg        # Camera scanning packaging demo
│   └── family-profiles.jpg # Multi-profile family mockup
├── src/
│   ├── api/                # Axios API request modules
│   │   ├── auth.js
│   │   ├── medicines.js
│   │   ├── profiles.js
│   │   ├── schedules.js
│   │   ├── doses.js
│   │   ├── stats.js
│   │   └── notifications.js
│   ├── components/         # Reusable UI components
│   │   ├── AppLayout.jsx
│   │   ├── AppLayout.css
│   │   ├── NotificationDropdown.jsx
│   │   ├── AccountModal.jsx
│   │   ├── LoadingSpinner.jsx
│   │   └── ToastContainer.jsx
│   ├── context/            # Global React Contexts
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── pages/              # View pages
│   │   ├── landing/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── medicines/
│   │   ├── profiles/
│   │   ├── schedules/
│   │   └── emergency/
│   ├── index.css           # Global design tokens and utilities
│   ├── App.jsx             # Top-level routing
│   └── main.jsx            # Application entry point
├── index.html              # HTML shell & Google Fonts imports
├── vite.config.js          # Vite build configuration
└── package.json
```

---

## 📄 License
MIT
