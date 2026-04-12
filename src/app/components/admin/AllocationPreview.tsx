'use client';

import React from 'react';

interface AllocationPreviewProps {
  recipients: Array<{
    user_id: string;
    percentage: number;
    amount: number;
  }>;
  totalAmount: number;
}

export const AllocationPreview = React.memo<AllocationPreviewProps>(
  ({ recipients, totalAmount }) => {
    const totalAllocated = recipients.reduce((sum, r) => sum + r.amount, 0);
    const difference = Math.abs(totalAllocated - totalAmount);

    return (
      <div className="bg-slate-700/30 rounded-2xl border border-indigo-500/20 p-6 mt-6">
        <h3 className="text-white font-semibold mb-4">Distribution Preview</h3>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Amount</p>
            <p className="text-white text-xl font-bold">${totalAmount.toFixed(2)}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Recipients</p>
            <p className="text-white text-xl font-bold">{recipients.length}</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Allocation</p>
            <p className={`text-xl font-bold ${difference < 0.01 ? 'text-green-400' : 'text-yellow-400'}`}>
              ${totalAllocated.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Recipients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left py-3 px-4 text-slate-300 font-medium">User ID</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Percentage</th>
                <th className="text-right py-3 px-4 text-slate-300 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {recipients.map((r, idx) => (
                <tr key={idx} className="border-b border-white/5 hover:bg-white/2">
                  <td className="py-3 px-4 text-white">{r.user_id}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{r.percentage.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-white font-semibold">${r.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Warning */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <p className="text-yellow-400 text-sm">
            ⚠️ Review carefully before submitting — this action is permanent and cannot be undone.
          </p>
        </div>
      </div>
    );
  }
);

AllocationPreview.displayName = 'AllocationPreview';
