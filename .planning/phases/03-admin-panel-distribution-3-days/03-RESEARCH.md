# Phase 3 Research: Admin Panel & Distribution

**Phase:** 3 — Admin Panel & Distribution (3 days)  
**Generated:** April 12, 2026  
**Status:** Research Complete

---

## Executive Summary

Phase 3 builds the admin panel with revenue distribution workflows and user management. The existing codebase provides:
- Supabase auth with role-based access (user/contributor/admin)
- Smart contracts for revenue distribution (RevenueRights.sol, RevenueSplitter.sol)
- Demo data seeding infrastructure
- Responsive Tailwind-based UI patterns (established in Phase 2)

Key technical decisions needed:
1. **Distribution workflow**: Form-based vs. wizard-based vs. batch CSV
2. **Approval strategy**: Single-step confirmation vs. multi-step review
3. **State management**: Supabase vs. client state vs. optimistic updates
4. **Audit logging**: Track all distribution actions at DB level

---

## Requirements Addressed

**Phase 3 Requirements IDs:** REQ-102, REQ-201 (admin view), REQ-402, REQ-501

| Requirement | Scope | Notes |
|-------------|-------|-------|
| REQ-102 | Admin Dashboard + Distribution + User Mgmt | Core feature |
| REQ-201 | Admin transaction monitoring | Extends user reporting |
| REQ-402 | Role-based features | Enforce admin role gate |
| REQ-501 | Web3 integration | Use existing contracts |

---

## Domain Research

### 1. Admin Dashboard Pattern

**Problem:** Admins need visibility into all users' transactions and ability to trigger distributions.

**Related Code:**
- `/src/app/admin/page.tsx` — Exists but likely minimal (Phase 1 artifact)
- `/src/app/components/dashboard/*` — Existing reusable components (cards, charts)
- `/src/lib/database.ts` — Supabase connection

**Pattern:** Multi-tab dashboard (users, distributions, audit log, health)

### 2. Revenue Distribution Workflow

**Pattern Options:**
1. **Form-based** (simplest)
   - Single page with project selector, user selector, amount input
   - Calculate splits automatically
   - Submit button triggers smart contract call
   - Feedback: success/error toast

2. **Wizard-based** (more complex, safer)
   - Step 1: Select project
   - Step 2: Select recipients and allocate percentages
   - Step 3: Review total, verify sum = 100%
   - Step 4: Confirm distribution
   - Best for preventing errors

3. **Batch CSV** (scalable for many distributions)
   - Upload CSV with project:user:amount rows
   - Preview calculated distributions
   - Approve batch
   - Execute in background

**Recommendation for MVP:** Form-based is fastest (1-2 screens), covers 80% of use cases.

### 3. User Management Interface

**Scope:** Admin can assign users to projects and set their revenue allocation %

**Related Code:**
- `users` table: Supabase schema tracks user data
- `projects` table: Tracks projects and their allocations
- `rights_holders` table: Links users to projects with percentage

**Pattern:** Table with edit/delete actions, modal for adding users

### 4. Approval & Safety

**Constraints:**
- Prevent underbooking (percentages < 100%)
- Prevent overbooking (percentages > 100%)
- No distribution without explicit confirmation
- Audit log every action (user, timestamp, action, result)

**Implementation:** Zod or manual validation on form submission

### 5. Existing Auth Role System

From Supabase auth, users have role: `enum('admin', 'contributor', 'creator', 'user')`

**Gate pattern already established:** Phase 2 knows how to check roles via `useAuth()` hook

**Implementation:** Wrap admin routes with role check
```typescript
if (user?.role !== 'admin') return <AccessDenied />
```

### 6. Web3 Contract Integration

From Phase 1 audit, contracts are:
- `RevenueRights.sol` — Manages rights/allocations
- `RevenueSplitter.sol` — Executes distributions

**Existing hook:** `/src/hooks/useRevenueContract.js` — Already handles contract calls

**Pattern:** Call contract method from admin distribution form, handle response

---

## Architecture Decisions

### Admin Dashboard Layout

**Strategy:** Reuse DashboardLayout (established in Phase 2)

Components needed:
- AdminLayout (similar to DashboardLayout, but wider for admin needs)
- Tabs: Users, Distributions, Audit Log, Health
- Each tab contains a card-based panel

### Distribution Form

**State Management:** React useState + form submission (no Redux/Context needed for MVP)

**Validation:**
- Project selected ✓
- At least 1 recipient ✓
- Sum of percentages = 100% ✓
- Amount > 0 ✓

**Flow:**
1. User fills form
2. Click "Preview Distribution"
3. Show summary (which users, what %, what amounts)
4. "Confirm & Distribute" button (calls smart contract)
5. Loading state + success/error toast

### User Management

**Pattern:** Filterable table with inline edit/delete actions

**Columns:**
- Name
- Email
- Role (dropdown editable)
- Projects (count)
- Actions (edit allocation, remove)

### Audit Log

**Pattern:** Read-only table, sortable/filterable

**Columns:**
- Timestamp
- Action (create user, update allocation, distribute)
- Admin user
- Target (which user/project)
- Result (success/failure)

### Role-Based Access

**Gate:** `/src/app/admin/*` pages check `if (user?.role !== 'admin')`

**Pattern:** Already established with `useAuth()` hook from Phase 2

---

## Tech Stack (Settled from Phases 1-2)

| Layer | Technology | Decision |
|-------|-----------|----------|
| DB | Supabase (PostgreSQL) | Established |
| ORM | Direct Supabase client | Established (no Prisma in MVP) |
| Frontend | Next.js 14 (App Router) | Established |
| Styling | Tailwind CSS | Established |
| Forms | React state + validation | Established (no Formik/React Hook Form for MVP) |
| Web3 | ethers.js + MetaMask | Established |
| Charts | Chart.js (Phase 2) | Reused |
| State Mgmt | React useState | Established (no Redux) |
| Toast Messages | react-hot-toast | Established |

---

## Known Constraints

1. **Single developer** — Keep UI simple, automate validation
2. **MetaMask dev env only** — No mainnet (Phase 7)
3. **Same design language as Phase 2** — Reuse colors, card styles, spacing
4. **Demo data available** — Use existing seed scripts for testing
5. **3-day window** — Focus on core distribution, defer complex approval workflows

---

## Risk Inventory

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Distribution calculations fail | HIGH | Validate sums before submit, show preview |
| Smart contract reversion | MEDIUM | Handle contract errors gracefully, show error toast |
| Admin accidentally triggers distribution | HIGH | Multi-step confirmation, disabled button until ready |
| No audit trail (compliance) | MEDIUM | Log every distribution to Supabase `activity` table |
| Role gate bypass | HIGH | Check role on every admin page load (not just mount) |
| Performance (many users) | LOW | Paginate tables, lazy-load tabs |

---

## Implementation Heuristics

1. **Forms over wizards** — Use modal forms for user/allocation edits
2. **Feedback loops** — Toast on success/error, refresh table after mutation
3. **Pre-submit preview** — Show summary before distribution, let admin review
4. **Audit by default** — Every action logged (don't make it an afterthought)
5. **Reuse Phase 2 components** — DashboardLayout, charts, cards
6. **Simple validation** — Zod if lightweight, else manual
7. **Contract error handling** — Catch revert reasons, show user-friendly message

---

## Validation Architecture

### Dimension 1: Requirements Coverage
- ✓ All REQ-102, REQ-201, REQ-402, REQ-501 mapped to tasks

### Dimension 2: Technical Feasibility
- ✓ Web3 hooks exist (Phase 1)
- ✓ Supabase auth established (Phase 1)
- ✓ UI patterns established (Phase 2)

### Dimension 3: Security
- ✓ Role gates via `useAuth()`
- ✓ Audit logging mandatory
- ✓ Contract validation (sums 100%)
- ✓ Preview before submit

### Dimension 4: Completeness
- ✓ Form-based distribution
- ✓ User management
- ✓ Audit log view
- ✓ Admin dashboard layout

### Dimension 5: Integration
- ✓ Reuses DashboardLayout, components
- ✓ Reuses useRevenueContract hook
- ✓ Reuses useAuth hook

### Dimension 6: Scope
- ✓ Form-based (not CSV batch) — within 3-day window
- ✓ Manual approval (not workflow) — keep it simple
- ✓ Supabase logging (not event sourcing) — sufficient for MVP

### Dimension 7: Verification
- ✓ Test form validation (max sum = 100%)
- ✓ Test role gate (non-admin redirected)
- ✓ Test contract call (mock success + error)
- ✓ Test audit log persistence

### Dimension 8: Context
- ✓ No design decisions deferred
- ✓ Tech stack finalized (Phases 1-2)
- ✓ UI patterns established (Phase 2)

---

## Summary

Phase 3 is **research-ready** with:
- Clear architecture (form-based distribution, table-based user mgmt)
- Established tech stack (Tailwind, Supabase, ethers.js)
- Reusable components (DashboardLayout, hooks)
- Security gates (role-based access, validation before submit)

**Next:** Plan phase creates 3-4 tasks:
1. Admin Dashboard Layout (cards, tabs)
2. Distribution Form (validation, preview, contract call)
3. User Management Table (CRUD modal)
4. Audit Log Viewer (read-only table)

**Estimated effort:** 15-18 hours (fits 3-day window at 6 hrs/day)

---

## RESEARCH COMPLETE