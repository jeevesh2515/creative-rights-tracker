'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { exportDistributionPDF, formatEthValue } from '@/lib/reportUtils';
import toast from 'react-hot-toast';

interface Distribution {
  id: string;
  created_at: string;
  recipient_address: string;
  amount: number | string;
  status: string;
}

interface Summary {
  totalAmount: number;
  recipientCount: number;
  distributionCount: number;
}

const SkeletonLoader = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-10 bg-slate-700/50 rounded" />
    <div className="h-20 bg-slate-700/50 rounded" />
  </div>
);

export const DistributionReportPanel = React.memo(() => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [distributions, setDistributions] = useState<Distribution[]>([]);
  const [summary, setSummary] = useState<Summary>({
    totalAmount: 0,
    recipientCount: 0,
    distributionCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadDistributions = async (from: string, to: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('distributions')
        .select('id, created_at, recipient_address, amount, status')
        .gte('created_at', new Date(from).toISOString())
        .lte('created_at', new Date(to).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const dists = data || [];
      setDistributions(dists);

      // Calculate summary
      const totalAmount = dists.reduce((sum: number, d: any) => {
        return sum + parseFloat(d.amount || 0);
      }, 0);

      const recipientCount = new Set(dists.map((d: any) => d.recipient_address)).size;

      setSummary({
        totalAmount: parseFloat(totalAmount.toFixed(6)),
        recipientCount,
        distributionCount: dists.length,
      });
    } catch (error) {
      console.error('Error loading distributions:', error);
      toast.error('Failed to load distributions');
      setDistributions([]);
      setSummary({ totalAmount: 0, recipientCount: 0, distributionCount: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDistributions(fromDate, toDate);
  }, []);

  const handleDateChange = () => {
    void loadDistributions(fromDate, toDate);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportDistributionPDF(new Date(fromDate), new Date(toDate));
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleClear = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setFromDate(date.toISOString().split('T')[0]);
    setToDate(new Date().toISOString().split('T')[0]);
    void loadDistributions(
      date.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
  };

  return (
    <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden">
      <h3 className="text-lg font-semibold text-white mb-4">Distribution Report</h3>

      {isLoading ? (
        <SkeletonLoader />
      ) : (
        <div className="space-y-4">
          {/* Date Range Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">From Date</label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900/50 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">To Date</label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-600 bg-slate-900/50 text-white"
              />
            </div>
          </div>

          {/* Update button */}
          <button
            onClick={handleDateChange}
            className="w-full px-4 py-2 rounded text-sm bg-slate-700 hover:bg-slate-600 text-white transition-colors"
          >
            Update Range
          </button>

          {/* Summary Preview */}
          <div className="p-4 bg-slate-900/40 rounded border border-white/5 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Total Amount:</span>
              <span className="text-sm font-semibold text-white">{formatEthValue(summary.totalAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Recipients:</span>
              <span className="text-sm font-semibold text-white">{summary.recipientCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-slate-400">Distributions:</span>
              <span className="text-sm font-semibold text-white">{summary.distributionCount}</span>
            </div>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || distributions.length === 0}
              className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
            >
              {isExporting ? '⏳ Generating...' : '⬇️ Export as PDF'}
            </button>
            <button
              onClick={handleClear}
              className="flex-1 px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors"
            >
              🔄 Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

DistributionReportPanel.displayName = 'DistributionReportPanel';
