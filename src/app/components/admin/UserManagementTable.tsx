'use client';

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface UserWithAllocation {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'creator' | 'contributor';
  allocation_percentage?: number;
  created_at?: string;
}

export const UserManagementTable = () => {
  const [users, setUsers] = useState<UserWithAllocation[]>([]);
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'creator' | 'contributor'>('all');
  const [sortBy, setSortBy] = useState<'email' | 'role' | 'created_at'>('email');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingAllocation, setEditingAllocation] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, roleFilter, sortBy, sortOrder]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const offset = (currentPage - 1) * pageSize;
      const params = new URLSearchParams({
        limit: pageSize.toString(),
        offset: offset.toString(),
        role: roleFilter !== 'all' ? roleFilter : 'all',
      });

      const res = await fetch(`/api/admin/users?${params}`);
      if (!res.ok) throw new Error('Failed to fetch users');

      const data = await res.json();
      setUsers(data.users || []);
      setTotalUsers(data.total || 0);
    } catch (err) {
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAllocationUpdate = async (userId: string, newAllocation: number) => {
    if (newAllocation < 0 || newAllocation > 100) {
      toast.error('Allocation must be between 0 and 100');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allocation_percentage: newAllocation }),
      });

      if (!res.ok) throw new Error('Update failed');

      const updatedUser = await res.json();
      setUsers(users.map((u) => (u.id === userId ? { ...u, allocation_percentage: newAllocation } : u)));
      setEditingUserId(null);
      toast.success('Allocation updated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update allocation');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredUsers = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);
  const totalPages = Math.ceil(totalUsers / pageSize);

  return (
    <div className="bg-slate-800/40 rounded-2xl border border-white/10 overflow-hidden">
      {/* Controls */}
      <div className="bg-slate-700/50 border-b border-white/10 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2">
            <label className="text-sm text-slate-400">Filter by Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3 py-1 rounded border border-slate-600 bg-slate-900/50 text-white text-sm"
            >
              <option value="all">All</option>
              <option value="admin">Admin</option>
              <option value="creator">Creator</option>
              <option value="contributor">Contributor</option>
            </select>
          </div>

          <div className="text-sm text-slate-400">
            Total: {totalUsers} users
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-slate-700/30">
              <th className="text-left p-4 text-white font-semibold">
                <button
                  onClick={() => {
                    setSortBy('email');
                    setSortOrder(sortOrder === 'asc' && sortBy === 'email' ? 'desc' : 'asc');
                  }}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left p-4 text-white font-semibold">
                <button
                  onClick={() => {
                    setSortBy('role');
                    setSortOrder(sortOrder === 'asc' && sortBy === 'role' ? 'desc' : 'asc');
                  }}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Role {sortBy === 'role' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
              <th className="text-left p-4 text-white font-semibold">Allocation %</th>
              <th className="text-left p-4 text-white font-semibold">
                <button
                  onClick={() => {
                    setSortBy('created_at');
                    setSortOrder(sortOrder === 'asc' && sortBy === 'created_at' ? 'desc' : 'asc');
                  }}
                  className="hover:text-indigo-400 transition-colors"
                >
                  Created {sortBy === 'created_at' && (sortOrder === 'asc' ? '↑' : '↓')}
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  Loading users...
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-400">
                  No users found
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                  <td className="p-4 text-white">{user.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">
                    {editingUserId === user.id ? (
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editingAllocation}
                          onChange={(e) => setEditingAllocation(parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 rounded border border-slate-600 bg-slate-900/50 text-white text-sm"
                        />
                        <button
                          onClick={() => handleAllocationUpdate(user.id, editingAllocation)}
                          disabled={isSaving}
                          className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition-colors disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingUserId(null)}
                          className="px-2 py-1 rounded text-xs bg-slate-600/50 text-slate-300 hover:bg-slate-600 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingUserId(user.id);
                          setEditingAllocation(user.allocation_percentage || 0);
                        }}
                        className="text-indigo-400 hover:text-indigo-300 cursor-pointer"
                      >
                        {user.allocation_percentage?.toFixed(1) || '0.0'}%
                      </button>
                    )}
                  </td>
                  <td className="p-4 text-slate-400 text-xs">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
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
