import React from 'react';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { RevenueSnapshot } from '@/components/dashboard/RevenueSnapshot';
import { ChartsPanel } from '@/components/dashboard/ChartsPanel';

export const metadata = {
  title: 'Dashboard | Creative Rights Tracker',
  description: 'Your revenue dashboard',
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardLayout>
        <RevenueSnapshot />
        <ChartsPanel />
      </DashboardLayout>
    </div>
  );
}
