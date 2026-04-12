'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { exportTransactionsCSV } from '@/lib/reportUtils';
import toast from 'react-hot-toast';

interface Distribution {
  id: string;
  created_at: string;
  recipient_address: string;
  amount: number | string;
  status: string;
  tx_hash?: string;
}

const SkeletonLoader = () => (
  <div className="space-y-3 animate-pulse">
    <div className="h-10 bg-slate-700/50 rounded" />
    <div className="h-4 bg-slate-700/50 rounded w-48" />
  </div>
);

export const TransactionReportPanel = React.memo(() => {
  const [fromDate, setFromDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [toDate, setToDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [transactions, setTransactions] = useState<Distribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const loadTransactions = async (from: string, to: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('distributions')
        .select('id, created_at, recipient_address, amount, status, tx_hash')
        .gte('created_at', new Date(from).toISOString())
        .lte('created_at', new Date(to).toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Failed to load transactions');
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadTransactions(fromDate, toDate);
  }, []);

  const handleDateChange = () => {
    void loadTransactions(fromDate, toDate);
  };

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await exportTransactionsCSV(new Date(fromDate), new Date(toDate));
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
    void loadTransactions(
      date.toISOString().split('T')[0],
      new Date().toISOString().split('T')[0]
    );
  };

  return (
    <div className="p-6 rounded-lg bg-slate-800/40 border border-white/10 overflow-hidden">
      <h3 className="text-lg font-semibold text-white mb-4">Transaction Report</h3>

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

          {/* Preview */}
          <div className="p-3 bg-slate-900/40 rounded border border-white/5">
            <p className="text-sm text-slate-300">
              📊 {transactions.length} transactions found
            </p>
          </div>

          {/* Export buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || transactions.length === 0}
              className="flex-1 px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
            >
              {isExporting ? 'Exporting...' : '⬇️ Export as CSV'}
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

TransactionReportPanel.displayName = 'TransactionReportPanel';
