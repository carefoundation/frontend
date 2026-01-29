'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Target,
  Settings,
  FileText,
  BarChart3,
  Menu,
  X,
  LogOut,
  Ticket,
  Wallet,
  HeartHandshake,
  UserCheck,
  Building2,
  Stethoscope,
  UtensilsCrossed,
  Microscope,
  Pill,
  ClipboardList,
  Mail,
  Calendar,
  Package,
  BookOpen,
  Star,
  Home,
  User,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useSidebar } from '@/contexts/SidebarContext';
import AnimatedHamburger from '@/components/ui/AnimatedHamburger';

// Main Section - Get dashboard URL based on role
const getMainSection = (userRole: string) => {
  const dashboardUrl = userRole === 'staff' ? '/staff/dashboard' : '/admin/dashboard';
  return [
    { href: dashboardUrl, label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/reports', label: 'Reports', icon: BarChart3 },
  ];
};

// Backend Content Section
const donationSection = [
  { href: '/admin/donations', label: 'Donation Data', icon: Wallet },
];

const couponSection = [
  { href: '/admin/coupons', label: 'Coupon Data', icon: Ticket },
  { href: '/admin/coupon-claims', label: 'Coupon Claims', icon: Ticket },
  { href: '/admin/redemption-requests', label: 'Redemption Requests', icon: ClipboardList },
  { href: '/admin/wallets', label: 'Vendor Wallets', icon: Wallet },
];

const crowdfundingSection = [
  { href: '/admin/fundraised', label: 'Fundraised Data', icon: HeartHandshake },
  { href: '/admin/fundraiser-requests', label: 'Fundraiser Request', icon: FileText },
  { href: '/admin/fundraiser-live', label: 'Fundraiser Live', icon: Target },
  { href: '/admin/create-fundraiser', label: 'Upload FundRaiser', icon: Target },
];

const volunteerSection = [
  { href: '/admin/volunteer-requests', label: 'Volunteer Rqst Data', icon: ClipboardList },
  { href: '/admin/volunteers', label: 'Our Volunteers', icon: UserCheck },
  { href: '/admin/volunteer-cards', label: 'Volunteer Cards', icon: UserCheck },
  { href: '/admin/volunteer-certificates', label: 'Volunteer Certificates', icon: FileText },
];

const partnerSection = [
  { href: '/admin/partner-requests', label: 'Partner Request', icon: ClipboardList },
  { href: '/admin/create-doctor', label: 'Add Dr. Partner', icon: Stethoscope },
  { href: '/admin/create-hospital', label: 'Add Hospital Partner', icon: Building2 },
  { href: '/admin/create-restaurant', label: 'Add Food Partner', icon: UtensilsCrossed },
  { href: '/admin/create-pathology', label: 'Add Pathology Partner', icon: Microscope },
  { href: '/admin/create-medicine', label: 'Add Medicine Partner', icon: Pill },
  { href: '/admin/partners', label: 'Our Partners', icon: Building2 },
];

const usersSection = [
  { href: '/admin/users', label: 'Registered', icon: Users },
];


const querySection = [
  { href: '/admin/queries', label: 'Query Mail', icon: Mail },
];

const eventsSection = [
  { href: '/admin/create-event', label: 'Upload Events', icon: Calendar },
  { href: '/admin/events', label: 'Our Events', icon: Calendar },
];

const productsSection = [
  { href: '/admin/products', label: 'Product Management', icon: Package },
];

const contentSection = [
  { href: '/admin/blogs', label: 'Blogs', icon: BookOpen },
  { href: '/admin/celebrities', label: 'Celebrities', icon: Star },
];

const staffManagementSection = [
  { href: '/admin/staff-management', label: 'Staff Management', icon: Users },
];

const profileSection = [
  { href: '/admin/profile', label: 'Your Profile', icon: User },
  { href: '/logout', label: 'Log Out', icon: LogOut },
];

// Permission mapping for sections
const sectionPermissions: Record<string, string> = {
  'donationSection': 'manage_donations',
  'couponSection': 'manage_coupons',
  'crowdfundingSection': 'manage_fundraisers',
  'volunteerSection': 'manage_volunteers',
  'partnerSection': 'manage_partners',
  'usersSection': 'manage_users',
  'querySection': 'manage_queries',
  'eventsSection': 'manage_events',
  'productsSection': 'manage_products',
  'contentSection': 'manage_blogs', // Blogs permission
  'staffManagementSection': 'manage_users', // Only admin should see this
};

export default function AdminSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userPermissions, setUserPermissions] = useState<string[]>([]);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    // Fetch user data and permissions from API
    const fetchUserData = async () => {
      try {
        const { api } = await import('@/lib/api');
        const userRes = await api.get<any>('/users/me');
        if (userRes) {
          const role = userRes.role || '';
          const permissions = userRes.permissions || [];
          
          setUserRole(role);
          setUserPermissions(permissions);
          
          // Update localStorage
          if (typeof window !== 'undefined') {
            localStorage.setItem('userRole', role);
            localStorage.setItem('userPermissions', JSON.stringify(permissions));
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // Fallback to localStorage
        if (typeof window !== 'undefined') {
          const role = localStorage.getItem('userRole') || '';
          const permissions = localStorage.getItem('userPermissions');
          setUserRole(role);
          
          if (permissions) {
            try {
              setUserPermissions(JSON.parse(permissions));
            } catch (e) {
              setUserPermissions([]);
            }
          } else {
            setUserPermissions([]);
          }
        }
      }
    };

    fetchUserData();

    // Listen for permission updates
    const handleStorageChange = () => {
      const updatedPermissions = localStorage.getItem('userPermissions');
      if (updatedPermissions) {
        try {
          setUserPermissions(JSON.parse(updatedPermissions));
        } catch (e) {
          setUserPermissions([]);
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('permissionsUpdated', handleStorageChange);

      return () => {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('permissionsUpdated', handleStorageChange);
      };
    }
  }, []);

  // Check if user has permission for a section
  const hasPermission = (sectionKey: string): boolean => {
    // Admin has all permissions
    if (userRole === 'admin') return true;
    
    // Staff needs specific permission
    if (userRole === 'staff') {
      const requiredPermission = sectionPermissions[sectionKey];
      return requiredPermission ? userPermissions.includes(requiredPermission) : false;
    }
    
    return false;
  };

  // Filter sections based on permissions
  const getFilteredSection = (section: any[], sectionKey: string) => {
    if (hasPermission(sectionKey)) {
      return section;
    }
    return [];
  };

  // Get active and hover classes based on user role
  const getHoverClasses = (isActive: boolean) => {
    if (isActive) {
      // Staff gets unique active color (indigo-purple gradient), admin keeps green
      if (userRole === 'staff') {
        return 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50';
      }
      return 'bg-[#10b981] text-white shadow-lg shadow-[#10b981]/50';
    }
    return 'text-gray-300 hover:text-white hover:bg-gray-800 active:bg-gray-700';
  };
  
  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 right-4 z-[100]">
        <AnimatedHamburger 
          isOpen={isMobileOpen} 
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="p-2.5 bg-black text-white rounded-lg shadow-xl hover:bg-gray-900 transition-colors w-12 h-12 flex items-center justify-center"
          variant="dark"
        />
      </div>
      
      {/* Sidebar */}
      <aside
        className={clsx(
          'fixed top-0 left-0 h-full bg-black text-white z-40 transition-all duration-300 ease-in-out shadow-xl',
          isCollapsed ? 'w-20' : 'w-64',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              {!isCollapsed && (
                <h1 className="text-2xl font-bold text-white transition-opacity duration-300">{userRole === 'staff' ? 'Staff Panel' : 'Admin Panel'}</h1>
              )}
              <div className="lg:block hidden">
                <AnimatedHamburger
                  isOpen={isCollapsed}
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="hover:bg-gray-800 rounded-lg p-1"
                  variant="dark"
                />
              </div>
            </div>
          </div>
          
          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-4 overflow-y-auto">
            {/* Main Section */}
            <div>
              {!isCollapsed && <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-4">Main</p>}
              <div className="space-y-1">
                {getMainSection(userRole).map((item) => {
                  // Check permission for Reports
                  if (item.href === '/admin/reports' && userRole === 'staff' && !userPermissions.includes('view_reports')) {
                    return null;
                  }
                  // Check if dashboard URL matches (for staff/admin)
                  const isActive = pathname === item.href || 
                    (item.href.includes('/dashboard') && (pathname === '/admin/dashboard' || pathname === '/staff/dashboard'));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon
                        className={clsx(
                          'h-5 w-5 flex-shrink-0',
                          isActive && 'scale-110'
                        )}
                      />
                      {!isCollapsed && (
                        <span className="font-medium">{item.label}</span>
                      )}
                      {isActive && !isCollapsed && (
                        <div className="ml-auto w-1 h-1 bg-white rounded-full animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Backend Content Section */}
            {!isCollapsed && <p className="text-xs font-semibold text-gray-500 uppercase mb-2 px-4 mt-4">Backend Content</p>}
            
            {/* Donation Section */}
            {hasPermission('donationSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Donation</p>}
              <div className="space-y-1">
                {donationSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Coupon Section */}
            {hasPermission('couponSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Coupon</p>}
              <div className="space-y-1">
                {couponSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Crowdfunding Section */}
            {hasPermission('crowdfundingSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Crowdfunding</p>}
              <div className="space-y-1">
                {crowdfundingSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Volunteer Section */}
            {hasPermission('volunteerSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Volunteer</p>}
              <div className="space-y-1">
                {volunteerSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Partner Section */}
            {hasPermission('partnerSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Partner</p>}
              <div className="space-y-1">
                {partnerSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Users Section */}
            {hasPermission('usersSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Users</p>}
              <div className="space-y-1">
                {usersSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Website Queries */}
            {hasPermission('querySection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Website Queries</p>}
              <div className="space-y-1">
                {querySection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Events Section */}
            {hasPermission('eventsSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Events</p>}
              <div className="space-y-1">
                {eventsSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Products */}
            {hasPermission('productsSection') && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Products</p>}
              <div className="space-y-1">
                {productsSection.map((item) => {
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Content Management */}
            {(hasPermission('contentSection') || userPermissions.includes('manage_celebrities') || userPermissions.includes('manage_blogs')) && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Content Management</p>}
              <div className="space-y-1">
                {contentSection.map((item) => {
                  // Check specific permission for each item
                  const hasItemPermission = userRole === 'admin' || 
                    (item.href.includes('/blogs') && (userRole === 'admin' || userPermissions.includes('manage_blogs'))) ||
                    (item.href.includes('/celebrities') && (userRole === 'admin' || userPermissions.includes('manage_celebrities')));
                  
                  if (!hasItemPermission) return null;
                  const isActive = pathname === item.href || (pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}

            {/* Staff Management - Only for Admin */}
            {userRole === 'admin' && (
            <div>
              {!isCollapsed && <p className="text-xs text-gray-400 mb-1 px-4">Staff Management</p>}
              <div className="space-y-1">
                {staffManagementSection.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                      className={clsx(
                        'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
                        getHoverClasses(isActive)
                      )}
                    >
                      <item.icon className="h-5 w-5 flex-shrink-0" />
                      {!isCollapsed && <span className="font-medium">{item.label}</span>}
                    </Link>
                  );
                })}
              </div>
            </div>
            )}
          </nav>
          
          {/* Profile Section */}
          <div className="p-4 border-t border-gray-800 space-y-1">
            {profileSection.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/admin/profile' && pathname?.startsWith(item.href + '/') && pathname.split('/').length === item.href.split('/').length + 1);
              if (item.href === '/logout') {
                return (
                  <button
                    key={item.href}
                    onClick={() => {
                      setIsMobileOpen(false);
                      // Handle logout
                      if (typeof window !== 'undefined') {
                        localStorage.removeItem('adminToken');
                        localStorage.removeItem('adminEmail');
                        window.location.href = '/admin/login';
                      }
                    }}
                    className={clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 w-full text-left',
                      'text-gray-300 hover:text-white hover:bg-gray-800'
                    )}
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    {!isCollapsed && <span className="font-medium">{item.label}</span>}
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group',
                    getHoverClasses(isActive)
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {!isCollapsed && <span className="font-medium">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      </aside>
      
      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

