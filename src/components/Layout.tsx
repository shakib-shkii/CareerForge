import { useState } from 'react';
import { useStore } from '../store/useStore';
import {
  LayoutDashboard,
  User,
  Briefcase,
  FileText,
  ScanSearch,
  Target,
  Plug,
  Send,
  Menu,
  X,
  Sparkles,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import type { Page } from '../types';

const navItems: { page: Page; label: string; icon: React.ReactNode }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
  { page: 'profile', label: 'My Profile', icon: <User size={20} /> },
  { page: 'jobs', label: 'Browse Jobs', icon: <Briefcase size={20} /> },
  { page: 'tailor', label: 'Tailor Resume', icon: <FileText size={20} /> },
  { page: 'ats', label: 'ATS Checker', icon: <ScanSearch size={20} /> },
  { page: 'match-session', label: 'Match Score Booster', icon: <Target size={20} /> },
  { page: 'applications', label: 'Applications', icon: <Send size={20} /> },
  { page: 'connectors', label: 'Connectors', icon: <Plug size={20} /> },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentPage, setCurrentPage, aiApiKey, user, logout } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } flex flex-col`}
      >
        <div className="flex items-center gap-3 p-6 border-b border-slate-700/50">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
            <Sparkles className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">CareerForge</h1>
            <p className="text-slate-400 text-xs">AI-Powered Career Platform</p>
          </div>
          <button
            className="lg:hidden ml-auto text-slate-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map(({ page, label, icon }) => (
            <button
              key={page}
              onClick={() => {
                setCurrentPage(page);
                setSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                currentPage === page
                  ? 'bg-gradient-to-r from-violet-600/90 to-indigo-600/90 text-white shadow-lg shadow-violet-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {icon}
              {label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700/50 space-y-3">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs ${
              aiApiKey
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
            }`}
          >
            <div className={`w-2 h-2 rounded-full ${aiApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {aiApiKey ? 'Google AI Connected' : 'Google AI Not Connected'}
          </div>

          {/* User section */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white text-sm font-medium truncate">{user.name}</p>
                  <p className="text-slate-400 text-xs truncate">{user.email}</p>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {userMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-700/50 transition-all text-sm"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 lg:px-8 py-4 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden text-gray-600 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {navItems.find((n) => n.page === currentPage)?.label || 'Dashboard'}
            </h2>
          </div>
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
              <span>Welcome,</span>
              <span className="font-medium text-gray-700">{user.name.split(' ')[0]}</span>
            </div>
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
