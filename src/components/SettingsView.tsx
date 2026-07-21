import React, { useState } from 'react';
import {
  User as UserIcon,
  Settings,
  ShieldCheck,
  Phone,
  Mail,
  UserCheck,
  LogOut,
  Loader2,
  Sparkles,
  Key,
  Copy,
  Eye,
  EyeOff,
  Terminal,
  Check,
  Code,
} from 'lucide-react';
import { User } from '../types.ts';

interface SettingsViewProps {
  user: User | null;
  token: string | null;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  token,
  refreshUser,
  logout,
}) => {
  const [fullName, setFullName] = useState(user?.profile?.fullName || '');
  const [username, setUsername] = useState(user?.profile?.username || '');
  const [phone, setPhone] = useState(user?.profile?.phone || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [generatingKey, setGeneratingKey] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [activeDocTab, setActiveDocTab] = useState<'auth' | 'buy' | 'sms'>('auth');

  const handleRotateApiKey = async () => {
    setGeneratingKey(true);
    try {
      const res = await fetch('/api/developer/key', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        await refreshUser();
      } else {
        console.error('Failed to rotate API Key');
      }
    } catch (err) {
      console.error('Error rotating API Key:', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !username) {
      setSaveError('Full name and username are required.');
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ fullName, username, phone }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveSuccess(true);
        await refreshUser();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        setSaveError(data.error || 'Failed to update user profile.');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      setSaveError('An unexpected server error occurred.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900">
          Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize your profile credentials, secure your wallet transactions, and configure details.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Profile card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm text-center space-y-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-purple-500 to-violet-500 flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-md">
              {fullName.charAt(0) || user?.email?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-800 text-base">
                {fullName || 'Jazzy User'}
              </h3>
              <p className="text-xs text-purple-600 font-semibold">@{username || 'username'}</p>
            </div>

            {/* Verification badge */}
            <div className="inline-flex items-center px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-[10px] text-purple-700 font-bold uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" /> Fully Verified
            </div>

            {/* Email card read-only */}
            <div className="pt-4 border-t border-slate-50 text-left space-y-3">
              <div className="flex items-center space-x-3 text-xs">
                <Mail className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span className="text-slate-600 truncate">{user?.email}</span>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <Phone className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span className="text-slate-600">{phone || 'No phone provided'}</span>
              </div>
            </div>

            {/* Logout button */}
            <button
              id="settings-logout-btn"
              onClick={logout}
              className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100/55 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Log Out Securely</span>
            </button>
          </div>
        </div>

        {/* Right column: Edit Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-5">
            <h3 className="font-display font-bold text-slate-950 text-sm flex items-center">
              <Settings className="w-4.5 h-4.5 mr-1.5 text-purple-600" /> Edit Profile Details
            </h3>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-purple-300"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-purple-300 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +234 803 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-purple-300"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Secure Sync Email (Synced from Google)
                </label>
                <input
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200/40 rounded-xl text-sm text-slate-400 cursor-not-allowed"
                />
              </div>

              {/* Status messages */}
              {saveSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 font-semibold flex items-center space-x-2">
                  <UserCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 font-semibold">
                  {saveError}
                </div>
              )}

              <button
                id="settings-save-profile-btn"
                type="submit"
                disabled={saving}
                className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 flex items-center space-x-1.5 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    <span>Save Profile Changes</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Developer Center & API docs Card */}
          <div className="bg-white p-6 rounded-3xl border border-purple-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-slate-950 text-sm flex items-center">
                <Terminal className="w-4.5 h-4.5 mr-1.5 text-purple-600" /> Developer API Hub
              </h3>
              <span className="px-2.5 py-0.5 bg-purple-50 text-purple-600 font-bold rounded-full text-[9px] uppercase tracking-wider">
                Enabled
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Integrate Jazzy Logs into your own applications, bots, or software. Automate purchasing accounts and renting numbers programmatically with zero platform overhead.
            </p>

            {/* API Key management */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Your API Authentication Key
                </label>
                {user?.apiKey && (
                  <button
                    onClick={() => copyToClipboard(user.apiKey || '')}
                    className="text-[10px] font-bold text-purple-600 flex items-center hover:text-purple-700"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 mr-1 animate-pulse" /> Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3 mr-1" /> Copy Key
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-3 text-slate-400">
                    <Key className="w-4 h-4" />
                  </span>
                  <input
                    type={showKey ? 'text' : 'password'}
                    readOnly
                    value={user?.apiKey || 'No active API Key. Click Generate to activate your developer account.'}
                    className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-200/60 rounded-xl text-xs font-mono text-slate-700 focus:outline-none"
                  />
                  {user?.apiKey && (
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                <button
                  onClick={handleRotateApiKey}
                  disabled={generatingKey}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shrink-0 disabled:opacity-50"
                >
                  {generatingKey ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : user?.apiKey ? (
                    'Rotate Key'
                  ) : (
                    'Generate Key'
                  )}
                </button>
              </div>
            </div>

            {/* API Documentation */}
            <div className="space-y-4">
              <h4 className="font-display font-bold text-slate-900 text-xs flex items-center">
                <Code className="w-4 h-4 mr-1 text-purple-600" /> Interactive Developer Guide
              </h4>

              {/* Documentation Tabs */}
              <div className="flex border-b border-slate-100 text-xs">
                {(['auth', 'buy', 'sms'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveDocTab(tab)}
                    className={`py-2 px-4 font-bold border-b-2 -mb-px capitalize transition-all ${
                      activeDocTab === tab
                        ? 'border-purple-600 text-purple-700 font-bold'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab === 'auth' ? 'Authentication' : tab === 'buy' ? 'Buy Accounts' : 'SMS Verification'}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="bg-slate-950 p-4 rounded-2xl text-slate-100 font-mono text-[10px] leading-relaxed overflow-x-auto shadow-inner border border-slate-900">
                {activeDocTab === 'auth' && (
                  <div className="space-y-2">
                    <p className="text-purple-400">// Authenticate your requests using standard API headers</p>
                    <p className="text-slate-300">All programmatic requests must include either of these headers:</p>
                    <div className="pl-3 border-l-2 border-purple-500/30 text-emerald-400 space-y-1">
                      <p>X-API-Key: {user?.apiKey || 'jz_live_...'}</p>
                      <p className="text-slate-400">or</p>
                      <p>Authorization: Bearer {user?.apiKey || 'jz_live_...'}</p>
                    </div>
                    <p className="text-slate-400 mt-2">// Example CURL request:</p>
                    <p className="text-yellow-400">curl -X GET http://localhost:3000/api/health \</p>
                    <p className="text-yellow-400">  -H "X-API-Key: {user?.apiKey || 'jz_live_...'}"</p>
                  </div>
                )}

                {activeDocTab === 'buy' && (
                  <div className="space-y-2">
                    <p className="text-purple-400">// Purchase platform products & assets instantly</p>
                    <p className="text-slate-300"><span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 font-bold rounded">POST</span> /api/v1/buy-account</p>
                    
                    <p className="text-slate-400 mt-3">// Payload parameters (JSON):</p>
                    <p className="text-slate-300">{"{"} <span className="text-blue-400">"productId"</span>: <span className="text-amber-400">123</span> {"}"}</p>

                    <p className="text-slate-400 mt-3">// Example API purchase call:</p>
                    <p className="text-yellow-400">curl -X POST http://localhost:3000/api/v1/buy-account \</p>
                    <p className="text-yellow-400">  -H "X-API-Key: {user?.apiKey || 'jz_live_...'}" \</p>
                    <p className="text-yellow-400">  -H "Content-Type: application/json" \</p>
                    <p className="text-yellow-400">  -d '{"{"}"productId": 1{"}"}'</p>
                  </div>
                )}

                {activeDocTab === 'sms' && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-purple-400">// 1. Activate & Rent a virtual phone number</p>
                      <p className="text-slate-300"><span className="px-1.5 py-0.5 bg-emerald-950 text-emerald-400 font-bold rounded">POST</span> /api/v1/rent-number</p>
                      
                      <p className="text-slate-400 mt-1">// Payload parameters (JSON):</p>
                      <p className="text-slate-300">{"{"} <span className="text-blue-400">"numberId"</span>: <span className="text-amber-400">12</span> {"}"}</p>

                      <p className="text-yellow-400 mt-1">curl -X POST http://localhost:3000/api/v1/rent-number \</p>
                      <p className="text-yellow-400">  -H "X-API-Key: {user?.apiKey || 'jz_live_...'}" \</p>
                      <p className="text-yellow-400">  -H "Content-Type: application/json" \</p>
                      <p className="text-yellow-400">  -d '{"{"}"numberId": 12{"}"}'</p>
                    </div>

                    <div className="pt-2 border-t border-slate-900">
                      <p className="text-purple-400">// 2. Query active SMS verification codes received</p>
                      <p className="text-slate-300"><span className="px-1.5 py-0.5 bg-blue-950 text-blue-400 font-bold rounded">GET</span> /api/v1/rented-numbers/:id/sms</p>
                      
                      <p className="text-yellow-400 mt-2">curl -X GET http://localhost:3000/api/v1/rented-numbers/12/sms \</p>
                      <p className="text-yellow-400">  -H "X-API-Key: {user?.apiKey || 'jz_live_...'}"</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
