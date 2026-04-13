'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { DistributionPayload, Project } from '@/lib/types';
import { AllocationPreview } from './AllocationPreview';
import { TransactionStatusDialog } from './TransactionStatusDialog';
import { parseTransactionError } from '@/lib/transactionUtils';

interface Recipient {
  user_id: string;
  percentage: number;
}

interface TransactionState {
  isOpen: boolean;
  distributionId?: string;
  txHash?: string;
  status?: 'pending' | 'confirming' | 'confirmed' | 'failed';
  error?: string;
}

export const DistributionForm = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([{ user_id: '', percentage: 0 }]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [transactionState, setTransactionState] = useState<TransactionState>({
    isOpen: false,
  });
  const [pollingActive, setPollingActive] = useState(false);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetch('/api/projects');
        if (!res.ok) throw new Error('Failed to fetch projects');
        const data = await res.json();
        setProjects(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        toast.error('Failed to load projects');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, []);

  // Poll for transaction confirmation
  useEffect(() => {
    if (!pollingActive || !transactionState.distributionId) return;

    const pollInterval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/admin/distributions/${transactionState.distributionId}`
        );
        if (!res.ok) return;

        const data = await res.json();

        if (data.status === 'confirmed') {
          setTransactionState((prev) => ({
            ...prev,
            status: 'confirmed',
          }));
          setPollingActive(false);
          toast.success('Transaction confirmed on blockchain!');
        } else if (data.confirmations && data.confirmations > 0) {
          setTransactionState((prev) => ({
            ...prev,
            status: 'confirming',
          }));
        }
      } catch (err) {
        console.error('Polling error:', err);
        // Continue polling even on error
      }
    }, 10000); // Poll every 10 seconds

    // Stop polling after 5 minutes
    const timeoutId = setTimeout(() => {
      setPollingActive(false);
      toast.error('Transaction confirmation timed out. Check Etherscan for status.');
    }, 5 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [pollingActive, transactionState.distributionId]);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!selectedProject) errors.project = 'Please select a project';
    if (totalAmount <= 0) errors.amount = 'Amount must be greater than 0';
    if (recipients.length === 0) errors.recipients = 'At least one recipient required';

    // Check percentage sum (with 0.1% tolerance for floating point)
    const percentSum = recipients.reduce((sum, r) => sum + r.percentage, 0);
    if (Math.abs(percentSum - 100) > 0.1) {
      errors.percentages = `Percentages must sum to 100% (currently ${percentSum.toFixed(1)}%)`;
    }

    // Check all recipients have user_id
    if (recipients.some((r) => !r.user_id)) {
      errors.recipientIds = 'All recipients must have a user selected';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddRecipient = () => {
    setRecipients([...recipients, { user_id: '', percentage: 0 }]);
  };

  const handleRemoveRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const handleRecipientChange = (index: number, field: keyof Recipient, value: any) => {
    const updated = [...recipients];
    updated[index] = { ...updated[index], [field]: value };
    setRecipients(updated);
    validate();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;
    if (!user) {
      toast.error('Not authenticated');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: DistributionPayload = {
        project_id: selectedProject,
        recipients: recipients.map((r) => ({
          user_id: r.user_id,
          percentage: r.percentage,
          amount: (totalAmount * r.percentage) / 100,
        })),
        total_amount: totalAmount,
        initiated_by: user.id,
        timestamp: new Date().toISOString(),
      };

      const res = await fetch('/api/admin/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        const parsedError = parseTransactionError(error);
        toast.error(parsedError.message || 'Distribution failed');
        return;
      }

      const result = await res.json();

      // Show transaction status dialog
      setTransactionState({
        isOpen: true,
        distributionId: result.distributionId,
        txHash: result.txHash,
        status: 'pending',
      });

      // Start polling for confirmation
      setPollingActive(true);

      // Reset form
      setRecipients([{ user_id: '', percentage: 0 }]);
      setTotalAmount(0);
      setSelectedProject('');
      setShowPreview(false);

      toast.success('Distribution submitted! Waiting for blockchain confirmation...');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-8 text-slate-400">
        Loading projects...
      </div>
    );
  }

  return (
    <>
      <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-6 sm:p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Project Selection */}
          <div>
            <label htmlFor="project-select" className="block text-sm font-medium text-white mb-2">Project</label>
            <select
              id="project-select"
              aria-label="Select a project for revenue distribution"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400 disabled:opacity-50 min-h-[44px]"
            >
              <option value="">Select a project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {validationErrors.project && (
              <p className="text-red-400 text-sm mt-1" role="alert">{validationErrors.project}</p>
            )}
          </div>

          {/* Total Amount */}
          <div>
            <label htmlFor="total-amount" className="block text-sm font-medium text-white mb-2">Total Amount ($)</label>
            <input
              id="total-amount"
              type="number"
              step="0.01"
              min="0"
              aria-label="Enter total amount for distribution"
              value={totalAmount}
              onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400 disabled:opacity-50 min-h-[44px]"
              placeholder="0.00"
            />
            {validationErrors.amount && (
              <p className="text-red-400 text-sm mt-1" role="alert">{validationErrors.amount}</p>
            )}
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Recipients</label>
            <div className="space-y-3">
              {recipients.map((recipient, idx) => (
                <div key={idx} className="flex gap-3 items-end">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="User ID or Email"
                      aria-label={`Recipient ${idx + 1} user ID or email`}
                      value={recipient.user_id}
                      onChange={(e) => handleRecipientChange(idx, 'user_id', e.target.value)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400 text-sm disabled:opacity-50 min-h-[44px]"
                    />
                  </div>
                  <div className="w-24">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      aria-label={`Recipient ${idx + 1} percentage`}
                      value={recipient.percentage}
                      onChange={(e) => handleRecipientChange(idx, 'percentage', parseFloat(e.target.value) || 0)}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400 text-sm disabled:opacity-50 min-h-[44px]"
                      placeholder="0"
                    />
                    <p className="text-xs text-slate-400 mt-1">%</p>
                  </div>
                  {recipients.length > 1 && (
                    <button
                      type="button"
                      aria-label={`Remove recipient ${idx + 1}`}
                      onClick={() => handleRemoveRecipient(idx)}
                      disabled={isSubmitting}
                      className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm disabled:opacity-50 min-h-[44px]"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              aria-label="Add another recipient"
              onClick={handleAddRecipient}
              disabled={isSubmitting}
              className="mt-3 text-sm text-indigo-400 hover:text-indigo-300 disabled:text-slate-500"
            >
              + Add Recipient
            </button>
            {validationErrors.percentages && (
              <p className="text-red-400 text-sm mt-2" role="alert">{validationErrors.percentages}</p>
            )}
            {validationErrors.recipientIds && (
              <p className="text-red-400 text-sm mt-2" role="alert">{validationErrors.recipientIds}</p>
            )}
          </div>

          {/* Preview */}
          {showPreview && validate() && (
            <AllocationPreview
              recipients={recipients.map((r) => ({
                user_id: r.user_id,
                percentage: r.percentage,
                amount: (totalAmount * r.percentage) / 100,
              }))}
              totalAmount={totalAmount}
            />
          )}

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                if (validate()) {
                  setShowPreview(!showPreview);
                }
              }}
              disabled={!validate() || selectedProject === '' || isSubmitting}
              className="flex-1 px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 font-medium disabled:opacity-50 hover:bg-indigo-500/10 transition-colors min-h-[44px] flex items-center justify-center"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !validate()}
              className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/50 transition-all min-h-[44px] flex items-center justify-center"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Distribution'}
            </button>
          </div>
        </form>
      </div>

      {/* Transaction Status Dialog */}
      <TransactionStatusDialog
        isOpen={transactionState.isOpen}
        txHash={transactionState.txHash}
        status={transactionState.status}
        errorMessage={transactionState.error}
        onClose={() => {
          setTransactionState({ isOpen: false });
          setPollingActive(false);
        }}
      />
    </>
  );
};
