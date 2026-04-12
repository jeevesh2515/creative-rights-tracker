'use client';

import React, { useState } from 'react';
import { toast } from 'react-hot-toast';

interface TransactionStatusDialogProps {
  isOpen: boolean;
  txHash?: string;
  status?: 'pending' | 'confirming' | 'confirmed' | 'failed';
  errorMessage?: string;
  onClose: () => void;
}

export const TransactionStatusDialog = React.memo<TransactionStatusDialogProps>(
  ({ isOpen, txHash, status, errorMessage, onClose }) => {
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleCopyHash = () => {
      if (txHash) {
        navigator.clipboard.writeText(txHash);
        setCopied(true);
        toast.success('Hash copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
      }
    };

    const truncatedHash = txHash
      ? `${txHash.slice(0, 10)}...${txHash.slice(-8)}`
      : '';

    const statusConfig = {
      pending: {
        icon: '⏳',
        label: 'Awaiting Confirmation',
        color: 'text-yellow-400',
        spinnerColor: 'border-yellow-500',
        bgColor: 'bg-yellow-500/5',
        borderColor: 'border-yellow-500/30',
      },
      confirming: {
        icon: '🔗',
        label: 'Confirming Blocks',
        color: 'text-blue-400',
        spinnerColor: 'border-blue-500',
        bgColor: 'bg-blue-500/5',
        borderColor: 'border-blue-500/30',
      },
      confirmed: {
        icon: '✅',
        label: 'Confirmed!',
        color: 'text-green-400',
        spinnerColor: '',
        bgColor: 'bg-green-500/5',
        borderColor: 'border-green-500/30',
      },
      failed: {
        icon: '❌',
        label: 'Failed',
        color: 'text-red-400',
        spinnerColor: '',
        bgColor: 'bg-red-500/5',
        borderColor: 'border-red-500/30',
      },
    };

    const config = statusConfig[status || 'pending'];

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-slate-800 rounded-lg border border-white/10 p-8 w-96 max-h-96 overflow-y-auto">
          {/* Header */}
          <h2 className="text-white text-xl font-semibold mb-6">Transaction Status</h2>

          {/* Status Badge */}
          <div className={`${config.bgColor} border ${config.borderColor} rounded-lg p-6 mb-6`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{config.icon}</span>
                <span className={`${config.color} font-semibold`}>{config.label}</span>
              </div>
              {(status === 'pending' || status === 'confirming') && (
                <div className={`animate-spin h-5 w-5 border-2 ${config.spinnerColor} border-t-transparent rounded-full`} />
              )}
            </div>

            {status === 'confirming' && (
              <p className="text-slate-300 text-sm">Waiting for block confirmations...</p>
            )}
            {status === 'pending' && (
              <p className="text-slate-300 text-sm">Checking blockchain...</p>
            )}
            {status === 'confirmed' && (
              <p className="text-green-300 text-sm">Distribution completed successfully!</p>
            )}
            {status === 'failed' && (
              <p className="text-red-300 text-sm">{errorMessage}</p>
            )}
          </div>

          {/* Hash Display */}
          {txHash && (
            <div className="mb-6">
              <p className="text-slate-400 text-sm mb-2">Transaction Hash</p>
              <button
                onClick={handleCopyHash}
                className="w-full bg-slate-700/50 hover:bg-slate-700 border border-slate-600 rounded-lg p-3 text-left group transition-colors"
              >
                <p className="text-slate-300 text-sm font-mono">{truncatedHash}</p>
                <p className="text-slate-500 text-xs group-hover:text-slate-400 mt-1">
                  {copied ? '✓ Copied' : 'Click to copy'}
                </p>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            {status === 'confirmed' && (
              <button
                onClick={onClose}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Done
              </button>
            )}
            {status === 'failed' && (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 rounded-lg transition-colors"
                >
                  Close
                </button>
              </>
            )}
            {(status === 'pending' || status === 'confirming') && (
              <button
                disabled
                className="flex-1 bg-slate-700/50 text-slate-400 font-semibold py-2 rounded-lg cursor-not-allowed"
              >
                Processing...
              </button>
            )}
          </div>

          {/* External Link */}
          {txHash && status === 'confirmed' && (
            <a
              href={`https://etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center mt-4 text-indigo-400 hover:text-indigo-300 text-sm underline"
            >
              View on Etherscan ↗
            </a>
          )}
        </div>
      </div>
    );
  }
);

TransactionStatusDialog.displayName = 'TransactionStatusDialog';
