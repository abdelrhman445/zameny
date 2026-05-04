import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import './globals.css';

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
    <html lang="ar" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-arabic antialiased">
        {children}
        <Toaster
          position="top-center"
          richColors
          toastOptions={{
            style: { fontFamily: 'Cairo, sans-serif' },
          }}
        />
      </body>
    </html>
  );
}
