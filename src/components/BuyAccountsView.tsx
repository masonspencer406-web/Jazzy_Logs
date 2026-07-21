import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  CheckCircle2,
  Copy,
  AlertCircle,
  Eye,
  SlidersHorizontal,
  RefreshCw,
  Facebook,
  Instagram,
  Twitter,
  Sparkles,
} from 'lucide-react';
import { Product, User } from '../types.ts';

interface BuyAccountsViewProps {
  user: User | null;
  token: string | null;
  refreshUser: () => Promise<void>;
}

export const BuyAccountsView: React.FC<BuyAccountsViewProps> = ({
  user,
  token,
  refreshUser,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');
  const [maxPrice, setMaxPrice] = useState('50000');
  const [showInStockOnly, setShowInStockOnly] = useState(false);

  // Purchasing Flow
  const [purchasingId, setPurchasingId] = useState<number | null>(null);
  const [successOrder, setSuccessOrder] = useState<{
    orderId: number;
    deliveredDetails: string;
    productTitle: string;
    price: string;
  } | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [copiedDetails, setCopiedDetails] = useState(false);

  // Load products list
  const loadProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams({
        platform: selectedPlatform,
        region: selectedRegion,
        maxPrice: maxPrice,
      });
      if (search) {
        queryParams.append('search', search);
      }

      const res = await fetch(`/api/products?${queryParams.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      } else {
        setError('Failed to fetch marketplace products catalog.');
      }
    } catch (err) {
      console.error('Error loading products:', err);
      setError('An error occurred while loading marketplace catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadProducts();
    }
  }, [token, selectedPlatform, selectedRegion, maxPrice]);

  // Execute buy order
  const handleBuyProduct = async (product: Product) => {
    setPurchaseError(null);
    setSuccessOrder(null);

    const walletBalance = parseFloat(user?.wallet?.balance || '0.00');
    const productPrice = parseFloat(product.price);

    if (walletBalance < productPrice) {
      setPurchaseError('Insufficient wallet balance. Please fund your wallet.');
      return;
    }

    if (!window.confirm(`Are you sure you want to purchase "${product.title}" for ₦${productPrice.toLocaleString()}?`)) {
      return;
    }

    setPurchasingId(product.id);
    try {
      const res = await fetch('/api/products/buy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccessOrder({
          orderId: data.orderId,
          deliveredDetails: data.deliveredDetails,
          productTitle: product.title,
          price: product.price,
        });
        await refreshUser();
        await loadProducts(); // Reload stock
      } else {
        setPurchaseError(data.error || 'Failed to complete transaction.');
      }
    } catch (err) {
      console.error('Error buying product:', err);
      setPurchaseError('An unexpected server error occurred during checkout.');
    } finally {
      setPurchasingId(null);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDetails(true);
    setTimeout(() => setCopiedDetails(false), 2000);
  };

  // Filter lists manually for double safety & Instant response
  const filteredProducts = products.filter((p) => {
    if (showInStockOnly && p.stock <= 0) return false;
    if (search) {
      const s = search.toLowerCase();
      return (
        p.title.toLowerCase().includes(s) ||
        p.platform.toLowerCase().includes(s) ||
        p.region.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'Facebook':
        return <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><Facebook className="w-5 h-5" /></div>;
      case 'Instagram':
        return <div className="p-2.5 bg-pink-50 text-pink-600 rounded-xl"><Instagram className="w-5 h-5" /></div>;
      case 'TikTok':
        return <div className="p-2.5 bg-slate-900 text-white rounded-xl"><Sparkles className="w-5 h-5" /></div>;
      case 'X/Twitter':
        return <div className="p-2.5 bg-slate-100 text-slate-800 rounded-xl"><Twitter className="w-5 h-5" /></div>;
      default:
        return <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl"><Sparkles className="w-5 h-5" /></div>;
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-display font-bold text-slate-900">
            Buy Accounts Marketplace
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Browse legitimate, authorized digital marketing resources and developer business assets.
          </p>
        </div>
        <button
          onClick={loadProducts}
          className="self-start md:self-auto px-4 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Catalogue</span>
        </button>
      </div>

      {/* Compliance Notice Banner */}
      <div className="bg-purple-50 border border-purple-100/70 p-4 rounded-2xl flex items-start space-x-3">
        <AlertCircle className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs text-purple-900">
          <span className="font-semibold block mb-0.5">Lawful & Compliant Usage Policy</span>
          This marketplace only trades in legal, authorized digital assets for marketing, branding, development, and business management. Hack or compromised accounts, stolen credentials, unauthorized takeovers, and spoofing tools are strictly prohibited.
        </div>
      </div>

      {/* Search and Filters Bento Grid */}
      <section className="bg-white p-5 rounded-3xl border border-purple-100 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by platform, region, or age details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm focus:outline-none focus:border-purple-300 transition-colors"
            />
          </div>

          {/* Quick Platform Filters */}
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Facebook', 'Instagram', 'TikTok', 'X/Twitter', 'Other'].map((plt) => (
              <button
                key={plt}
                onClick={() => setSelectedPlatform(plt)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                  selectedPlatform === plt
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {plt}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel Expanded */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-50">
          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Region / Location
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-100 rounded-lg text-xs font-semibold text-slate-700"
            >
              <option value="All">All Regions</option>
              <option value="Nigeria">Nigeria</option>
              <option value="United States">United States</option>
              <option value="United Kingdom">United Kingdom</option>
              <option value="Worldwide">Worldwide</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1.5">
              Price Range (Max: ₦{parseInt(maxPrice).toLocaleString()})
            </label>
            <input
              type="range"
              min="1000"
              max="100000"
              step="1000"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
          </div>

          <div className="flex items-center space-x-2 pt-5">
            <input
              type="checkbox"
              id="instock"
              checked={showInStockOnly}
              onChange={(e) => setShowInStockOnly(e.target.checked)}
              className="w-4.5 h-4.5 text-purple-600 border-slate-200 rounded focus:ring-purple-500 cursor-pointer"
            />
            <label htmlFor="instock" className="text-xs font-semibold text-slate-600 cursor-pointer">
              Show In Stock Only
            </label>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-5 rounded-3xl border border-purple-50 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-slate-100 rounded-xl" />
                <div className="w-16 h-5 bg-slate-100 rounded-md" />
              </div>
              <div className="w-full h-4 bg-slate-100 rounded" />
              <div className="w-2/3 h-4 bg-slate-100 rounded" />
              <div className="flex justify-between items-center pt-4">
                <div className="w-20 h-6 bg-slate-100 rounded" />
                <div className="w-24 h-10 bg-slate-100 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-red-100">
          <AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
          <p className="text-slate-600 font-medium">{error}</p>
          <button onClick={loadProducts} className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold">
            Retry
          </button>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-purple-100">
          <SlidersHorizontal className="w-12 h-12 text-purple-200 mx-auto mb-3" />
          <p className="text-slate-500 font-semibold text-sm">No accounts found matching your filters.</p>
          <p className="text-slate-400 text-xs mt-1">Try expanding your filter region or platform parameters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const isOutOfStock = product.stock <= 0;
            const price = parseFloat(product.price);
            return (
              <div
                key={product.id}
                id={`product-card-${product.id}`}
                className="bg-white p-5 rounded-3xl border border-purple-100 hover:border-purple-200 transition-all duration-300 hover:shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Header Card */}
                  <div className="flex justify-between items-start mb-4">
                    {getPlatformIcon(product.platform)}
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2 py-1 rounded-md">
                        {product.region}
                      </span>
                      {product.ageDetails && (
                        <span className="text-[9px] text-purple-600 font-semibold mt-1">
                          {product.ageDetails}
                        </span>
                      )}
                      {product.isExternal && (
                        <span className="text-[8px] bg-purple-50 text-purple-600 border border-purple-100 font-extrabold px-1.5 py-0.5 rounded-full mt-1 flex items-center justify-center uppercase tracking-wide">
                          API Provider
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title Description */}
                  <h3 className="font-semibold text-slate-800 text-sm md:text-base leading-snug">
                    {product.title}
                  </h3>

                  {/* Stock Availability status */}
                  <div className="flex items-center mt-3 mb-5 space-x-2">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        isOutOfStock ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                    <span className="text-xs font-semibold text-slate-500">
                      {isOutOfStock ? 'Out of stock' : `${product.stock} items left`}
                    </span>
                  </div>
                </div>

                {/* Pricing & Buy Button footer */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-semibold leading-none">
                      Price
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-1 block">
                      ₦{price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <button
                    id={`buy-account-btn-${product.id}`}
                    disabled={isOutOfStock || purchasingId === product.id}
                    onClick={() => handleBuyProduct(product)}
                    className={`px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
                      isOutOfStock
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                        : purchasingId === product.id
                        ? 'bg-purple-100 text-purple-500 cursor-wait shadow-none'
                        : 'bg-purple-600 text-white hover:bg-purple-700 active:scale-95 shadow-purple-200'
                    }`}
                  >
                    {purchasingId === product.id ? 'Processing...' : 'Buy Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* General Purchase Error Banner */}
      {purchaseError && (
        <div className="fixed bottom-20 md:bottom-6 right-6 bg-rose-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-50 animate-bounce">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs font-semibold">{purchaseError}</span>
          <button onClick={() => setPurchaseError(null)} className="text-white hover:opacity-80 text-xs font-bold pl-2">
            ✕
          </button>
        </div>
      )}

      {/* Success Checkout Delivery Confirmation Modal */}
      {successOrder && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-purple-50">
            <div className="flex items-center space-x-3 text-emerald-600">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shadow-inner">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-display font-bold text-slate-900 text-lg">Purchase Complete!</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                  Order ID: #{successOrder.orderId}
                </p>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-slate-400 uppercase block font-semibold">Product Purchased</span>
              <p className="text-xs font-bold text-slate-800 leading-snug">{successOrder.productTitle}</p>
            </div>

            {/* SECURE DELIVERY DETAILS SCREEN */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-3 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Delivered Credentials Vault
                </span>
                <button
                  id="copy-creds-btn"
                  onClick={() => handleCopy(successOrder.deliveredDetails)}
                  className="text-purple-600 hover:text-purple-700 transition-colors flex items-center space-x-1"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-[10px] font-semibold">{copiedDetails ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs font-mono bg-slate-900 text-purple-300 p-3.5 rounded-xl overflow-x-auto whitespace-pre-wrap leading-relaxed select-all">
                {successOrder.deliveredDetails}
              </pre>
              <span className="text-[9px] text-slate-400 block italic leading-normal">
                Credentials format: username:password|email:password|auth_token
              </span>
            </div>

            <div className="text-xs text-purple-900/80 leading-normal bg-purple-50/50 p-3 rounded-xl border border-purple-50">
              💡 <span className="font-semibold text-purple-900">Pro tip:</span> These credentials have also been saved securely in your order history logs. You can retrieve them anytime under the <b>My Orders</b> page.
            </div>

            <button
              id="close-success-modal-btn"
              onClick={() => setSuccessOrder(null)}
              className="w-full py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors shadow-lg shadow-purple-200"
            >
              Close and Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
