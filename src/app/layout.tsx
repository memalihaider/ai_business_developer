import './globals.css';
import { ReactNode } from 'react';
import ClientLayout from '@/components/ClientLayout';

export default function RootLayout({ children }: { children: ReactNode }) {

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Comfortaa:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-screen bg-gradient-to-br from-green-50/50 via-white to-emerald-50/50 dark:from-gray-900 dark:via-black dark:to-gray-900"
      suppressHydrationWarning={true}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
