'use client';

import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';
import { clsx } from 'clsx';

const AdminSidebar = dynamic(() => import('@/components/admin/AdminSidebar'), { ssr: false });
const AdminAuthGuard = dynamic(() => import('@/components/admin/AdminAuthGuard'), { ssr: false });

// Routes that don't require admin sidebar (public partner forms)
const PUBLIC_ROUTES = [
  '/admin/create-doctor',
  '/admin/create-hospital',
  '/admin/create-restaurant',
  '/admin/create-medicine',
  '/admin/create-pathology',
];

function AdminLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isCollapsed } = useSidebar();
  const pathname = usePathname();
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));

  return (
    <div className="min-h-screen bg-gray-100">
      {!isPublicRoute && <AdminSidebar />}
      <main 
        className={clsx(
          'transition-all duration-300 min-h-screen',
          isPublicRoute ? 'ml-0' : (isCollapsed ? 'lg:ml-20' : 'lg:ml-64')
        )}
      >
        <div className="bg-gray-50 min-h-screen overflow-x-hidden">
          <div className="max-w-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAuthGuard>
      <SidebarProvider>
        <AdminLayoutContent>
          {children}
        </AdminLayoutContent>
      </SidebarProvider>
    </AdminAuthGuard>
  );
}

