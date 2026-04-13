'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchDistributionByRecipient } from '@/lib/analyticsUtils';

interface DistributionBreakdownChartProps {
  limit?: number;
}

const COLORS = [
  '#6366f1', '#a855f7', '#ec4899', '#f59e0b',
  '#10b981', '#0ea5e9', '#8b5cf6', '#f97316',
  '#06b6d4', '#84cc16',
];

const SkeletonChart = () => (
  <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 animate-pulse">
    <div className="h-80 bg-slate-700/50 rounded" />
  </div>
);

export const DistributionBreakdownChart = React.memo<DistributionBreakdownChartProps>(({ limit = 10 }) => {
  const [data, setData] = useState<{ recipient_id: string; name: string; total: number; value: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const recipients = await fetchDistributionByRecipient(limit);
        
        if (mounted) {
          const chartData = recipients.map((r, idx) => ({
            ...r,
            value: r.total,
            name: `Recipient ${idx + 1}: ${r.total.toFixed(4)} ETH`,
          }));
          setData(chartData);
          
          if (chartData.length === 0) {
            setError('No distribution data yet');
          }
        }
      } catch (err) {
        console.error('Error loading distribution data:', err);
        if (mounted) {
          setError('Unable to load chart');
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadData();

    // Subscribe to real-time updates
    const interval = setInterval(() => {
      void loadData();
    }, 10000); // Refresh every 10 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [limit]);

  if (isLoading && data.length === 0) {
    return <SkeletonChart />;
  }

  if (error && data.length === 0) {
    return (
      <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-slate-400 text-2xl mb-2">📊</div>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const totalAmount = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden animate-fadeIn" role="img" aria-label={`Recipient distribution breakdown pie chart showing ${data.length} recipients with total of ${totalAmount.toFixed(6)} ETH distributed`}>
      <h3 className="text-lg font-semibold text-white mb-4">Recipient Breakdown</h3>
      {data.length > 0 && (
        <>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="recipient_id"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ percent }) => percent ? `${(percent * 100).toFixed(0)}%` : '0%'}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(value: any) => `${parseFloat(value).toFixed(6)} ETH`}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 p-3 bg-slate-900/40 rounded border border-white/5">
            <p className="text-sm text-slate-400">
              Top {data.length} of recipients • Total: {totalAmount.toFixed(6)} ETH
            </p>
          </div>
        </>
      )}
    </div>
  );
});

DistributionBreakdownChart.displayName = 'DistributionBreakdownChart';
