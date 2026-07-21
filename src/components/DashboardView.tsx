import React, { useState } from 'react';
import {
  Wallet,
  Eye,
  EyeOff,
  ShoppingBag,
  PhoneCall,
  History,
  Bell,
  CheckCircle2,
  TrendingUp,
  Clock,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { User, WalletTransaction, Notification } from '../types.ts';

interface DashboardViewProps {
  user: User | null;
  setActiveTab: (tab: string) => void;
  transactions: WalletTransaction[];
  notifications: Notification[];
  onMarkNotificationsRead: () => void;
  ordersCount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  setActiveTab,
  transactions,
  notifications,
  onMarkNotificationsRead,
  ordersCount,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  const balanceNum = parseFloat(user?.wallet?.balance || '0.00');
  const formattedBalance = balanceNum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const unreadNotifications = notifications.filter((n) => !n.isRead);

  // Statistics
  const totalSpend = transactions
    .filter((t) => t.type === 'purchase' && t.status === 'completed')
    .reduce((acc, curr) => acc + Math.abs(parseFloat(curr.amount)), 0);

  const totalDeposits = transactions
    .filter((t) => t.type === 'deposit' && t.status === 'completed')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  return (
    <div className="space-y-6 pb-20 md:pb-6">
      {/* 1. Header Bar */}
      <header className="flex justify-between items-center bg-white p-4 md:p-6 rounded-2xl border border-purple-100 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center text-white font-display font-bold text-xl md:hidden">
            J
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold tracking-tight text-slate-900">
              Dashboard Overview
            </h1>
            <p className="text-xs text-slate-500">
              Welcome back, <span className="font-semibold text-purple-700">{user?.profile?.fullName || 'Jazzy'} 👋</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-4 relative">
          {/* Notifications Trigger */}
          <button
            id="notification-bell-btn"
            onClick={() => {
              setShowNotifications(!showNotifications);
              if (!showNotifications && unreadNotifications.length > 0) {
                onMarkNotificationsRead();
              }
            }}
            className="p-2.5 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors duration-200 relative"
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
            )}
            {unreadNotifications.length > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white border border-purple-100 rounded-2xl shadow-xl z-50 p-4 max-h-[400px] overflow-y-auto">
              <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-2">
                <h4 className="font-semibold text-sm text-slate-900">Notifications</h4>
                {unreadNotifications.length > 0 && (
                  <span className="text-xs text-purple-600 font-medium">New alerts</span>
                )}
              </div>
              {notifications.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">No notifications yet.</div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notif) => (
                    <div key={notif.id} className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100/70 transition-colors">
                      <div className="flex justify-between items-start">
                        <span className="font-semibold text-xs text-slate-800">{notif.title}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">{notif.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Profile Avatar */}
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-violet-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {user?.profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <h4 className="text-xs font-semibold text-slate-900 truncate max-w-[100px]">
                {user?.profile?.fullName}
              </h4>
              <p className="text-[10px] text-slate-400 truncate">@{user?.profile?.username}</p>
            </div>
          </div>
        </div>
      </header>

      {/* 2. Wallet Balance Card (Purple Gradient) */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-800 via-purple-700 to-violet-600 rounded-3xl text-white p-6 md:p-8 shadow-xl shadow-purple-900/15">
        {/* Ambient background designs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-purple-200 text-xs font-medium uppercase tracking-wider">
              <Wallet className="w-4 h-4" />
              <span>Wallet Balance</span>
              <button
                id="toggle-balance-btn"
                onClick={() => setShowBalance(!showBalance)}
                className="hover:text-white transition-colors p-1"
              >
                {showBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div className="flex items-baseline space-x-1">
              <span className="text-2xl md:text-3xl font-display font-light text-purple-200">₦</span>
              <span className="text-3xl md:text-4xl font-display font-bold tracking-tight">
                {showBalance ? formattedBalance : '••••••'}
              </span>
            </div>
            <p className="text-[11px] text-purple-200/80">
              Default currency: Nigerian Naira • Timezone: Africa/Lagos
            </p>
          </div>

          <div className="flex flex-row gap-3">
            <button
              id="dash-fund-wallet-btn"
              onClick={() => setActiveTab('wallet')}
              className="flex-1 md:flex-none px-5 py-3 bg-white text-purple-900 rounded-xl text-sm font-semibold hover:bg-purple-50 transition-all duration-200 shadow-lg shadow-purple-950/20 active:scale-95"
            >
              + Fund Wallet
            </button>
            <button
              id="dash-history-btn"
              onClick={() => setActiveTab('wallet')}
              className="px-4 py-3 bg-white/10 text-white hover:bg-white/15 transition-all duration-200 rounded-xl text-sm font-semibold flex items-center justify-center space-x-1"
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </div>
      </section>

      {/* 3. Quick Action Buttons */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            id: 'buy-accounts',
            label: 'Buy Account',
            desc: 'Legitimate digital assets',
            icon: ShoppingBag,
            color: 'from-purple-500 to-indigo-500',
            textColor: 'text-purple-600',
            bgColor: 'bg-purple-50',
          },
          {
            id: 'buy-numbers',
            label: 'Buy Number',
            desc: 'Legitimate virtual SMS',
            icon: PhoneCall,
            color: 'from-violet-500 to-pink-500',
            textColor: 'text-violet-600',
            bgColor: 'bg-violet-50',
          },
          {
            id: 'wallet',
            label: 'Fund Wallet',
            desc: 'Secure payment gateway',
            icon: Wallet,
            color: 'from-fuchsia-500 to-rose-500',
            textColor: 'text-fuchsia-600',
            bgColor: 'bg-fuchsia-50',
          },
          {
            id: 'orders',
            label: 'My Orders',
            desc: 'Retrieve deliverable logins',
            icon: CheckCircle2,
            color: 'from-emerald-500 to-teal-500',
            textColor: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
          },
        ].map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              id={`quick-action-btn-${act.id}`}
              onClick={() => setActiveTab(act.id)}
              className="group text-left p-5 bg-white rounded-2xl border border-purple-50 hover:border-purple-200 hover:shadow-md transition-all duration-300 relative overflow-hidden active:scale-[0.98]"
            >
              <div className="absolute right-0 bottom-0 w-24 h-24 bg-purple-50/20 rounded-full translate-x-8 translate-y-8 group-hover:scale-110 transition-transform duration-300" />
              <div className={`w-11 h-11 rounded-xl ${act.bgColor} ${act.textColor} flex items-center justify-center mb-4 transition-transform group-hover:scale-105 duration-300 shadow-sm`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-slate-800 text-sm md:text-base group-hover:text-purple-700 transition-colors">
                {act.label}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{act.desc}</p>
            </button>
          );
        })}
      </section>

      {/* 4. Marketplace Stats & Recent Transactions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Overview Stats */}
        <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-slate-900 text-base">
              Marketplace Stats
            </h3>
            <span className="p-1 rounded-md bg-purple-50 text-purple-600 text-xs">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Total Orders</span>
              <h4 className="text-xl font-bold text-slate-800 mt-1">{ordersCount}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Wallet Balance</span>
              <h4 className="text-xl font-bold text-purple-700 mt-1">₦{formattedBalance}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Deposited</span>
              <h4 className="text-xl font-bold text-emerald-600 mt-1">₦{totalDeposits.toLocaleString()}</h4>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] text-slate-400 uppercase font-medium">Spent</span>
              <h4 className="text-xl font-bold text-indigo-600 mt-1">₦{totalSpend.toLocaleString()}</h4>
            </div>
          </div>
        </div>

        {/* Right: Recent Transactions List */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-50">
              <h3 className="font-display font-semibold text-slate-900 text-base">
                Recent Ledger Ledger
              </h3>
              <button
                id="view-all-tx-btn"
                onClick={() => setActiveTab('wallet')}
                className="text-xs text-purple-600 font-semibold hover:text-purple-700 transition-colors flex items-center"
              >
                <span>View Wallet</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs">
                <Clock className="w-10 h-10 text-slate-200 mb-2" />
                <p>No transactions recorded yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 mt-3 max-h-[220px] overflow-y-auto pr-1">
                {transactions.slice(0, 5).map((tx) => {
                  const isNegative = parseFloat(tx.amount) < 0;
                  const amtVal = Math.abs(parseFloat(tx.amount));
                  return (
                    <div key={tx.id} className="flex justify-between items-center py-3">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isNegative
                              ? 'bg-indigo-50 text-indigo-600'
                              : 'bg-emerald-50 text-emerald-600'
                          }`}
                        >
                          {isNegative ? (
                            <TrendingUp className="w-4 h-4 rotate-180" />
                          ) : (
                            <TrendingUp className="w-4 h-4" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-800 truncate max-w-[180px] sm:max-w-[300px]">
                            {tx.description}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            {new Date(tx.createdAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })} • Ref: {tx.reference}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-xs font-bold ${
                            isNegative ? 'text-indigo-600' : 'text-emerald-600'
                          }`}
                        >
                          {isNegative ? '-' : '+'}₦{amtVal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <span className="block text-[8px] uppercase tracking-wider text-slate-400 font-semibold mt-0.5">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
