import React, { useState } from 'react';
import { ShieldCheck, Lock, Eye, EyeOff, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface AdminUnlockViewProps {
  token: string | null;
  refreshUser: () => Promise<void>;
  onUnlockSuccess?: () => void;
}

export const AdminUnlockView: React.FC<AdminUnlockViewProps> = ({ token, refreshUser, onUnlockSuccess }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter the administrator security passcode.');
      return;
    }

    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess('Privileges approved! Redirecting to secure control panel...');
        setPassword('');
        if (onUnlockSuccess) onUnlockSuccess();
        // Wait briefly for smooth user transition, then refresh user status
        setTimeout(async () => {
          await refreshUser();
        }, 1200);
      } else {
        setError(data.error || 'The passcode you entered is incorrect. Access denied.');
      }
    } catch (err) {
      console.error('Admin unlock error:', err);
      setError('Network request failed. Please check your connection and retry.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto my-12 animate-fade-in">
      <div className="bg-white border border-slate-100 shadow-xl rounded-3xl overflow-hidden">
        {/* Shield Icon Header */}
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-12 -mt-12 blur-xl pointer-events-none" />
          <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h2 className="font-display font-bold text-lg">Secure Administration Entry</h2>
          <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">
            This workspace requires administrative privileges. Please authorize below using your master gatekeeping passcode.
          </p>
        </div>

        {/* Access Form */}
        <div className="p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                Administrator Passcode
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-3 text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={submitting}
                  required
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-sm focus:outline-none focus:border-purple-500 placeholder:text-slate-400 focus:bg-white transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-800 flex items-start space-x-2.5 animate-pulse">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 flex items-start space-x-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !!success}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  <span>Authorizing Portal...</span>
                </>
              ) : (
                <span>Unlock Control Panel</span>
              )}
            </button>
          </form>

          {/* Privacy Disclaimer */}
          <div className="text-[10px] text-slate-400 leading-relaxed text-center">
            All configuration updates, catalog uploads, manual balance adjustments, and ledger overrides are tracked and audit-logged in real-time. Unauthorized attempts are locked out instantly.
          </div>
        </div>
      </div>
    </div>
  );
};
