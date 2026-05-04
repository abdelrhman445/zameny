'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Settings,
  Plug, ChevronLeft, ChevronRight, Zap, LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

const navLinks = [
  { href: '/overview', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/products', label: 'المنتجات', icon: Package },
  { href: '/customers', label: 'العملاء', icon: Users },
  { href: '/settings/profile', label: 'الإعدادات', icon: Settings },
  { href: '/settings/integrations', label: 'الربط والتكامل', icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useMerchantStore();
  const { merchant, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 z-30 shadow-2xl',
        sidebarCollapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <p className="text-sm font-bold text-white truncate">A.E.E</p>
            <p className="text-[10px] text-slate-400 truncate">E-commerce Engine</p>
          </div>
        )}
      </div>

      {/* Merchant Info */}
      {!sidebarCollapsed && merchant && (
        <div className="px-4 py-3 border-b border-slate-700/50">
          <p className="text-xs text-slate-400 truncate">متجر</p>
          <p className="text-sm font-semibold text-white truncate">{merchant.storeName}</p>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
          return (
            <Link
              key={link.href}
              href={link.href}
              title={sidebarCollapsed ? link.label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!sidebarCollapsed && <span className="truncate">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-slate-700/50 space-y-1">
        <button
          onClick={handleLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
            'text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-all duration-150'
          )}
          title={sidebarCollapsed ? 'تسجيل الخروج' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!sidebarCollapsed && <span>تسجيل الخروج</span>}
        </button>

        {/* Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleSidebar}
          className="w-full text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {sidebarCollapsed ? (
            <ChevronLeft className="w-4 h-4" />
          ) : (
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4" />
              <span className="text-xs">طي القائمة</span>
            </div>
          )}
        </Button>
      </div>
    </aside>
  );
}
