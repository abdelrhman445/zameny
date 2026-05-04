import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { OrderStatus, RiskLevel } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ── Currency Formatter ────────────────────────────────────────────────────────
export function formatCurrency(amount: number, currency = 'EGP'): string {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ── Date Formatter ────────────────────────────────────────────────────────────
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat('en-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateStr));
}

// ── Risk Level Helpers ────────────────────────────────────────────────────────
export function getRiskColor(riskLevel: RiskLevel): string {
  const map: Record<RiskLevel, string> = {
    Low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    High: 'text-red-600 bg-red-50 border-red-200',
  };
  return map[riskLevel];
}

// ── Order Status Color ────────────────────────────────────────────────────────
export function getStatusColor(status: OrderStatus): string {
  const map: Record<OrderStatus, string> = {
    Pending: 'text-slate-600 bg-slate-100',
    Flagged: 'text-red-700 bg-red-100',
    Confirmed: 'text-blue-700 bg-blue-100',
    Shipped: 'text-indigo-700 bg-indigo-100',
    Delivered: 'text-emerald-700 bg-emerald-100',
    RTO: 'text-orange-700 bg-orange-100',
    Cancelled: 'text-gray-600 bg-gray-100',
  };
  return map[status] || 'text-gray-600 bg-gray-100';
}

// ── Phone Formatter ───────────────────────────────────────────────────────────
export function formatPhone(phone: string): string {
  return phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
}

// ── Extract API Error Message ─────────────────────────────────────────────────
export function getApiError(error: unknown): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as { response?: { data?: { message?: string } } };
    return axiosError.response?.data?.message || 'حدث خطأ غير متوقع';
  }
  if (error instanceof Error) return error.message;
  return 'حدث خطأ غير متوقع';
}

// ── Truncate Text ─────────────────────────────────────────────────────────────
export function truncate(text: string, length = 50): string {
  return text.length > length ? `${text.substring(0, length)}...` : text;
}

// ── Build Store URL ───────────────────────────────────────────────────────────
export function buildStoreUrl(storeSlug: string): string {
  return `${typeof window !== 'undefined' ? window.location.origin : ''}/${storeSlug}`;
}
