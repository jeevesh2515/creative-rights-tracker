'use client';

import { ethers } from 'ethers';

export interface ParsedTransactionError {
  code: string;
  message: string;
  recoverable: boolean;
}

/**
 * Parse blockchain transaction error into human-readable format
 */
export function parseTransactionError(error: any): ParsedTransactionError {
  console.error('Transaction error details:', error);

  // Extract error code
  const code = error?.code || 'UNKNOWN_ERROR';
  const reason = error?.reason || error?.message || '';

  // Map error codes to messages
  const errorMessages: Record<string, { message: string; recoverable: boolean }> = {
    ACTION_REJECTED: {
      message: 'You rejected the transaction in MetaMask. Please try again.',
      recoverable: true,
    },
    CALL_EXCEPTION: {
      message: `Contract execution failed: ${reason || 'Unknown error'}. Check your inputs and try again.`,
      recoverable: true,
    },
    INSUFFICIENT_DATA: {
      message: 'Network error retrieving data. Please check your connection and retry.',
      recoverable: true,
    },
    NETWORK_ERROR: {
      message: 'Network connectivity issue. Your transaction may still process. Please wait and refresh.',
      recoverable: true,
    },
    TIMEOUT: {
      message: 'Request timed out. Your transaction may still process on the blockchain. Please check back shortly.',
      recoverable: true,
    },
    UNKNOWN_ERROR: {
      message: `An unexpected error occurred: ${reason || 'Please try again'}`,
      recoverable: true,
    },
  };

  const errorInfo = errorMessages[code] || {
    message: `Transaction failed: ${reason || code}`,
    recoverable: false,
  };

  return {
    code,
    message: errorInfo.message,
    recoverable: errorInfo.recoverable,
  };
}

/**
 * Format transaction hash for display
 */
export function formatTxHash(hash: string, length: number = 8): string {
  if (!hash || hash.length < 2 * length) return hash;
  return `${hash.slice(0, length)}...${hash.slice(-length)}`;
}

/**
 * Calculate number of block confirmations
 */
export function calculateConfirmations(
  currentBlockNumber: number,
  txBlockNumber: number | null
): number {
  if (!txBlockNumber) return 0;
  return Math.max(0, currentBlockNumber - txBlockNumber);
}

/**
 * Check if a transaction is confirmed (5+ blocks)
 */
export function isTransactionConfirmed(confirmations: number): boolean {
  return confirmations >= 5;
}
