import React from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  PhoneCall,
  Wallet,
  Settings,
  ShieldAlert,
} from 'lucide-react';
import { User as UserType } from '../types.ts';

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: UserType | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  user,
}) => {
  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';

  const items = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'buy-numbers', label: 'Numbers', icon: PhoneCall },
    { id: 'buy-accounts', label: 'Accounts', icon: ShoppingBag },
    { id: 'wallet', label: 'Wallet', icon: Wallet },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center py-2.5 px-3 z-50 rounded-t-3xl shadow-[0_-8px_30px_rgb(0,0,0,0.3)]">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`bottom-nav-btn-${item.id}`}
            onClick={() => setActiveTab(item.id)}
            className="flex flex-col items-center justify-center flex-1 py-1 relative"
          >
            <div
              className={`p-1.5 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-purple-600 text-white scale-110 shadow-lg shadow-purple-900/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span
              className={`text-[9px] mt-1 font-medium transition-colors duration-200 ${
                isActive ? 'text-purple-400 font-semibold' : 'text-slate-500'
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}

      <button
        id="bottom-nav-btn-admin"
        onClick={() => setActiveTab('admin')}
        className="flex flex-col items-center justify-center flex-1 py-1 relative"
      >
        <div
          className={`p-1.5 rounded-xl transition-all duration-300 ${
            activeTab === 'admin'
              ? 'bg-amber-600 text-white scale-110 shadow-lg shadow-amber-900/40'
              : 'text-amber-500 hover:text-amber-400'
          }`}
        >
          <ShieldAlert className="w-5 h-5" />
        </div>
        <span
          className={`text-[9px] mt-1 font-medium ${
            activeTab === 'admin' ? 'text-amber-400 font-semibold' : 'text-slate-400'
          }`}
        >
          Admin
        </span>
      </button>
    </nav>
  );
};
