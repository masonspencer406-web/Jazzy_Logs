import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { BuyAccountsView } from './components/BuyAccountsView.tsx';
import { BuyNumbersView } from './components/BuyNumbersView.tsx';
import { WalletView } from './components/WalletView.tsx';
import { OrdersView } from './components/OrdersView.tsx';
import { SettingsView } from './components/SettingsView.tsx';
import { AdminView } from './components/AdminView.tsx';
import { AdminUnlockView } from './components/AdminUnlockView.tsx';
import {
  Sparkles,
  ShieldCheck,
  PhoneCall,
  ShoppingBag,
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WalletTransaction, Notification } from './types.ts';

function AppContent() {
  const {
    user,
    loading,
    token,
    loginWithGoogle,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
    logout,
    refreshUser,
  } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('tab') === 'admin' || window.location.hash === '#admin') {
      setActiveTab('admin');
    }
  }, []);

  const handleLockAdmin = async () => {
    setIsAdminUnlocked(false);
    if (token) {
      try {
        await fetch('/api/admin/lock', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        await refreshUser();
      } catch (err) {
        console.error('Error locking admin portal:', err);
      }
    }
  };

  // Interactive Custom Auth Forms State
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFullName, setAuthFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Instant Admin Access handler
  const handleAdminQuickLogin = async () => {
    setAuthError(null);
    setAuthSuccess(null);
    setAuthSubmitting(true);
    try {
      await loginWithEmail('admin@jazzy.com', 'Jazzy3541$');
      setActiveTab('admin');
    } catch (err: any) {
      try {
        await signUpWithEmail('admin@jazzy.com', 'Jazzy3541$', 'Administrator');
        setActiveTab('admin');
      } catch (signupErr: any) {
        setAuthError('Admin access error: ' + (signupErr.message || 'Could not log in as admin'));
      }
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Form submission handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);

    // Validate email
    if (!authEmail || !authEmail.includes('@')) {
      setAuthError('Please enter a valid email address.');
      return;
    }

    if (authMode !== 'forgot' && (!authPassword || authPassword.length < 6)) {
      setAuthError('Password must be at least 6 characters long.');
      return;
    }

    if (authMode === 'signup' && !authFullName.trim()) {
      setAuthError('Please enter your full name.');
      return;
    }

    setAuthSubmitting(true);
    try {
      if (authMode === 'login') {
        await loginWithEmail(authEmail, authPassword);
      } else if (authMode === 'signup') {
        await signUpWithEmail(authEmail, authPassword, authFullName);
        setAuthSuccess('Account created successfully! Welcome to your dashboard.');
      } else if (authMode === 'forgot') {
        await resetPassword(authEmail);
        setAuthSuccess('Password reset link sent! Please check your email inbox.');
      }
    } catch (err: any) {
      console.error('Authentication Error:', err);
      let friendlyMessage = err.message || 'Authentication failed. Please try again.';
      if (err.code === 'auth/user-not-found' || err.message?.includes('user-not-found') || err.message?.includes('auth/invalid-credential')) {
        friendlyMessage = 'No account associated with this email address or invalid password.';
      } else if (err.code === 'auth/wrong-password' || err.message?.includes('wrong-password') || err.message?.includes('invalid-credential')) {
        friendlyMessage = 'Incorrect password. Please try again or click Forgot Password.';
      } else if (err.code === 'auth/email-already-in-use' || err.message?.includes('email-already-in-use')) {
        friendlyMessage = 'An account with this email address already exists. Please login instead.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Invalid email address format.';
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        friendlyMessage = "Email/Password sign-in is currently disabled in your Firebase project. To resolve this, go to your Firebase Console -> Authentication -> Sign-in Method, and enable the 'Email/Password' provider. Alternatively, you can use Google Sign-In or click the Sandbox Evaluation buttons below to log in instantly.";
      }
      setAuthError(friendlyMessage);
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Shared application states
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ordersCount, setOrdersCount] = useState(0);

  // Sync / poll ledger logs and notification alerts
  const loadUserData = async () => {
    if (!token) return;
    const authHeader = { 'Authorization': `Bearer ${token}` };

    // Helper function to safely parse JSON responses
    const safeJsonParse = async (res: Response) => {
      if (!res.ok) return null;
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        return null;
      }
      try {
        return await res.json();
      } catch (e) {
        return null;
      }
    };

    // 1. Fetch wallet & transactions
    try {
      const resWallet = await fetch('/api/wallet', { headers: authHeader });
      const walletData = await safeJsonParse(resWallet);
      if (walletData) {
        setTransactions(walletData.transactions || []);
      }
    } catch (err) {
      console.warn('Silent fallback: Wallet fetch is pending connection.', err);
    }

    // 2. Fetch notifications
    try {
      const resNotifications = await fetch('/api/notifications', { headers: authHeader });
      const notifData = await safeJsonParse(resNotifications);
      if (notifData) {
        setNotifications(notifData || []);
      }
    } catch (err) {
      console.warn('Silent fallback: Notifications fetch is pending connection.', err);
    }

    // 3. Fetch orders count
    try {
      const resOrders = await fetch('/api/orders', { headers: authHeader });
      const ordersData = await safeJsonParse(resOrders);
      if (ordersData) {
        setOrdersCount(ordersData.length || 0);
      }
    } catch (err) {
      console.warn('Silent fallback: Orders fetch is pending connection.', err);
    }
  };

  // Mark all unread as read
  const handleMarkNotificationsRead = async () => {
    if (!token) return;
    try {
      await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      // reload notifications
      loadUserData();
    } catch (err) {
      console.error('Error marking notifications read:', err);
    }
  };

  useEffect(() => {
    if (token) {
      loadUserData();

      // Poll every 7 seconds to catch webhooks, new verifications, and status changes in real-time
      const interval = setInterval(() => {
        loadUserData();
      }, 7000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Audio system chime simulation for new incoming codes or notifications
  useEffect(() => {
    const unreadCount = notifications.filter((n) => !n.isRead).length;
    if (unreadCount > 0) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.setValueAtTime(830, audioCtx.currentTime); // nice crystal high note
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
      } catch (e) {
        // Safe if audio context block
      }
    }
  }, [notifications]);

  // 1. Loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-purple-950 border-t-purple-500 animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold font-display text-lg">
            J
          </div>
        </div>
        <div className="text-center space-y-1 animate-pulse">
          <p className="text-purple-300 font-display font-medium text-sm">Securing ledger session...</p>
          <p className="text-slate-500 text-[10px]">Nigerian Naira Marketplace (₦)</p>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated welcome / login view (Cosmic Indigo Theme)
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between items-center p-6 relative overflow-hidden">
        {/* Abstract celestial orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full max-w-md mx-auto my-auto space-y-6 relative z-10">
          {/* Logo Brand Header */}
          <div className="space-y-2 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-violet-400 flex items-center justify-center text-white font-display font-black text-3xl shadow-xl shadow-purple-900/30 mx-auto">
              J
            </div>
            <div>
              <h1 className="font-display font-black text-2xl tracking-tight text-white">
                Jazzy_Logs
              </h1>
              <p className="text-purple-400 text-xs font-semibold uppercase tracking-wider">
                Digital Solutions for Every Market
              </p>
            </div>
          </div>

          {/* Interactive Form Card */}
          <div className="bg-slate-900/95 border border-slate-800/90 p-6 rounded-3xl space-y-5 shadow-2xl backdrop-blur-md">
            {/* Tab selection headers */}
            {authMode !== 'forgot' && (
              <div className="flex border-b border-slate-800/80 pb-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 pb-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    authMode === 'login'
                      ? 'text-purple-400 border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('signup');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className={`flex-1 pb-2 text-xs font-extrabold uppercase tracking-wider transition-colors ${
                    authMode === 'signup'
                      ? 'text-purple-400 border-b-2 border-purple-500'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            )}

            {authMode === 'forgot' && (
              <div className="text-center pb-2 border-b border-slate-800/80">
                <h2 className="text-xs font-bold uppercase tracking-widest text-purple-400">
                  Reset Password
                </h2>
              </div>
            )}

            {/* Error and Success alerts */}
            {authError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-[11px] text-rose-300 flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {authSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-[11px] text-emerald-300 flex items-start space-x-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {/* Full Name field (Sign Up Only) */}
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                    Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. John Doe"
                      value={authFullName}
                      onChange={(e) => setAuthFullName(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-xl py-3 pl-10 pr-4 text-xs focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Password field (Login / Sign Up) */}
              {authMode !== 'forgot' && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      Password
                    </label>
                    {authMode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError(null);
                          setAuthSuccess(null);
                        }}
                        className="text-[10px] text-purple-400 hover:text-purple-300 font-bold hover:underline"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      className="w-full bg-slate-950/50 border border-slate-800 focus:border-purple-500 rounded-xl py-3 pl-10 pr-10 text-xs focus:outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 active:scale-98 shadow-lg shadow-purple-900/20 cursor-pointer"
              >
                {authSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {authMode === 'login' && <span>Sign In with Email</span>}
                    {authMode === 'signup' && <span>Create Account</span>}
                    {authMode === 'forgot' && <span>Send Reset Link</span>}
                    <ArrowRight className="w-4 h-4 text-purple-200" />
                  </>
                )}
              </button>
            </form>

            {/* Back to Login option */}
            {authMode === 'forgot' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setAuthError(null);
                    setAuthSuccess(null);
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 font-bold underline"
                >
                  Back to Log In
                </button>
              </div>
            )}

            {/* Divider */}
            <div className="flex items-center my-2">
              <div className="flex-1 border-t border-slate-800/80" />
              <span className="px-3 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                Or continue with
              </span>
              <div className="flex-1 border-t border-slate-800/80" />
            </div>

            {/* Google Sign In option */}
            <button
              id="google-signin-btn"
              onClick={loginWithGoogle}
              className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 shadow-md active:scale-98 cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.6c-.28 1.5-1.11 2.76-2.36 3.62l3.65 2.84c2.13-1.97 3.36-4.87 3.36-8.29z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.65-2.84c-1.01.67-2.31 1.09-4.28 1.09-3.8 0-7.01-2.57-8.16-6.03H.17v2.96C2.18 20.2 7.16 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M3.84 13.31c-.3-.88-.47-1.83-.47-2.81s.17-1.93.47-2.81V4.73H.17C-.4 5.9-.7 7.25-.7 8.7s.3 2.8 1.03 3.97l3.51-2.56z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24.5 12 .5 7.16.5 2.18 4.3.17 8.13l3.67 2.84c1.15-3.46 4.36-6.03 8.16-6.03z"
                />
              </svg>
              <span>Sign In with Google</span>
            </button>

            {/* Direct Admin Portal Access Button */}
            <div className="pt-2 border-t border-slate-800/80">
              <button
                type="button"
                id="admin-portal-login-btn"
                onClick={handleAdminQuickLogin}
                className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 cursor-pointer hover:shadow-lg hover:shadow-amber-900/20"
              >
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <span>Admin Portal Entry</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-[10px] text-slate-600 text-center relative z-10 py-2">
          Jazzy_Logs • Secure authorized software marketplace • Currency: NGN (₦)
        </div>
      </div>
    );
  }

  // 3. Authenticated workspace layout
  const handleTabChange = (tab: string) => {
    if (activeTab === 'admin' && tab !== 'admin') {
      handleLockAdmin();
    }
    setActiveTab(tab);
    // Refresh user balance on view changes
    refreshUser();
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView
            user={user}
            setActiveTab={handleTabChange}
            transactions={transactions}
            notifications={notifications}
            onMarkNotificationsRead={handleMarkNotificationsRead}
            ordersCount={ordersCount}
          />
        );
      case 'buy-accounts':
        return <BuyAccountsView user={user} token={token} refreshUser={refreshUser} />;
      case 'buy-numbers':
        return <BuyNumbersView user={user} token={token} refreshUser={refreshUser} />;
      case 'wallet':
        return (
          <WalletView
            user={user}
            token={token}
            transactions={transactions}
            refreshUser={refreshUser}
            loadTransactions={loadUserData}
          />
        );
      case 'orders':
        return <OrdersView user={user} token={token} />;
      case 'settings':
        return <SettingsView user={user} token={token} refreshUser={refreshUser} logout={logout} />;
      case 'admin':
        if (isAdminUnlocked && (user?.role === 'admin' || user?.role === 'super_admin')) {
          return (
            <AdminView
              user={user}
              token={token}
              onLockAdmin={async () => {
                await handleLockAdmin();
                setActiveTab('dashboard');
              }}
            />
          );
        }
        return (
          <AdminUnlockView
            token={token}
            refreshUser={refreshUser}
            onUnlockSuccess={() => setIsAdminUnlocked(true)}
          />
        );
      default:
        return (
          <div className="bg-white p-12 text-center rounded-3xl">
            <h3 className="font-bold text-slate-800 text-base">Under Development</h3>
            <p className="text-xs text-slate-500 mt-1">This module will be ready shortly.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Desktop Sidebar navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        user={user}
        logout={logout}
        notificationsCount={notifications.filter((n) => !n.isRead).length}
      />

      {/* Main Workspace Frame container */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {renderActiveView()}
      </main>

      {/* Mobile Bottom Navigation menu */}
      <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} user={user} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
