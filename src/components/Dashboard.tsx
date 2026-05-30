import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { User, DashboardStats, ApiUsageLog, AIModel } from '../types/database';
import { getAdminStats, getAllUsers, createUser, updateUser, deleteUser, regenerateApiKey, getModels, sendMessage } from '../lib/api';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Plus,
  RefreshCw,
  Trash2,
  Edit2,
  Copy,
  Check,
  Eye,
  EyeOff,
  Search,
  Key,
  Activity,
  MessageSquare,
  Zap,
  X,
  Save
} from 'lucide-react';

type Tab = 'dashboard' | 'users' | 'chat' | 'settings';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [recentActivity, setRecentActivity] = useState<ApiUsageLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
      loadModels();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [statsResult, usersResult] = await Promise.all([getAdminStats(), getAllUsers()]);
      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
        setRecentActivity(statsResult.recent_activity || []);
      }
      if (usersResult.success && usersResult.users) setUsers(usersResult.users);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = async () => {
    const result = await getModels();
    if (result.success && result.models) setModels(result.models);
    // Background: fetch with status check
    getModels('?status=true').then(r => { if (r.success && r.models) setModels(r.models); });
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateUser = async (userData: { email: string; username: string; password: string; role: string }) => {
    const result = await createUser(userData.email, userData.username, userData.password, userData.role);
    if (result.success) { setShowCreateModal(false); loadDashboardData(); }
    return result;
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User> & { password?: string }) => {
    const result = await updateUser(userId, updates);
    if (result.success) { setShowEditModal(false); setSelectedUser(null); loadDashboardData(); }
    return result;
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    const result = await deleteUser(userId);
    if (result.success) loadDashboardData();
  };

  const handleRegenerateKey = async (userId: string) => {
    const result = await regenerateApiKey(userId);
    if (result.success) loadDashboardData();
    return result;
  };

  const filteredUsers = users.filter(u =>
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sidebarItems = [
    { id: 'dashboard' as Tab, icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'users' as Tab, icon: Users, label: 'Users' },
    { id: 'chat' as Tab, icon: MessageSquare, label: 'Chat API' },
    { id: 'settings' as Tab, icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-30
        w-64 bg-slate-800 border-r border-slate-700 flex flex-col
        transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        <div className="p-5 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-sm">KuroCodex</h1>
                <p className="text-xs text-gray-400">Admin Panel</p>
              </div>
            </div>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition ${
                activeTab === item.id ? 'bg-cyan-600/20 text-cyan-400' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <button onClick={logout} className="text-gray-400 hover:text-red-400 transition" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto min-w-0">
        {/* Mobile topbar */}
        <div className="md:hidden flex items-center gap-3 px-4 py-3 bg-slate-800 border-b border-slate-700 sticky top-0 z-10">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-400 hover:text-white">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-bold text-sm">KuroCodex</span>
          </div>
          <div className="flex-1" />
          <span className="text-xs text-cyan-400 font-medium capitalize">{activeTab}</span>
        </div>

        {activeTab === 'dashboard' && <DashboardTab stats={stats} recentActivity={recentActivity} isLoading={isLoading} models={models} />}
        {activeTab === 'users' && (
          <UsersTab
            users={filteredUsers} isLoading={isLoading} searchQuery={searchQuery}
            setSearchQuery={setSearchQuery} onRefresh={loadDashboardData}
            onCreateUser={() => setShowCreateModal(true)}
            onEditUser={(u) => { setSelectedUser(u); setShowEditModal(true); }}
            onDeleteUser={handleDeleteUser} onRegenerateKey={handleRegenerateKey}
            onCopy={copyToClipboard} copiedId={copiedId}
          />
        )}
        {activeTab === 'chat' && <ChatTab models={models} />}
        {activeTab === 'settings' && <SettingsTab user={user} onLogout={logout} />}
      </main>

      {showCreateModal && <CreateUserModal onClose={() => setShowCreateModal(false)} onSubmit={handleCreateUser} />}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => { setShowEditModal(false); setSelectedUser(null); }}
          onSubmit={(updates) => handleUpdateUser(selectedUser.id, updates)}
        />
      )}
    </div>
  );
}

function DashboardTab({ stats, recentActivity, isLoading, models }: {
  stats: DashboardStats | null; recentActivity: ApiUsageLog[]; isLoading: boolean; models: AIModel[];
}) {
  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'from-cyan-500 to-blue-600' },
    { label: 'Active Users', value: stats?.active_users || 0, icon: Activity, color: 'from-green-500 to-emerald-600' },
    { label: 'Total Requests', value: stats?.total_requests || 0, icon: BarChart3, color: 'from-purple-500 to-violet-600' },
    { label: 'Total Tokens', value: stats?.total_tokens || 0, icon: Zap, color: 'from-orange-500 to-red-600' },
  ];

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Dashboard Overview</h2>
        <p className="text-gray-400 text-sm">Monitor your KuroCodex API usage and users</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid - 2 cols on mobile */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-5">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-slate-800 border border-slate-700 rounded-xl p-3 md:p-5">
                <div className={`w-8 h-8 md:w-11 md:h-11 rounded-lg md:rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-2 md:mb-3`}>
                  <stat.icon className="w-4 h-4 md:w-5 md:h-5 text-white" />
                </div>
                <p className="text-gray-400 text-xs mb-0.5">{stat.label}</p>
                <p className="text-xl md:text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Models - 2 cols on mobile */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6 mb-5">
            <h3 className="text-base md:text-xl font-bold text-white mb-3">Available AI Models</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
              {models.map((model, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-2.5 md:p-4 border border-slate-600">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-white font-semibold text-xs md:text-sm">{model.name.toUpperCase()}</p>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      (model as any).status === 'active' ? 'bg-green-400' :
                      (model as any).status === 'down'   ? 'bg-red-400' :
                      'bg-yellow-400 animate-pulse'
                    }`} title={(model as any).status || 'checking...'} />
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">{model.id}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">FREE</span>
                    {(model as any).status && (
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        (model as any).status === 'active' ? 'bg-green-500/10 text-green-400' :
                        (model as any).status === 'down'   ? 'bg-red-500/10 text-red-400' :
                        'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {(model as any).status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6">
            <h3 className="text-base md:text-xl font-bold text-white mb-3">Recent API Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-2">
                {recentActivity.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-2.5 md:p-3 bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-white text-xs md:text-sm">{log.model.split('/')[1] || log.model}</p>
                        <p className="text-xs text-gray-400">{new Date(log.request_time).toLocaleString('id-ID')}</p>
                      </div>
                    </div>
                    <p className="text-cyan-400 font-mono text-xs md:text-sm">{log.tokens_used} tokens</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8 text-sm">Belum ada aktivitas API</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function UsersTab({ users, isLoading, searchQuery, setSearchQuery, onRefresh, onCreateUser, onEditUser, onDeleteUser, onRegenerateKey, onCopy, copiedId }: {
  users: User[]; isLoading: boolean; searchQuery: string; setSearchQuery: (q: string) => void;
  onRefresh: () => void; onCreateUser: () => void; onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void; onRegenerateKey: (userId: string) => Promise<any>;
  onCopy: (text: string, id: string) => void; copiedId: string | null;
}) {
  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl md:text-3xl font-bold text-white mb-1">User Management</h2>
          <p className="text-gray-400 text-xs md:text-sm">Manage API users and access</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-white transition">
            <RefreshCw className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          <button
            onClick={onCreateUser}
            className="flex items-center gap-1.5 px-3 py-2 md:px-4 md:py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 pl-10 pr-4 text-white text-sm placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px]">
              <thead className="bg-slate-700/50">
                <tr>
                  <th className="text-left p-3 text-gray-400 font-medium text-xs">User</th>
                  <th className="text-left p-3 text-gray-400 font-medium text-xs">API Key</th>
                  <th className="text-left p-3 text-gray-400 font-medium text-xs">Role</th>
                  <th className="text-left p-3 text-gray-400 font-medium text-xs">Status</th>
                  <th className="text-left p-3 text-gray-400 font-medium text-xs">Usage</th>
                  <th className="text-right p-3 text-gray-400 font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                          {u.username[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{u.username}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[100px]">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs text-gray-400 bg-slate-700 px-2 py-1 rounded font-mono">
                          {u.api_key.substring(0, 16)}...
                        </code>
                        <button onClick={() => onCopy(u.api_key, `key-${u.id}`)} className="text-gray-400 hover:text-cyan-400 transition">
                          {copiedId === `key-${u.id}` ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {u.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="p-3">
                      <p className="text-white text-xs">{u.total_requests || 0} req</p>
                      <p className="text-xs text-gray-400">{u.total_tokens || 0} tokens</p>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onEditUser(u)} className="p-1.5 text-gray-400 hover:text-cyan-400 transition" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onRegenerateKey(u.id)} className="p-1.5 text-gray-400 hover:text-yellow-400 transition" title="Regenerate Key">
                          <Key className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => onDeleteUser(u.id)} className="p-1.5 text-gray-400 hover:text-red-400 transition" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-400 text-sm">Tidak ada user ditemukan</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ChatTab({ models }: { models: AIModel[] }) {
  const [selectedModel, setSelectedModel] = useState('gemini');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsLoading(true);
    setResponse('');
    const result = await sendMessage([{ role: 'user', content: message }], selectedModel);
    setResponse(result.success ? (result.message || '') : `Error: ${result.error}`);
    setIsLoading(false);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Chat API Tester</h2>
        <p className="text-gray-400 text-sm">Test your AI models directly from the dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h3 className="text-sm md:text-lg font-bold text-white mb-3">Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm mb-4"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>{model.name.toUpperCase()} - {model.id}</option>
            ))}
          </select>

          <h3 className="text-sm md:text-lg font-bold text-white mb-3">Message</h3>
          <textarea
            value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm min-h-[100px] resize-none mb-3"
          />

          <button
            onClick={handleSend} disabled={isLoading || !message.trim()}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium py-2.5 rounded-xl text-sm disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Processing...' : 'Send Message'}
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h3 className="text-sm md:text-lg font-bold text-white mb-3">Response</h3>
          <div className="bg-slate-700/50 rounded-xl p-3 min-h-[200px] md:min-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full pt-16">
                <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
              </div>
            ) : response ? (
              <div className="text-gray-300 text-sm whitespace-pre-wrap">{response}</div>
            ) : (
              <p className="text-gray-500 text-sm">Response akan muncul disini...</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 md:mt-6 bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6">
        <h3 className="text-sm md:text-lg font-bold text-white mb-3">API Usage Example</h3>
        <pre className="bg-slate-700 rounded-xl p-3 overflow-x-auto">
          <code className="text-xs text-gray-300">
{`curl -X POST https://apis-zyvora.biz.id/functions/v1/proxy/chat \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"model":"gemini","messages":[{"role":"user","content":"Halo!"}]}'`}
          </code>
        </pre>
      </div>
    </div>
  );
}

function SettingsTab({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <div className="p-4 md:p-8">
      <div className="mb-5">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">Settings</h2>
        <p className="text-gray-400 text-sm">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h3 className="text-base font-bold text-white mb-4">Account Information</h3>
          <div className="space-y-3">
            {[['Username', user?.username || '', 'text'], ['Email', user?.email || '', 'email'], ['Role', user?.role || '', 'text']].map(([label, value]) => (
              <div key={label as string}>
                <label className="block text-xs text-gray-400 mb-1">{label as string}</label>
                <input type="text" value={value as string} disabled className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-gray-400 text-sm" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl md:rounded-2xl p-4 md:p-6">
          <h3 className="text-base font-bold text-white mb-4">Firebase Authentication</h3>
          <div className="bg-slate-700/50 rounded-xl p-3">
            <p className="text-gray-300 text-sm">You are logged in with Google authentication via Firebase.</p>
            <p className="text-xs text-gray-400 mt-2">No API key needed - authentication is handled automatically by Firebase.</p>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
}

function CreateUserModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (data: any) => Promise<any> }) {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const result = await onSubmit({ email, username, password, role });
    if (!result.success) setError(result.error || 'Gagal membuat user');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Create New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
          {[['Email', email, setEmail, 'email'], ['Username', username, setUsername, 'text']].map(([label, value, setter, type]) => (
            <div key={label as string}>
              <label className="block text-xs text-gray-400 mb-1">{label as string}</label>
              <input type={type as string} value={value as string} onChange={(e) => (setter as any)(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" required />
            </div>
          ))}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition text-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl disabled:opacity-50 transition text-sm">
              {isLoading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditUserModal({ user, onClose, onSubmit }: { user: User; onClose: () => void; onSubmit: (updates: any) => Promise<any> }) {
  const [email, setEmail] = useState(user.email);
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user.role);
  const [is_active, setIsActive] = useState(user.is_active);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    const updates: any = { email, username, role, is_active };
    if (password) updates.password = password;
    const result = await onSubmit(updates);
    if (!result.success) setError(result.error || 'Gagal mengupdate user');
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-white">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-3">
          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">{error}</div>}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" required />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">New Password (kosongkan jika tidak diubah)</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-sm">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" id="is_active" checked={is_active} onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-cyan-500" />
            <label htmlFor="is_active" className="text-white text-sm">Active</label>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition text-sm">Cancel</button>
            <button type="submit" disabled={isLoading} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl disabled:opacity-50 transition text-sm">
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
