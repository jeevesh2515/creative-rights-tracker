'use client';

import { ethers } from 'ethers';
import { supabaseAdmin } from '@/lib/supabaseServer';

const BALANCE_TOLERANCE = BigInt(1e15); // 0.001 ETH

interface ReconciliationResult {
  contractBalance: bigint;
  dbBalance: bigint;
  discrepancy: bigint;
  isReconciled: boolean;
  action: string;
}

/**
 * Reconcile contract balance with database balance
 */
export async function reconcileBalance(): Promise<ReconciliationResult> {
  try {
    const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
    if (!rpcUrl) throw new Error('RPC URL not configured');

    const contractAddress = process.env.NEXT_PUBLIC_REVENUE_RIGHTS_ADDRESS;
    if (!contractAddress) throw new Error('Contract address not configured');

    // Fetch contract balance (simulated for MVP)
    // In production: const balance = await contract.getBalance();
    let contractBalance = BigInt(0);
    try {
      const provider = new ethers.JsonRpcProvider(rpcUrl);
      contractBalance = await provider.getBalance(contractAddress);
    } catch (err) {
      console.error('Error fetching contract balance:', err);
      contractBalance = BigInt(0);
    }

    // Fetch database balance from distribution_recipients
    // Sum all amounts that have been distributed
    const { data: dbData, error: dbError } = await supabaseAdmin
      .from('distribution_recipients')
      .select('amount');

    if (dbError) {
      console.error('Error fetching DB balance:', dbError);
      return {
        contractBalance,
        dbBalance: BigInt(0),
        discrepancy: contractBalance,
        isReconciled: false,
        action: 'error_fetching_db',
      };
    }

    const dbBalance = (dbData || []).reduce((sum, row) => sum + BigInt(Math.floor(row.amount * 1e18)), BigInt(0));
    const discrepancy = contractBalance > dbBalance
      ? contractBalance - dbBalance
      : dbBalance - contractBalance;

    const isReconciled = discrepancy <= BALANCE_TOLERANCE;

    return {
      contractBalance,
      dbBalance,
      discrepancy,
      isReconciled,
      action: isReconciled ? 'reconciliation_success' : 'discrepancy_detected',
    };
  } catch (error) {
    console.error('Reconciliation error:', error);
    throw error;
  }
}

/**
 * Format balance in wei to ETH string
 */
export function formatBalance(wei: bigint): string {
  try {
    const eth = ethers.formatEther(wei);
    return eth;
  } catch {
    return '0';
  }
}

/**
 * Get tolerance for balance comparison
 */
export function getBalanceTolerance(): bigint {
  return BALANCE_TOLERANCE;
}
