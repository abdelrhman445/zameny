// ─── Merchant / Auth ──────────────────────────────────────────────────────────
export interface Merchant {
  _id: string;
  name: string;
  email: string;
  storeName: string;
  storeSlug?: string;
  telegramChatId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  status: string;
  token: string;
  data: { merchant: Merchant };
}

export interface MeResponse {
  status: string;
  data: { merchant: Merchant };
}

// ─── Products ────────────────────────────────────────────────────────────────
export interface Product {
  _id: string;
  merchantId: string;
  name: string;
  sku?: string;
  description?: string;
  price: number;
  stockCount: number;
  isActive: boolean;
  inStock: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProductsResponse {
  status: string;
  data: Product[];
  pagination: Pagination;
}

export interface SingleProductResponse {
  status: string;
  data: { product: Product };
}

// ─── Orders ──────────────────────────────────────────────────────────────────
export type OrderStatus =
  | 'Pending'
  | 'Flagged'
  | 'Confirmed'
  | 'Shipped'
  | 'Delivered'
  | 'RTO'
  | 'Cancelled';

export type RiskLevel = 'Low' | 'Medium' | 'High';

export type PaymentMethod = 'COD' | 'Online';
export type PaymentStatus = 'Pending' | 'Awaiting_OTP' | 'Paid' | 'Failed' | 'Refunded';

export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface FraudAnalysis {
  score: number;
  riskLevel: RiskLevel;
  reason: string;
  rtoRate: number;
  isNewCustomer: boolean;
  ipMismatch: boolean;
}

export interface StatusHistoryEntry {
  status: OrderStatus;
  changedAt: string;
  changedBy: string;
}

export interface Order {
  _id: string;
  orderNumber: string;
  merchantId: string;
  customerPhone: string;
  customerName: string;
  customerAddress: string;
  customerCity: string;
  customerEmail?: string;
  customerIp: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  fraudAnalysis: FraudAnalysis;
  statusHistory: StatusHistoryEntry[];
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  trackingNumber?: string;
  trackingUrl?: string;
  shippingCarrier?: string;
  estimatedDelivery?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  status: string;
  data: Order[];
  pagination: Pagination;
}

export interface SingleOrderResponse {
  status: string;
  data: { order: Order };
}

// ─── Stats ────────────────────────────────────────────────────────────────────
export interface OrderStat {
  _id: string;
  count: number;
  totalRevenue: number;
}

export interface FraudStat {
  _id: string;
  count: number;
}

export interface StatsResponse {
  status: string;
  data: {
    orderStats: OrderStat[];
    fraudStats: FraudStat[];
  };
}

// ─── Customer History ─────────────────────────────────────────────────────────
export interface CustomerHistory {
  _id: string;
  phoneNumber: string;
  totalOrders: number;
  rtoOrders: number;
  fraudScore: number;
  riskLevel: RiskLevel;
  rtoRate: number;
  knownIps: string[];
  isBlacklisted: boolean;
  lastOrderDate: string;
}

export interface CustomerHistoryResponse {
  status: string;
  data: {
    customerHistory: CustomerHistory;
    recentOrders: Partial<Order>[];
  };
}

// ─── Shared ───────────────────────────────────────────────────────────────────
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

export interface ApiError {
  status: string;
  message: string;
}

// ─── Cart ─────────────────────────────────────────────────────────────────────
export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  stockCount: number;
}

// ─── Storefront ───────────────────────────────────────────────────────────────
export interface StoreInfo {
  storeName: string;
  merchantId: string;
  storeSlug: string;
}

// ─── Create Order Payload ─────────────────────────────────────────────────────
export interface CreateOrderPayload {
  customerPhone: string;
  customerName: string;
  customerAddress: string;
  customerCity?: string;
  customerEmail?: string;
  items: { productId: string; quantity: number }[];
  notes?: string;
  paymentMethod: PaymentMethod;
}
