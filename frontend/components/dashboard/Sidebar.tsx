'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Settings,
  Plug, ChevronLeft, ChevronRight, Zap, LogOut, Store, Menu, X
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMerchantStore } from '@/store/useMerchantStore';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '/overview', label: 'الرئيسية', icon: LayoutDashboard },
  { href: '/orders', label: 'الطلبات', icon: ShoppingCart },
  { href: '/products', label: 'المنتجات', icon: Package },
  { href: '/customers', label: 'العملاء', icon: Users },
  { href: '/settings/profile', label: 'إعدادات الحساب', icon: Settings },
  { href: '/settings/integrations', label: 'الربط والتكامل', icon: Plug },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useMerchantStore();
  const { merchant, logout } = useAuthStore();
  const router = useRouter();
  const [isMobile, setIsMobile] = useState(false);

  // اكتشاف حجم الشاشة عشان نتعامل مع الموبايل بشكل مختلف
  useEffect(() => {
    // 1. إغلاق القائمة أوتوماتيك مرة واحدة فقط عند التحميل (لو الشاشة موبايل والقائمة مفتوحة)
    if (window.innerWidth < 768 && !sidebarCollapsed) {
      toggleSidebar(); 
    }

    // 2. مراقبة تغيير حجم الشاشة لتحديث حالة الـ isMobile فقط (بدون التداخل مع فتح/قفل القائمة)
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    handleResize(); // الفحص عند التحميل
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // إغلاق القائمة في الموبايل بمجرد الضغط على أي رابط
  const handleNavClick = () => {
    if (isMobile && !sidebarCollapsed) {
      toggleSidebar();
    }
  };

  return (
    <>
      {/* ── زر القائمة العائم للموبايل فقط ── */}
      <button
        onClick={toggleSidebar}
        className={cn(
          "md:hidden fixed top-3 right-4 z-40 p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-slate-700 hover:bg-slate-50 transition-all",
          !sidebarCollapsed && "hidden opacity-0 pointer-events-none"
        )}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* ── خلفية ضبابية للموبايل عند فتح القائمة ── */}
      <div 
        className={cn(
          "fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300",
          sidebarCollapsed ? "opacity-0 pointer-events-none" : "opacity-100"
        )}
        onClick={toggleSidebar}
      />

      {/* ── القائمة الجانبية ── */}
      <aside
        className={cn(
          'fixed right-0 top-0 h-screen bg-[#030712] border-l border-slate-800/60 text-slate-300 flex flex-col transition-all duration-300 z-50 shadow-2xl',
          // المنطق هنا:
          // الديسكتوب (md): القائمة دايماً ظاهرة بس العرض بيتغير (w-16 أو w-64)
          // الموبايل: العرض دايماً 64 بس بتتحرك بره الشاشة (translate-x-full) أو تدخل الشاشة
          'md:translate-x-0',
          sidebarCollapsed ? 'translate-x-full w-64 md:w-16' : 'translate-x-0 w-64'
        )}
      >
        {/* Logo & Branding */}
        <div className="flex items-center justify-between px-4 py-6 border-b border-slate-800/60 transition-all">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="w-4 h-4 text-white fill-white" />
            </div>
            {/* في الموبايل، النص دايماً ظاهر لما القائمة تفتح */}
            {(!sidebarCollapsed || isMobile) && (
              <div className="min-w-0 flex flex-col animate-fade-in">
                <p className="text-xl font-black text-white leading-none tracking-tight">Zameny</p>
              </div>
            )}
          </div>
          
          {/* زرار قفل القائمة للموبايل فقط */}
          <button 
            onClick={toggleSidebar}
            className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Merchant Store Info */}
        {(!sidebarCollapsed || isMobile) && merchant && (
          <div className="px-5 py-4 border-b border-slate-800/60 animate-fade-in">
            <p className="text-[11px] font-bold text-slate-500 mb-0.5">متجر</p>
            <div className="flex items-center gap-2">
              <Store className="w-3.5 h-3.5 text-slate-400" />
              <p className="text-sm font-black text-slate-200 truncate">{merchant.storeName}</p>
            </div>
          </div>
        )}

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto scrollbar-thin scrollbar-thin-dark">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/');
            
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={handleNavClick}
                title={sidebarCollapsed && !isMobile ? link.label : undefined}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200 group relative',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                )}
              >
                {isActive && (!sidebarCollapsed || isMobile) && (
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-l-full" />
                )}
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0 transition-transform duration-200", 
                  isActive ? "scale-110" : "group-hover:scale-110"
                )} />
                {(!sidebarCollapsed || isMobile) && <span className="truncate">{link.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-800/60 space-y-2 bg-[#030712]">
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all duration-200',
              'text-slate-400 hover:text-rose-500 hover:bg-rose-500/10'
            )}
            title={sidebarCollapsed && !isMobile ? 'تسجيل الخروج' : undefined}
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            {(!sidebarCollapsed || isMobile) && <span>تسجيل الخروج</span>}
          </button>

          {/* زر التصغير للديسكتوب فقط */}
          <Button
            variant="ghost"
            onClick={toggleSidebar}
            className="hidden md:flex w-full h-12 items-center justify-center rounded-xl text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 transition-colors"
            title={sidebarCollapsed ? 'توسيع القائمة' : 'طي القائمة'}
          >
            {sidebarCollapsed ? (
              <ChevronLeft className="w-5 h-5" />
            ) : (
              <div className="flex items-center gap-2">
                <ChevronRight className="w-5 h-5" />
                <span className="text-xs font-bold">طي القائمة الجانبية</span>
              </div>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
