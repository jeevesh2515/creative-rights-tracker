'use client';

import { ethers } from 'ethers';

interface GasEstimateResult {
  gasLimit: bigint;
  gasPrice: bigint;
  totalFeeWei: bigint;
  totalFeeEth: string;
}

interface EstimationRecipient {
  user_id: string;
  percentage: number;
}

/**
 * Estimate gas cost for a distribution transaction
 * Returns the estimated gas fee in ETH format
 */
export async function estimateGas(
  recipients: EstimationRecipient[],
  totalAmount: number
): Promise<GasEstimateResult | null> {
  try {
    // Get the provider from window.ethereum
    if (typeof window === 'undefined' || !window.ethereum) {
      console.warn('Web3 not available');
      return null;
    }

    const provider = new ethers.BrowserProvider(window.ethereum);

    // Get current fee data (includes gas price)
    const feeData = await provider.getFeeData();
    const gasPrice = feeData.gasPrice || BigInt(50000000000); // Fallback to 50 gwei

    // For estimation, we'll use a conservative gas limit estimate
    // A typical transfer uses ~21000 gas, plus ~20000 per recipient for additional logic
    const baseGas = BigInt(21000);
    const perRecipientGas = BigInt(20000);
    const gasLimit = baseGas + (BigInt(recipients.length) * perRecipientGas);

    // Calculate total fee
    const totalFeeWei = gasLimit * gasPrice;
    const totalFeeEth = ethers.formatEther(totalFeeWei);

    return {
      gasLimit,
      gasPrice,
      totalFeeWei,
      totalFeeEth,
    };
  } catch (error) {
    console.error('Failed to estimate gas:', error);
    // Return safe default estimate (0.00205 ETH)
    return {
      gasLimit: BigInt(41000), // (21000 + 20000)
      gasPrice: BigInt(50000000000), // 50 gwei
      totalFeeWei: BigInt(2050000000000000), // 0.00205 ETH
      totalFeeEth: '0.00205',
    };
  }
}

/**
 * Format gas price from wei to gwei
 */
export function formatGasPrice(gasPriceWei: bigint): string {
  const gweiValue = Number(ethers.formatUnits(gasPriceWei, 'gwei'));
  return `${Math.round(gweiValue)} gwei`;
}

/**
 * Get current ETH/USD price
 * For now, returns a mock value; in production, would call a price oracle
 */
export async function getEthUsdPrice(): Promise<number> {
  try {
    // In production, call CoinGecko or similar
    // const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
    // const data = await response.json();
    // return data.ethereum.usd;
    
    // Mock price for now
    return 2500;
  } catch (error) {
    console.error('Failed to fetch ETH price:', error);
    return 2500; // Fallback
  }
}

/**
 * Cache for ETH price with 5-minute TTL
 */
let cachedEthPrice: { price: number; timestamp: number } | null = null;

export async function getCachedEthPrice(): Promise<number> {
  const now = Date.now();
  const fiveMinutes = 5 * 60 * 1000;

  if (cachedEthPrice && now - cachedEthPrice.timestamp < fiveMinutes) {
    return cachedEthPrice.price;
  }

  const price = await getEthUsdPrice();
  cachedEthPrice = { price, timestamp: now };
  return price;
}
