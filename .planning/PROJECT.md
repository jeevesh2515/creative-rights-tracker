# Creative Rights Tracker - Project Context

**Status:** Initialized | **Version:** 1.0 | **Created:** April 12, 2026

---

## Project Overview

**Name:** Creative Rights Tracker  
**Type:** Web3/Blockchain Application  
**Owner:** Moonstone  
**Target Timeline:** ASAP (within 2 weeks)  

### Problem Statement
Create a comprehensive dashboard for users and admin of Moonstone that enables:
- Real-time visibility into revenue generation and transactions
- Web3-enabled revenue distribution across projects  
- Personalized dashboards based on user roles and earned rights
- Admin transaction processing capabilities

Currently operational with local demo data. Future phases will integrate Meta wallet for live blockchain transactions.

---

## Core Vision

Enable transparent revenue tracking and distribution for creative professionals working across multiple projects, with role-based access controls and real-time financial analytics.

---

## Key Features (MVP)

1. **User Dashboard**
   - Personalized revenue view by project
   - Transaction history with filtering
   - Role-based access (user vs. admin)

2. **Analytics & Reporting**
   - Revenue trends and graphs
   - Donuts/pie charts for distribution
   - Project-level summaries
   - Exportable reports

3. **Admin Panel**
   - Revenue distribution workflow
   - Transaction processing via Web3
   - User/rights management
   - Batch operations

4. **Web3 Integration**
   - Smart contract-based revenue splitting
   - Transaction signing and execution
   - Real-time balance syncing
   - Transaction history blockchain-backed

5. **UI/UX**
   - Professional dashboard design
   - Responsive layout
   - Real-time updates
   - Clear data visualization

---

## Stakeholders

| Role | Responsibility | Needs |
|------|--|--|
| **Creative Professional** | View earnings, track projects | Personalized dashboard, project earnings breakdown |
| **Admin** | Process transactions, manage distribution | Admin panel, Web3 controls, reports |
| **Company** | Revenue oversight | Analytics, audit trails, insights |

---

## Success Criteria

1. **Functional** — Users can view personalized earnings dashboard; admin can process transactions
2. **Technical** — Real-time syncing, graphs/donuts display accurately, reports generate
3. **Financial** — Revenue tracking and distribution working correctly
4. **User Experience** — Clean UI, no confusion about earnings/roles

---

## Constraints & Assumptions

- Local demo data for development phase
- Meta wallet integration deferred to later phase
- Existing smart contracts (RevenueRights.sol, RevenueSplitter.sol) available
- Supabase for auth/data layer
- Next.js + Hardhat stack established

---

## Roadmap Overview

```
Phase 1: Foundation & Setup [CURRENT]
Phase 2: Dashboard & UI Polish
Phase 3: Admin Controls & Distribution
Phase 4: Web3 Integration & Smart Contracts
Phase 5: Analytics & Reporting
Phase 6: Meta Wallet Integration [FUTURE MILESTONE]
```

---

## Project Artifacts

- **Repository:** creative-rights-tracker
- **Smart Contracts:** `contracts/RevenueRights.sol`, `contracts/RevenueSplitter.sol`
- **Frontend:** Next.js + React (`src/app/`)
- **Backend:** Express.js + Supabase (`server/`, `scripts/`)
- **Tech Stack:** TypeScript, Tailwind CSS, Web3.js, Hardhat
