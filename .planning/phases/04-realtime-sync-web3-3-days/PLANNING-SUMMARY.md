---
phase: 04-realtime-sync-web3
planning_status: complete
date: 2026-04-12
---

# Phase 04 Planning Summary

**Phase:** Real-time Sync & Web3 Integration (3 days)  
**Status:** All Planning Artifacts Created ✓  
**Timestamp:** 2026-04-12T20:00:00Z  

---

## Planning Complete: 3 Executable Plans Created

### Phase 04 Overview

**Goal:** Enable live blockchain integration with real-time status updates

**Requirements Addressed:**
- REQ-301: Transaction status tracking
- REQ-302: Gas estimation and fee display
- REQ-501: Wallet integration and signing
- REQ-502: Contract event listeners for balance updates

**Planned Effort:** 2.75 days (fits 3-day window with buffer)

---

## Plans Structure

### Wave 1: Foundation (Parallel, No Dependencies)

**Plan 04-01: Gas Estimation & Display** (0.5 days)
- Create GasFeeSummary component
- Implement gas estimation utility (estimateGas function)
- Create useGasPrice hook for polling
- Integrate into AllocationPreview

**Deliverables:**
- GasFeeSummary.tsx (display component)
- gasUtils.ts (estimation functions)
- useGasPrice hook
- Updated AllocationPreview with fee display

**Files Modified:** 1 existing (AllocationPreview.tsx)  
**Files Created:** 3 new

---

### Wave 2: Transaction Submission & Event Listeners (Depends on Wave 1)

**Plan 04-02: Transaction Submission & Status Tracking** (0.75 days)
- Enhance POST /api/admin/distribute to call contract
- Create TransactionStatusDialog component
- Create transactionUtils.ts for error parsing
- Implement polling for confirmation

**Deliverables:**
- Enhanced POST /api/admin/distribute with contract call
- TransactionStatusDialog.tsx (status UI)
- transactionUtils.ts (error handling)
- GET /api/admin/distributions/{id} endpoint

**Files Modified:** 1 existing (DistributionForm.tsx, POST endpoint)  
**Files Created:** 3 new components/utilities

---

**Plan 04-03: Real-time Events & Balance Reconciliation** (0.5 days)
- Create useContractEvents hook for event listening
- Implement balance reconciliation utility
- Create scheduled reconciliation job
- Integrate event listener into AuditLogViewer

**Deliverables:**
- useContractEvents hook (event listener)
- balanceReconciliation.ts (sync utility)
- reconcileBalances.js (scheduled job)
- GET /api/admin/reconcile endpoint
- Enhanced AuditLogViewer with real-time indicator

**Files Modified:** 1 existing (AuditLogViewer.tsx)  
**Files Created:** 4 new

---

## Plan Dependency Graph

```
Plan 04-01 (Gas Estimation)
    ↓ (provides UI foundation)
Plan 04-02 (Transaction Submission) ← depends on 04-01
Plan 04-03 (Event Listeners)       ← depends on 04-02
```

**Execution Pattern:**
1. Wave 1: Plan 04-01 (can start immediately, no dependencies)
2. Wave 2: Plans 04-02 and 04-03 (execute in sequence: 02 → 03)

**Estimated Wave Timing:**
- Wave 1: 4 hours (Plan 04-01)
- Wave 2: 6 hours (Plan 04-02: 3h + Plan 04-03: 3h)
- **Total: 10 hours** (fits 3-day window with 2-day buffer)

---

## Technical Approach Summary

### Architecture: Hybrid Event Listener + Polling

**Problem Solved:** Bridge blockchain events to database automatically

**How It Works:**
1. **Gas Estimation** - User sees estimated fee before signing
2. **Contract Submission** - Form calls contract.distributeRevenue()
3. **Status Polling** - Client polls blockchain for confirmation (1-5 blocks)
4. **Real-time Sync** - Contract event triggers activity table insert
5. **UI Updates** - Supabase subscription (Phase 3 pattern) updates UI
6. **Balance Reconciliation** - Every 5 minutes, verify DB matches contract

---

## Key Components Created

| Component | Purpose | Pattern |
|-----------|---------|---------|
| **GasFeeSummary.tsx** | Display gas fee | Dark themed card |
| **TransactionStatusDialog.tsx** | Show tx status | Modal/overlay |
| **useGasPrice hook** | Poll gas prices | React hook with interval |
| **useContractEvents hook** | Listen to events | React hook with cleanup |
| **AuditLogViewer enhancement** | Show listener status | Visual indicator |

---

## New API Endpoints

| Endpoint | Method | Purpose | Status Code |
|----------|--------|---------|-------------|
| `/api/admin/distribute` | POST (enhanced) | Call contract + store distribution | 201 |
| `/api/admin/distributions/[id]` | GET (new) | Poll transaction status | 200 |
| `/api/admin/sync-event` | POST (new) | Sync blockchain event to DB | 200 |
| `/api/admin/reconcile` | GET (new) | Check balance reconciliation | 200 |

---

## Utility Functions

| Utility | File | Purpose |
|---------|------|---------|
| `estimateGas()` | gasUtils.ts | Get current gas price + fee |
| `formatGasPrice()` | gasUtils.ts | Convert wei to gwei for display |
| `parseTransactionError()` | transactionUtils.ts | Extract human-readable error |
| `reconcileBalance()` | balanceReconciliation.ts | Compare contract vs DB balance |
| `formatBalance()` | balanceReconciliation.ts | Format wei as ETH string |

---

## Success Criteria for Phase 04

### Functionality
✓ Gas estimation displayed before submission  
✓ Contract call triggered on form submit  
✓ Transaction hash captured and stored  
✓ Transaction status updates real-time (pending → confirmed)  
✓ Contract events synced to audit log  
✓ Balance reconciliation runs and logs discrepancies  

### Quality
✓ All TypeScript types correct (no errors on build)  
✓ Error messages human-readable  
✓ Dark theme consistent with Phase 3  
✓ Real-time updates within 5 seconds  
✓ Fallback to polling if event listener fails  

### Security
✓ All endpoints verify admin role (403 if not)  
✓ Transaction hashes logged immutably  
✓ Balance discrepancies trigger audit log entries  
✓ No private keys handled in app (MetaMask only)  

---

## Risk & Mitigation

| Risk | Mitigation Plan |
|------|-----------------|
| Testnet RPC unreliable | Use Alchemy/Infura fallback; implement retry logic |
| User rejects signing | Expected; show friendly error message |
| Contract reverts | Pre-validate balance/allowances; simulate first |
| Event listener dies | Fallback to polling every 10 seconds |
| Gas prices spike | Re-estimate before final submit; cache for 30s |

---

## RESEARCH Assumptions & Decisions

**Locked Decisions (from Phase 1-3):**
- MetaMask for wallet (no Meta Wallet yet)
- ethers.js v6 for contract calls
- Supabase for real-time subscriptions
- Activity table for audit trail

**Phase 04 Decisions:**
1. **Distribution API behaves:** Form → submit → contract call (no approval workflow)
2. **Gas display:** Estimated before submit, actual in confirmation
3. **Retry on fail:** Auto-retry network errors only; user retry for validation errors
4. **Balance reconciliation:** Every 5 minutes (or on-demand via API)
5. **Event listener fallback:** Polling every 10 seconds if listener unavailable

---

## Artifact Checklist

**Planning Documents:**
✓ 04-RESEARCH.md (200+ lines, domain analysis)  
✓ 04-01-PLAN.md (Gas estimation, 80 lines)  
✓ 04-02-PLAN.md (Transaction submission, 120 lines)  
✓ 04-03-PLAN.md (Event listeners, 110 lines)  
✓ PLANNING-SUMMARY.md (this file)  

**Ready for Execution:**
- All 3 plans have concrete tasks with files, actions, verify steps
- Dependency graph clear (Wave 1 → Wave 2)
- Success criteria measurable
- Time estimates realistic (10 hours total, 3 days allocated)

---

## Next Steps

### Execution Phase
1. Run Phase 04 Plans in order:
   - Executor runs Plan 04-01 (4 hours)
   - Executor runs Plan 04-02 (3 hours)
   - Executor runs Plan 04-03 (3 hours)

2. Verify each plan:
   - GasFeeSummary shows on form
   - Transaction status updates on submission
   - Balance reconciliation runs and logs

3. Test on testnet with real MetaMask

### After Phase 04
- Phase 05: Analytics & Reporting (2 days)
- Phase 06: Testing & Launch (1.5 days)
- Phase 07: Meta Wallet (post-launch)

---

## Summary

Phase 04 planning complete with 3 executable plans totaling ~100 lines of specifications. Architecture defined: hybrid event listening + polling for real-time blockchain sync. All components, endpoints, and utilities planned. Ready to execute with 10-hour effort estimate fitting 3-day window comfortably.

**Status:** 🟢 READY FOR EXECUTION
