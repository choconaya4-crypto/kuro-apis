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

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
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
      const [statsResult, usersResult] = await Promise.all([
        getAdminStats(),
        getAllUsers(),
      ]);

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
        setRecentActivity(statsResult.recent_activity || []);
      }

      if (usersResult.success && usersResult.users) {
        setUsers(usersResult.users);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModels = async () => {
    const result = await getModels();
    if (result.success && result.models) {
      setModels(result.models);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateUser = async (userData: { email: string; username: string; password: string; role: string }) => {
    const result = await createUser(userData.email, userData.username, userData.password, userData.role);
    if (result.success) {
      setShowCreateModal(false);
      loadDashboardData();
    }
    return result;
  };

  const handleUpdateUser = async (userId: string, updates: Partial<User> & { password?: string }) => {
    const result = await updateUser(userId, updates);
    if (result.success) {
      setShowEditModal(false);
      setSelectedUser(null);
      loadDashboardData();
    }
    return result;
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Yakin ingin menghapus user ini?')) return;
    const result = await deleteUser(userId);
    if (result.success) {
      loadDashboardData();
    }
  };

  const handleRegenerateKey = async (userId: string) => {
    const result = await regenerateApiKey(userId);
    if (result.success) {
      loadDashboardData();
    }
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
      {/* Sidebar */}
      <aside className="w-64 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">KuroCodex</h1>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {sidebarItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition ${
                activeTab === item.id
                  ? 'bg-cyan-600/20 text-cyan-400'
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold">
              {user?.username?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{user?.username}</p>
              <p className="text-xs text-gray-400">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="text-gray-400 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {activeTab === 'dashboard' && (
          <DashboardTab
            stats={stats}
            recentActivity={recentActivity}
            isLoading={isLoading}
            models={models}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={filteredUsers}
            isLoading={isLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onRefresh={loadDashboardData}
            onCreateUser={() => setShowCreateModal(true)}
            onEditUser={(u) => {
              setSelectedUser(u);
              setShowEditModal(true);
            }}
            onDeleteUser={handleDeleteUser}
            onRegenerateKey={handleRegenerateKey}
            onCopy={copyToClipboard}
            copiedId={copiedId}
          />
        )}

        {activeTab === 'chat' && (
          <ChatTab
            models={models}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsTab
            user={user}
            onLogout={logout}
          />
        )}
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(updates) => handleUpdateUser(selectedUser.id, updates)}
        />
      )}
    </div>
  );
}

function DashboardTab({ stats, recentActivity, isLoading, models }: {
  stats: DashboardStats | null;
  recentActivity: ApiUsageLog[];
  isLoading: boolean;
  models: AIModel[];
}) {
  const statCards = [
    { label: 'Total Users', value: stats?.total_users || 0, icon: Users, color: 'from-cyan-500 to-blue-600' },
    { label: 'Active Users', value: stats?.active_users || 0, icon: Activity, color: 'from-green-500 to-emerald-600' },
    { label: 'Total Requests', value: stats?.total_requests || 0, icon: BarChart3, color: 'from-purple-500 to-violet-600' },
    { label: 'Total Tokens', value: stats?.total_tokens || 0, icon: Zap, color: 'from-orange-500 to-red-600' },
  ];

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-gray-400">Monitor your KuroCodex API usage and users</p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Available Models */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8">
            <h3 className="text-xl font-bold text-white mb-4">Available AI Models</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {models.map((model, index) => (
                <div key={index} className="bg-slate-700/50 rounded-xl p-4 border border-slate-600">
                  <p className="text-white font-medium">{model.name.toUpperCase()}</p>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{model.id}</p>
                  <span className="inline-block mt-2 px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                    FREE
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">Recent API Activity</h3>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.slice(0, 10).map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                      <div>
                        <p className="text-white text-sm">{log.model.split('/')[1]}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(log.request_time).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <p className="text-cyan-400 font-mono text-sm">{log.tokens_used} tokens</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-400 text-center py-8">Belum ada aktivitas API</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function UsersTab({ users, isLoading, searchQuery, setSearchQuery, onRefresh, onCreateUser, onEditUser, onDeleteUser, onRegenerateKey, onCopy, copiedId }: {
  users: User[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onRefresh: () => void;
  onCreateUser: () => void;
  onEditUser: (user: User) => void;
  onDeleteUser: (userId: string) => void;
  onRegenerateKey: (userId: string) => Promise<any>;
  onCopy: (text: string, id: string) => void;
  copiedId: string | null;
}) {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">User Management</h2>
          <p className="text-gray-400">Manage API users and access</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={onCreateUser}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 transition"
          >
            <Plus className="w-5 h-5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left p-4 text-gray-400 font-medium">User</th>
                <th className="text-left p-4 text-gray-400 font-medium">API Key</th>
                <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Usage</th>
                <th className="text-right p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-700 hover:bg-slate-700/30 transition">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {u.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-medium">{u.username}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-gray-400 bg-slate-700 px-2 py-1 rounded font-mono">
                        {u.api_key.substring(0, 20)}...
                      </code>
                      <button
                        onClick={() => onCopy(u.api_key, `key-${u.id}`)}
                        className="text-gray-400 hover:text-cyan-400 transition"
                      >
                        {copiedId === `key-${u.id}` ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      u.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm">
                      <p className="text-white">{u.total_requests || 0} requests</p>
                      <p className="text-xs text-gray-400">{u.total_tokens || 0} tokens</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onEditUser(u)}
                        className="p-2 text-gray-400 hover:text-cyan-400 transition"
                        title="Edit"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRegenerateKey(u.id)}
                        className="p-2 text-gray-400 hover:text-yellow-400 transition"
                        title="Regenerate Key"
                      >
                        <Key className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteUser(u.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-gray-400">Tidak ada user ditemukan</p>
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

    const messages = [{ role: 'user', content: message }];
    const result = await sendMessage(messages, selectedModel);

    if (result.success) {
      setResponse(result.message || '');
    } else {
      setResponse(`Error: ${result.error}`);
    }
    setIsLoading(false);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Chat API Tester</h2>
        <p className="text-gray-400">Test your AI models directly from the dashboard</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Model</h3>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white mb-6"
          >
            {models.map((model) => (
              <option key={model.name} value={model.name}>
                {model.name.toUpperCase()} - {model.id}
              </option>
            ))}
          </select>

          <h3 className="text-lg font-bold text-white mb-4">Message</h3>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ketik pesan..."
            className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white min-h-[120px] resize-none mb-4"
          />

          <button
            onClick={handleSend}
            disabled={isLoading || !message.trim()}
            className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-medium py-3 rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Processing...' : 'Send Message'}
          </button>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Response</h3>
          <div className="bg-slate-700/50 rounded-xl p-4 min-h-[300px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <RefreshCw className="w-6 h-6 text-cyan-500 animate-spin" />
              </div>
            ) : response ? (
              <div className="text-gray-300 whitespace-pre-wrap">{response}</div>
            ) : (
              <p className="text-gray-500">Response akan muncul disini...</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 bg-slate-800 border border-slate-700 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-white mb-4">API Usage Example</h3>
        <pre className="bg-slate-700 rounded-xl p-4 overflow-x-auto">
          <code className="text-sm text-gray-300">
{`// With Firebase Authentication
const idToken = await firebase.auth().currentUser.getIdToken();

fetch('/functions/v1/proxy/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Firebase-Token': idToken
  },
  body: JSON.stringify({
    messages: [{ role: 'user', content: 'Halo!' }],
    model: 'gemini'
  })
});`}
          </code>
        </pre>
      </div>
    </div>
  );
}

function SettingsTab({ user, onLogout }: { user: User | null; onLogout: () => void }) {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Settings</h2>
        <p className="text-gray-400">Manage your account settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Username</label>
              <input
                type="text"
                value={user?.username || ''}
                disabled
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-gray-400"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Role</label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-gray-400 capitalize"
              />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">Firebase Authentication</h3>
          <div className="space-y-4">
            <div className="bg-slate-700/50 rounded-xl p-4">
              <p className="text-gray-300 text-sm">
                You are logged in with Google authentication via Firebase.
              </p>
              <p className="text-xs text-gray-400 mt-2">
                No API key needed - authentication is handled automatically by Firebase.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:bg-red-500/20 transition"
        >
          <LogOut className="w-5 h-5" />
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
    if (!result.success) {
      setError(result.error || 'Gagal membuat user');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Create New User</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition"
            >
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
    if (!result.success) {
      setError(result.error || 'Gagal mengupdate user');
    }
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full">
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Edit User</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">New Password (leave empty to keep)</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'admin' | 'user')}
              className="w-full bg-slate-700 border border-slate-600 rounded-xl px-4 py-3 text-white"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={is_active}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded border-slate-600 bg-slate-700 text-cyan-500 focus:ring-cyan-500"
            />
            <label htmlFor="is_active" className="text-white">Active</label>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-slate-700 text-gray-300 rounded-xl hover:bg-slate-600 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 transition"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
