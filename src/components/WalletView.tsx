import React, { useState, useEffect } from 'react';
import {
  Wallet,
  TrendingUp,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Sparkles,
  ArrowUpRight,
  Cpu,
  Upload,
  FileText,
  AlertCircle,
  MessageSquare,
  Send,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  Building2,
  ExternalLink,
  ShieldCheck,
  Key,
} from 'lucide-react';
import { User, WalletTransaction } from '../types.ts';

interface WalletViewProps {
  user: User | null;
  token: string | null;
  transactions: WalletTransaction[];
  refreshUser: () => Promise<void>;
  loadTransactions: () => Promise<void>;
}

export const WalletView: React.FC<WalletViewProps> = ({
  user,
  token,
  transactions,
  refreshUser,
  loadTransactions,
}) => {
  const [amount, setAmount] = useState('');
  const [gateway, setGateway] = useState('Paystack');
  const [funding, setFunding] = useState(false);
  const [fundSuccess, setFundSuccess] = useState<any | null>(null);

  // Paystack Info & Callback Links
  const [paystackInfo, setPaystackInfo] = useState<{
    callbackUrl: string;
    webhookUrl: string;
    hasPublicKey: boolean;
    hasSecretKey: boolean;
    publicKey: string | null;
  }>({
    callbackUrl: `${window.location.origin}/api/wallet/paystack/callback`,
    webhookUrl: `${window.location.origin}/api/wallet/paystack/webhook`,
    hasPublicKey: false,
    hasSecretKey: false,
    publicKey: null,
  });
  const [copiedCallback, setCopiedCallback] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  useEffect(() => {
    fetch('/api/wallet/paystack/info')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.callbackUrl) {
          setPaystackInfo(data);
        }
      })
      .catch((err) => console.error('Failed to fetch Paystack info:', err));
  }, []);

  // Auto-detect redirect payments from Paystack and credit instantly
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('payment_success') === 'true') {
      const ref = params.get('ref');
      const amt = params.get('amount');
      const gway = params.get('gateway') || 'Paystack';
      
      // Clean query parameters from URL for clean history
      const newUrl = window.location.pathname + (window.location.hash || '');
      window.history.replaceState({}, document.title, newUrl);

      // Trigger success notice
      setAiSuccess(`Payment Approved! Your deposit of ₦${parseFloat(amt || '0').toLocaleString()} via ${gway} has been verified and added to your wallet balance automatically. Transaction Ref: ${ref}`);
      
      // Pull fresh data
      refreshUser();
      loadTransactions();
    }
  }, []);

  // AI Verification State variables
  const [aiVerifying, setAiVerifying] = useState(false);
  const [aiSuccess, setAiSuccess] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [receiptText, setReceiptText] = useState('');
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptImageName, setReceiptImageName] = useState<string | null>(null);
  const [receiptMime, setReceiptMime] = useState<string | null>(null);

  // AI Chat Assistant State variables
  const [activeRightTab, setActiveRightTab] = useState<'ledger' | 'assistant'>('ledger');
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; role: 'user' | 'assistant'; content: string; timestamp: Date }>>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am your Jazzy_Logs AI Payment Support Assistant. How can I help you with payments, bank transfers, or wallet funding today?',
      timestamp: new Date()
    }
  ]);

  const handleSendChatMessage = async (e?: React.FormEvent, customMsg?: string) => {
    if (e) e.preventDefault();
    const textToSend = (customMsg || chatInput).trim();
    if (!textToSend) return;

    if (!customMsg) {
      setChatInput('');
    }

    const userMsg = {
      id: Math.random().toString(36).substring(2, 9),
      role: 'user' as const,
      content: textToSend,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatSending(true);

    try {
      const chatHistory = chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/wallet/ai-assistant-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: textToSend,
          history: chatHistory
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'assistant' as const,
          content: data.response,
          timestamp: new Date()
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          id: Math.random().toString(36).substring(2, 9),
          role: 'assistant' as const,
          content: 'Sorry, I encountered an error. Please verify your payment or try again shortly.',
          timestamp: new Date()
        }]);
      }
    } catch (err) {
      console.error('AI chat assistant error:', err);
      setChatMessages(prev => [...prev, {
        id: Math.random().toString(36).substring(2, 9),
        role: 'assistant' as const,
        content: 'I failed to connect. Please check your network connection and try again.',
        timestamp: new Date()
      }]);
    } finally {
      setChatSending(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, JPEG).');
      return;
    }

    setReceiptImageName(file.name);
    setReceiptMime(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAiVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptText && !receiptImage) {
      alert('Please provide either pasted receipt details or upload a receipt screenshot.');
      return;
    }

    setAiVerifying(true);
    setAiSuccess(null);
    setAiError(null);

    try {
      const res = await fetch('/api/wallet/ai-verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          receiptText,
          receiptImage,
          mimeType: receiptMime
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setAiSuccess(data.message || 'Payment successfully verified and credited!');
        setReceiptText('');
        setReceiptImage(null);
        setReceiptImageName(null);
        setReceiptMime(null);
        await refreshUser();
        await loadTransactions();
      } else {
        setAiError(data.error || 'AI Audit was unable to verify this receipt. Please double-check details or type the details clearly.');
      }
    } catch (err) {
      console.error('AI Verification error:', err);
      setAiError('Connection failed. Please check your internet connection.');
    } finally {
      setAiVerifying(false);
    }
  };

  const balanceNum = parseFloat(user?.wallet?.balance || '0.00');
  const formattedBalance = balanceNum.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const handleFundWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount to fund.');
      return;
    }

    setFunding(true);
    setFundSuccess(null);
    try {
      const res = await fetch('/api/wallet/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, gateway }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFundSuccess(data);
        setAmount('');
      } else {
        alert(data.error || 'Failed to initiate payment.');
      }
    } catch (err) {
      console.error('Funding error:', err);
      alert('An unexpected error occurred during checkout.');
    } finally {
      setFunding(false);
    }
  };

  const getTxTypeBadge = (type: string) => {
    switch (type) {
      case 'deposit':
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase rounded-md">
            Deposit
          </span>
        );
      case 'purchase':
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase rounded-md">
            Purchase
          </span>
        );
      case 'refund':
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-purple-50 text-purple-700 text-[10px] font-bold uppercase rounded-md">
            Refund
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase rounded-md">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6 animate-fade-in">
      {/* Title */}
      <div>
        <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900">
          Naira Wallet Manager
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your account balance, deposit Naira securely, and track your ledger transactions history.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Balance panel & Funding form */}
        <div className="lg:col-span-1 space-y-6">
          {/* Balance card */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-800 to-indigo-700 text-white p-6 rounded-3xl shadow-xl shadow-purple-900/10">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-xl pointer-events-none" />
            <span className="text-[10px] uppercase font-bold text-purple-200 tracking-widest flex items-center mb-2">
              <Wallet className="w-3.5 h-3.5 mr-1" /> Available Balance
            </span>
            <div className="flex items-baseline space-x-1">
              <span className="text-xl font-display text-purple-200">₦</span>
              <span className="text-3xl font-display font-bold">{formattedBalance}</span>
            </div>
            <p className="text-[10px] text-purple-200/80 mt-2">
              Instant crediting, zero platform deposit fees.
            </p>
          </div>

          {/* Paystack Developer & Callback Link Integration Card */}
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-lg border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-teal-400 tracking-widest flex items-center">
                <Sparkles className="w-3.5 h-3.5 mr-1 text-teal-400" /> Paystack Gateway Integration
              </span>
              <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full uppercase font-extrabold tracking-wider border border-emerald-500/20">
                Active Gateway
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Copy these URLs to your <strong>Paystack Dashboard</strong> (Settings → API Keys & Webhooks) for instant automatic wallet crediting:
            </p>

            {/* Callback URL Box */}
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Paystack Callback URL (Redirect)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paystackInfo.callbackUrl);
                    setCopiedCallback(true);
                    setTimeout(() => setCopiedCallback(false), 2000);
                  }}
                  className="text-[10px] font-semibold text-teal-300 hover:text-teal-200 flex items-center space-x-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 transition-all cursor-pointer"
                >
                  {copiedCallback ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Callback URL</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-[11px] text-teal-200 font-mono break-all block bg-slate-950/60 p-2 rounded-xl border border-slate-800 select-all">
                {paystackInfo.callbackUrl}
              </code>
            </div>

            {/* Webhook URL Box */}
            <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/50 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-[10px] font-bold uppercase">Paystack Webhook URL (Event Listener)</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(paystackInfo.webhookUrl);
                    setCopiedWebhook(true);
                    setTimeout(() => setCopiedWebhook(false), 2000);
                  }}
                  className="text-[10px] font-semibold text-teal-300 hover:text-teal-200 flex items-center space-x-1 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20 transition-all cursor-pointer"
                >
                  {copiedWebhook ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy Webhook URL</span>
                    </>
                  )}
                </button>
              </div>
              <code className="text-[11px] text-teal-200 font-mono break-all block bg-slate-950/60 p-2 rounded-xl border border-slate-800 select-all">
                {paystackInfo.webhookUrl}
              </code>
            </div>

            <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span className="flex items-center">
                <Key className="w-3 h-3 mr-1 text-slate-500" /> Paystack API Keys: {paystackInfo.hasSecretKey ? 'Secret Key Loaded' : 'Pending in .env'}
              </span>
              <span className="text-emerald-400 font-medium">Auto-Credit Enabled</span>
            </div>
          </div>

          {/* Funding Form */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <h3 className="font-display font-bold text-slate-900 text-sm flex items-center justify-between">
              <span>Fund Your Naira Wallet</span>
              <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">Paystack Active</span>
            </h3>

            <form onSubmit={handleFundWallet} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Amount in Naira (₦)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 text-sm font-semibold">₦</span>
                  <input
                    type="number"
                    min="100"
                    max="500000"
                    placeholder="Enter deposit amount e.g. 5,000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-teal-300"
                  />
                </div>
                <span className="text-[9px] text-slate-400 mt-1 block">
                  Min deposit: ₦100 • Max: ₦500,000
                </span>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Payment Gateway
                </label>
                <div className="py-2.5 px-3.5 bg-teal-50 border border-teal-200/80 rounded-xl text-xs font-bold text-teal-950 flex items-center justify-between shadow-xs">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-teal-600" />
                    <span>Paystack Payment Gateway</span>
                  </div>
                  <span className="text-[9px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold border border-emerald-300/60">
                    Active
                  </span>
                </div>
              </div>

              <button
                id="wallet-fund-submit-btn"
                type="submit"
                disabled={funding}
                className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20 flex items-center justify-center space-x-2 cursor-pointer"
              >
                {funding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Connecting to Paystack...</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-white" />
                    <span>Proceed to Pay via Paystack</span>
                  </>
                )}
              </button>
            </form>

            {/* Fund Checkout Success Box */}
            {fundSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2.5 animate-fade-in">
                <div className="flex items-center text-emerald-800 text-xs font-bold space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Payment Initialized ({fundSuccess.gateway})</span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-snug">
                  {fundSuccess.message || 'Click the button below to complete your payment. Upon completion, your wallet will automatically show the updated funds!'}
                </p>
                <a
                  href={fundSuccess.checkoutUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl text-center flex items-center justify-center space-x-1.5 transition-all shadow-sm"
                >
                  <span>Pay Now on {fundSuccess.gateway}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}

            {/* Payment security notice */}
            <div className="p-3 bg-purple-50 border border-purple-100/50 rounded-2xl flex items-start space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div className="text-[10px] text-purple-950 leading-normal">
                <span className="font-semibold block mb-0.5">Secure SSL Ingress</span>
                All payments are initialized securely via encrypted SSL. Your funds will be credited to your available balance immediately upon successful gateway authentication.
              </div>
            </div>
          </div>

          {/* AI Automated Payment Verifier Card */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-purple-50 rounded-xl text-purple-600">
                <Cpu className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-sm">
                  AI Instant Payment Verifier
                </h3>
                <p className="text-[10px] text-slate-400">
                  Reflex funds automatically using Gemini AI
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed">
              Paid via bank transfer or the official Flutterwave checkout? Paste the payment reference or upload a screenshot of your transaction receipt. Our AI Auditor will automatically analyze it and reflex the funds instantly to your dashboard.
            </p>

            <form onSubmit={handleAiVerifyPayment} className="space-y-3">
              {/* Receipt Text paste area */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Paste Receipt Text or Reference
                </label>
                <textarea
                  placeholder="e.g. Flutterwave Ref: FLW392019482 or Paste the transaction success alert / SMS / email copy..."
                  value={receiptText}
                  onChange={(e) => setReceiptText(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-purple-300 placeholder:text-slate-400"
                />
              </div>

              {/* Image Upload Area */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Upload Receipt Screenshot
                </label>
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-100 border-dashed rounded-xl cursor-pointer bg-slate-50 hover:bg-slate-100/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-3 pb-3">
                      <Upload className="w-5 h-5 text-slate-400 mb-1" />
                      <p className="text-[10px] text-slate-500">
                        {receiptImageName ? (
                          <span className="text-purple-600 font-semibold">{receiptImageName}</span>
                        ) : (
                          <span>Click to upload JPEG, JPG or PNG</span>
                        )}
                      </p>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Status Display */}
              {aiSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-[11px] text-emerald-800 flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{aiSuccess}</span>
                </div>
              )}
              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-[11px] text-rose-800 flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{aiError}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={aiVerifying}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2"
              >
                {aiVerifying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                    <span>AI Auditor auditing receipt...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-3.5 h-3.5 text-purple-400" />
                    <span>Scan & Reflex Funds with AI</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right column: Ledger details and Chat Assistant */}
        <div className="lg:col-span-2 space-y-4 flex flex-col">
          {/* Tab selector bar */}
          <div className="bg-slate-100 p-1 rounded-2xl flex space-x-1 border border-slate-200 shrink-0">
            <button
              onClick={() => setActiveRightTab('ledger')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeRightTab === 'ledger'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Transactions Ledger</span>
            </button>
            <button
              onClick={() => setActiveRightTab('assistant')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-2 ${
                activeRightTab === 'assistant'
                  ? 'bg-white text-purple-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span className="relative">
                AI Support Assistant
                <span className="absolute -top-1 -right-2.5 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
                </span>
              </span>
            </button>
          </div>

          {activeRightTab === 'ledger' ? (
            <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex-1">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-3">
                <h3 className="font-display font-bold text-slate-900 text-sm flex items-center">
                  <History className="w-4 h-4 mr-1.5 text-purple-600" /> Wallet Transactions Ledger
                </h3>
                <button
                  onClick={loadTransactions}
                  className="p-1.5 hover:bg-slate-50 transition-colors rounded-lg text-purple-600"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {transactions.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">No transactions recorded yet.</div>
              ) : (
                <div className="divide-y divide-slate-50 max-h-[460px] overflow-y-auto pr-1">
                  {transactions.map((tx) => {
                    const isNegative = parseFloat(tx.amount) < 0;
                    const absAmount = Math.abs(parseFloat(tx.amount));
                    return (
                      <div key={tx.id} className="py-3.5 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isNegative ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                            }`}
                          >
                            <TrendingUp className={`w-4 h-4 ${isNegative ? 'rotate-180' : ''}`} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-800 leading-snug">
                              {tx.description}
                            </p>
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {new Date(tx.createdAt).toLocaleDateString([], {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
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
                            {isNegative ? '-' : '+'}₦{absAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <div className="mt-0.5">{getTxTypeBadge(tx.type)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col h-[520px]">
              <div className="flex justify-between items-center pb-3 border-b border-slate-50 mb-3 shrink-0">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                    <Bot className="w-4 h-4 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-slate-900 text-sm">
                      Jazzy AI Support Concierge
                    </h3>
                    <p className="text-[10px] text-emerald-600 font-medium">● Assistant Online</p>
                  </div>
                </div>
              </div>

              {/* Chat messages viewport */}
              <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-4 text-xs scrollbar-thin">
                {chatMessages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start space-x-2.5 max-w-[85%] ${
                        isUser ? 'ml-auto flex-row-reverse space-x-reverse' : 'mr-auto'
                      }`}
                    >
                      <div
                        className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center ${
                          isUser ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5 text-purple-600" />}
                      </div>
                      <div className="space-y-1">
                        <div
                          className={`p-3 rounded-2xl leading-relaxed shadow-xs ${
                            isUser
                              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-tr-none'
                              : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.content}</p>
                        </div>
                        <span className={`text-[8px] text-slate-400 block ${isUser ? 'text-right' : 'text-left'}`}>
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}

                {chatSending && (
                  <div className="flex items-start space-x-2.5 max-w-[85%] mr-auto animate-pulse">
                    <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                      <Bot className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                    </div>
                    <div className="bg-slate-50 text-slate-500 border border-slate-100 p-3 rounded-2xl rounded-tl-none flex items-center space-x-1.5">
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animate-duration-1000"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animate-duration-1000 delay-150"></span>
                      <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce animate-duration-1000 delay-300"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Prompt suggestions */}
              <div className="flex flex-wrap gap-1.5 pb-3 shrink-0">
                <button
                  onClick={() => handleSendChatMessage(undefined, 'How can I fund my wallet?')}
                  disabled={chatSending}
                  className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-medium hover:bg-purple-100/50 transition-colors"
                >
                  💳 How to fund?
                </button>
                <button
                  onClick={() => handleSendChatMessage(undefined, 'My payment has not been credited. Can you help?')}
                  disabled={chatSending}
                  className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-medium hover:bg-purple-100/50 transition-colors"
                >
                  ⚡ Deposit not reflecting
                </button>
                <button
                  onClick={() => handleSendChatMessage(undefined, 'Where is the Flutterwave checkout link?')}
                  disabled={chatSending}
                  className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-100 rounded-lg text-[10px] font-medium hover:bg-purple-100/50 transition-colors"
                >
                  🔗 Payment link
                </button>
              </div>

              {/* Chat Input panel */}
              <form onSubmit={handleSendChatMessage} className="flex space-x-2 shrink-0">
                <input
                  type="text"
                  placeholder="Ask any payment support question here..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  disabled={chatSending}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs focus:outline-none focus:border-purple-300 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  disabled={chatSending || !chatInput.trim()}
                  className="p-2.5 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50 rounded-xl transition-all shadow-sm shadow-purple-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Floating success notice */}
      {fundSuccess && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-purple-50 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 text-base">Payment Session Created</h3>
              <p className="text-xs text-slate-500 mt-1 leading-normal">
                Reference: <code className="font-mono bg-slate-50 px-1.5 py-0.5 rounded text-purple-600">{fundSuccess.reference}</code>
              </p>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed bg-slate-50 p-3.5 rounded-2xl">
              Your transaction has been initialized securely. Please proceed to checkout to complete your payment.
            </p>
            <div className="space-y-2 pt-2">
              <a
                href={fundSuccess.checkoutUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-200 block text-center"
              >
                Go to Payment Gateway
              </a>
              
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/wallet/verify/${fundSuccess.reference}`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const checkData = await res.json();
                    if (res.ok && checkData.success) {
                      alert('Payment verified! Your wallet has been credited.');
                      setFundSuccess(null);
                      await refreshUser();
                      await loadTransactions();
                    } else {
                      alert(checkData.error || 'Transaction is still pending checkout.');
                    }
                  } catch (err) {
                    alert('Error checking transaction status.');
                  }
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Verify Payment Status
              </button>

              <button
                id="close-funding-success-btn"
                onClick={() => setFundSuccess(null)}
                className="w-full py-2 text-slate-400 hover:text-slate-600 text-xs font-semibold transition-colors block text-center"
              >
                Cancel / Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
