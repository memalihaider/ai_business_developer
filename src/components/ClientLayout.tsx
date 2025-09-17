'use client';

import { ReactNode, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import SidebarWrapper from '@/components/SidebarWrapper';
import Header from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LeadProvider } from '@/contexts/LeadContext';

interface ClientLayoutProps {
  children: ReactNode;
}

// Wrapper component that provides token to LeadProvider
function LeadProviderWrapper({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  return <LeadProvider token={token}>{children}</LeadProvider>;
}

// Inner component that uses auth context
function LayoutContent({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();

  // Define public routes that don't need sidebar/header
  const publicRoutes = ['/', '/login'];
  const isPublicRoute = publicRoutes.includes(pathname);

  // Load sidebar state from localStorage on first mount
  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed');
    if (stored === 'true') setCollapsed(true);

    // Listener for global toggle event
    const handleToggle = () => {
      const updated = localStorage.getItem('sidebar-collapsed') === 'true';
      setCollapsed(updated);
    };

    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, []);

  const toggleSidebar = () => {
    const newCollapsed = !collapsed;
    setCollapsed(newCollapsed);
    localStorage.setItem('sidebar-collapsed', newCollapsed.toString());
    window.dispatchEvent(new Event('toggle-sidebar'));
  };

  // Show sidebar and header only for authenticated users on protected routes
  const showSidebarAndHeader = isAuthenticated && !isPublicRoute;

  if (isPublicRoute || !showSidebarAndHeader) {
    // Public routes or unauthenticated users - no sidebar/header
    return (
      <div className="min-h-screen">
        <main className="min-h-screen">
          {children}
        </main>
        <Toaster />
      </div>
    );
  }

  // Authenticated users on protected routes - show full layout
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <SidebarWrapper collapsed={collapsed} setCollapsed={setCollapsed} />

      {/* Main content area */}
      <div className={`flex-1 flex flex-col transition-all duration-400 ease-[cubic-bezier(0.7,-0.15,0.25,1.15)] ${
        collapsed ? 'ml-[58px]' : 'ml-[190px]'
      }`}>
        {/* Header */}
        <Header onToggle={toggleSidebar} collapsed={collapsed} />
        
        {/* Main content */}
        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      <Toaster />
    </div>
  );
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      storageKey="theme"
    >
      <AuthProvider>
        <LeadProviderWrapper>
          <LayoutContent>{children}</LayoutContent>
        </LeadProviderWrapper>
      </AuthProvider>
    </ThemeProvider>
  );
}