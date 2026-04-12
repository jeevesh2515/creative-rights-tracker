'use client';

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

interface ContractEvent {
  sender: string;
  amount: bigint;
  timestamp: number;
}

interface UseContractEventsResult {
  isListening: boolean;
  lastEvent?: ContractEvent;
  error?: string;
}

const REVENUE_RIGHTS_ABI = [
  'event RevenueDistributed(address indexed sender, uint256 totalAmount, uint256 timestamp)',
];

export function useContractEvents(): UseContractEventsResult {
  const [isListening, setIsListening] = useState(false);
  const [lastEvent, setLastEvent] = useState<ContractEvent | undefined>(undefined);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    const setupListener = async () => {
      try {
        if (typeof window === 'undefined' || !window.ethereum) {
          setError('Web3 provider not available');
          return;
        }

        const provider = new ethers.BrowserProvider(window.ethereum);
        const contractAddress = process.env.NEXT_PUBLIC_REVENUE_RIGHTS_ADDRESS;

        if (!contractAddress) {
          setError('Contract address not configured');
          return;
        }

        const contract = new ethers.Contract(contractAddress, REVENUE_RIGHTS_ABI, provider);

        setIsListening(true);

        // Set up event listener
        const handleRevenueDistributed = async (sender: string, totalAmount: bigint, timestamp: bigint, event: any) => {
          if (!isMounted) return;

          const eventData: ContractEvent = {
            sender,
            amount: totalAmount,
            timestamp: Number(timestamp),
          };

          setLastEvent(eventData);

          // Sync event to database via API
          try {
            await fetch('/api/admin/sync-event', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                eventName: 'RevenueDistributed',
                sender,
                totalAmount: totalAmount.toString(),
                timestamp: Number(timestamp),
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
              }),
            });
          } catch (syncError) {
            console.error('Failed to sync event to database:', syncError);
          }
        };

        contract.on('RevenueDistributed', handleRevenueDistributed);

        // Cleanup on unmount
        return () => {
          contract.off('RevenueDistributed', handleRevenueDistributed);
        };
      } catch (err) {
        if (isMounted) {
          const errorMsg = err instanceof Error ? err.message : 'Unknown error setting up listener';
          setError(errorMsg);
          console.error('Contract event listener error:', err);
        }
      }
    };

    setupListener();

    return () => {
      isMounted = false;
    };
  }, []);

  return {
    isListening,
    lastEvent,
    error,
  };
}
