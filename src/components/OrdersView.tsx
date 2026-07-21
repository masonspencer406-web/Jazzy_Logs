import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Eye,
  Copy,
  RefreshCw,
  Search,
  Box,
} from 'lucide-react';
import { Order, User } from '../types.ts';

interface OrdersViewProps {
  user: User | null;
  token: string | null;
}

export const OrdersView: React.FC<OrdersViewProps> = ({ user, token }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Selected order details for popup view
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedText, setCopiedText] = useState(false);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (err) {
      console.error('Error loading orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadOrders();
    }
  }, [token]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            Completed
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refunded
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold uppercase tracking-wider rounded-full animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Pending
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-rose-50 text-rose-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
            {status}
          </span>
        );
    }
  };

  // Filter orders by search
  const filteredOrders = orders.filter((o) => {
    if (!search) return true;
    const s = search.toLowerCase();
    const matchesId = String(o.id).includes(s);
    const matchesItems = o.items?.some((item) =>
      item.deliveredDetails?.toLowerCase().includes(s)
    );
    return matchesId || matchesItems;
  });

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900">
            My Orders History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            View your purchased digital credentials, logs, and account deliveries securely.
          </p>
        </div>
        <button
          onClick={loadOrders}
          className="self-start md:self-auto px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh List</span>
        </button>
      </div>

      {/* Search orders */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by Order ID or item details..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-white border border-purple-100/70 rounded-2xl text-sm focus:outline-none focus:border-purple-300 shadow-sm"
        />
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="bg-white rounded-3xl border border-purple-50 p-6 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-slate-100 rounded-xl" />
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-purple-100">
          <Box className="w-12 h-12 text-purple-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold text-sm">No orders recorded yet.</p>
          <p className="text-slate-400 text-xs mt-1">Purchased accounts or numbers will appear here securely.</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden divide-y divide-slate-100">
          <div className="hidden md:flex p-4 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 justify-between">
            <div className="flex-1">Order Summary</div>
            <div className="w-32 text-center">Amount</div>
            <div className="w-32 text-center">Status</div>
            <div className="w-24 text-right">Action</div>
          </div>

          {filteredOrders.map((order) => {
            const dateStr = new Date(order.createdAt).toLocaleDateString([], {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const firstItemDetails = order.items?.[0]?.deliveredDetails || 'Digital delivery';
            const price = parseFloat(order.totalAmount);

            return (
              <div
                key={order.id}
                id={`order-row-${order.id}`}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors"
              >
                {/* ID & Date */}
                <div className="flex-1 flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm shrink-0">
                    #{order.id}
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate max-w-[240px] md:max-w-md">
                      {firstItemDetails.split('|')[0] || 'Marketplace Item'}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">{dateStr}</p>
                  </div>
                </div>

                {/* Amount */}
                <div className="flex justify-between md:block md:w-32 md:text-center shrink-0">
                  <span className="md:hidden text-xs text-slate-400 font-semibold uppercase">Amount</span>
                  <span className="font-bold text-slate-900 text-sm">
                    ₦{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Status badge */}
                <div className="flex justify-between md:block md:w-32 md:text-center shrink-0">
                  <span className="md:hidden text-xs text-slate-400 font-semibold uppercase">Status</span>
                  {getStatusBadge(order.status)}
                </div>

                {/* Action button */}
                <div className="text-right shrink-0">
                  <button
                    id={`view-order-btn-${order.id}`}
                    onClick={() => setSelectedOrder(order)}
                    className="w-full md:w-auto px-4 py-2 border border-purple-100 hover:bg-purple-50 text-purple-600 rounded-xl text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Delivery</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order details modal overlay */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-purple-50">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-3 text-purple-600">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center font-bold">
                  #{selectedOrder.id}
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">Delivery Vault</h3>
                  <p className="text-[10px] text-slate-400">
                    Purchased on{' '}
                    {new Date(selectedOrder.createdAt).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div>{getStatusBadge(selectedOrder.status)}</div>
            </div>

            {/* Price section */}
            <div className="flex justify-between items-center bg-purple-50/50 border border-purple-50 p-3 rounded-2xl">
              <span className="text-xs text-purple-800 font-semibold">Total Price Paid:</span>
              <span className="text-base font-bold text-slate-900">
                ₦{parseFloat(selectedOrder.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>

            {/* Delivery log credentials section */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Deliverable login details
              </span>

              {selectedOrder.status === 'refunded' ? (
                <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 flex items-center space-x-2 text-xs">
                  <AlertTriangle className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Details retracted. This order was refunded and closed.</span>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-semibold text-purple-600 uppercase tracking-widest block">
                      Secure Credentials
                    </span>
                    <button
                      id="order-details-copy-btn"
                      onClick={() => handleCopy(selectedOrder.items?.[0]?.deliveredDetails || '')}
                      className="text-purple-600 hover:text-purple-700 transition-colors flex items-center space-x-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-semibold">{copiedText ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-xs font-mono bg-slate-900 text-purple-300 p-3 rounded-xl overflow-x-auto whitespace-pre-wrap select-all leading-relaxed">
                    {selectedOrder.items?.[0]?.deliveredDetails || 'No delivered credentials logs found.'}
                  </pre>
                  <span className="text-[9px] text-slate-400 block italic leading-normal">
                    Format: login_id:password|email:password|auth_token/cookie
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <button
              id="close-order-details-btn"
              onClick={() => setSelectedOrder(null)}
              className="w-full py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
