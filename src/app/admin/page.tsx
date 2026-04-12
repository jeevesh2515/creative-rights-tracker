'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Role, useAuth, type User } from '@/lib/auth';
import { toast } from 'react-hot-toast';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { DistributionForm } from "@/components/admin/DistributionForm";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { listUsers, setUserRole, inviteUser } = useAuth();
  
  const [users, setUsers] = useState<User[]>([]);
  const [invite, setInvite] = useState({ name: '', email: '', role: 'creator' as Role });
  const [isLoading, setIsLoading] = useState(true);
  const [isInviting, setIsInviting] = useState(false);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role !== 'admin') {
      router.replace('/dashboard');
      return;
    }

    void (async () => {
      try {
        const next = await listUsers();
        setUsers(next);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, router, listUsers]);

  const refresh = async () => {
    const next = await listUsers();
    setUsers(next);
  };

  if (isLoading || !user || user.role !== 'admin') return null;

  return (
    <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === 'users' && (
        <main className="p-8 max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold text-white">User Management</h2>

          <div className="rounded-2xl border border-white/10 bg-slate-800/40 p-4 sm:p-6 space-y-4">
            <h3 className="font-semibold text-white">Invite User</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="px-3 py-2 rounded border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400"
                placeholder="Name"
                value={invite.name}
                onChange={(e) => setInvite({ ...invite, name: e.target.value })}
              />
              <input
                className="px-3 py-2 rounded border border-slate-600 bg-slate-900/50 text-white placeholder-slate-400"
                placeholder="Email"
                value={invite.email}
                onChange={(e) => setInvite({ ...invite, email: e.target.value })}
              />
              <select
                className="px-3 py-2 rounded border border-slate-600 bg-slate-900/50 text-white"
                value={invite.role}
                onChange={(e) => setInvite({ ...invite, role: e.target.value as Role })}
              >
                <option value="admin">admin</option>
                <option value="creator">creator</option>
                <option value="contributor">contributor</option>
              </select>
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium disabled:opacity-50 hover:shadow-lg hover:shadow-indigo-500/50 transition-all"
                disabled={isInviting}
                onClick={() => {
                  void (async () => {
                    const email = invite.email.trim();
                    const name = (invite.name || email.split('@')[0]).trim();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                      toast.error('Please enter a valid email address.');
                      return;
                    }

                    setIsInviting(true);
                    toast.loading('Sending invite...', { id: 'invite' });
                    try {
                      await inviteUser(email, name, invite.role);
                      toast.success(`Invite sent to ${email} as ${invite.role}.`, { id: 'invite' });
                      setInvite({ name: '', email: '', role: 'creator' });
                      await refresh();
                    } catch (e: unknown) {
                      const msg = e instanceof Error ? e.message : 'Failed to send invite';
                      toast.error(msg, { id: 'invite' });
                    } finally {
                      setIsInviting(false);
                    }
                  })();
                }}
              >
                {isInviting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-slate-800/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-700/50">
                  <th className="text-left p-4 text-white font-semibold">Name</th>
                  <th className="text-left p-4 text-white font-semibold">Email</th>
                  <th className="text-left p-4 text-white font-semibold">Role</th>
                  <th className="text-left p-4 text-white font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="p-4 text-white">{u.name}</td>
                    <td className="p-4 text-slate-400">{u.email}</td>
                    <td className="p-4">
                      <span className="px-3 py-1 rounded text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        defaultValue={u.role}
                        onChange={(e) => {
                          void (async () => {
                            await setUserRole(u.id, e.target.value as Role);
                            await refresh();
                          })();
                        }}
                        className="px-2 py-1 rounded border border-slate-600 bg-slate-900/50 text-white text-sm"
                      >
                        <option value="admin">admin</option>
                        <option value="creator">creator</option>
                        <option value="contributor">contributor</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      )}

      {activeTab === 'distributions' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Revenue Distribution</h2>
          <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-8 text-slate-400">
            <DistributionForm />
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Audit Log</h2>
          <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-8 text-slate-400">
            Audit Log Viewer (Coming soon)
          </div>
        </div>
      )}

      {activeTab === 'health' && (
        <div className="p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Health Dashboard</h2>
          <div className="bg-slate-800/40 rounded-2xl border border-white/10 p-8 text-slate-400">
            Health Dashboard (Coming soon)
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
