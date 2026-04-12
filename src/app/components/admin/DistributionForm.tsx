'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { DistributionPayload, Project } from '@/lib/types';
import { AllocationPreview } from './AllocationPreview';

interface Recipient {
  user_id: string;
  percentage: number;
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
        toast.error(error.message || 'Distribution failed');
        return;
      }

      const result = await res.json();
      toast.success(`Distribution created: ${result.txHash?.slice(0, 10)}...`);
      
      // Reset form
      setRecipients([{ user_id: '', percentage: 0 }]);
      setTotalAmount(0);
      setSelectedProject('');
      setShowPreview(false);
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
    <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400"
          >
            <option value="">Select a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {validationErrors.project && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.project}</p>
          )}
        </div>

        {/* Total Amount */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">Total Amount ($)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={totalAmount}
            onChange={(e) => setTotalAmount(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400"
            placeholder="0.00"
          />
          {validationErrors.amount && (
            <p className="text-red-400 text-sm mt-1">{validationErrors.amount}</p>
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
                    value={recipient.user_id}
                    onChange={(e) => handleRecipientChange(idx, 'user_id', e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400 text-sm"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={recipient.percentage}
                    onChange={(e) => handleRecipientChange(idx, 'percentage', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400 text-sm"
                    placeholder="0"
                  />
                  <p className="text-xs text-slate-400 mt-1">%</p>
                </div>
                {recipients.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(idx)}
                    className="px-3 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors text-sm"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleAddRecipient}
            className="mt-3 text-sm text-indigo-400 hover:text-indigo-300"
          >
            + Add Recipient
          </button>
          {validationErrors.percentages && (
            <p className="text-red-400 text-sm mt-2">{validationErrors.percentages}</p>
          )}
          {validationErrors.recipientIds && (
            <p className="text-red-400 text-sm mt-2">{validationErrors.recipientIds}</p>
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
            disabled={!validate() || selectedProject === ''}
            className="flex-1 px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 font-medium disabled:opacity-50 hover:bg-indigo-500/10 transition-colors"
          >
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !validate()}
            className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Distribution'}
          </button>
        </div>
      </form>
    </div>
  );
};
