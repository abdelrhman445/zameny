'use client';
import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Menu, Search, Store } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { cn, buildStoreUrl } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, toggleSidebar, unreadCount, markAllRead } = useMerchantStore();
  const { merchant, setMerchant, logout } = useAuthStore();
  const router = useRouter();

  // Fetch fresh merchant data on mount
  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get('/auth/me');
        setMerchant(res.data.data.merchant);
      } catch {
        // Token invalid — middleware handles redirect
      }
    };
    fetchMe();
  }, [setMerchant]);

  const storeUrl = merchant?.storeSlug
    ? `/${merchant.storeSlug}`
    : merchant?.storeName
    ? `/${merchant.storeName.toLowerCase().replace(/\s+/g, '-')}`
    : null;

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <Sidebar />

      {/* Main content */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'mr-16' : 'mr-60')}>
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: hamburger + search */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={toggleSidebar} className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              {storeUrl && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={storeUrl} target="_blank">
                    <Store className="w-4 h-4 mr-1.5" />
                    <span className="hidden sm:inline">عرض المتجر</span>
                  </Link>
                </Button>
              )}

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" onClick={markAllRead}>
                    <Bell className="w-5 h-5" />
                    {unreadCount() > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    لا توجد إشعارات جديدة
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Avatar */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {merchant?.name?.[0]?.toUpperCase() || 'M'}
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-xs font-semibold text-slate-900 leading-none">{merchant?.name}</p>
                      <p className="text-[10px] text-muted-foreground">{merchant?.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings/profile">الملف الشخصي</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings/integrations">الربط والتكامل</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600"
                    onClick={() => { logout(); router.push('/login'); }}
                  >
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
