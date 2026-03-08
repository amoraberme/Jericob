# Website Architectural Analysis: CareerSync

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [The Core (Architecture)](#2-the-core-architecture)
3. [The Flow (Execution & Data)](#3-the-flow-execution--data)
4. [The Logic (Business Rules)](#4-the-logic-business-rules)
5. [Directory Map](#5-directory-map)

---

## 1. Executive Summary

**CareerSync** is an AI-powered applicant tracking system (ATS) optimization and executive career coaching platform. Its primary purpose is to help job seekers bypass automated resume filters using artificial intelligence. 

The application takes a user's resume and a target job description, analyzes the gaps, maps transferable skills, computes match scores, drafts professional cover letters, and provides actionable resume optimizations. Beyond analysis, CareerSync incorporates a tiered credit system where users must expend credits to run deep analyses, with an integrated payment infrastructure to purchase additional credits.

---

## 2. The Core (Architecture)

The application is built on a modern, modern full-stack JavaScript architecture, utilizing a Serverless deployment model for its backend.

### **Tech Stack**
*   **Frontend Framework:** React 19 built with Vite.
*   **Styling & UI:** Tailwind CSS combined with `clsx` and `tailwind-merge` for utility class management.
*   **Animations:** Framer Motion and GSAP (GreenSock) for dynamic and complex visual transitions, plus Lenis for smooth scrolling.
*   **State Management:** Zustand (`zustand`) for lightweight, decentralized global state.
*   **Backend / API Layer:** Vercel Serverless Functions (`api/` directory) acting as lightweight Node.js endpoints.
*   **Database & Authentication:** Supabase (`@supabase/supabase-js`) providing PostgreSQL, Row Level Security (RLS), and identity management.
*   **AI Engine:** Google Generative AI (`@google/generative-ai`), specifically utilizing the Gemini models.
*   **Hosting / Analytics:** Vercel (Routing managed via `vercel.json` and analytics via `@vercel/analytics`).

### **Structural Design**
The application adheres to a decoupled Jamstack pattern. The React frontend handles all view logic, state, and routing globally via `App.jsx`, bypassing traditional React Router for a state-based view rendering approach synchronized with the browser History API. The backend operates strictly headlessly via Vercel Functions that securely orchestrate prompt construction, payment verification, and AI API interactions, never exposing secrets to the client.

---

## 3. The Flow (Execution & Data)

### **A. User Journey & Navigation Flow**
1.  **Entry Point:** The browser fetches `index.html`, hydrating the React tree at `src/main.jsx` and rendering `src/App.jsx`.
2.  **Routing:** `App.jsx` acts as the primary layout controller storing the `currentView` in state (e.g., `'workspace'`, `'auth'`, `'plans'`, `'history'`). It listens to browser history state (`popstate`) and applies an Authentication Middleware Gatekeeper, redirecting unauthenticated users aiming for protected views back to the `<Auth />` or `<Landing />` screens.
3.  **Application View:** Once authenticated, users interact primarily with `<CoreEngine />` to input their resume data and job details.

### **B. AI Analysis Execution Flow**
1.  **Input:** User provides target job details (title, industry, experience required) and uploads a resume or pastes text via the `CoreEngine` component.
2.  **Request:** The frontend dispatches a `POST` request to `/api/analyze`.
3.  **Middlewares:** `analyze.js` applies CORS headers and verifies the user's Supabase authentication token natively.
4.  **Credit Deduction:** Before processing, the backend connects to Supabase securely via Admin credentials to invoke the `decrement_credits` RPC function, instantly attempting to deduct 3 credits from the user's balance. If this fails, a `402 Payment Required` is returned.
5.  **AI Orchestration:** If successful, `analyze.js` constructs a rigid, internal prompt separated completely from user input (to prevent injection), embedding a persona instruction for `Apex-ATS`. It sends the payload to the Gemini API (`models/gemini-flash-latest`).
6.  **Response Handling:** The Gemini model generates a structured JSON output (score, gap analysis, cover letter, optimization tips) which is parsed and forwarded back to the React client.
7.  **Display:** The frontend updates the Zustand store (`analysisData`) and switches the view to `<AnalysisTabs />` to format and present the results.

### **C. Payment & Credit Fulfillment Flow**
1.  **Initiation:** Users trigger a purchase in the `<Billing />` view, calling `/api/initiate-payment` which logs a `'Pending'` transaction in Supabase.
2.  **Fulfillment (Database Layer):** The true business logic lives entirely inside the Postgres instance (`supabase_schema.sql`). When a webhook or manual process updates the `transactions` table `status` to `'Paid'`, a post-update trigger (`fulfill_credits_on_payment()`) automatically finds the `plan_id` and adds the correct number of credits to `user_profiles.current_credit_balance`.

---

## 4. The Logic (Business Rules)

*   **Credit Mechanics & Abuse Prevention:**
    *   **New Users:** Users receive 1 credit on signup via a PostgreSQL trigger (`handle_new_user`).
    *   **Account Deletion Fraud:** A `previously_registered_emails` table permanently tracks deleted accounts. Re-registered emails are detected by the trigger and explicitly granted 0 credits to stop infinite free-tier abuse.
    *   **Analysis Cost:** Each deep analysis strictly costs 3 credits, securely deduced server-side using PostgreSQL Row-Level Locking (`FOR UPDATE`) to prevent race condition exploits.
*   **AI Rubric & Output:**
    *   The system heavily penalizes missing skills ("Never hallucinate skills").
    *   The required output is heavily structured into four areas: Baseline Score (40% Core, 30% Scope, 20% Bonus, 10% Industry), Gap Analysis, Transferable Skills (mapping adjacent experiences to gaps), and a highly specific Cover Letter generated under one of four user-selected tones.
*   **Security & RLS:**
    *   Row-Level Security is strictly enforced. Users can only select or mutate their `candidates_history`, `user_profiles`, and `transactions`.
    *   Sensitive API keys (Gemini, Supabase Admin Role) are completely abstracted behind the Vercel API layer configuration.

---

## 5. Directory Map

*Note: This is a curated structural map highlighting the most critical components of the system.*

```text
/CareerSync (Root)
│
├── package.json                   # Defines project scripts, Vite setup, and core dependencies (React, GSAP, Supabase, Framer).
├── vercel.json                    # API routing configuration for Vercel deployment.
├── vite.config.js                 # Front-end bundler configuration.
├── supabase_schema.sql            # The backbone data layer: DDL, triggers, RLS policies, and core credit transaction logic.
│
├── api/                           # Vercel Serverless Functions Backend
│   ├── _lib/                      # Backend middleware (authMiddleware.js, corsHelper.js)
│   ├── analyze.js                 # Core engine logic: deducts credits and communicates with Gemini API.
│   ├── contact.js                 # Handles contact form submissions.
│   ├── initiate-payment.js        # Bootstraps checkout sessions.
│   ├── parse.js                   # Handles potential document extraction/formatting.
│   ├── payment-history.js         # Endpoint strictly fetching user transaction history.
│   └── webhooks/                  # Handlers for third-party payment success callbacks.
│
├── src/                           # React Frontend Directory
│   ├── main.jsx                   # React DOM Entry, applies Analytics and strict mode.
│   ├── App.jsx                    # Root layout, routing state machine, authentication guard, global error boundary.
│   ├── index.css                  # Global Tailwind imports and base styles.
│   ├── supabaseClient.js          # Initialization of the single Supabase client instance.
│   │
│   ├── store/
│   │   └── useWorkspaceStore.js   # Global Zustand store handling UI state and AI response caching.
│   │
│   ├── hooks/
│   │   └── usePageTracking.js     # Analytics SPA hook.
│   │
│   ├── components/                # UI Layer
│   │   ├── Auth.jsx               # Login / authentication wrapper.
│   │   ├── CoreEngine.jsx         # The main resume input dashboard.
│   │   ├── AnalysisTabs.jsx       # The view layer that renders the AI's returned results.
│   │   ├── Billing.jsx            # User interface for buying credit plans.
│   │   ├── HistoryDashboard.jsx   # Grid of past `candidates_history` records.
│   │   ├── Landing.jsx            # Unauthenticated marketing page.
│   │   └── legal/                 # Static markdown/text pages parsed into components.
│   │       ├── Privacy.jsx
│   │       └── Terms.jsx
│   │
│   └── utils/                     # Generic utility functions (not further defined in context).
```
