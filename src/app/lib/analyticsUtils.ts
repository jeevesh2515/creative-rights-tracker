import { supabase } from './supabaseClient';
import { formatEther } from 'ethers';

/**
 * Fetch daily revenue aggregates for the last N days
 * Returns array of {date, revenue} for line chart
 */
export async function fetchRevenueByDate(days: number = 7): Promise<{ date: string; revenue: number }[]> {
  try {
    const { data, error } = await supabase
      .from('distributions')
      .select('amount, created_at')
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (error) {
      console.error('Error fetching revenue by date:', error);
      // Return fallback dummy data (last 7 days)
      return generateDummyRevenueData(days);
    }

    // Group by date and sum amounts
    const grouped: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const date = new Date(row.created_at).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + parseFloat(row.amount || 0);
    });

    // Convert to array and sort by date
    const result = Object.entries(grouped)
      .map(([date, revenue]) => ({
        date,
        revenue: parseFloat(Number(revenue).toFixed(6)),
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return result.length > 0 ? result : generateDummyRevenueData(days);
  } catch (error) {
    console.error('Exception in fetchRevenueByDate:', error);
    return generateDummyRevenueData(days);
  }
}

/**
 * Fetch top N recipients by total distributed amount
 * Returns array of {recipient_id, name, total} for pie chart
 */
export async function fetchDistributionByRecipient(
  limit: number = 10
): Promise<{ recipient_id: string; name: string; total: number }[]> {
  try {
    // Query to get top recipients
    const { data, error } = await supabase
      .from('distributions')
      .select('recipient_address, amount');

    if (error) {
      console.error('Error fetching distribution by recipient:', error);
      return [];
    }

    // Group by recipient and sum
    const grouped: Record<string, number> = {};
    (data || []).forEach((row: any) => {
      const recipient = row.recipient_address || 'Unknown';
      grouped[recipient] = (grouped[recipient] || 0) + parseFloat(row.amount || 0);
    });

    // Convert to array, sort by total descending, and take top N
    return Object.entries(grouped)
      .map(([recipient_id, total], index) => ({
        recipient_id,
        name: `Recipient ${index + 1}`,
        total: parseFloat(Number(total).toFixed(6)),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  } catch (error) {
    console.error('Exception in fetchDistributionByRecipient:', error);
    return [];
  }
}

/**
 * Aggregate key metrics for analytics cards
 * Returns {totalDistributed, pending, failed, successRate}
 */
export async function aggregateMetrics(): Promise<{
  totalDistributed: number;
  pending: number;
  failed: number;
  successRate: number;
}> {
  try {
    // Fetch all distributions to aggregate metrics
    const { data, error } = await supabase.from('distributions').select('amount, status');

    if (error) {
      console.error('Error fetching metrics:', error);
      return { totalDistributed: 0, pending: 0, failed: 0, successRate: 0 };
    }

    const distributions = data || [];

    // Calculate metrics
    const totalDistributed = distributions
      .filter((d: any) => d.status === 'confirmed')
      .reduce((sum: number, d: any) => sum + parseFloat(d.amount || 0), 0);

    const pending = distributions.filter((d: any) => d.status === 'pending').length;
    const failed = distributions.filter((d: any) => d.status === 'failed').length;

    const confirmed = distributions.filter((d: any) => d.status === 'confirmed').length;
    const total = distributions.length;
    const successRate = total > 0 ? (confirmed / total) * 100 : 0;

    return {
      totalDistributed: parseFloat(Number(totalDistributed).toFixed(6)),
      pending,
      failed,
      successRate: parseFloat(successRate.toFixed(1)),
    };
  } catch (error) {
    console.error('Exception in aggregateMetrics:', error);
    return { totalDistributed: 0, pending: 0, failed: 0, successRate: 0 };
  }
}

/**
 * Format ETH value with proper decimals and comma separators
 */
export function formatEthValue(value: string | number): string {
  try {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '0 ETH';

    const formatted = parseFloat(num.toFixed(6));
    return `${formatted.toLocaleString()} ETH`;
  } catch (error) {
    console.error('Error formatting ETH value:', error);
    return '0 ETH';
  }
}

/**
 * Generate dummy revenue data for fallback/demo purposes
 */
function generateDummyRevenueData(days: number): { date: string; revenue: number }[] {
  const result = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const revenue = parseFloat((Math.random() * 5).toFixed(6));

    result.push({ date: dateStr, revenue });
  }

  return result;
}
