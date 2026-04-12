'use client';

import React from 'react';

interface GasFeeSummaryProps {
  estimatedFeeEth: string;
  gasPrice: string;
  isEstimating: boolean;
}

export const GasFeeSummary = React.memo<GasFeeSummaryProps>(
  ({ estimatedFeeEth, gasPrice, isEstimating }) => {
    // Mock ETH/USD conversion for display
    const estimatedFeeUSD = (
      parseFloat(estimatedFeeEth) * 2500
    ).toFixed(2);

    return (
      <div className="bg-slate-700/40 border border-yellow-500/20 rounded-lg p-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-lg">⚡</span>
            <p className="text-slate-300 text-sm font-medium">Estimated Gas Fee</p>
          </div>
          {isEstimating && (
            <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full" />
          )}
        </div>

        <div className="flex items-baseline gap-3 mb-3">
          <p className="text-white text-lg font-semibold">
            {estimatedFeeEth} ETH
          </p>
          <p className="text-slate-400 text-sm">
            (~${estimatedFeeUSD})
          </p>
        </div>

        <div className="flex items-center gap-1 mb-3">
          <span className="text-sm">⏱️</span>
          <p className="text-slate-400 text-xs">
            Gas Price: <span className="text-yellow-300 font-mono">{gasPrice}</span>
          </p>
        </div>

        <div className="p-2 bg-yellow-500/5 border border-yellow-500/10 rounded">
          <p className="text-yellow-500/70 text-xs">
            💡 Gas prices are estimates from the blockchain. Actual fees may vary based on network conditions.
          </p>
        </div>
      </div>
    );
  }
);

GasFeeSummary.displayName = 'GasFeeSummary';
