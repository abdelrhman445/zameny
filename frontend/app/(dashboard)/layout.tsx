'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, Search, Store, ExternalLink, Settings, 
  LogOut, Blocks, UserCircle, CheckCheck 
} from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
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

  // ✅ نستخدم slug الجديد أولاً (مولَّد أوتوماتيك من storeName في الباك)
  const storeUrl = merchant?.slug
    ? `/${merchant.slug}`
    : merchant?.storeSlug
    ? `/${merchant.storeSlug}`
    : merchant?.storeName
    ? `/${merchant.storeName.toLowerCase().replace(/\s+/g, '-')}`
    : null;

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900" dir="rtl">
      <Sidebar />

      {/* Main content */}
      <div className={cn('transition-all duration-300', sidebarCollapsed ? 'md:mr-16' : 'md:mr-64')}>
        
        {/* ── Top Header (Glassmorphism & Premium UI) ── */}
        <header className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-slate-200/80 px-4 lg:px-8 py-3.5 shadow-[0_4px_20px_-15px_rgba(0,0,0,0.05)] transition-all">
          <div className="flex items-center justify-between gap-4">
            
            {/* Right Side: Quick Search */}
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
                    <span className="font-bold text-xs mt-0.5">زيارة المتجر</span>
                    <ExternalLink className="w-3 h-3 opacity-50" />
                  </Link>
                </Button>
              )}

              {/* ── Notifications Dropdown ── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  {/* شلنا الـ onClick=markAllRead من هنا عشان الإشعارات متتمسحش أول ما تفتح القائمة */}
                  <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-slate-100 text-slate-600 h-9 w-9 focus:ring-0 focus-visible:ring-0">
                    <Bell className="w-5 h-5" />
                    {unreadCount() > 0 && (
                      <>
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full z-10 border border-white" />
                        <span className="absolute top-2 right-2.5 w-2 h-2 bg-rose-500 rounded-full animate-ping opacity-75" />
                      </>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                
                {/* تعديل العرض ليكون متجاوب مع الموبايل w-[calc(100vw-2rem)] */}
                <DropdownMenuContent align="end" className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 rounded-3xl p-0 shadow-2xl border-slate-200/60 mt-2 overflow-hidden z-50">
                  
                  {/* Notifications Header */}
                  <div className="flex items-center justify-between px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <span className="font-black text-slate-900 text-base">الإشعارات</span>
                      {unreadCount() > 0 && (
                        <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-black">
                          {unreadCount()} جديد
                        </span>
                      )}
                    </div>
                    {unreadCount() > 0 && (
                      <button 
                        onClick={markAllRead} 
                        className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded-md"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> مقروء
                      </button>
                    )}
                  </div>

                  {/* Notifications Body (Empty State) */}
                  <div className="py-10 px-6 text-center flex flex-col items-center justify-center bg-white">
                    <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center mb-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
                      <Bell className="w-7 h-7 text-slate-300" />
                    </div>
                    <p className="text-sm font-black text-slate-800 mb-1.5">لا توجد إشعارات جديدة</p>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed max-w-[220px]">
                      سنقوم بإبلاغك فور وصول أي طلبات أو تحديثات جديدة لمتجرك.
                    </p>
                  </div>
                  
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="w-px h-6 bg-slate-200 hidden sm:block mx-1"></div>

              {/* ── User Avatar & Dropdown ── */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md">
                      {merchant?.name?.[0]?.toUpperCase() || 'Z'}
                    </div>
                    <div className="hidden sm:block text-right">
                      <p className="text-sm font-bold text-slate-800 leading-none mb-1">{merchant?.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 leading-none truncate max-w-[120px]">{merchant?.storeName || 'إدارة المتجر'}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl p-2 shadow-xl border-slate-100 mt-2 z-50">
                  <div className="px-3 py-3 mb-1 bg-slate-50/50 rounded-xl border border-slate-100">
                    <p className="text-sm font-black text-slate-800 truncate">{merchant?.name}</p>
                    <p className="text-xs font-medium text-slate-500 mt-0.5 truncate" dir="ltr">{merchant?.email}</p>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-100 my-1" />
                  
                  <div className="p-1 space-y-0.5">
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-slate-50 focus:bg-slate-50 py-2.5">
                      <Link href="/settings/profile" className="flex items-center gap-2.5">
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-sm text-slate-700">الملف الشخصي</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-slate-50 focus:bg-slate-50 py-2.5">
                      <Link href="/settings/integrations" className="flex items-center gap-2.5">
                        <Blocks className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-sm text-slate-700">الربط والتكامل</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild className="rounded-lg cursor-pointer hover:bg-slate-50 focus:bg-slate-50 py-2.5">
                      <Link href="/settings" className="flex items-center gap-2.5">
                        <Settings className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-sm text-slate-700">إعدادات المتجر</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="bg-slate-100 my-1" />
                  
                  <div className="p-1">
                    <DropdownMenuItem
                      className="rounded-lg cursor-pointer text-rose-600 focus:text-rose-700 focus:bg-rose-50 hover:bg-rose-50 py-2.5 flex items-center gap-2.5 font-black transition-colors"
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