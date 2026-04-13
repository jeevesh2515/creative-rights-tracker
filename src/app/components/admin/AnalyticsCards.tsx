'use client';

import React, { useState, useEffect } from 'react';
import { aggregateMetrics, formatEthValue } from '@/lib/analyticsUtils';

interface Metrics {
  totalDistributed: number;
  pending: number;
  failed: number;
  successRate: number;
}

const SkeletonCard = () => (
  <div className="p-4 rounded-lg bg-slate-800/40 border-l-4 border-slate-600 animate-pulse">
    <div className="h-6 bg-slate-700/50 rounded w-24 mb-2" />
    <div className="h-8 bg-slate-700/50 rounded w-16 mb-2" />
    <div className="h-4 bg-slate-700/50 rounded w-32" />
  </div>
);

interface KPICard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: string;
  borderColor: string;
  metric: 'total' | 'pending' | 'failed' | 'successRate';
}

export const AnalyticsCards = React.memo(() => {
  const [metrics, setMetrics] = useState<Metrics>({
    totalDistributed: 0,
    pending: 0,
    failed: 0,
    successRate: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadMetrics = async () => {
      try {
        setIsLoading(true);
        const data = await aggregateMetrics();
        if (mounted) {
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error loading metrics:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadMetrics();

    // Subscribe to real-time updates
    const interval = setInterval(() => {
      void loadMetrics();
    }, 10000); // Refresh every 10 seconds

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const cards: KPICard[] = [
    {
      title: 'Total Distributed',
      value: formatEthValue(metrics.totalDistributed),
      subtitle: 'All time',
      icon: '💰',
      borderColor: 'border-blue-500',
      metric: 'total',
    },
    {
      title: 'Pending',
      value: metrics.pending,
      subtitle: 'Awaiting confirmation',
      icon: '⏳',
      borderColor: 'border-yellow-500',
      metric: 'pending',
    },
    {
      title: 'Failed',
      value: metrics.failed,
      subtitle: 'Needs retry',
      icon: '⚠️',
      borderColor: 'border-red-500',
      metric: 'failed',
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate}%`,
      subtitle: 'Confirmed transactions',
      icon: '✓',
      borderColor: 'border-green-500',
      metric: 'successRate',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div
          key={card.title}
          className={`p-4 rounded-lg bg-slate-800/40 border-l-4 ${card.borderColor} hover:bg-slate-800/60 transition-colors`}
          role="img"
          aria-label={`${card.title}: ${card.value}. ${card.subtitle}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-slate-400 mb-1">{card.title}</p>
              <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
              <p className="text-xs text-slate-500">{card.subtitle}</p>
            </div>
            <div className="text-2xl">{card.icon}</div>
          </div>
        </div>
      ))}
    </div>
  );
});

AnalyticsCards.displayName = 'AnalyticsCards';
