export interface UserProfile {
  uid: string;
  fullName: string;
  username: string;
  phone: string | null;
  updatedAt: string;
}

export interface User {
  uid: string;
  email: string;
  role: 'user' | 'admin' | 'super_admin';
  apiKey?: string | null;
  createdAt: string;
  profile?: UserProfile;
  wallet?: {
    uid: string;
    balance: string;
    bankName?: string | null;
    accountNumber?: string | null;
    accountName?: string | null;
    updatedAt: string;
  };
}

export interface WalletTransaction {
  id: number;
  uid: string;
  amount: string;
  type: 'deposit' | 'purchase' | 'withdrawal' | 'refund';
  reference: string;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface ProductCategory {
  id: number;
  name: string;
  description: string | null;
}

export interface Product {
  id: number;
  categoryId: number | null;
  platform: 'Facebook' | 'Instagram' | 'TikTok' | 'X/Twitter' | 'Other';
  title: string;
  region: string;
  ageDetails: string | null;
  price: string;
  stock: number;
  createdAt: string;
  isExternal?: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  price: string;
  deliveredDetails: string | null;
}

export interface Order {
  id: number;
  uid: string;
  totalAmount: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  createdAt: string;
  items?: OrderItem[];
}

export interface PhoneNumber {
  id: number;
  country: string;
  countryName: string;
  service: string;
  number: string;
  price: string;
  duration: string;
  providerId: string;
  status: 'available' | 'active' | 'completed' | 'expired' | 'cancelled';
  smsLogs: string; // JSON encoded string [{id, sender, text, timestamp}]
  uid: string | null;
  createdAt: string;
  expiresAt: string;
}

export interface Notification {
  id: number;
  uid: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface AdminStats {
  totalUsers: number;
  totalSales: number;
  totalDeposits: number;
  totalOrders: number;
  availableInventory: number;
  revenue: number;
}
