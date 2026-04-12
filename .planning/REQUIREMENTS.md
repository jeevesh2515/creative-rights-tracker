# Creative Rights Tracker - Scoped Requirements

**Version:** 1.0 | **Milestone:** 1 | **Status:** Active  

---

## Requirement Scoping

This document defines what WILL be built in the initial milestone vs. what is deferred.

### In Scope (MVP)

#### Dashboard & User Interface

**REQ-101: User Dashboard**
- Display personalized revenue dashboard for logged-in users
- Show total earnings across all projects (top cards)
- Display project-level breakdown with earnings per project
- Show latest transactions (last 10-20)
- Filter by date range, project, revenue source
- Real-time updates when transactions are processed

**REQ-102: Admin Dashboard**
- Extended view showing all users' data (with audit trail)
- Revenue distribution panel with approve/reject flows
- Transaction management (pending, completed, failed)
- User management and role assignment
- System health indicators

**REQ-103: UI/UX Standards**
- Responsive design (mobile + desktop)
- Consistent Tailwind styling across all pages
- Loading states and error boundaries
- Accessible color scheme and typography
- Dark/light mode support (if resources allow)

#### Analytics & Reporting

**REQ-201: Dashboards & Visualizations**
- Line graph: Revenue trends over time (monthly/quarterly)
- Pie/donut charts: Revenue distribution by project
- Table: Transaction history with search/filter
- Summary cards: Total earned, active projects, pending transactions

**REQ-202: Reports**
- Generate PDF report with project summary (earnings, transactions, dates)
- Export transaction history as CSV
- Monthly statement-like report per user
- Admin consolidated report (all users)

#### Transactions & Web3

**REQ-301: Transaction Processing**
- Display transaction status (pending, confirmed, failed)
- Show transaction hash when available
- Display gas fees and net amount
- Transaction timestamp and block confirmation

**REQ-302: Local Wallet Integration**
- Support MetaMask/browser wallet for development
- Allow admin to sign and send transactions
- Validate gas estimates before sending
- Handle transaction errors gracefully

#### Authentication & Access Control

**REQ-401: User Authentication**
- Signup/login with Supabase
- 2FA support for admin accounts
- Role-based access (user vs. admin vs. super admin)
- Session management and logout

**REQ-402: Authorization**
- Users see only their own data
- Admins see all user data
- Admins can process distributions
- Audit logs for all actions

#### Data & Integration

**REQ-501: Data Sync**
- Real-time blockchain balance sync
- Contract state reflects in dashboard immediately
- Transaction confirmations update in real-time
- Database stays consistent with blockchain state

**REQ-502: Smart Contract Integration**
- Read from RevenueRights.sol (user rights/allocations)
- Read from RevenueSplitter.sol (distribution logic)
- Execute distribution transactions
- Listen to contract events (revenue received, distributed, etc.)

---

### Out of Scope (Deferred)

**Future Phases:**
- Meta wallet native mobile app
- Offline mode / PWA
- Advanced analytics (ML-based insights)
- Governance/voting for rights holders
- Multi-chain support (currently Ethereum/testnet only)
- Mobile app (iOS/Android)
- White-label deployment

**Post-MVP:**
- Real Meta wallet integration (currently using browser wallets)
- Production blockchain deployment
- Insurance/arbitration layer
- Royalty splits engine (auto-distribution rules)

---

## User Stories

### As a Creative Professional

1. "I want to log in and see how much I've earned from my projects"
   - **Acceptance:** Dashboard shows accurate earnings breakdown, updates in real-time
   
2. "I want to download my earnings report for tax purposes"
   - **Acceptance:** CSV/PDF export available, includes all transactions for selected period

3. "I want to see a history of all transactions related to my work"
   - **Acceptance:** Sortable/filterable transaction table with date, amount, status, hash

4. "I want to know when my earned revenue is in my wallet"
   - **Acceptance:** Real-time status indicator, blockchain confirmation count shown

### As an Admin

1. "I want to view all users' earnings and allocate distribution based on their rights"
   - **Acceptance:** Admin dashboard shows all users, can select and process distribution

2. "I want to process multiple revenue distributions in one operation"
   - **Acceptance:** Batch distribution UI, gas calculation, approval flow

3. "I want to track transaction success/failure"
   - **Acceptance:** Transaction list shows status, error messages, hash, can retry failed ones

4. "I want audit logs of who did what"
   - **Acceptance:** All admin actions logged with timestamp, user, action type, result

---

## Technical Requirements

**REQ-T01: Performance**
- Dashboard loads in <2 seconds
- Transactions update within 5 seconds of confirmation
- No memory leaks on sustained use

**REQ-T02: Reliability**
- Graceful error handling (network, contract calls, wallet issues)
- State consistency between DB and blockchain
- Transaction retry logic for failed operations

**REQ-T03: Security**
- All user inputs validated server-side
- Private keys never exposed to browser
- Rate limiting on API endpoints
- CSRF protection on form submissions
- 2FA enforcement for admin actions

**REQ-T04: Code Quality**
- TypeScript for type safety
- Unit tests for critical paths
- Component tests for UI elements
- Contract tests with Hardhat

---

## Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Dashboard load time | <2s | Lighthouse audit |
| Transaction sync latency | <5s | Manual testing |
| Test coverage | >80% (critical paths) | Jest/Hardhat reports |
| User error rate | <5% (task completion) | UAT feedback |
| Availability | >99% uptime | Monitoring |
| Accessibility (WCAG) | AA standard | Axe audit |

---

## Dependencies & Risks

**Dependencies:**
- Supabase availability for authentication
- Testnet RPC provider (Infura/Alchemy)
- MetaMask for transaction signing in dev

**Risks:**
- Smart contract bugs affecting distribution
- Wallet integration complexity
- Real-time sync delays
- Users unfamiliar with crypto (UX mitigation needed)

---

## Compliance & Governance

- Align with Moonstone company data privacy policy
- Log audit trail for regulatory compliance
- Document all smart contract interactions
- User terms of service for revenue sharing
