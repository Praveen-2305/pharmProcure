# AutonoSource Frontend Dashboard (`frontend/`)

The **AutonoSource Frontend** is an executive audit and procurement cockpit built for pharmaceutical procurement officers, regulatory compliance auditors, and executive risk committees. It visualizes the multi-agent investigation pipeline, highlights contract contradictions, displays statutory price ceiling variance, and enables GxP-compliant human-in-the-loop decision making.

---

## 🎨 Design Philosophy & Technology Stack

Traditional enterprise procurement software (e.g., legacy SAP or Oracle modules) is often visually dense, sluggish, and unintuitive. AutonoSource provides a modern, high-contrast, responsive interface designed to make multi-factor risk assessments immediate and clear.

| Technology | Role | Why We Chose It |
| :--- | :--- | :--- |
| **React 18** | UI Framework | Component-driven architecture, concurrent rendering, and fast client-side state updates. |
| **TypeScript** | Type Safety | Direct type parity with backend Pydantic models (camelCase JSON), eliminating runtime schema mismatches. |
| **Vite** | Build Tool & Dev Server | Sub-second Hot Module Replacement (HMR) and optimized Rollup production bundling. |
| **Tailwind CSS** | Styling System | Utility-first CSS enabling custom glassmorphism tokens, curated color palettes, and rapid responsive styling. |
| **Framer Motion** | Micro-Animations | Butter-smooth 60fps transitions for pipeline stage progress, modal overlays, and confidence score gauges. |
| **Lucide React** | Iconography | Clean, consistent icons for risk levels, regulatory warnings, and operational stages. |
| **React Router DOM** | Routing | Seamless single-page application (SPA) client-side navigation. |

---

## ❓ Frontend Architecture: Why Did We Choose This?

### 1. Why Glassmorphism & High-Contrast Dark Theme?
* Investigating complex pharmaceutical audits requires analyzing dense data: FDA citation numbers, temperature tolerances, statutory ceiling rates, and liability caps.
* High-contrast dark cards with subtle translucent glassmorphism reduce eye fatigue during prolonged analytical sessions while highlighting color-coded risk indicators:
  - 🟢 **LOW Risk** (Compliant / Safe)
  - 🟡 **MEDIUM Risk** (Requires review / moderate variance)
  - 🔴 **HIGH Risk** (Contradictions / regulatory citation / ceiling exceeded)

### 2. Why Dedicated Risk Visualization Components?
Instead of generic text tables, the dashboard utilizes dedicated, reusable domain components:
* **`ConfidenceBadge.tsx`:** Renders a visual confidence gauge ($0.00$ to $1.00$). If confidence drops below $0.80$, it flags that the Critic agent performed self-validation revision loops.
* **`ContradictionFlag.tsx`:** An alert banner that surfaces explicit conflicts between vendor contracts and statutory standards (e.g., ambient 15°C–25°C transit vs WHO TRS 1025 cold chain mandate of 2°C–8°C).
* **`RiskLevelTag.tsx`:** Standardized badges for Financial, Compliance, Contractual, and Pricing risk levels.

### 3. Why Stateful Polling for Deal Evaluations?
* Multi-agent investigations can take 5 to 20 seconds depending on whether the Critic triggers revision loops.
* The frontend initiates the audit via `POST /procurement/submit` and polls `GET /procurement/{id}/status` until the pipeline reaches `AWAITING_APPROVAL` or `COMPLETE`, giving users a live view of the active agent stage (`PLANNING` ➔ `GATHERING_EVIDENCE` ➔ `SCORING_RISK` ➔ `CRITIQUING`).

---

## 🖥️ Screen & User Flow Overview

```
                      ┌──────────────────────────────┐
                      │      Landing Page ( / )      │
                      └──────────────┬───────────────┘
                                     │
               ┌─────────────────────┴─────────────────────┐
               ▼                                           ▼
  ┌─────────────────────────┐                 ┌─────────────────────────┐
  │   Dashboard (/dashboard)│                 │ Submit Request (/submit)│
  └────────────┬────────────┘                 └────────────┬────────────┘
               │                                           │
               ▼                                           ▼
  ┌─────────────────────────┐                 ┌─────────────────────────┐
  │ Vendor Review (/review) │ ◄───────────────┤ Triggers Agent Pipeline │
  └────────────┬────────────┘                 └─────────────────────────┘
               │
               ▼
  ┌─────────────────────────┐
  │ Approval Queue (/approval│
  │ • APPROVED / REJECTED   │
  └─────────────────────────┘
```

1. **Landing Page (`/`):** High-level overview of the platform, capability highlights, and quick access buttons.
2. **Procurement Dashboard (`/dashboard`):** Central command ledger showing all vendor evaluations, overall risk distribution, average confidence scores, and current investigation stages.
3. **Submit Request (`/submit`):** Form allowing procurement analysts to initiate an evaluation:
   - Vendor Name (e.g. *Apex BioLogistics*, *Nova Biologics*)
   - Product Category (e.g. *RT-PCR Reagents*, *Pediatric Vaccines*)
   - Quoted Deal Size & Unit Pricing
   - Master Services Agreement (MSA) / SLA document upload
4. **Vendor Review & Risk Breakdown (`/review/:id`):** Deep-dive investigative dossier:
   - **4-Dimension Risk Cards:** Breakdown of Financial, Compliance, Contract, and Pricing risk.
   - **Contradiction Alert Timeline:** Shows legal and regulatory contradictions detected by the fusion engine.
   - **Executive Summary:** Synthesized report from the Writer agent with recommendations.
5. **Executive Approval Queue (`/approval`):** Workflow gate for high-stakes transactions:
   - Displays all cases currently in `AWAITING_APPROVAL`.
   - Allows authorized procurement officers to record an official decision (`APPROVED`, `REJECTED`, or `ESCALATED`) with an audit rationale note.

---

## 📂 Frontend Directory Structure

```
frontend/
├── src/
│   ├── api/                   # Type-safe API client wrappers
│   │   ├── client.ts          # Axios / Fetch client configuration
│   │   ├── procurement.ts     # /procurement endpoints (submit, status, report, all)
│   │   ├── approval.ts        # /approval endpoints (pending, decide)
│   │   └── types.ts           # TypeScript interfaces matching backend models
│   ├── components/            # Reusable UI component library
│   │   ├── ConfidenceBadge.tsx# Color-coded confidence score visualizer
│   │   ├── ContradictionFlag.tsx # Contradiction alert component
│   │   ├── RiskLevelTag.tsx   # Standardized LOW/MEDIUM/HIGH badge
│   │   ├── layout/            # Navbar, Sidebar, and AppShell
│   │   └── ui/                # Core buttons, cards, modals, dialogs
│   ├── pages/                 # Route page components
│   │   ├── Landing/           # Public landing and product overview
│   │   ├── Dashboard/         # Active procurement case ledger
│   │   ├── SubmitRequest/     # New audit intake form
│   │   ├── VendorReview/      # Comprehensive multi-agent report review
│   │   └── ApprovalQueue/     # Human-in-the-loop executive sign-off queue
│   ├── router.tsx             # React Router configuration
│   ├── App.tsx                # App root provider wrapper
│   ├── main.tsx               # DOM entry point
│   └── index.css              # Global styles, Tailwind directives, glassmorphism tokens
├── package.json               # Frontend dependencies & scripts
├── tailwind.config.ts         # Tailwind theme customizations
├── tsconfig.json              # TypeScript compiler configuration
└── vite.config.ts             # Vite build & dev server configuration
```

---

## 🚀 Getting Started Locally

### 1. Install Dependencies
```bash
# Navigate to the frontend directory
cd frontend

# Install using pnpm (or npm / yarn)
pnpm install
```

### 2. Configure Environment
Ensure your `.env` points to the running backend server:
```bash
VITE_API_BASE_URL=http://localhost:8000
```

### 3. Start the Development Server
```bash
pnpm run dev
```
The application will be live at `http://localhost:5173`.

### 4. Build for Production
```bash
pnpm run build
```
Generates an optimized, type-checked production bundle in `dist/`.
