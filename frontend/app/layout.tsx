import type { Metadata } from 'next';
import { Cairo } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';

// تحميل الخط باحترافية لتسريع الموقع ومنع الـ Layout Shift
const cairo = Cairo({ 
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'A.E.E — Advanced E-commerce Engine',
    template: '%s | A.E.E',
  },
  description: 'منصة التجارة الإلكترونية الأكثر ذكاءً في مصر — مدعومة بمحرك كشف الاحتيال',
  keywords: ['ecommerce', 'egypt', 'fraud detection', 'saas', 'online store'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ربط الخط بـ html بالكامل
    <html lang="ar" dir="rtl" className={cairo.className}>
      <head>
        {/* تم حذف الـ link القديم لأن Next.js سيتولى أمر الخطوط الآن */}
      </head>
      <body className="min-h-screen bg-[#030712] text-slate-50 antialiased selection:bg-rose-500/30">
        
        {children}
        
        {/* تخصيص شكل الإشعارات لتبدو فخمة وزجاجية */}
        <Toaster
          position="top-center"
          richColors
          theme="dark"
          toastOptions={{
            style: { 
              fontFamily: 'inherit',
              background: 'rgba(15, 23, 42, 0.8)', // خلفية زجاجية غامقة
              backdropFilter: 'blur(12px)',        // تأثير الزجاج
              border: '1px solid rgba(30, 41, 59, 0.8)',
              color: '#f8fafc'
            },
          }}
        />
        
      </body>
    </html>
  );
}