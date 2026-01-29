'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAdminSession } from '@/lib/auth';

// Routes that don't require authentication (public partner forms)
const PUBLIC_ROUTES = [
  '/admin/create-doctor',
  '/admin/create-hospital',
  '/admin/create-restaurant',
  '/admin/create-medicine',
  '/admin/create-pathology',
];

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if current route is a public route
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname?.startsWith(route));
    
    if (isPublicRoute) {
      // Allow access to public routes without authentication
      setIsAuthenticated(true);
      setIsLoading(false);
      return;
    }
    
    // For other admin routes, require authentication
    // Check if user is admin or staff - do this synchronously for faster loading
    const userRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
    const userToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
    const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    
    if (checkAdminSession() || (userRole === 'staff' && userToken) || (userRole === 'admin' && userToken)) {
      setIsAuthenticated(true);
      setIsLoading(false);
    } else {
      // Only redirect if we're sure there's no token
      if (!userToken && !adminToken) {
        setIsLoading(false);
        router.push('/login');
      } else {
        // Give a small delay in case token is being set (during login redirect)
        setTimeout(() => {
          const retryToken = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
          const retryRole = typeof window !== 'undefined' ? localStorage.getItem('userRole') : null;
          if (retryToken && (retryRole === 'admin' || retryRole === 'staff')) {
            setIsAuthenticated(true);
          } else {
            router.push('/login');
          }
          setIsLoading(false);
        }, 100);
      }
    }
  }, [router, pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#10b981] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

