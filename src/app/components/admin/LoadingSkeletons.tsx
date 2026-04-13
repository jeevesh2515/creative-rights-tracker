'use client';

import React from 'react';

/**
 * Skeleton Chart - Placeholder for chart components while loading
 */
export const SkeletonChart = ({ height = 300 }: { height?: number }) => (
  <div 
    className="bg-slate-800/40 rounded-lg animate-pulse border border-white/10 overflow-hidden"
    style={{ height: `${height}px` }}
  />
);

/**
 * Skeleton Card - Placeholder for KPI cards while loading
 */
export const SkeletonCard = () => (
  <div className="h-24 bg-slate-800/40 rounded-lg animate-pulse border border-white/10" />
);

/**
 * Skeleton Table - Placeholder for table rows while loading
 */
export const SkeletonTable = ({ rows = 5 }: { rows?: number }) => (
  <div className="space-y-2">
    {[...Array(rows)].map((_, i) => (
      <div 
        key={i} 
        className="h-12 bg-slate-800/40 rounded animate-pulse border border-white/10"
      />
    ))}
  </div>
);

/**
 * Skeleton Form - Placeholder for form inputs while loading
 */
export const SkeletonForm = () => (
  <div className="space-y-4">
    <div className="h-10 bg-slate-800/40 rounded animate-pulse border border-white/10" />
    <div className="h-10 bg-slate-800/40 rounded animate-pulse border border-white/10" />
    <div className="h-40 bg-slate-800/40 rounded animate-pulse border border-white/10" />
    <div className="h-10 bg-slate-800/40 rounded animate-pulse border border-white/10" />
  </div>
);
