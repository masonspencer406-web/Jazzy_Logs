import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  Globe,
  MessageSquare,
  Clock,
  AlertCircle,
  RefreshCw,
  Play,
  CheckCircle2,
  Inbox,
} from 'lucide-react';
import { PhoneNumber, User } from '../types.ts';

interface BuyNumbersViewProps {
  user: User | null;
  token: string | null;
  refreshUser: () => Promise<void>;
}

export const BuyNumbersView: React.FC<BuyNumbersViewProps> = ({
  user,
  token,
  refreshUser,
}) => {
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [rentedNumbers, setRentedNumbers] = useState<PhoneNumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [rentingId, setRentingId] = useState<number | null>(null);

  const [selectedCountry, setSelectedCountry] = useState('All');
  const [selectedService, setSelectedService] = useState('All');

  // Active selected rented number details for SMS logs checking
  const [activeRental, setActiveRental] = useState<PhoneNumber | null>(null);
  const [activeSmsLogs, setActiveSmsLogs] = useState<any[]>([]);
  const [pollingActive, setPollingActive] = useState(false);

  // Load numbers catalogue & active rentals
  const loadData = async () => {
    setLoading(true);
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };

      // Available numbers
      const resAvail = await fetch('/api/numbers/available', { headers: authHeader });
      if (resAvail.ok) {
        setAvailableNumbers(await resAvail.json());
      }

      // Rented numbers
      const resRented = await fetch('/api/numbers/rented', { headers: authHeader });
      if (resRented.ok) {
        const rentedList = await resRented.json();
        setRentedNumbers(rentedList);

        // Auto-select first active rental if nothing is selected yet
        const activeOne = rentedList.find((r: PhoneNumber) => r.status === 'active');
        if (activeOne && !activeRental) {
          setActiveRental(activeOne);
        }
      }
    } catch (err) {
      console.error('Error loading virtual number workspace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  // Rent handler
  const handleRentNumber = async (num: PhoneNumber) => {
    const balanceNum = parseFloat(user?.wallet?.balance || '0.00');
    const priceNum = parseFloat(num.price);

    if (balanceNum < priceNum) {
      alert('Insufficient wallet balance. Please fund your wallet.');
      return;
    }

    if (!window.confirm(`Rent virtual number ${num.number} for ${num.service} at ₦${priceNum.toLocaleString()}?`)) {
      return;
    }

    setRentingId(num.id);
    try {
      const res = await fetch('/api/numbers/rent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ numberId: num.id }),
      });

      const data = await res.json();
      if (res.ok) {
        alert('Virtual number successfully activated!');
        setActiveRental(data.numberDetails);
        await refreshUser();
        await loadData();
      } else {
        alert(data.error || 'Failed to rent virtual number.');
      }
    } catch (err) {
      console.error('Rent error:', err);
      alert('An unexpected error occurred during activation.');
    } finally {
      setRentingId(null);
    }
  };

  // Poll SMS logs for active selection
  const fetchSMSLogs = async () => {
    if (!activeRental || !token) return;
    try {
      const res = await fetch(`/api/numbers/${activeRental.id}/sms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSmsLogs(data.smsLogs);
      }
    } catch (err) {
      console.error('SMS polling error:', err);
    }
  };

  // Poll intervals
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeRental && activeRental.status === 'active') {
      fetchSMSLogs(); // fetch immediately
      interval = setInterval(() => {
        fetchSMSLogs();
      }, 4000); // Poll every 4 seconds
      setPollingActive(true);
    } else {
      setActiveSmsLogs([]);
      setPollingActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeRental, token]);

  // Manual trigger
  const handlePollSMSManual = () => {
    if (activeRental) {
      fetchSMSLogs();
    }
  };

  // Filter available numbers
  const filteredAvailable = availableNumbers.filter((num) => {
    if (selectedCountry !== 'All' && num.country !== selectedCountry) return false;
    if (selectedService !== 'All' && num.service !== selectedService) return false;
    return true;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900">
            Virtual Number SMS Verification
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rent secure, legal temporary communication numbers to receive authorized account verifications.
          </p>
        </div>
        <button
          onClick={loadData}
          className="self-start md:self-auto px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Workspace</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Rent Number Catalog */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filters card */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="w-full md:w-auto flex items-center space-x-2 text-slate-800 font-display font-semibold text-sm">
              <Globe className="w-4 h-4 text-purple-600" />
              <span>Select Service Requirements:</span>
            </div>

            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
              {/* Country selector */}
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Countries</option>
                <option value="NG">Nigeria (NG)</option>
                <option value="US">United States (US)</option>
                <option value="UK">United Kingdom (UK)</option>
                <option value="ZA">South Africa (ZA)</option>
              </select>

              {/* Service selector */}
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Services</option>
                <option value="WhatsApp">WhatsApp</option>
                <option value="Telegram">Telegram</option>
                <option value="OpenAI">OpenAI</option>
                <option value="Google">Google</option>
              </select>
            </div>
          </div>

          {/* Numbers list */}
          {loading ? (
            <div className="bg-white p-6 rounded-3xl space-y-4 animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl w-full" />
              ))}
            </div>
          ) : filteredAvailable.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-purple-100">
              <Inbox className="w-12 h-12 text-purple-200 mx-auto mb-3" />
              <p className="text-slate-500 font-semibold text-sm">No temporary numbers available currently.</p>
              <p className="text-slate-400 text-xs mt-1">Try changing country or service options.</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              <div className="p-4 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex justify-between">
                <span>Number & Country</span>
                <span className="text-right">Price & Activation</span>
              </div>

              {filteredAvailable.map((num) => {
                const price = parseFloat(num.price);
                return (
                  <div
                    key={num.id}
                    id={`number-row-${num.id}`}
                    className="p-4 hover:bg-slate-50/50 flex justify-between items-center transition-colors"
                  >
                    <div className="flex items-center space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm">
                        {num.country}
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 text-sm">
                          {num.number}
                        </h4>
                        <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                          <span>{num.countryName}</span>
                          <span>•</span>
                          <span className="text-purple-600 font-semibold">{num.service}</span>
                          <span>•</span>
                          <span>{num.duration}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm block">
                          ₦{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      <button
                        id={`rent-num-btn-${num.id}`}
                        disabled={rentingId === num.id}
                        onClick={() => handleRentNumber(num)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
                      >
                        {rentingId === num.id ? 'Loading...' : 'Rent'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: SMS Incoming Verification Board */}
        <div className="lg:col-span-1 space-y-5">
          <div className="bg-slate-900 text-white p-5 rounded-3xl shadow-xl space-y-4 border border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <h3 className="font-display font-semibold text-sm">SMS Verification Vault</h3>
              </div>
              {activeRental && (
                <button
                  onClick={handlePollSMSManual}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 transition-colors text-purple-400 rounded-lg text-xs flex items-center space-x-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Active Rental info */}
            {activeRental ? (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold block">
                    Active Phone Number
                  </span>
                  <p className="text-lg font-mono font-bold text-white mt-0.5">{activeRental.number}</p>
                  <div className="flex items-center justify-between text-[11px] text-purple-300 mt-2">
                    <span className="font-semibold">{activeRental.service}</span>
                    <span className="flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1" />
                      15 min window
                    </span>
                  </div>
                </div>

                {/* SMS incoming logs */}
                <div className="space-y-3">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                    Incoming SMS Code Inbox
                  </span>

                  {activeSmsLogs.length === 0 ? (
                    <div className="bg-slate-950 p-6 rounded-2xl text-center border border-slate-800/40 text-slate-500 text-xs space-y-2">
                      <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                        <MessageSquare className="w-4 h-4 animate-pulse" />
                      </div>
                      <p className="font-medium">Waiting for verification code...</p>
                      <p className="text-[10px] text-slate-600 leading-normal">
                        Simulating secure integration: SMS code will appear automatically in 15 seconds after rental.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {activeSmsLogs.map((log: any, idx: number) => (
                        <div
                          key={idx}
                          className="bg-purple-950/40 border border-purple-800/40 p-4 rounded-2xl space-y-2 animate-bounce"
                        >
                          <div className="flex justify-between items-center text-[10px]">
                            <span className="font-bold text-purple-400 uppercase tracking-wider">
                              From: {log.sender}
                            </span>
                            <span className="text-slate-500">Just Now</span>
                          </div>
                          <p className="text-sm font-mono text-purple-200 leading-relaxed font-semibold">
                            {log.text}
                          </p>
                          <div className="pt-2 border-t border-purple-900/30 flex justify-between items-center">
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Verified Code
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs space-y-2">
                <PhoneCall className="w-10 h-10 text-slate-800 mx-auto mb-2" />
                <p className="font-medium text-slate-400">No active temporary rental selected.</p>
                <p className="text-[10px] text-slate-600 max-w-[180px] mx-auto leading-normal">
                  Rent a virtual phone number from the left list to enable SMS verifications.
                </p>
              </div>
            )}
          </div>

          {/* Rented history list summary */}
          {rentedNumbers.length > 0 && (
            <div className="bg-white p-4 rounded-3xl border border-purple-100 shadow-sm space-y-3">
              <h4 className="font-display font-semibold text-xs text-slate-400 uppercase tracking-wider">
                My Number Rentals History
              </h4>
              <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto pr-1">
                {rentedNumbers.map((rented) => {
                  const isActive = activeRental?.id === rented.id;
                  return (
                    <button
                      key={rented.id}
                      onClick={() => setActiveRental(rented)}
                      className={`w-full text-left py-2 px-1 rounded-lg flex justify-between items-center transition-colors ${
                        isActive ? 'bg-purple-50 text-purple-900' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div>
                        <p className="text-xs font-mono font-bold text-slate-800">
                          {rented.number}
                        </p>
                        <span className="text-[9px] text-slate-400 block">
                          {rented.service} • {rented.countryName}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          rented.status === 'active'
                            ? 'bg-emerald-50 text-emerald-600 animate-pulse'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {rented.status}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
