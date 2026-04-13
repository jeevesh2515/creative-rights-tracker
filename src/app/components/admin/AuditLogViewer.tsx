'use client';

import React, { useState, useEffect } from 'react';
import { supabase as supabaseClient } from '@/lib/supabaseClient';
import { useContractEvents } from '@/hooks/useContractEvents';
import toast from 'react-hot-toast';
import { AdminAuditLog } from '@/lib/types';

export const AuditLogViewer = () => {
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const { isListening, lastEvent, error: eventError } = useContractEvents();
  const [actionFilter, setActionFilter] = useState<'all' | string>('all');
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    to: new Date(),
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalLogs, setTotalLogs] = useState(0);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const channel = supabaseClient
      .channel('audit_logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'activity' },
        (payload) => {
          // Add new log to the beginning
          if (currentPage === 1) {
            setLogs((prev) => [payload.new as AdminAuditLog, ...prev.slice(0, pageSize - 1)]);
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [pageSize, currentPage]);

  useEffect(() => {
    fetchLogs();
  }, [dateRange, actionFilter, currentPage]);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      let query = supabaseClient
        .from('activity')
        .select('*', { count: 'exact' })
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }

      const { data, error, count } = await query;

      if (error) throw error;
      setLogs(data as AdminAuditLog[] || []);
      setTotalLogs(count || 0);
    } catch (err) {
      toast.error('Failed to load audit logs');
    } finally {
      setIsLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'distribute_revenue':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'update_allocation':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'create_user':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'delete_user':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'event_revenue_distributed':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'balance_discrepancy':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'manual_reconciliation':
        return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'flex items-center gap-2 text-green-400';
      case 'pending':
        return 'flex items-center gap-2 text-yellow-400';
      case 'failed':
        return 'flex items-center gap-2 text-red-400';
      default:
        return 'flex items-center gap-2 text-slate-400';
    }
  };

  const setQuickDateRange = (days: number) => {
    const to = new Date();
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    setDateRange({ from, to });
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalLogs / pageSize);

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-white/10 overflow-hidden">
      {/* Controls */}
      <div className="bg-slate-700/50 border-b border-white/10 p-4 sm:p-6 space-y-4">
        {/* Header with Event Listener Status */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Audit Log</h3>
            <div className="flex items-center gap-2 text-xs">
              {isListening ? (
                <div className="flex items-center gap-1 text-green-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
                  <span>Real-time enabled</span>
                </div>
              ) : eventError ? (
                <div className="flex items-center gap-1 text-yellow-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500"></span>
                  <span>Web3 unavailable</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-slate-400">
                  <span className="inline-flex h-2 w-2 rounded-full bg-slate-500"></span>
                  <span>Initializing...</span>
                </div>
              )}
            </div>
          </div>

          <div className="text-sm text-slate-400">
            Total: {totalLogs} actions
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <label className="text-sm text-slate-400">Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-900/50 text-white text-sm"
            >
              <option value="all">All Actions</option>
              <option value="distribute_revenue">Distribute Revenue</option>
              <option value="update_allocation">Update Allocation</option>
              <option value="create_user">Create User</option>
              <option value="delete_user">Delete User</option>
              <option value="event_revenue_distributed">Blockchain Event - Revenue Distributed</option>
              <option value="balance_discrepancy">Balance Discrepancy Detected</option>
              <option value="manual_reconciliation">Manual Reconciliation</option>
            </select>
          </div>
        </div>

        {/* Date Range Quick Filters */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setQuickDateRange(1)}
            className="px-3 py-1 rounded text-xs border border-slate-600 text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
          >
            Last 24h
          </button>
          <button
            onClick={() => setQuickDateRange(7)}
            className="px-3 py-1 rounded text-xs border border-slate-600 text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
          >
            Last 7d
          </button>
          <button
            onClick={() => setQuickDateRange(30)}
            className="px-3 py-1 rounded text-xs border border-slate-600 text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
          >
            Last 30d
          </button>
          <div className="text-sm text-slate-400">
            {dateRange.from.toLocaleDateString()} - {dateRange.to.toLocaleDateString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table" aria-label="Audit activity log showing all system actions and user activities">
          <caption className="sr-only">Activity log table with timestamps, administrators, actions, projects, and details</caption>
          <thead>
            <tr className="border-b border-white/10 bg-slate-700/30">
              <th className="text-left p-4 text-white font-semibold">Timestamp</th>
              <th className="text-left p-4 text-white font-semibold">Admin</th>
              <th className="text-left p-4 text-white font-semibold">Action</th>
              <th className="text-left p-4 text-white font-semibold">Project</th>
              <th className="text-left p-4 text-white font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  Loading logs...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-400">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <React.Fragment key={log.id}>
                  <tr className="border-b border-white/5 hover:bg-white/2 transition-colors cursor-pointer" onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}>
                    <td className="p-4 text-slate-300 text-xs font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-white text-sm">{log.admin_id?.slice(0, 8)}...</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs border ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{log.target_project_id?.slice(0, 8) || '-'}</td>
                    <td className="p-4 text-slate-400 text-xs">
                      {expandedLogId === log.id ? '▼ Close' : '▶ View'}
                    </td>
                  </tr>
                  {expandedLogId === log.id && (
                    <tr className="border-b border-white/5 bg-slate-900/30">
                      <td colSpan={5} className="p-4">
                        <div className="space-y-2 text-xs text-slate-300">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-slate-400">Status</p>
                              <p className={getStatusColor(log.status)}>
                                {log.status === 'completed' && '✓'}
                                {log.status === 'pending' && '⏳'}
                                {log.status === 'failed' && '✗'}
                                {log.status}
                              </p>
                            </div>
                            <div>
                              <p className="text-slate-400">User</p>
                              <p className="text-slate-300">{log.admin_id}</p>
                            </div>
                          </div>
                          {log.details && (
                            <div className="mt-3 p-2 bg-slate-800/50 rounded font-mono text-xs text-slate-400 overflow-x-auto">
                              <pre>{JSON.stringify(log.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="border-t border-white/10 bg-slate-700/30 p-4 flex items-center justify-between">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border border-slate-600 text-slate-400 disabled:opacity-50 hover:text-white transition-colors"
        >
          ← Previous
        </button>
        <span className="text-sm text-slate-400">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded border border-slate-600 text-slate-400 disabled:opacity-50 hover:text-white transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
};
