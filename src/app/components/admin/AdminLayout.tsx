'use client';

import React from 'react';

interface AdminLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const ADMIN_TABS = [
  { id: 'users', label: 'Users', icon: '👥' },
  { id: 'distributions', label: 'Distributions', icon: '⚡' },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'audit', label: 'Audit Log', icon: '📋' },
  { id: 'health', label: 'Health', icon: '💚' },
] as const;

export const AdminLayout = React.memo<AdminLayoutProps>(
  ({ children, activeTab, onTabChange }) => {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-950 to-slate-900">
        {/* Header */}
        <div className="border-b border-white/10 bg-slate-900/40 backdrop-blur">
          <div className="px-6 py-4 sm:px-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
                <p className="text-slate-400 text-sm mt-1">Manage users, distributions, and access logs</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-white/10 bg-slate-900/20 backdrop-blur sticky top-0 z-40">
          <div className="px-6 py-0 sm:px-8">
            <div className="flex gap-1 overflow-x-auto">
              {ADMIN_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`
                    px-4 py-3 text-sm font-medium whitespace-nowrap
                    border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-indigo-500 text-white bg-gradient-to-r from-indigo-500/10 to-purple-500/10'
                        : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }
                  `}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }
);

AdminLayout.displayName = 'AdminLayout';
