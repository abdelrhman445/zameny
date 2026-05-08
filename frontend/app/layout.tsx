import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

// تحميل خط Cairo لدعم العربية والإنجليزية بتميز
const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Zameny Store | منصة التجارة الذكية',
    template: '%s | A.E.E', // ربط الصفحة بمحركك المتطور Advanced E-commerce Engine
  },
  description: 'Zameny Store — الحل الأمثل للتجارة الإلكترونية في مصر، مدعوم بأنظمة كشف الاحتيال الذكية والربط مع تيليجرام.',
  keywords: ['Zameny', 'Zameny Store', 'A.E.E', 'E-commerce Egypt', 'Fraud Detection', 'Cybersecurity'],
  icons: {
    icon: [
      { url: '/favicon.ico' }, 
      { url: '/icon.svg', type: 'image/svg+xml' }, 
    ],
    apple: '/apple-touch-icon.png',
  },
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.className}>
      <body className="min-h-screen bg-[#030712] text-slate-50 antialiased selection:bg-rose-500/30">
        
        {children}
        
        {/* تخصيص الـ Toaster ليتماشى مع تصميمك الفخم */}
        <Toaster
          position="top-center"
          richColors
          theme="dark"
          toastOptions={{
            style: { 
              fontFamily: 'inherit',
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(30, 41, 59, 0.8)',
              color: '#f8fafc'
            },
          }}
        />
        
      </body>
    </html>
  );
}