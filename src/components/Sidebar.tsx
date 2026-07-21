import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Wallet,
  Settings,
  ShieldAlert,
  LogOut,
  Bell,
  User,
} from 'lucide-react';
import { User as UserType } from '../types.ts';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserType | null;
  logout: () => void;
  notificationsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  user,
  logout,
  notificationsCount,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'buy-accounts', label: 'Buy Accounts', icon: ShoppingBag },
    { id: 'buy-numbers', label: 'Buy Numbers', icon: PhoneCall },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag }, // reutilizing icon or we can use another
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-100 min-h-screen border-r border-slate-800 p-6 shrink-0 justify-between">
      <div className="space-y-8">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3 px-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-purple-950/40">
            J
          </div>
          <div>
            <h1 className="font-display font-bold text-lg tracking-tight leading-none text-white">
              Jazzy_Logs
            </h1>
            <span className="text-[10px] text-purple-400 font-medium tracking-widest uppercase">
              Digital Solutions
            </span>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-inner">
            {user?.profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
          </div>
          <div className="overflow-hidden min-w-0 flex-1">
            <h3 className="font-semibold text-sm truncate text-slate-100 leading-tight">
              {user?.profile?.fullName || 'Jazzy User'}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              @{user?.profile?.username || 'username'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="space-y-1.5">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`sidebar-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-600/80 to-violet-600/80 text-white shadow-md shadow-purple-900/10 border-l-4 border-purple-400'
                    : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-800 mt-4">
            <span className="px-4 text-[10px] text-amber-400/90 font-semibold uppercase tracking-wider block mb-2">
              Management Portal
            </span>
            <button
              id="sidebar-btn-admin"
              onClick={() => setActiveTab('admin')}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'admin'
                  ? 'bg-gradient-to-r from-amber-600/90 to-yellow-600/90 text-white border-l-4 border-amber-400 shadow-md shadow-amber-950/40'
                  : 'text-amber-400 hover:bg-amber-950/30 hover:text-amber-300'
              }`}
            >
              <div className="flex items-center space-x-3">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Admin Portal</span>
              </div>
              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                isAdmin 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isAdmin ? 'Active' : 'Passcode'}
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Logout */}
      <button
        id="sidebar-logout-btn"
        onClick={logout}
        className="w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:bg-rose-950/20 hover:text-rose-400 transition-all duration-200 border border-transparent hover:border-rose-900/20"
      >
        <LogOut className="w-5 h-5 text-slate-400 group-hover:text-rose-400" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
};
