import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  TrendingUp,
  CreditCard,
  ShoppingBag,
  Database,
  PlusCircle,
  Trash2,
  Edit,
  UserCheck,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  Loader2,
  ListFilter,
  FileSpreadsheet,
  Lock,
} from 'lucide-react';
import { User, AdminStats, Product, Order } from '../types.ts';

interface AdminViewProps {
  user: User | null;
  token: string | null;
  onLockAdmin?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({ user, token, onLockAdmin }) => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [paymentsList, setPaymentsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Sub-tabs
  const [adminSubTab, setAdminSubTab] = useState<'stats' | 'catalog' | 'payments' | 'orders' | 'users'>('stats');

  // Catalogue forms states
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [platform, setPlatform] = useState('Facebook');
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('Nigeria');
  const [ageDetails, setAgeDetails] = useState('');
  const [price, setPrice] = useState('');
  const [categoryName, setCategoryName] = useState('Facebook');
  const [addingProduct, setAddingProduct] = useState(false);

  // Inventory forms states
  const [showAddInventory, setShowAddInventory] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [loginDetails, setLoginDetails] = useState('');
  const [addingInventory, setAddingInventory] = useState(false);

  // Edit product details
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const authHeader = { 'Authorization': `Bearer ${token}` };

      // Stats
      const resStats = await fetch('/api/admin/stats', { headers: authHeader });
      if (resStats.ok) setStats(await resStats.json());

      // Products (Catalogue)
      const resProd = await fetch('/api/products?platform=All&region=All', { headers: authHeader });
      if (resProd.ok) setProductsList(await resProd.json());

      // Orders
      const resOrders = await fetch('/api/admin/orders', { headers: authHeader });
      if (resOrders.ok) setOrdersList(await resOrders.json());

      // Users
      const resUsers = await fetch('/api/admin/users', { headers: authHeader });
      if (resUsers.ok) setUsersList(await resUsers.json());

      // Payments
      const resPayments = await fetch('/api/admin/payments', { headers: authHeader });
      if (resPayments.ok) setPaymentsList(await resPayments.json());
    } catch (err) {
      console.error('Error loading admin analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadAdminData();
    }
  }, [token]);

  // Handle Add Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!platform || !title || !region || !price) return;

    setAddingProduct(true);
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          platform,
          title,
          region,
          ageDetails,
          price,
          stock: 0,
          categoryName,
        }),
      });

      if (res.ok) {
        alert('Product successfully added to catalog!');
        setTitle('');
        setAgeDetails('');
        setPrice('');
        setShowAddProduct(false);
        await loadAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to add product');
      }
    } catch (err) {
      console.error('Add product error:', err);
    } finally {
      setAddingProduct(false);
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this product catalog entry? All its inventory will be deleted.')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        alert('Product deleted successfully');
        await loadAdminData();
      }
    } catch (err) {
      console.error('Delete product error:', err);
    }
  };

  // Handle Edit Product
  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const res = await fetch(`/api/admin/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingProduct),
      });

      if (res.ok) {
        alert('Product updated successfully!');
        setEditingProduct(null);
        await loadAdminData();
      }
    } catch (err) {
      console.error('Edit error:', err);
    }
  };

  // Handle Add Inventory login credential details
  const handleAddInventorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !loginDetails) return;

    setAddingInventory(true);
    try {
      const res = await fetch('/api/admin/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: selectedProductId, loginDetails }),
      });

      if (res.ok) {
        alert('Stock item successfully added to inventory vault!');
        setLoginDetails('');
        setShowAddInventory(false);
        await loadAdminData();
      } else {
        const d = await res.json();
        alert(d.error || 'Failed to add inventory item.');
      }
    } catch (err) {
      console.error('Add inventory error:', err);
    } finally {
      setAddingInventory(false);
    }
  };

  // Handle Refund Request
  const handleRefundOrder = async (orderId: number) => {
    if (!window.confirm(`Are you sure you want to refund Order #${orderId}? This will credit the user wallet and restore item stock.`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/orders/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });

      const d = await res.json();
      if (res.ok) {
        alert('Order refunded successfully and ledger updated.');
        await loadAdminData();
      } else {
        alert(d.error || 'Failed to process refund request.');
      }
    } catch (err) {
      console.error('Refund request error:', err);
    }
  };

  // Handle User Role Toggle
  const handleToggleUserRole = async (targetUid: string, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Are you sure you want to change this user's role to ${nextRole}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ targetUid, role: nextRole }),
      });

      if (res.ok) {
        alert(`User role changed to ${nextRole} successfully.`);
        await loadAdminData();
      }
    } catch (err) {
      console.error('Role toggle error:', err);
    }
  };

  // Manual User Wallet adjustments states
  const [fundingUser, setFundingUser] = useState<any | null>(null);
  const [fundAmount, setFundAmount] = useState('');
  const [fundType, setFundType] = useState<'credit' | 'debit'>('credit');
  const [fundDescription, setFundDescription] = useState('');
  const [submittingFund, setSubmittingFund] = useState(false);

  const handleAdjustUserWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fundingUser || !fundAmount || parseFloat(fundAmount) <= 0) return;

    setSubmittingFund(true);
    try {
      const res = await fetch('/api/admin/users/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetUid: fundingUser.uid,
          amount: fundAmount,
          type: fundType,
          description: fundDescription || `Wallet manual ${fundType} by Administrator`
        })
      });

      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Wallet adjusted successfully!');
        setFundingUser(null);
        setFundAmount('');
        setFundDescription('');
        await loadAdminData();
      } else {
        alert(d.error || 'Failed to adjust wallet balance.');
      }
    } catch (err) {
      console.error('Adjust wallet balance error:', err);
    } finally {
      setSubmittingFund(false);
    }
  };

  const handleApprovePayment = async (reference: string, amount: string) => {
    if (!window.confirm(`Are you sure you want to approve payment reference ${reference} for ₦${parseFloat(amount).toLocaleString()}?`)) {
      return;
    }
    try {
      const res = await fetch('/api/admin/payments/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reference, amount })
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Payment approved & wallet credited successfully!');
        await loadAdminData();
      } else {
        alert(d.error || 'Failed to approve payment.');
      }
    } catch (err) {
      console.error('Approve payment error:', err);
    }
  };

  const handleDeclinePayment = async (id: number) => {
    if (!window.confirm('Are you sure you want to decline this payment request?')) {
      return;
    }
    try {
      const res = await fetch('/api/admin/payments/decline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ id })
      });
      const d = await res.json();
      if (res.ok) {
        alert(d.message || 'Payment request declined.');
        await loadAdminData();
      } else {
        alert(d.error || 'Failed to decline payment.');
      }
    } catch (err) {
      console.error('Decline payment error:', err);
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6 animate-fade-in">
      {/* Header title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center space-x-2.5">
          <ShieldAlert className="w-6 h-6 text-amber-500" />
          <div>
            <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900">
              Admin Control Panel
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Secure platform metrics, product catalogue editor, inventory upload, and user role overrides.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start md:self-auto">
          <button
            onClick={loadAdminData}
            className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh System Data</span>
          </button>
          {onLockAdmin && (
            <button
              onClick={onLockAdmin}
              className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-rose-600" />
              <span>Lock & Exit Portal</span>
            </button>
          )}
        </div>
      </div>

      {/* Admin navigation sub-tabs */}
      <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-max flex-wrap gap-y-1">
        {[
          { id: 'stats', label: 'Stats Analytics', icon: TrendingUp },
          { id: 'catalog', label: 'Manage Catalog', icon: Database },
          { id: 'payments', label: 'Payment Requests', icon: CreditCard },
          { id: 'orders', label: 'System Orders', icon: FileSpreadsheet },
          { id: 'users', label: 'Users Directory', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = adminSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setAdminSubTab(tab.id as any)}
              className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-slate-600 hover:text-purple-600'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 text-xs flex flex-col items-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span>Loading system data logs...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* TAB 1: OVERVIEW METRICS */}
          {adminSubTab === 'stats' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-purple-50 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Sales Revenue</span>
                  <h3 className="text-2xl font-bold text-slate-900 mt-1">
                    ₦{stats.totalSales.toLocaleString()}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-purple-50 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Deposits (Fundings)</span>
                  <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                    ₦{stats.totalDeposits.toLocaleString()}
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-purple-50 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total Platform Users</span>
                  <h3 className="text-2xl font-bold text-purple-600 mt-1">
                    {stats.totalUsers} users
                  </h3>
                </div>
                <div className="bg-white p-5 rounded-3xl border border-purple-50 shadow-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block">Stock Items Available</span>
                  <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                    {stats.availableInventory} items
                  </h3>
                </div>
              </div>

              {/* Security warning card */}
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 leading-normal">
                  <span className="font-semibold block mb-0.5">Role-Based Access Control Alert</span>
                  You are logged in as an Administrator. You have full root credentials to view transaction references, manage product stocks, override pricing parameters, and perform order refunds directly.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MANAGE CATALOGUE */}
          {adminSubTab === 'catalog' && (
            <div className="space-y-6">
              {/* Controls bar */}
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowAddProduct(!showAddProduct);
                    setEditingProduct(null);
                    setShowAddInventory(false);
                  }}
                  className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add Product Catalog Entry</span>
                </button>
              </div>

              {/* FORM: ADD PRODUCT CATALOG */}
              {showAddProduct && (
                <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-900 text-sm">Add New Catalogue Product</h3>
                  <form onSubmit={handleAddProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Platform</label>
                      <select
                        value={platform}
                        onChange={(e) => {
                          setPlatform(e.target.value);
                          setCategoryName(e.target.value);
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs font-semibold focus:outline-none"
                      >
                        <option value="Facebook">Facebook</option>
                        <option value="Instagram">Instagram</option>
                        <option value="TikTok">TikTok</option>
                        <option value="X/Twitter">X/Twitter</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Product Description</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Aged Page (Created 2020) with ad accounts"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Region</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nigeria, US, Worldwide"
                        value={region}
                        onChange={(e) => setRegion(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Age Details</label>
                      <input
                        type="text"
                        placeholder="e.g. Created 2020, Fresh, ID Verified"
                        value={ageDetails}
                        onChange={(e) => setAgeDetails(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price (₦)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 15000"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddProduct(false)}
                        className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingProduct}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold"
                      >
                        {addingProduct ? 'Adding...' : 'Add Catalog Entry'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* FORM: ADD INVENTORY CREDENTIAL STOCK */}
              {showAddInventory && selectedProductId && (
                <div className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-900 text-sm">
                    Stock Inventory Upload
                  </h3>
                  <div className="bg-slate-50 p-3 rounded-xl border text-[11px] text-slate-500">
                    Adding credentials for Product ID: <b>#{selectedProductId}</b>. Enter login details format exactly.
                  </div>

                  <form onSubmit={handleAddInventorySubmit} className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Login / Credential Details</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="username:password|email:emailpass|auth_token_or_cookie"
                        value={loginDetails}
                        onChange={(e) => setLoginDetails(e.target.value)}
                        className="w-full p-3 bg-slate-50 border rounded-lg text-xs font-mono"
                      />
                      <span className="text-[9px] text-slate-400 mt-1 block">
                        Credentials will remain encrypted and securely hidden. Delivered to user instantly upon purchase.
                      </span>
                    </div>

                    <div className="flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddInventory(false)}
                        className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={addingInventory}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold"
                      >
                        {addingInventory ? 'Uploading...' : 'Save Stock'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* FORM: EDIT PRODUCT ENTRY */}
              {editingProduct && (
                <div className="bg-white p-5 rounded-3xl border border-amber-100 shadow-sm space-y-4">
                  <h3 className="font-display font-bold text-slate-900 text-sm">Edit Product Catalog Entry #{editingProduct.id}</h3>
                  <form onSubmit={handleEditProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Title</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.title}
                        onChange={(e) => setEditingProduct({ ...editingProduct, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Region</label>
                      <input
                        type="text"
                        required
                        value={editingProduct.region}
                        onChange={(e) => setEditingProduct({ ...editingProduct, region: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Price (₦)</label>
                      <input
                        type="number"
                        required
                        value={editingProduct.price}
                        onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Age Details</label>
                      <input
                        type="text"
                        value={editingProduct.ageDetails || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, ageDetails: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border rounded-lg text-xs"
                      />
                    </div>

                    <div className="md:col-span-2 flex justify-end space-x-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(null)}
                        className="px-4 py-2 border rounded-lg text-xs font-bold text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold"
                      >
                        Save Changes
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Catalogue grid Table */}
              <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden divide-y divide-slate-100">
                <div className="hidden md:flex p-4 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 justify-between">
                  <div className="flex-1">Platform & Description</div>
                  <div className="w-24 text-center">Price</div>
                  <div className="w-24 text-center">Stock</div>
                  <div className="w-48 text-right">Actions</div>
                </div>

                {productsList.map((prod) => (
                  <div key={prod.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md">
                          {prod.platform}
                        </span>
                        <span className="text-xs text-slate-400">ID: #{prod.id}</span>
                      </div>
                      <h4 className="font-semibold text-slate-800 text-sm mt-1">{prod.title}</h4>
                      <p className="text-[10px] text-slate-400">{prod.region} • {prod.ageDetails || 'Fresh'}</p>
                    </div>

                    <div className="flex justify-between md:block md:w-24 md:text-center shrink-0">
                      <span className="md:hidden text-xs text-slate-400 font-semibold">Price</span>
                      <span className="font-bold text-slate-800 text-xs">
                        ₦{parseFloat(prod.price).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between md:block md:w-24 md:text-center shrink-0">
                      <span className="md:hidden text-xs text-slate-400 font-semibold">Stock</span>
                      <span className="font-bold text-purple-600 text-xs">{prod.stock} left</span>
                    </div>

                    <div className="flex flex-wrap md:w-48 justify-end gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setSelectedProductId(prod.id);
                          setShowAddInventory(true);
                          setShowAddProduct(false);
                          setEditingProduct(null);
                        }}
                        className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-[10px] transition-all"
                      >
                        + Stock
                      </button>
                      <button
                        onClick={() => setEditingProduct(prod)}
                        className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: SYSTEM ORDERS LOGS (with direct Refund capability) */}
          {adminSubTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              <div className="hidden md:flex p-4 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 justify-between">
                <div className="w-24">Order ID</div>
                <div className="flex-1">Buyer & Items</div>
                <div className="w-28 text-center">Amount</div>
                <div className="w-28 text-center">Status</div>
                <div className="w-32 text-right">Refund Action</div>
              </div>

              {ordersList.length === 0 ? (
                <div className="py-20 text-center text-slate-400 text-xs">No orders recorded on the platform yet.</div>
              ) : (
                ordersList.map((ord) => (
                  <div key={ord.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="md:w-24 shrink-0">
                      <span className="font-bold text-slate-900 text-xs block">#{ord.id}</span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-800 text-xs truncate">
                        Buyer: {ord.email}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        {ord.items?.[0]?.deliveredDetails?.split('|')[0] || 'Marketplace Item'}
                      </p>
                    </div>

                    <div className="flex justify-between md:block md:w-28 md:text-center shrink-0">
                      <span className="md:hidden text-xs text-slate-400 font-semibold">Amount</span>
                      <span className="font-bold text-slate-900 text-xs">
                        ₦{parseFloat(ord.totalAmount).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex justify-between md:block md:w-28 md:text-center shrink-0">
                      <span className="md:hidden text-xs text-slate-400 font-semibold">Status</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider ${
                          ord.status === 'completed'
                            ? 'text-emerald-600'
                            : ord.status === 'refunded'
                            ? 'text-indigo-600'
                            : 'text-slate-500'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-right md:w-32 shrink-0">
                      {ord.status === 'completed' ? (
                        <button
                          onClick={() => handleRefundOrder(ord.id)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all border border-rose-100"
                        >
                          Refund
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No Actions</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB: PAYMENT REQUESTS (Approve / Decline) */}
          {adminSubTab === 'payments' && (
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-purple-50 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-sm">
                    Deposit & Payment Verification Requests
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Review and approve incoming bank transfers, Flutterwave gateway payments, and manually uploaded receipts.
                  </p>
                </div>
                <div className="text-xs bg-purple-100 text-purple-800 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
                  {paymentsList.filter(p => p.status === 'pending').length} Pending
                </div>
              </div>

              <div className="hidden md:flex p-4 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 justify-between border-b">
                <div className="w-32">Sender</div>
                <div className="flex-1">Reference & Gateway</div>
                <div className="w-28 text-center">Amount (₦)</div>
                <div className="w-24 text-center">Status</div>
                <div className="w-48 text-right">Actions</div>
              </div>

              <div className="divide-y divide-slate-100">
                {paymentsList.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 text-xs">
                    No payment transactions recorded yet.
                  </div>
                ) : (
                  paymentsList.map((pay) => (
                    <div key={pay.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Sender details */}
                      <div className="md:w-32 shrink-0">
                        <span className="font-bold text-slate-900 text-xs block">
                          {pay.fullName}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          @{pay.username}
                        </span>
                        <span className="text-[9px] text-slate-400 block truncate">
                          {pay.email}
                        </span>
                      </div>

                      {/* Payment details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                            {pay.reference}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            via {pay.paymentGateway}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">
                          Created: {new Date(pay.createdAt).toLocaleString()}
                        </span>
                      </div>

                      {/* Amount */}
                      <div className="flex justify-between md:block md:w-28 md:text-center shrink-0">
                        <span className="md:hidden text-xs text-slate-400 font-semibold">Amount</span>
                        <span className="font-bold text-slate-900 text-sm">
                          ₦{parseFloat(pay.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* Status */}
                      <div className="flex justify-between md:block md:w-24 md:text-center shrink-0">
                        <span className="md:hidden text-xs text-slate-400 font-semibold">Status</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                            pay.status === 'success'
                              ? 'text-emerald-700 bg-emerald-50'
                              : pay.status === 'failed'
                              ? 'text-rose-700 bg-rose-50'
                              : 'text-amber-700 bg-amber-50 animate-pulse'
                          }`}
                        >
                          {pay.status}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end space-x-2 md:w-48 shrink-0">
                        {pay.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => handleApprovePayment(pay.reference, pay.amount)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleDeclinePayment(pay.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl transition-all border border-rose-100"
                            >
                              Decline
                            </button>
                          </>
                        ) : pay.status === 'success' ? (
                          <div className="text-emerald-600 text-xs font-bold flex items-center space-x-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Approved & Credited</span>
                          </div>
                        ) : (
                          <div className="text-rose-500 text-xs font-bold italic">
                            Declined/Failed
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: USERS DIRECTORY (Role-management) */}
          {adminSubTab === 'users' && (
            <div className="bg-white rounded-3xl border border-purple-100 shadow-sm overflow-hidden divide-y divide-slate-100">
              
              {/* Manual Wallet Adjustment Inline Form */}
              {fundingUser && (
                <div className="p-5 bg-purple-50/50 border-b border-purple-100 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center">
                    <h3 className="font-display font-bold text-slate-900 text-xs flex items-center">
                      <CreditCard className="w-4 h-4 mr-2 text-purple-600 animate-pulse" />
                      Adjust Wallet for: <span className="text-purple-700 ml-1 font-extrabold">{fundingUser.profile?.fullName || fundingUser.email}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setFundingUser(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 font-bold underline"
                    >
                      Cancel
                    </button>
                  </div>
                  <form onSubmit={handleAdjustUserWallet} className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Adjustment Type</label>
                      <select
                        value={fundType}
                        onChange={(e) => setFundType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                      >
                        <option value="credit">Credit / Add Money (+)</option>
                        <option value="debit">Debit / Deduct Money (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Amount (₦)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g. 5000"
                        value={fundAmount}
                        onChange={(e) => setFundAmount(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none font-bold"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Description / Reason</label>
                      <input
                        type="text"
                        placeholder="e.g. Manual refund / Deposit credit"
                        value={fundDescription}
                        onChange={(e) => setFundDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={submittingFund}
                        className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all"
                      >
                        {submittingFund ? 'Processing...' : 'Apply Adjustment'}
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="hidden md:flex p-4 bg-slate-50 text-[10px] uppercase font-bold tracking-wider text-slate-400 justify-between">
                <div className="flex-1">Profile Details</div>
                <div className="w-32 text-center">Wallet Balance</div>
                <div className="w-28 text-center">Active Role</div>
                <div className="w-48 text-right">Actions</div>
              </div>

              {usersList.map((u) => (
                <div key={u.uid} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-slate-800 text-sm truncate">
                      {u.profile?.fullName || 'New User'}
                    </h4>
                    <p className="text-xs text-slate-400 truncate">@{u.profile?.username || 'username'}</p>
                    <span className="text-[9px] text-slate-400 block mt-0.5">Email: {u.email}</span>
                  </div>

                  <div className="flex justify-between md:block md:w-32 md:text-center shrink-0">
                    <span className="md:hidden text-xs text-slate-400 font-semibold">Balance</span>
                    <span className="font-bold text-slate-900 text-xs">
                      ₦{parseFloat(u.wallet?.balance || '0.00').toLocaleString()}
                    </span>
                  </div>

                  <div className="flex justify-between md:block md:w-28 md:text-center shrink-0">
                    <span className="md:hidden text-xs text-slate-400 font-semibold">Role</span>
                    <span
                      className={`text-[10px] font-bold uppercase ${
                        u.role === 'admin' || u.role === 'super_admin'
                          ? 'text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full'
                          : 'text-slate-500 bg-slate-50 px-2.5 py-0.5 rounded-full'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>

                  <div className="flex flex-wrap md:w-48 justify-end gap-2 shrink-0">
                    <button
                      onClick={() => {
                        setFundingUser(u);
                        setFundType('credit');
                        setFundAmount('');
                        setFundDescription('');
                      }}
                      className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 text-[10px] font-bold rounded-xl transition-all border border-purple-100"
                    >
                      Fund Wallet
                    </button>
                    <button
                      onClick={() => handleToggleUserRole(u.uid, u.role)}
                      className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition-all border ${
                        u.role === 'admin'
                          ? 'bg-slate-50 text-slate-700 border-slate-200'
                          : 'bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100'
                      }`}
                    >
                      {u.role === 'admin' ? 'Revoke' : 'Admin'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
