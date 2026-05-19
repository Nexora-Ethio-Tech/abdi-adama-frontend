# Abdi Adama — School Management System

A modern, role-based school management system built for low-resource environments. Designed with a minimalist executive dashboard philosophy, mobile-first responsiveness, and multi-branch support.

> Built with **React 18** · **TypeScript** · **Tailwind CSS** · **Vite** · **Lucide Icons**

---

## ✨ Key Features

### 🏫 Multi-Branch Network
- Super Admin controls across all branches from a single command center
- Branch Health Matrix with traffic-light status indicators (Healthy / Attention / Critical)
- Per-branch drill-down with "Power of Three" executive widgets

### 👥 Role-Based Access (7 Roles)

| Role | ID Prefix | Access |
|------|-----------|--------|
| **Super Admin** | `SA` | Full network control, global settings, all branches |
| **School Admin** | `AD` | Branch-level management, registration pipeline, staff |
| **Vice Principal** | `VP` | Attendance oversight, proxy management, staff shortage command |
| **Teacher** | `TC` | Grade entry, schedule, attendance marking, course management |
| **Finance Clerk** | `FC` | Fee collection, audit logs, enrollment payment confirmation |
| **Student** | `ST` | Portal, courses, grades, exam sessions |
| **Driver** | `DR` | Logistics broadcasting, route stations, notice posting |
| **Parent** | `PR` | Child monitoring, clinic chat, fee status |

### 📝 Registration Pipeline
Full 5-stage admission workflow with gated controls:

```
📝 Apply → 🏫 Admin Review → 📋 Exam (if needed) → 💰 Finance Payment → 🎓 Official Student
```

- **Registration Window** — School admin opens/closes registration with a toggle
- **3-Way Decision** — Decline / Pass / Pass After Exam
- **Exam Scheduling** — Modal to set date, time, location, subjects (emailed to applicant)
- **Post-Exam Review** — Admin confirms pass/fail
- **Finance Approval** — Finance clerk confirms payment → student officially enrolled
- **Email Notifications** — Toast notifications for every status change

### 💰 Finance & Audit
- Fee collection with payment status tracking and approval history
- **Audit Logs** with Gmail-style pagination and advanced filters:
  - Direction (Money In / Money Out)
  - Category (Fees / Staff)
  - Section, Action Type, Role, Amount Range
- **Pending Enrollment Payments** — Finance clerk confirms admission fee payments
- **Monthly Net Profit Targets** — Set targets per Ethiopian calendar month with visual comparison bars

### 📊 Executive Dashboard
- **"Power of Three"** widget layout replacing heavy tab navigation:
  - Quick Stats (students, teachers, attendance, revenue)
  - Pending Actions (urgent items requiring attention)
  - Performance Snapshot (traffic-light health indicators)
- Categorized **Notice Board** with audience filtering (Academic / Logistics / Finance)
- Priority Watchlist for at-risk students

### 📋 Attendance & VP Workflow
- Daily attendance marking by teachers
- **Staff Shortage Command Center** (VP) — collapsible tray with real-time badges
- Proxy assignment and substitute management
- Attendance queue for VP approval

### 🏥 School Clinic
- Student medical records with blood group, allergies, chronic conditions
- Parent-clinic chat interface
- Confidential medical details during registration

### 📚 Academics
- Grading system configuration per grade level (weighted assessment methods)
- Grade entry with lock/unlock by Super Admin
- Transcript viewer with academic year/semester filtering
- Schedule builder for class timetables
- Exam session management

### 🚌 Driver Portal
- Logistics-focused notice broadcasting
- Station stop management (pickup/dropoff points)
- Route information for parents

### 📦 Inventory & Assets
- Track school equipment, supplies, furniture
- Low stock alerts and maintenance tracking
- **Add Asset** restricted to Finance Clerk only

### ⚙️ Settings
- **General** — School name (Oromic/Amharic/English), motto, contact info
- **Financial Policy** — Late penalties, payment deadlines, fee structure per branch/grade, monthly profit targets (Ethiopian calendar)
- **Grading System** — Assessment method weights per grade level
- **Appearance** — UI style (Standard/Modern/Compact/Classic), auto dark mode
- **Grade Lock** — Super Admin toggle to lock/unlock grade entry system-wide

---

## 🗓️ Ethiopian Calendar Support
- All 13 months supported (Meskerem through Pagumē)
- Both Ge'ez transliteration and Amharic script display
- Used in financial target planning

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173/`

### Production Build

```bash
npm run build
```

### Test Login IDs

| Role | Login ID |
|------|----------|
| Super Admin | `SA001` |
| School Admin | `AD001` |
| Vice Principal | `VP001` |
| Teacher | `TC001` |
| Finance Clerk | `FC001` |
| Student | `ST001` |
| Driver | `DR001` |
| Parent | `PR001` |

> Password: any value (mock authentication)

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Sidebar.tsx
│   │   ├── Breadcrumbs.tsx
│   │   └── StudentRegistration.tsx
│   ├── context/          # Global state management
│   │   ├── UserContext.tsx        # Auth, roles, school config
│   │   ├── AppearanceContext.tsx  # Theme & UI style
│   │   └── useStore.ts           # Branch selection store
│   ├── data/
│   │   └── mockData.ts   # All mock data for demo
│   ├── pages/            # Route-level page components
│   │   ├── Dashboard.tsx
│   │   ├── Finance.tsx
│   │   ├── Attendance.tsx
│   │   ├── Analytics.tsx
│   │   ├── Settings.tsx
│   │   ├── DriverPortal.tsx
│   │   ├── Students.tsx
│   │   ├── Teachers.tsx
│   │   └── ... (30+ pages)
│   └── App.tsx           # Router & role-based routing
├── index.html
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 🎨 Design Philosophy

- **Minimalist Executive View** — "5-second health check" dashboards, not feature dumps
- **Role-Based Visibility** — Each role sees only what's relevant
- **Mobile-First** — Fully responsive, optimized for 4GB RAM devices
- **Ethiopian Context** — Amharic/Oromic language support, Ethiopian calendar, ETB currency
- **Traffic-Light System** — Green/Amber/Red indicators for instant status assessment

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Routing | React Router v6 |
| State | React Context + useState |

---

## 📄 License

Proprietary — Nexora Technology PLC © 2026