# Banana Quest Enterprise: Distributed Educational Game

**Unit:** CIS046-3 Software For Enterprise  
**Assessment:** Assignment 1 – Artifact & Video Submission  
**Author:** Lenin Maharjan (Student ID: Reflected in Video Submission)  
**Target Grade Standard:** 1st Class (70%+)  

---

## 1. Project Overview

Banana Quest Enterprise is a full-stack, distributed web application engineered around Marc Conrad's educational **Banana API**. The system was constructed to explore and critically evaluate four foundational software engineering and computer science themes:

1. **Version Control & Modular Component Architecture**
2. **Event-Driven Programming (EDA)**
3. **Interoperability & Distributed Web Services**
4. **Virtual Identity & Cryptographic Security**

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                      ENTERPRISE DISTRIBUTED SYSTEM                     │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
           ┌─────────────────────────┼─────────────────────────┐
           ▼                         ▼                         ▼
  ┌───────────────────┐    ┌───────────────────┐    ┌────────────────────┐
  │ 1. VERSION CTRL   │    │ 2. EVENT-DRIVEN   │    │ 3. INTEROPERAB.    │
  │ • Git Flow        │    │ • Pub/Sub Engine  │    │ • Banana REST API  │
  │ • Feature Branches│    │ • Async Queues    │    │ • Resilient Cache  │
  │ • Semantic Tags   │    │ • Web Audio Synth │    │ • Gateway Proxy    │
  │ • Decoupled Layers│    │ • State Machine   │    │ • JSON & Telemetry │
  └───────────────────┘    └───────────────────┘    └────────────────────┘
                                     │
                                     ▼
                            ┌───────────────────┐
                            │ 4. VIRTUAL ID     │
                            │ • Bcrypt Salting  │
                            │ • HTTP-Only Cookie│
                            │ • Audit Trails    │
                            │ • Progression/Rank│
                            └───────────────────┘
```

---

## 2. Quick Start Guide

### Prerequisites
- Node.js (version 18+ or 24+)
- npm (version 9+)

### Installation & Launch
```bash
# 1. Clone repository
git clone <repository_url>
cd bananaAPI

# 2. Install dependencies
npm install

# 3. Run automated tests (All 4 themes)
npm test

# 4. Start the application
npm start
```

Open your browser and navigate to:  
👉 **`http://localhost:3000`**

---

## 3. Implementation of the Four Key Themes

### Theme 1: Version Control & Code Organization (Rubric 70%+)
- **Git Flow Branching Strategy**:
  - `main`: Production-stable releases.
  - `develop`: Integration branch.
  - Feature branches: `feature/banana-interop`, `feature/auth-virtual-identity`, `feature/event-driven-engine`, `feature/testing-documentation`.
- **Semantic Version Tags**:
  - `v0.1.0-alpha`: Interoperability gateway and fallback cache.
  - `v0.2.0-beta`: Virtual identity, bcrypt salted hashing, and session management.
  - `v0.3.0-rc1`: Event-driven architecture, Pub/Sub EventBus, and Web Audio.
  - `v1.0.0`: Full system delivery and automated test suite.
- **Component Modularity**: Decoupled 3-tier architecture with separate concerns for presentation (`public/`), routing (`routes/`), business services (`services/`), persistence (`models/`), and security (`middleware/`).

### Theme 2: Event-Driven Programming (Rubric 70%+)
- **Publish-Subscribe EventBus (`src/public/js/eventBus.js`)**: Decoupled message bus implementing `on()`, `off()`, `emit()`, and `once()`.
- **Finite State Machine (FSM)**: State transitions (`IDLE`, `FETCHING`, `WAITING_INPUT`, `EVALUATING`, `GAME_OVER`) triggered purely via discrete events.
- **Synthesized Web Audio Engine (`src/public/js/soundManager.js`)**: Procedural audio synthesized via native Web Audio API oscillators upon receiving sound events.
- **Live Event Stream Inspector**: Interactive drawer in the UI displaying all dispatched events, payloads, and subscriber counts in real-time.

### Theme 3: Interoperability (Rubric 70%+)
- **External Web Service Target**: Marc Conrad's Banana API (`https://marcconrad.com/uob/banana/api.php?out=json`).
- **Architectural Gateway & Anti-Cheat**: The Node.js server proxies outbound requests to prevent CORS browser blocks and hides raw puzzle solutions from client-side inspection.
- **Fault-Tolerance & Resilience**: Automatic HTTP fallback and local high-availability cache in case the remote university server experiences network latency or downtime.
- **Live Telemetry & Diagnostics**: Real-time tracking of request latency (ms), HTTP status codes, and success rates via the UI Interoperability Drawer.

### Theme 4: Virtual Identity (Rubric 70%+)
- **Cryptographic Password Security**: Salted hashing with `bcryptjs` (work factor 10) to defend against rainbow table and brute-force attacks.
- **Session Management**: Cryptographically signed HTTP-only cookies (`connect.sid`) preventing Cross-Site Scripting (XSS) session theft.
- **Identity Progression**: Tying player achievements, stats (accuracy %, streak records, high scores) to persistent virtual identities displayed on the Global Leaderboard.
- **Forensic Audit Logging**: Logging security events (registration, logins, failed attempts, IP addresses) in `data/store.json`.

---

## 4. Academic Integrity & References

In compliance with University of Bedfordshire academic integrity guidelines, the following external resources, documentation, and tools are acknowledged:

1. **Banana API**:
   - Conrad, M. (2022). *Banana Game API Documentation*. Available at: https://marcconrad.com/uob/banana/doc.php [Accessed October 2026].
   - Example repositories: https://github.com/marcconrad/comparativeintegratedsystems.
2. **Security & Cryptography**:
   - OWASP (2023). *Password Storage Cheat Sheet*. Open Web Application Security Project.
   - NIST (2020). *Digital Identity Guidelines: Authentication and Lifecycle Management* (Special Publication 800-63B).
3. **Software Architecture**:
   - Fowler, M. (2002). *Patterns of Enterprise Application Architecture*. Addison-Wesley.
   - Gamma, E., Helm, R., Johnson, R., and Vlissides, J. (1994). *Design Patterns: Elements of Reusable Object-Oriented Software*. (Observer Pattern / EventBus).
4. **Third-Party Libraries**:
   - `express`: Fast, unopinionated minimalist web framework for Node.js.
   - `bcryptjs`: Optimized bcrypt in plain JavaScript with zero native compilation dependencies.
   - `express-session`: Session middleware for Node.js Express.
   - `cors`: Cross-Origin Resource Sharing middleware.
5. **Generative AI Disclosure**:
   - Generative AI (Antigravity IDE / Gemini) was utilized as an assistive pair programmer for architectural brainstorming, boilerplate generation, and plan structuring, fully verified and adapted by the student.
