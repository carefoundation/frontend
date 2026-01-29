'use client';

import { useEffect, useState } from 'react';
import { Users, Target, Wallet, ArrowUp, HeartHandshake, Ticket, Building2, Stethoscope, CheckCircle2, Loader2 } from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeCampaigns: 0,
    totalDonations: 0,
    volunteersCount: 0,
    foodPartners: 0,
    healthPartners: 0,
    couponsGenerated: 0,
    completedCampaigns: 0,
  });
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [recentCampaigns, setRecentCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [userPermissions, setUserPermissions] = useState<string[]>([]);

  // Fetch user data and permissions from API
  useEffect(() => {
    const fetchUserData = async () => {
      try {
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

  // Check if user has permission
  const hasPermission = (permission: string): boolean => {
    if (userRole === 'admin') return true;
    if (userRole === 'staff') {
      return userPermissions.includes(permission);
    }
    return false;
  };

  // Auto-refresh every 10 seconds for staff to see live payments, 30 seconds for admin
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const data = await api.get<{ stats: typeof stats; recentDonations: any[]; recentCampaigns: any[] }>('/dashboard/admin');
        
        if (data) {
          if (data.stats) {
            setStats({
              totalUsers: data.stats.totalUsers || 0,
              activeCampaigns: data.stats.activeCampaigns || 0,
              totalDonations: data.stats.totalDonations || 0,
              volunteersCount: data.stats.volunteersCount || 0,
              foodPartners: data.stats.foodPartners || 0,
              healthPartners: data.stats.healthPartners || 0,
              couponsGenerated: data.stats.couponsGenerated || 0,
              completedCampaigns: data.stats.completedCampaigns || 0,
            });
          }
          if (data.recentDonations) {
            setRecentDonations(data.recentDonations);
          }
          if (data.recentCampaigns) {
            setRecentCampaigns(data.recentCampaigns);
          }
        }
      } catch (error) {
        if (error instanceof ApiError) {
          // Handle 401 - redirect to login if unauthorized
          if (error.status === 401) {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('userToken');
              window.location.href = '/login';
            }
            return;
          }
          showToast(`Failed to load dashboard: ${error.message}`, 'error');
        } else {
          showToast('Failed to load dashboard statistics', 'error');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    // Refresh more frequently for staff to see live payments
    const refreshInterval = userRole === 'staff' ? 10000 : 30000; // 10 seconds for staff, 30 for admin
    const interval = setInterval(fetchStats, refreshInterval);

    return () => clearInterval(interval);
  }, [userRole]);

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) {
      return `₹${(amount / 10000000).toFixed(1)}Cr`;
    } else if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(1)}L`;
    } else {
      return `₹${amount.toLocaleString()}`;
    }
  };

  const allStatCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers.toLocaleString(),
      icon: Users,
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      gradient: 'from-blue-500 to-blue-600',
      permission: 'manage_users',
    },
    {
      title: 'Active Campaigns',
      value: stats.activeCampaigns.toLocaleString(),
      icon: Target,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      gradient: 'from-purple-500 to-purple-600',
      permission: 'manage_campaigns',
    },
    {
      title: 'Total Donations',
      value: formatCurrency(stats.totalDonations),
      icon: Wallet,
      color: 'text-[#10b981]',
      bg: 'bg-[#ecfdf5]',
      gradient: 'from-[#10b981] to-[#059669]',
      permission: 'manage_donations',
    },
    {
      title: 'Volunteers Count',
      value: stats.volunteersCount.toLocaleString(),
      icon: HeartHandshake,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
      gradient: 'from-orange-500 to-orange-600',
      permission: 'manage_volunteers',
    },
    {
      title: 'Food Partners',
      value: stats.foodPartners.toLocaleString(),
      icon: Building2,
      color: 'text-pink-600',
      bg: 'bg-pink-50',
      gradient: 'from-pink-500 to-pink-600',
      permission: 'manage_partners',
    },
    {
      title: 'Doctors for u',
      value: stats.healthPartners.toLocaleString(),
      icon: Stethoscope,
      color: 'text-red-600',
      bg: 'bg-red-50',
      gradient: 'from-red-500 to-red-600',
      permission: 'manage_partners',
    },
    {
      title: 'Coupons Generated',
      value: stats.couponsGenerated.toLocaleString(),
      icon: Ticket,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      gradient: 'from-indigo-500 to-indigo-600',
      permission: 'manage_coupons',
    },
    {
      title: 'Completed Campaigns',
      value: stats.completedCampaigns.toLocaleString(),
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-50',
      gradient: 'from-green-500 to-green-600',
      permission: 'manage_campaigns',
    },
  ];

  // Filter stat cards based on permissions
  const statCards = allStatCards.filter(card => 
    userRole === 'admin' || hasPermission(card.permission)
  );
  
  const formatTimeAgo = (date: string | Date) => {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  };

  const formatActivity = () => {
    const activities: any[] = [];
    
    // Add recent donations - only if user has permission (for admin view)
    if (userRole === 'admin' || hasPermission('view_reports')) {
      recentDonations.slice(0, 3).forEach((donation: any) => {
        activities.push({
          action: 'New donation received',
          amount: `₹${(donation.amount || 0).toLocaleString()}`,
          time: formatTimeAgo(donation.createdAt || new Date()),
        });
      });
    }
    
    // Add recent campaigns - only if user has permission
    if (userRole === 'admin' || hasPermission('manage_campaigns') || hasPermission('view_reports')) {
      recentCampaigns.slice(0, 2).forEach((campaign: any) => {
        activities.push({
          action: campaign.status === 'active' ? 'Campaign approved' : 'Campaign created',
          campaign: campaign.title || 'Untitled',
          time: formatTimeAgo(campaign.createdAt || new Date()),
        });
      });
    }
    
    return activities.sort((a, b) => {
      const timeA = a.time.includes('minutes') ? 0 : a.time.includes('hours') ? 1 : 2;
      const timeB = b.time.includes('minutes') ? 0 : b.time.includes('hours') ? 1 : 2;
      return timeA - timeB;
    }).slice(0, 5);
  };
  
  if (loading && stats.totalUsers === 0) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {userRole === 'staff' ? 'Staff Dashboard' : 'Dashboard'}
        </h1>
        <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
        {statCards.map((stat, index) => (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.title}</div>
          </Card>
        ))}
      </div>
      
      {/* Quick Actions */}
      {(userRole === 'admin' || 
        hasPermission('manage_fundraisers') || 
        hasPermission('view_reports') || 
        hasPermission('manage_users') || 
        hasPermission('manage_partners')) && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {hasPermission('manage_fundraisers') && (
              <Link href="/admin/fundraiser-requests">
                <Button variant="outline" className="w-full">Approve Fundraisers</Button>
              </Link>
            )}
            {hasPermission('view_reports') && (
              <Link href="/admin/reports">
                <Button variant="outline" className="w-full">View Reports</Button>
              </Link>
            )}
            {hasPermission('manage_users') && (
              <Link href="/admin/users">
                <Button variant="outline" className="w-full">Manage Users</Button>
              </Link>
            )}
            {hasPermission('manage_partners') && (
              <Link href="/admin/partner-requests">
                <Button variant="outline" className="w-full">Approve Partners</Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Recent Payments - Show for staff with view_reports or manage_donations permission */}
      {(userRole === 'staff' && (hasPermission('view_reports') || hasPermission('manage_donations'))) && (
        <Card className="p-6 border-2 border-[#10b981] mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">Live Recent Payments</h2>
                <span className="px-2 py-1 bg-[#10b981] text-white text-xs font-semibold rounded-full animate-pulse">
                  LIVE
                </span>
              </div>
              <p className="text-sm text-gray-600">
                <span className="font-semibold text-[#10b981]">{recentDonations.length}</span> payment{recentDonations.length !== 1 ? 's' : ''} received recently
              </p>
            </div>
            {hasPermission('view_reports') && (
              <Link href="/admin/reports">
                <Button variant="outline" size="sm">View All Reports</Button>
              </Link>
            )}
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {recentDonations.length > 0 ? (
              recentDonations.slice(0, 10).map((donation: any, index) => (
              <div key={index} className="flex items-start gap-3 p-4 hover:bg-gray-50 rounded-lg transition-colors border-l-4 border-[#10b981] bg-gradient-to-r from-green-50/50 to-white">
                <div className="w-3 h-3 bg-[#10b981] rounded-full mt-1 flex-shrink-0 animate-pulse" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">
                      Payment received
                      {donation.userId?.name && (
                        <span className="text-gray-600 ml-2">from {donation.userId.name}</span>
                      )}
                    </p>
                    <span className="text-lg font-bold text-[#10b981]">₹{(donation.amount || 0).toLocaleString()}</span>
                  </div>
                  {donation.campaignId?.title && (
                    <p className="text-xs text-gray-500 mt-1">Campaign: {donation.campaignId.title}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">{formatTimeAgo(donation.createdAt || new Date())}</p>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent payments</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Recent Activity - Only show for admin or staff with view_reports */}
      {(userRole === 'admin' || 
        (userRole === 'staff' && hasPermission('view_reports'))) && (
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
            {hasPermission('view_reports') && (
              <Link href="/admin/reports">
                <Button variant="ghost" size="sm">View All</Button>
              </Link>
            )}
          </div>
          <div className="space-y-4">
            {formatActivity().length > 0 ? (
              formatActivity().map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="w-2 h-2 bg-[#10b981] rounded-full mt-2 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    <span className="font-medium">{activity.action}</span>
                    {activity.amount && (
                      <span className="text-[#10b981] font-semibold ml-1">{activity.amount}</span>
                    )}
                    {activity.campaign && (
                      <span className="text-gray-600 ml-1">- {activity.campaign}</span>
                    )}
                    {activity.user && (
                      <span className="text-gray-600 ml-1">- {activity.user}</span>
                    )}
                    {activity.partner && (
                      <span className="text-gray-600 ml-1">- {activity.partner}</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                </div>
              </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent activity</p>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

