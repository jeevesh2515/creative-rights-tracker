'use client';

import { useEffect, useState } from 'react';
import { estimateGas, formatGasPrice, getCachedEthPrice } from '@/lib/gasUtils';

interface UseGasPriceOptions {
  shouldPoll?: boolean;
  pollIntervalMs?: number;
  recipients?: Array<{ user_id: string; percentage: number }>;
  totalAmount?: number;
}

interface UseGasPriceResult {
  gasPrice: string;
  estimatedFee: string;
  isEstimating: boolean;
  error: string | null;
}

/**
 * Hook that polls gas prices and estimates transaction fees
 * Polls every 10 seconds by default
 */
export function useGasPrice({
  shouldPoll = true,
  pollIntervalMs = 10000,
  recipients = [],
  totalAmount = 0,
}: UseGasPriceOptions = {}): UseGasPriceResult {
  const [gasPrice, setGasPrice] = useState<string>('--');
  const [estimatedFee, setEstimatedFee] = useState<string>('0.0000');
  const [isEstimating, setIsEstimating] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initial fetch and polling
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    async function fetchGasPrice() {
      try {
        setIsEstimating(true);
        setError(null);

        // Only estimate if we have recipients data
        if (recipients.length === 0 || totalAmount === 0) {
          setEstimatedFee('0.0000');
          setGasPrice('--');
          setIsEstimating(false);
          return;
        }

        const estimate = await estimateGas(recipients, totalAmount);

        if (estimate) {
          setGasPrice(formatGasPrice(estimate.gasPrice));
          setEstimatedFee(estimate.totalFeeEth);
          setError(null);
        } else {
          // Use safe defaults if estimation fails
          setGasPrice('50 gwei');
          setEstimatedFee('0.0082');
          setError('Using estimated gas (actual may vary)');
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch gas price';
        setError(errorMsg);
        // Keep last valid estimate visible
        console.error('Gas price fetch error:', err);
      } finally {
        setIsEstimating(false);
      }
    }

    // Fetch immediately on mount
    fetchGasPrice();

    // Set up polling if enabled
    if (shouldPoll) {
      intervalId = setInterval(fetchGasPrice, pollIntervalMs);
    }

    // Cleanup interval on unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [shouldPoll, pollIntervalMs, recipients.length, totalAmount]);

  return {
    gasPrice,
    estimatedFee,
    isEstimating,
    error,
  };
}
