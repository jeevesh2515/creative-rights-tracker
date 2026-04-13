'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchRevenueByDate } from '@/lib/analyticsUtils';
import { SkeletonChart } from './LoadingSkeletons';

interface RevenueTrendChartProps {
  timeRange?: 7 | 14;
}

export const RevenueTrendChart = React.memo<RevenueTrendChartProps>(({ timeRange = 7 }) => {
  const [data, setData] = useState<{ date: string; revenue: number }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const chartData = await fetchRevenueByDate(timeRange);
        if (mounted) {
          setData(chartData);
        }
      } catch (err) {
        console.error('Error loading revenue data:', err);
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
  }, [timeRange]);

  if (isLoading && data.length === 0) {
    return <SkeletonChart />;
  }

  if (error) {
    return (
      <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 flex items-center justify-center h-80">
        <div className="text-center">
          <div className="text-yellow-500 text-2xl mb-2">⚠️</div>
          <p className="text-yellow-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden animate-fadeIn" role="img" aria-label={`Revenue trend chart over the last ${timeRange} days. Line chart showing revenue distribution across dates.`}>
      <h3 className="text-lg font-semibold text-white mb-4">Revenue Trend ({timeRange} Days)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" label={{ value: 'Revenue (ETH)', angle: -90, position: 'insideLeft' }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
            labelStyle={{ color: '#f1f5f9' }}
            formatter={(value: any) => [`${parseFloat(value).toFixed(6)} ETH`, 'Revenue']}
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#6366f1"
            strokeWidth={2}
            dot={{ fill: '#6366f1', r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
});

RevenueTrendChart.displayName = 'RevenueTrendChart';
