import { relations } from 'drizzle-orm';
import { pgTable, text, timestamp, numeric, integer, boolean, serial } from 'drizzle-orm/pg-core';

// 1. Users Table (using Firebase Auth UID directly as primary key)
export const users = pgTable('users', {
  uid: text('uid').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').default('user').notNull(), // user, admin, super_admin
  apiKey: text('api_key'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. User Profiles Table
export const userProfiles = pgTable('user_profiles', {
  uid: text('uid').primaryKey().references(() => users.uid, { onDelete: 'cascade' }),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  phone: text('phone'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. Wallets Table
export const wallets = pgTable('wallets', {
  uid: text('uid').primaryKey().references(() => users.uid, { onDelete: 'cascade' }),
  balance: numeric('balance', { precision: 12, scale: 2 }).default('0.00').notNull(), // Balance in Naira (₦)
  bankName: text('bank_name'),
  accountNumber: text('account_number'),
  accountName: text('account_name'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 4. Wallet Transactions Table
export const walletTransactions = pgTable('wallet_transactions', {
  id: serial('id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(), // Positive for deposit/refund, negative for purchase/withdrawal
  type: text('type').notNull(), // deposit, purchase, withdrawal, refund
  reference: text('reference').notNull().unique(), // Unique payment ref or ledger ref
  status: text('status').default('completed').notNull(), // pending, completed, failed
  description: text('description').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 5. Product Categories Table
export const productCategories = pgTable('product_categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  description: text('description'),
});

// 6. Products Table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  categoryId: integer('category_id').references(() => productCategories.id),
  platform: text('platform').notNull(), // Facebook, Instagram, TikTok, X/Twitter, Other
  title: text('title').notNull(), // Product description/title
  region: text('region').notNull(), // Nigeria, US, UK, Worldwide, etc.
  ageDetails: text('age_details'), // e.g., "Created 2021", "Fresh"
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  stock: integer('stock').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 7. Inventory Table (Stores items for Buy Account deliveries)
export const inventory = pgTable('inventory', {
  id: serial('id').primaryKey(),
  productId: integer('product_id').references(() => products.id, { onDelete: 'cascade' }).notNull(),
  loginDetails: text('login_details').notNull(), // Format e.g., "user:pass|email:pass"
  isSold: boolean('is_sold').default(false).notNull(),
  orderId: integer('order_id'), // populated after sale
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 8. Phone Numbers Table (Virtual/Temporary numbers for SMS rentals)
export const phoneNumbers = pgTable('phone_numbers', {
  id: serial('id').primaryKey(),
  country: text('country').notNull(), // Country code or name, e.g., "NG", "US", "UK"
  countryName: text('country_name').notNull(), // "Nigeria", "United States", etc.
  service: text('service').notNull(), // "WhatsApp", "Telegram", "OpenAI", etc.
  number: text('number').notNull(), // e.g. "+2348031234567"
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  duration: text('duration').notNull(), // e.g. "15 minutes"
  providerId: text('provider_id').notNull(), // external provider number ID
  status: text('status').default('available').notNull(), // available, active, completed, expired, cancelled
  smsLogs: text('sms_logs').default('[]').notNull(), // JSON list of received SMS logs [{id, sender, text, timestamp}]
  uid: text('uid').references(() => users.uid, { onDelete: 'set null' }), // user renting it
  createdAt: timestamp('created_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at').notNull(),
});

// 9. Orders Table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  totalAmount: numeric('total_amount', { precision: 12, scale: 2 }).notNull(),
  status: text('status').default('pending').notNull(), // pending, processing, completed, cancelled, refunded
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 10. Order Items Table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').references(() => orders.id, { onDelete: 'cascade' }).notNull(),
  productId: integer('product_id').references(() => products.id).notNull(),
  price: numeric('price', { precision: 12, scale: 2 }).notNull(),
  deliveredDetails: text('delivered_details'), // copy of login details for this purchase
});

// 11. Payment Transactions Table
export const paymentTransactions = pgTable('payment_transactions', {
  id: serial('id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
  reference: text('reference').notNull().unique(),
  status: text('status').default('pending').notNull(), // pending, success, failed
  paymentGateway: text('payment_gateway').default('Flutterwave').notNull(), // Flutterwave, Moniepoint
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 12. Notifications Table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  uid: text('uid').references(() => users.uid, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 13. Admin Users Table (For explicit role assignment/tracking if needed, although users.role is the primary mechanism)
export const adminUsers = pgTable('admin_users', {
  uid: text('uid').primaryKey().references(() => users.uid, { onDelete: 'cascade' }),
  role: text('role').default('admin').notNull(), // admin, super_admin
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// RELATIONSHIPS
export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(userProfiles, {
    fields: [users.uid],
    references: [userProfiles.uid],
  }),
  wallet: one(wallets, {
    fields: [users.uid],
    references: [wallets.uid],
  }),
  walletTransactions: many(walletTransactions),
  orders: many(orders),
  paymentTransactions: many(paymentTransactions),
  notifications: many(notifications),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, {
    fields: [userProfiles.uid],
    references: [users.uid],
  }),
}));

export const walletsRelations = relations(wallets, ({ one }) => ({
  user: one(users, {
    fields: [wallets.uid],
    references: [users.uid],
  }),
}));

export const walletTransactionsRelations = relations(walletTransactions, ({ one }) => ({
  user: one(users, {
    fields: [walletTransactions.uid],
    references: [users.uid],
  }),
}));

export const productCategoriesRelations = relations(productCategories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(productCategories, {
    fields: [products.categoryId],
    references: [productCategories.id],
  }),
  inventory: many(inventory),
  orderItems: many(orderItems),
}));

export const inventoryRelations = relations(inventory, ({ one }) => ({
  product: one(products, {
    fields: [inventory.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.uid],
    references: [users.uid],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));
