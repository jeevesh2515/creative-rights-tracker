---
phase: 04-realtime-sync-web3
status: research
date: 2026-04-12
---

# Phase 04 Research: Real-time Sync & Web3 Integration

## Phase Goal

Enable live blockchain integration with real-time status updates. Transactions should update within 5 seconds of confirmation. Balance consistency maintained between database and blockchain.

## Requirements to Address

- **REQ-301:** Real-time transaction status tracking (pending → confirmed → failed)
- **REQ-302:** Gas estimation and fee display
- **REQ-501:** Wallet connection and signing workflow (ethers.js)
- **REQ-502:** Contract event listeners for balance updates

## Technology Stack (Locked from Phase 1-3)

| Layer | Technology | Status | Notes |
|-------|-----------|--------|-------|
| Frontend | Next.js 14 (App Router) + React 18 | ✓ Locked | Already in use Phases 1-3 |
| Database | Supabase (PostgreSQL) | ✓ Locked | Real-time subscriptions available |
| Blockchain | Ethereum + ethers.js v6 | ✓ Locked | Used in Phase 1 audit |
| Web3 Wallet | MetaMask (browser extension) | ✓ Locked | dev/testnet only (Phase 7 deferred) |
| Real-time Sync | Supabase + ethers.js listeners | ✓ Locked | Both available; combine for sync |

## Domain Analysis: Real-time Blockchain Integration

### Challenge 1: Event Listener Architecture

**Problem:** Contract events are emitted on-chain, but database has no real-time connection to blockchain.

**Solution Options:**

| Approach | Pros | Cons | Fit |
|----------|------|------|-----|
| **A) Ethers.js Event Listeners** | Real-time, no polling, instant | Needs persistent connection, browser only | Partial (UI only) |
| **B) Blockchain.com/Alchemy Webhooks** | Reliable, tested, server-side | Requires external service account, cost | No (scope constraint) |
| **C) Polling (Ethers + setInterval)** | Simple, no external deps, sync every 5s | Less real-time, network load | ✓ Recommended |
| **D) Supabase `postgres_changes` + Contract listener** | Combined real-time, db-driven UI updates | Complex state management | Hybrid (best) |

**Recommendation:**
- Primary: **Option D (Hybrid)** - Ethers.js listeners on client + store results in Supabase activity table → Supabase subscriptions update UI
- Fallback: **Option C (Polling)** - Every 5 seconds, check contract balance via `getBalance()` and compare with DB

### Challenge 2: Transaction Status Lifecycle

**Goal:** Track transactions from creation → pending → confirmed → finalized

**Current State (Phase 3):**
- Admin creates distribution via POST /api/admin/distribute
- Returns `distributionId` + placeholder `txHash`
- No actual blockchain submission (deferred to Phase 4)

**Phase 04 Requirements:**
1. Form submission triggers **contract call** (POST /api/admin/distribute should call contract)
2. Contract call returns **tx hash**
3. Store tx hash in database with status = "pending"
4. Poll/listen for transaction confirmation (5+ block confirmations)
5. Update distribution status to "confirmed" when done
6. Display status in UI with toast notifications

**Transaction Status States:**

```
pending (0 confirmations)
  ↓
confirming (1-4 confirmations)
  ↓
confirmed (5+ confirmations)
  ✓ OR
  ✗ failed (if revert or dropped)
```

### Challenge 3: Gas Estimation & Display

**Problem:** Users need to know gas costs before signing.

**Solution:**
1. Before form submission, call `contract.estimateGas.distributeRevenue(...args)`
2. Multiply estimated gas by current gas price (via ethers.js)
3. Display total fee in distribution preview (already exists in Phase 03 AllocationPreview.tsx)
4. Update fee when gas prices change (poll every 10s)

### Challenge 4: Balance Consistency

**Problem:** Database shows allocated amounts; blockchain shows actual contract balance. These can diverge if:
- Transactions fail but db is updated
- Admin sends funds via wallet directly (outside app)
- Withdrawal happens off-chain

**Solution:**
1. **Periodic reconciliation:** Every 5 minutes, fetch contract balance and compare with DB sum
2. **Event-driven updates:** Listen for `RevenueDistributed` event and immediately sync DB
3. **User-initiated sync:** "Refresh" button on dashboard to force sync
4. **Audit table:** Track all balance discrepancies

### Challenge 5: Error Handling & Retry

**Problem:** Transactions can fail for multiple reasons:
- User rejects signing
- Network timeout
- Gas too low
- Contract revert

**Solution:**
1. Try/catch all `contract.` calls
2. Distinguish error types:
   - User rejection → show friendly message, don't retry
   - Network/timeout → auto-retry up to 3 times with exponential backoff
   - Insufficient funds → show required balance needed
   - Contract error (revert) → show revert reason if available
3. Store error message in database for audit

## Architecture Decision

### Recommended: Hybrid Event Listener + Polling

**Why:** Real-time UI updates + reliable fallback if listener dies

```
┌─ Admin submits distribution form
│
├─ Call estimateGas(...) → show fee preview
├─ User approves form
├─ POST /api/admin/distribute
│  ├─ Call contract.distributeRevenue(...) 
│  ├─ Get tx hash
│  ├─ Store distribution with status='pending'
│  └─ Return tx hash to client
│
├─ Client: ethers.js waitForTransaction(txHash, 1 confirmation)
│  └─ Polls blockchain every 10 seconds (built-in to ethers)
├─ Database: Listen for activity table INSERTs (status='confirmed')
│  └─ Toast notification "Distribution confirmed!"
│
└─ Every 5 min: Reconcile contract balance with DB sum
```

### Contract Modifications Needed

**Current Status:** RevenueRights.sol has `distributeRevenue()` but hasn't been called from web app yet

**Phase 04 Tasks:**
1. Test distributeRevenue() call from browser (MetaMask signing)
2. Capture tx hash and wait for confirmation
3. Update distribution record status when confirmed

## Code Patterns

### Pattern 1: Gas Estimation

```typescript
// Before form submit, in AllocationPreview component
const estimateGas = async () => {
  const contract = getRevenueRightsContract();
  const recipients = /* extracted from form */;
  const amounts = /* calculated amounts */;
  
  const gasEstimate = await contract.estimateGas.distributeRevenue(
    recipients,
    amounts
  );
  const gasPrice = await provider.getGasPrice();
  const feeBigInt = gasEstimate * gasPrice;
  const feeEth = ethers.formatEther(feeBigInt);
  
  setEstimatedFee(feeEth);
};
```

### Pattern 2: Transaction Submission + Wait

```typescript
const submitDistribution = async (recipients, amounts) => {
  try {
    const contract = getRevenueRightsContract(signer); // signer = MetaMask
    const tx = await contract.distributeRevenue(recipients, amounts);
    const txHash = tx.hash; // Available immediately (not confirmed)
    
    // Store in DB with status='pending'
    await fetch('/api/admin/distribute', {
      method: 'POST',
      body: JSON.stringify({ ..., txHash, status: 'pending' })
    });
    
    // Wait for 1 confirmation (ethers polls)
    const receipt = await tx.wait(1);
    
    // Update DB: status='confirmed'
    await fetch(`/api/admin/distributions/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'confirmed' })
    });
    
    toast.success('Distribution confirmed!');
  } catch (error) {
    if (error.code === 'ACTION_REJECTED') {
      toast.error('You rejected the transaction');
    } else {
      toast.error(`Transaction failed: ${error.message}`);
    }
  }
};
```

### Pattern 3: Event Listener (AuditLogViewer model)

```typescript
useEffect(() => {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const contract = new ethers.Contract(CONTRACT_ADDR, ABI, provider);
  
  // Listen for RevenueDistributed event
  const onDistributed = (sender, amount, timestamp) => {
    console.log('Distribution confirmed on-chain!', { sender, amount });
    // Trigger DB sync or UI update
  };
  
  contract.on('RevenueDistributed', onDistributed);
  
  return () => {
    contract.off('RevenueDistributed', onDistributed);
  };
}, []);
```

## Files to Create/Modify

### New API Routes
- **POST /api/admin/distribute** (existing from Phase 3 - needs contract call)
  - Currently: Creates DB records only
  - Phase 04: Call contract.distributeRevenue(), get tx hash, store with status='pending'

### New Components
- **TransactionStatusBadge.tsx** - Status indicator (pending/confirming/confirmed/failed)
- **GasFeeSummary.tsx** - Shows estimated/actual gas costs
- **TransactionWaitingDialog.tsx** - Shows pending status with spinner while waiting

### New Utilities
- **useRevenueContract.ts hook** - Already exists from Phase 1, enhance for submitting distributions
- **useGasPrice.ts hook** - Poll gas prices every 10s
- **transactionUtils.ts** - Helper functions for tx parsing/error handling

### Modified Files
- **src/app/components/admin/DistributionForm.tsx** - Add gas estimation before submit
- **src/app/components/admin/AllocationPreview.tsx** - Show estimated fee
- **src/app/api/admin/distribute/route.ts** - Call contract, don't just store DB
- **src/app/admin/page.tsx** - Show TransactionStatusBadge where needed

## Success Metrics for Phase 04

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Transaction confirmation time | < 30 seconds on testnet | Submit distribution, measure time to "confirmed" status |
| Gas estimation accuracy | Within 10% of actual | Compare estimateGas result to actual gas used |
| Error message clarity | User understands what went wrong | UX test with invalid inputs |
| Balance reconciliation | Every 5 minutes | Check logs for reconciliation attempts |
| UI responsiveness | Status updates within 5 sec | Observe UI while transaction pending |

## Risks & Mitigations

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Testnet RPC unreliable | 🟠 Medium | Use Infura/Alchemy fallback; implement retry logic |
| User rejects MetaMask signing | 🟢 Low | Expected; show friendly message |
| Gas price spikes mid-tx | 🟡 Medium | Re-estimate before final submit; cache for 30s |
| Contract reverts on-chain | 🔴 High | Check contract balance/allowances before submitting; simulate first |
| Browser listener disconnects | 🟡 Medium | Fallback to polling every 5s; monitor connection status |

## Timeline Estimate

| Task | Effort | Days |
|------|--------|------|
| Enhance POST /api/admin/distribute to call contract | 2-3h | 0.5 |
| Add gas estimation + display | 2h | 0.25 |
| Create TransactionStatusBadge + waiting dialog | 1.5h | 0.25 |
| Implement transaction polling/wait | 2h | 0.25 |
| Event listener for RevenueDistributed | 1.5h | 0.25 |
| Balance reconciliation cron job | 2h | 0.25 |
| Error handling + retry logic | 2h | 0.25 |
| Testing + verification | 3h | 0.5 |
| **TOTAL** | **16 hours** | **2.75 days** |

**Fits within 3-day Phase 04 window with buffer for discovery.**

## Assumptions

1. **MetaMask available** - Phase 1 verified this; Phase 4 uses it
2. **Contract functions correct** - Phase 1 audit confirmed; Phase 4 calls them
3. **Testnet stable** - Using testnet RPC; assume occasional latency
4. **Supabase available** - Running continuously; store tx status there
5. **No breaking changes to contract ABI** - Locked since Phase 1

## Open Questions to Resolve During Planning

1. Should distribution execution be immediate on form submit or require admin approval step?
   - **Decision needed:** Skip approval workflow for Phase 04 (form → contract call directly)
   
2. Should we display actual gas cost or estimated?
   - **Decision needed:** Show estimated before submit, actual after confirmation

3. Should failed transactions allow retry or require manual resubmission?
   - **Decision needed:** Auto-retry net errors 3x; manual retry for validation errors

4. How frequently to reconcile balances?
   - **Decision needed:** Every 5 minutes via scheduled job

---

## Next Steps

1. Use this research to create 3 executable PLAN files
2. Execute plans in order: Gas Estimation → Transaction Submission → Event Listeners
3. Test with MetaMask on testnet before Phase 05
