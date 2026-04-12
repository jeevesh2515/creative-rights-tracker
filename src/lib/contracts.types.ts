/**
 * TypeScript Type Definitions for Smart Contract Interactions
 * 
 * These types ensure type safety when calling contract functions
 * and processing events in the React frontend and Node.js backend.
 */

import { ethers, Contract } from 'ethers';

// ============================================================================
// RevenueRights Contract Types
// ============================================================================

/**
 * RightsHolder struct from RevenueRights contract
 */
export interface RightsHolder {
  wallet: string;  // Ethereum address (checksummed)
  name: string;    // Holder display name
  role: string;    // Role description (e.g., "creator", "producer")
  basisPoints: number;  // Percentage of revenue (0-10000)
}

/**
 * RevenueRights contract interface
 */
export interface IRevenueRights extends Contract {
  // View functions
  getRightsHolders(): Promise<RightsHolder[]>;
  getContractBalance(): Promise<bigint>;
  getTotalDistributed(): Promise<bigint>;
  
  // State-changing functions
  distributeRevenue(options?: {
    value: bigint;
    gasLimit?: number;
    gasPrice?: bigint;
  }): Promise<ethers.ContractTransactionResponse>;

  // Events
  on(eventName: 'RevenueDistributed', listener: (sender: string, amount: bigint, timestamp: number) => void): Contract;
  on(eventName: 'HolderPaid', listener: (recipient: string, name: string, role: string, amount: bigint, basisPoints: number) => void): Contract;
  once(eventName: 'RevenueDistributed', listener: (sender: string, amount: bigint, timestamp: number) => void): Contract;
  once(eventName: 'HolderPaid', listener: (recipient: string, name: string, role: string, amount: bigint, basisPoints: number) => void): Contract;
}

/**
 * Event emitted when revenue is distributed
 */
export interface RevenueDistributedEvent {
  sender: string;           // Address that called distributeRevenue()
  totalAmount: bigint;      // Total ETH distributed (wei)
  timestamp: number;        // Block timestamp (Unix seconds)
  transactionHash: string;  // Transaction hash
  blockNumber: number;      // Block number
}

/**
 * Event emitted for each holder paid
 */
export interface HolderPaidEvent {
  recipient: string;        // Rights holder address
  name: string;             // Holder name
  role: string;             // Holder role
  amount: bigint;           // ETH amount paid (wei)
  basisPoints: number;      // Allocation percentage (0-10000)
  transactionHash: string;  // Transaction hash
}

// ============================================================================
// RevenueSplitter Contract Types
// ============================================================================

/**
 * RevenueSplitter contract interface
 */
export interface IRevenueSplitter extends Contract {
  // View functions
  shares(account: string): Promise<bigint>;
  released(account: string): Promise<bigint>;
  totalShares(): Promise<bigint>;
  totalReleased(): Promise<bigint>;
  
  // State-changing functions
  addPayee(account: string, shares: bigint): Promise<ethers.ContractTransactionResponse>;
  release(account: string): Promise<ethers.ContractTransactionResponse>;

  // Fallback
  receive?(): Promise<ethers.ContractTransactionResponse>;

  // Events
  on(eventName: 'PayeeAdded', listener: (account: string, shares: bigint) => void): Contract;
  on(eventName: 'PaymentReleased', listener: (to: string, amount: bigint) => void): Contract;
  on(eventName: 'PaymentReceived', listener: (from: string, amount: bigint) => void): Contract;
}

/**
 * Event emitted when payee is added
 */
export interface PayeeAddedEvent {
  account: string;  // Payee address
  shares: bigint;   // Share allocation
}

/**
 * Event emitted when payment is released to payee
 */
export interface PaymentReleasedEvent {
  to: string;       // Payee address
  amount: bigint;   // ETH amount released (wei)
}

/**
 * Event emitted when contract receives ETH
 */
export interface PaymentReceivedEvent {
  from: string;     // Sender address
  amount: bigint;   // ETH amount received (wei)
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Contract interaction result
 */
export interface ContractCallResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  error?: string;
  gasUsed?: bigint;
}

/**
 * Rights allocation for display
 */
export interface AllocationDisplay {
  id: string;
  wallet: string;
  name: string;
  role: string;
  percentage: number;  // Decimal (e.g., 50.00 for 5000 basis points)
  percentageFormatted: string;  // "50.00%"
}

/**
 * Transaction history item
 */
export interface TransactionHistoryItem {
  id: string;
  timestamp: number;
  transactionHash: string;
  blockNumber: number;
  totalAmount: string;  // Decimal ETH (e.g., "100.50")
  splits: {
    recipientName: string;
    recipientRole: string;
    amount: string;  // Decimal ETH
    percentage: number;
  }[];
}

/**
 * Network configuration
 */
export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  contractAddresses: {
    revenueRights: string;
    revenueSplitter: string;
  };
}

// ============================================================================
// Hook Types (for React hooks)
// ============================================================================

/**
 * Hook for RevenueRights contract interaction
 */
export interface UseRevenueContractReturn {
  contract: IRevenueRights | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Functions
  getRightsHolders(): Promise<RightsHolder[]>;
  getBalance(): Promise<string>;  // Decimal ETH
  getTotalDistributed(): Promise<string>;  // Decimal ETH
  distributeRevenue(amount: string): Promise<ContractCallResult>;
}

/**
 * Hook for RevenueSplitter contract interaction
 */
export interface UseRevenueSplitterReturn {
  contract: IRevenueSplitter | null;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Functions
  getShares(account: string): Promise<string>;
  getReleased(account: string): Promise<string>;
  release(account: string): Promise<ContractCallResult>;
  addPayee(account: string, shares: string): Promise<ContractCallResult>;
}

// ============================================================================
// API Types (for backend/database)
// ============================================================================

/**
 * Transaction record in Supabase
 */
export interface TransactionRecord {
  id: string;
  project_id: string;
  tx_hash: string;
  sender_address: string;
  total_amount: string;  // NUMERIC as string
  block_number: number;
  status: 'pending' | 'confirmed' | 'failed';
  network: string;
  created_at: string;
  confirmed_at?: string;
}

/**
 * Transaction split record in Supabase
 */
export interface TransactionSplitRecord {
  id: string;
  transaction_id: string;
  rights_holder_id?: string;
  wallet_address: string;
  name: string;
  role: string;
  percentage: string;  // NUMERIC as string
  amount_eth: string;  // NUMERIC as string
  created_at: string;
}

export default {};
