# Smart Contract Interaction Guide

**Version:** 1.0  
**Last Updated:** April 12, 2026  
**Status:** Foundation verified, production-ready for testing

---

## Quick Start

### For Frontend Developers

```typescript
import { ABIS, CONTRACTS } from '@/contracts/abis';
import { useRevenueContract } from '@/hooks/useRevenueContract';

// Use hook in React component
const { allocateRights, getBalance, holders } = useRevenueContract();

// Call function
const tx = await allocateRights('0x123...', 5000); // 50% shares
```

### For Backend Developers

```javascript
const { ethers } = require('ethers');
const ABIS = require('../src/contracts/abis');

const provider = ethers.getDefaultProvider('http://localhost:8545');
const signer = provider.getSigner();

const contract = new ethers.Contract(
  REVENUE_RIGHTS_ADDRESS,
  ABIS.RevenueRights,
  signer
);

await contract.distributeRevenue({ value: ethers.parseEther('100') });
```

---

## RevenueRights Contract

**Purpose:** Allocate and track revenue rights for creators and contributors  
**Network:** Localhost (testnet: TBD)  
**Status:** Deployed and tested

### Contract Address

```
Testnet: [To be deployed]
Mainnet: [Future]
Dev: 0x[Contract address from Hardhat deploy]
```

### Key Functions

#### allocateRights(address rightsholder, uint256 basisPoints)

Allocate a percentage of revenue to a user.

**Parameters:**
- `rightsholder` (address) — Ethereum address of the user
- `basisPoints` (uint256) — Percentage in basis points (5000 = 50%)

**Returns:** bool

**Access:** onlyOwner

**Emits:** `HolderAllocated(address rightsholder, uint256 basisPoints)`

**Example:**

```javascript
const tx = await contract.allocateRights(
  '0x1234567890123456789012345678901234567890',
  2500  // 25%
);
const receipt = await tx.wait();
console.log(`Allocated in block ${receipt.blockNumber}`);
```

**Error Handling:**

```javascript
try {
  await contract.allocateRights(userAddr, 2500);
} catch (error) {
  if (error.reason === 'Not owner') {
    console.error('Only owner can allocate rights');
  } else if (error.reason === 'Invalid percentage') {
    console.error('Percentage must be 0-10000 basis points');
  } else {
    logger.error('Allocation failed', error);
  }
}
```

#### distributeRevenue()

Execute revenue distribution to all allocated rights holders.

**Parameters:** None - eth sent in transaction

**Returns:** bool

**Access:** onlyOwner

**Emits:** 
- `RevenueDistributed(address sender, uint256 amount, uint256 timestamp)`
- `HolderPaid(address recipient, string name, string role, uint256 amount, uint256 basisPoints)` (N times)

**Example:**

```javascript
const ethAmount = ethers.parseEther('100'); // 100 ETH
const tx = await contract.distributeRevenue({ 
  value: ethAmount,
  gasLimit: 300000
});

const receipt = await tx.wait();
console.log(`Distribution completed. Gas used: ${receipt.gasUsed}`);
```

#### getRightsHolders()

Get the list of all rights holders and their allocations.

**Parameters:** None

**Returns:** RightsHolder[] array with structure:
```solidity
{
  address wallet;
  string name;
  string role;
  uint256 basisPoints;
}
```

**Access:** public

**Example:**

```javascript
const holders = await contract.getRightsHolders();
holders.forEach(holder => {
  console.log(`${holder.name} (${holder.role}): ${holder.basisPoints / 100}%`);
});
```

#### getContractBalance()

Get current ETH balance in contract.

**Returns:** uint256 (wei)

**Example:**

```javascript
const balance = await contract.getContractBalance();
const ethBalance = ethers.formatEther(balance);
console.log(`Contract has ${ethBalance} ETH`);
```

#### getTotalDistributed()

Get cumulative amount distributed to date.

**Returns:** uint256 (wei)

**Example:**

```javascript
const total = await contract.getTotalDistributed();
console.log(`Total distributed: ${ethers.formatEther(total)} ETH`);
```

---

## RevenueSplitter Contract

**Purpose:** Dynamically distribute ETH to payees based on shares  
**Status:** Deployed and tested

### Key Functions

#### addPayee(address account, uint256 shares)

Add a new payee and their share of future distributions.

**Parameters:**
- `account` (address) — Payee address
- `shares` (uint256) — Share count

**Access:** onlyOwner

**Emits:** `PayeeAdded(address account, uint256 shares)`

**Example:**

```javascript
await contract.addPayee('0xPayeeAddress', 1000);
```

#### release(address payable account)

Release payment owed to a payee based on their shares.

**Parameters:**
- `account` (address) — Payee address

**Access:** anyone (payee initiates own release)

**Emits:** `PaymentReleased(address account, uint256 amount)`

**Example:**

```javascript
const tx = await contract.connect(payeeSigner).release(payeeAddress);
```

#### receive()

Contract can receive ETH and will emit `PaymentReceived` event.

**Example:**

```javascript
await owner.sendTransaction({
  to: revenueSplitterAddress,
  value: ethers.parseEther('10')
});
```

---

## Events

### RevenueDistributed

```solidity
event RevenueDistributed(
  address indexed sender,
  uint256 totalAmount,
  uint256 timestamp
);
```

**When:** `distributeRevenue()` completes  
**Use:** Trigger UI updates, log distribution history

### HolderPaid

```solidity
event HolderPaid(
  address indexed recipient,
  string name,
  string role,
  uint256 amount,
  uint256 basisPoints
);
```

**When:** Each holder receives their share  
**Use:** Record individual payouts, update holder totals

---

## Integration Patterns

### Pattern: Get User Balance

```javascript
// Frontend wants to show user's allocation
const userAllocation = await contract.getBalance(userAddress);
console.log(`Your share: ${ethers.formatEther(userAllocation)} ETH`);
```

### Pattern: Distribute Revenue (Admin Dashboard)

```javascript
// Admin clicks "Distribute" button
const tx = await contract
  .connect(adminSigner)
  .distributeRevenue({ 
    value: ethers.parseEther('50'),
    gasLimit: 300000
  });

const receipt = await tx.wait();
if (receipt.status === 1) {
  showNotification('Distribution successful');
} else {
  showNotification('Distribution failed');
}
```

### Pattern: Track Distribution in Real-Time

```javascript
contract.on('RevenueDistributed', (sender, amount, timestamp) => {
  console.log(`New distribution: ${ethers.formatEther(amount)} ETH`);
  
  // Update UI
  refreshTransactionHistory();
  updateDashboard();
});
```

---

## Gas Costs

| Operation | Min Gas | Typical | Max |
|-----------|---------|---------|-----|
| allocateRights() | 35,000 | 85,000 | 150,000 |
| distributeRevenue() (3 holders) | 80,000 | 180,000 | 300,000 |
| getRightsHolders() | 0 (view) | 0 | 0 |

**Recommendation:** Set gasLimit to 300,000 for distributions to account for variable holders.

---

## Error Codes

| Error | Meaning | Recovery |
|-------|---------|----------|
| "Not owner" | Caller is not contract owner | Use owner address |
| "Insufficient balance" | Not enough ETH for distribution | Send more ETH to contract |
| "Invalid address" | Zero address or invalid format | Verify address checksum |
| "No shares" | Account has no allocation | Add payee first |

---

## Testing Contracts

### Local Testing

```bash
# Start Hardhat node
npx hardhat node

# In another terminal, run tests
npx hardhat test
```

### Verify Contract Works

```bash
# Deploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Run seed script
node scripts/seed_demo_data.js

# Verify it worked
node -e "
const { ethers } = require('ethers');
// ... connect and query
"
```

---

## ABI Reference

The contract ABIs are exported from `src/contracts/abis/index.ts`:

```typescript
export const ABIS = {
  RevenueRights: [
    {
      "type": "function",
      "name": "distributeRevenue",
      "inputs": [],
      "outputs": [{"type": "bool"}],
      "stateMutability": "payable"
    },
    // ... other functions
  ],
  RevenueSplitter: [
    // ... RevenueSplitter ABI
  ]
};
```

Use these ABIs when creating contract instances:

```typescript
import { ABIS } from '@/contracts/abis';

const contract = new ethers.Contract(
  address,
  ABIS.RevenueRights,
  signer
);
```

---

## Environment Variables

Required for contract interaction:

```bash
# Contract addresses
NEXT_PUBLIC_REVENUE_RIGHTS_ADDRESS=0x...
NEXT_PUBLIC_REVENUE_SPLITTER_ADDRESS=0x...

# RPC endpoint
NEXT_PUBLIC_RPC_URL=http://localhost:8545

# Network
NEXT_PUBLIC_NETWORK=localhost
```

---

## Common Issues & Solutions

### Issue: "Contract creation without any data"
**Cause:** Invalid contract address or contract not deployed  
**Solution:** Verify contract is deployed and address is correct

### Issue: "Insufficient gas, would revert"
**Cause:** gasLimit too low  
**Solution:** Increase gasLimit to 300,000+ for distributions

### Issue: "Event listener not firing"
**Cause:** Not connected to correct RPC endpoint  
**Solution:** Verify RPC URL and network ID match

### Issue: "Duplicate transaction error"
**Cause:** Attempted to distribution same TX twice  
**Solution:** Check tx hash; if already mined, no need to retry

---

## Support

- **Documentation:** See this guide + contract comments
- **Tests:** test/RevenueRights.test.js and test/RevenueSplitter.test.js
- **Demo:** scripts/demo.js provides working example

---

**Guard:** This guide is the interface contract. Any changes to contract functions must be documented here before deployment.

