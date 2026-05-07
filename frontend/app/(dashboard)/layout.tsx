'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, Store, ExternalLink, Settings, LogOut, Blocks, UserCircle } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import api from '@/lib/api';
import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, unreadCount, markAllRead } = useMerchantStore();
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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir="rtl">
      <Sidebar />

      {/* Main content */}
      {/* ✅ التركاية السحرية هنا: استخدام md: عشان الموبايل ياخد الشاشة كاملة */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'md:mr-16' : 'md:mr-64')}>
        
        {/* ── Top Header (Glassmorphism & Premium UI) ── */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between gap-4">
            
            {/* Right Side: Quick Search (الزرار القديم اتشال من هنا) */}
            <div className="flex items-center gap-4 flex-1">
              
              {/* Mac-style Quick Search (SaaS Premium touch) */}
              <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-slate-100/80 border border-slate-200/60 rounded-xl text-slate-400 w-full max-w-xs hover:bg-slate-100 hover:border-slate-300 transition-colors cursor-text group">
                <Search className="w-4 h-4 text-slate-400 group-hover:text-slate-500 transition-colors" />
                <span className="text-sm font-medium mr-1 select-none flex-1">بحث سريع...</span>
                <kbd className="hidden lg:inline-flex items-center gap-1 font-sans text-[10px] font-semibold bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 shadow-sm dir-ltr">
                  <span className="text-xs">⌘</span> K
                </kbd>
              </div>
            </div>

            {/* Left Side: Actions & Profile */}
            <div className="flex items-center gap-3">
              
              {/* Store Button */}
              {storeUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  asChild 
                  className="hidden sm:flex bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 transition-all shadow-sm rounded-xl gap-2 h-9 px-4"
                >
                  <Link href={storeUrl} target="_blank">
                    <Store className="w-4 h-4" />
                    <span className="font-semibold text-xs mt-0.5">زيارة المتجر</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Link>
                </Button>
              )}

              {/* Notifications */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100 text-slate-600 h-9 w-9" onClick={markAllRead}>
                    <Bell className="w-5 h-5" />
                    {unreadCount() > 0 && (
                      <>
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full z-10" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-ping opacity-75" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 rounded-2xl p-2 shadow-xl border-slate-100">
                  <DropdownMenuLabel className="font-bold text-base px-3 py-2 flex items-center justify-between">
                    الإشعارات
                    <span className="bg-slate-100 text-slate-500 text-xs px-2 py-0.5 rounded-full font-medium">{unreadCount()}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  <div className="py-8 text-center flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-1">
                      <Bell className="w-5 h-5 text-slate-300" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">لا توجد إشعارات جديدة</p>
                    <p className="text-xs text-slate-400">أنت على اطلاع دائم بكل شيء!</p>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"></div>

              {/* User Avatar & Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                      {merchant?.name?.[0]?.toUpperCase() || 'Z'}
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">{merchant?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-none truncate max-w-[120px]">{merchant?.storeName || 'إدارة المتجر'}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100">
                  <div className="px-2 py-3 mb-1">
                    <p className="text-sm font-bold text-slate-800">{merchant?.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate" dir="ltr">{merchant?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <div className="p-1 space-y-1">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-slate-50 focus:bg-slate-50 py-2.5">
                      <Link href="/settings/profile" className="flex items-center gap-2.5">
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-sm">الملف الشخصي</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-slate-50 focus:bg-slate-50 py-2.5">
                      <Link href="/settings/integrations" className="flex items-center gap-2.5">
                        <Blocks className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-sm">الربط والتكامل</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-slate-50 focus:bg-slate-50 py-2.5">
                      <Link href="/settings" className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-sm">إعدادات المتجر</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="bg-slate-100" />
                  
                  <div className="p-1">
                    <DropdownMenuItem
                      className="rounded-lg cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:bg-rose-50 py-2.5 flex items-center gap-2.5 font-bold transition-colors"
                      onClick={() => { logout(); router.push('/login'); }}
                    >
                      <LogOut className="w-4 h-4" />
                      <span>تسجيل الخروج</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 animate-fade-in max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}