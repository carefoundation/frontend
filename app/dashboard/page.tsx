'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TrendingUp, Users, Target, Plus, Eye, Edit, Trash2, ArrowRight, Wallet, Award, Download, Ticket, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import ProgressBar from '@/components/ui/ProgressBar';
import { api, ApiError } from '@/lib/api';

const PartnerKycModal = dynamic(() => import('@/components/PartnerKycModal'), { ssr: false });

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'campaigns'>('overview');
  const [userRole, setUserRole] = useState<'donor' | 'beneficiary' | 'volunteer' | 'vendor' | 'fundraiser' | 'partner' | 'staff'>('donor');
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);
  const [myClaims, setMyClaims] = useState<any[]>([]);
  const [isApproved, setIsApproved] = useState(false);
  const [partnerKycCompleted, setPartnerKycCompleted] = useState(false);
  const [partnerFormApproved, setPartnerFormApproved] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [recentDonations, setRecentDonations] = useState<any[]>([]);
  const [myCampaigns, setMyCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<any>(null);
  const [couponStats, setCouponStats] = useState({ total: 0, redeemed: 0, active: 0 });
  
  useEffect(() => {
    // Redirect to role-based dashboard
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('userRole');
      if (role === 'admin') {
        window.location.href = '/admin/dashboard';
        return;
      }
      if (role === 'staff') {
        window.location.href = '/staff/dashboard';
        return;
      }
      // For other roles, redirect to donor dashboard
      if (role && role !== 'donor' && role !== 'beneficiary' && role !== 'volunteer' && role !== 'vendor' && role !== 'fundraiser' && role !== 'partner') {
        window.location.href = '/donor/dashboard';
        return;
      }
    }
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const role = localStorage.getItem('userRole') as typeof userRole | 'admin' || 'donor';
      setUserRole(role as typeof userRole);

      // Fetch user data first (required for other checks)
      let userRes: any = null;
      let partnerFormApprovedValue = false;
      
      try {
        userRes = await api.get<any>('/users/me');
        if (!userRes) {
          // User not found - clear token and redirect
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
          }
          window.location.href = '/login';
          return;
        }
        if (userRes && !userRes.isApproved && role !== 'admin') {
          // Redirect to login if not approved
          alert('Your account is pending admin approval. Please wait for approval before accessing the dashboard.');
          window.location.href = '/login';
          return;
        }
        if (role === 'partner') {
          setIsApproved(userRes?.isApproved || false);
          setPartnerKycCompleted(userRes?.partnerKycCompleted || false);
          
          // Show KYC modal if approved but KYC not completed
          if (userRes?.isApproved && !userRes?.partnerKycCompleted) {
            const kycModalDismissed = sessionStorage.getItem('kycModalDismissed');
            if (!kycModalDismissed) {
              setShowKycModal(true);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        if (error instanceof ApiError && (error.message === 'User not found' || error.status === 401 || error.status === 403)) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
          }
          window.location.href = '/login';
          return;
        }
      }

      // Prepare parallel API calls based on role
      const apiCalls: Promise<any>[] = [];
      const callNames: string[] = [];

      // Always fetch donations and campaigns in parallel
      apiCalls.push(
        api.get<any[]>('/donations?limit=3').catch(() => []),
        api.get<any[]>('/campaigns/me?limit=3').catch(() => [])
      );
      callNames.push('donations', 'campaigns');

      // Partner-specific calls
      if (role === 'partner') {
        apiCalls.push(
          api.get<any[]>('/partners?limit=50').catch(() => []),
          api.get<any[]>('/coupons?limit=50').catch(() => []),
          api.get<any[]>('/coupon-claims/my-claims?limit=50').catch(() => [])
        );
        callNames.push('partners', 'coupons', 'claims');
      }

      // Vendor-specific calls
      if (role === 'vendor') {
        apiCalls.push(api.get<any>('/wallets/me').catch(() => null));
        callNames.push('wallet');
      }

      // Execute all API calls in parallel
      const results = await Promise.all(apiCalls);
      
      // Process results
      const resultMap: Record<string, any> = {};
      callNames.forEach((name, index) => {
        resultMap[name] = results[index];
      });

      // Process donations
      if (resultMap.donations && Array.isArray(resultMap.donations)) {
        const formatted = resultMap.donations.slice(0, 3).map((donation: any) => ({
          campaign: donation.campaignId?.title || donation.campaign?.title || 'General Donation',
          amount: donation.amount || 0,
          date: donation.createdAt ? new Date(donation.createdAt).toISOString().split('T')[0] : 'N/A',
          status: donation.status || 'Completed',
        }));
        setRecentDonations(formatted);
      }

      // Process campaigns
      if (resultMap.campaigns && Array.isArray(resultMap.campaigns)) {
        const formatted = resultMap.campaigns.slice(0, 3).map((campaign: any) => {
          const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
          const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
          return {
            id: campaign._id || campaign.id,
            title: campaign.title || 'Untitled',
            currentAmount: campaign.currentAmount || 0,
            goalAmount: campaign.goalAmount || campaign.goal || 0,
            donors: campaign.donors || 0,
            status: campaign.status === 'active' ? 'Active' : campaign.status === 'completed' ? 'Completed' : 'Pending',
            daysLeft: daysLeft > 0 ? daysLeft : 0,
          };
        });
        setMyCampaigns(formatted);
      }

      // Process partner data
      if (role === 'partner') {
        // Check partner record status
        if (resultMap.partners && Array.isArray(resultMap.partners)) {
          const myPartnerRecord = resultMap.partners.find((p: any) => {
            const createdById = typeof p.createdBy === 'string' ? p.createdBy : p.createdBy?._id || p.createdBy?.id;
            const userId = userRes?.id || userRes?._id;
            return createdById === userId;
          });
          
          if (myPartnerRecord) {
            partnerFormApprovedValue = myPartnerRecord.status === 'approved' || myPartnerRecord.status === 'active';
            setPartnerFormApproved(partnerFormApprovedValue);
          } else {
            partnerFormApprovedValue = false;
            setPartnerFormApproved(false);
          }
        }

        // Process coupons if partner form is approved
        if (partnerFormApprovedValue && resultMap.coupons && Array.isArray(resultMap.coupons)) {
          const redeemed = resultMap.coupons.filter((c: any) => c.status === 'redeemed' || c.isRedeemed).length;
          const active = resultMap.coupons.filter((c: any) => {
            const expiryDate = c.expiryDate ? new Date(c.expiryDate) : null;
            return (c.status === 'active' || !c.status) && (!expiryDate || expiryDate > new Date());
          }).length;
          setCouponStats({ total: resultMap.coupons.length, redeemed, active });
          
          const available = resultMap.coupons.filter((c: any) => {
            const expiryDate = c.validUntil ? new Date(c.validUntil) : null;
            return (c.status === 'active' || !c.status) && 
                   (!expiryDate || expiryDate > new Date()) &&
                   !c.issuedTo;
          });
          setAvailableCoupons(available);
        } else {
          setAvailableCoupons([]);
          setCouponStats({ total: 0, redeemed: 0, active: 0 });
        }

        // Process claims if partner form is approved
        if (partnerFormApprovedValue && resultMap.claims && Array.isArray(resultMap.claims)) {
          setMyClaims(resultMap.claims);
        } else {
          setMyClaims([]);
        }
      }

      // Process wallet data for vendors
      if (role === 'vendor' && resultMap.wallet) {
        setWalletData(resultMap.wallet);
      }

      // Calculate stats based on role
      if (role !== 'admin') {
        const calculatedStats = getStats(role as typeof userRole);
        setStats(calculatedStats);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 401 || error.message === 'User not found') {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
          }
          window.location.href = '/login';
          return;
        }
        if (error.status === 403 && error.message?.includes('authorized')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('userToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
          }
          window.location.href = '/login';
          return;
        }
      }
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClaimCoupon = async (couponId: string) => {
    try {
      await api.post('/coupon-claims/claim', { couponId });
      alert('Coupon claim request submitted! Waiting for admin approval.');
      fetchDashboardData();
    } catch (error: any) {
      alert(error.message || 'Failed to claim coupon');
    }
  };

  const getStats = (role: typeof userRole) => {
    switch (role) {
      case 'partner':
        const totalCoupons = availableCoupons.length;
        const pendingClaims = myClaims.filter(c => c.status === 'pending').length;
        const approvedClaims = myClaims.filter(c => c.status === 'approved').length;
        let statusText = 'Pending';
        let statusColor = 'text-yellow-600';
        let statusBg = 'bg-yellow-50';
        
        if (isApproved && partnerKycCompleted) {
          statusText = 'Active';
          statusColor = 'text-green-600';
          statusBg = 'bg-green-50';
        } else if (isApproved && !partnerKycCompleted) {
          statusText = 'KYC Pending';
          statusColor = 'text-orange-600';
          statusBg = 'bg-orange-50';
        }
        
        return [
          { icon: Ticket, value: totalCoupons.toString(), label: 'Available Coupons', color: 'text-[#10b981]', bg: 'bg-[#ecfdf5]' },
          { icon: Ticket, value: approvedClaims.toString(), label: 'Claimed Coupons', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Ticket, value: pendingClaims.toString(), label: 'Pending Claims', color: 'text-orange-600', bg: 'bg-orange-50' },
          { icon: Users, value: statusText, label: 'Account Status', color: statusColor, bg: statusBg },
        ];
      case 'vendor':
        const walletBalance = walletData?.balance || 0;
        return [
          { icon: Wallet, value: `₹${walletBalance.toLocaleString()}`, label: 'Wallet Balance', color: 'text-[#10b981]', bg: 'bg-[#ecfdf5]' },
          { icon: Ticket, value: couponStats.total.toString(), label: 'Total Coupons', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Ticket, value: couponStats.redeemed.toString(), label: 'Redeemed', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: Ticket, value: couponStats.active.toString(), label: 'Active Coupons', color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
      case 'beneficiary':
        return [
          { icon: Heart, value: '₹1,20,000', label: 'Total Received', color: 'text-[#10b981]', bg: 'bg-[#ecfdf5]' },
          { icon: Target, value: '15', label: 'Donations Count', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Users, value: 'Verified', label: 'Verification Status', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: TrendingUp, value: 'Active', label: 'Status', color: 'text-purple-600', bg: 'bg-purple-50' },
        ];
      case 'volunteer':
        return [
          { icon: Award, value: '120', label: 'Hours Volunteered', color: 'text-[#10b981]', bg: 'bg-[#ecfdf5]' },
          { icon: Target, value: '15', label: 'Events Attended', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Award, value: '3', label: 'Certificates', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Users, value: 'Active', label: 'Status', color: 'text-green-600', bg: 'bg-green-50' },
        ];
      case 'fundraiser':
        return [
          { icon: TrendingUp, value: '₹2,50,000', label: 'Total Raised', color: 'text-[#10b981]', bg: 'bg-[#ecfdf5]' },
          { icon: Target, value: '5', label: 'Active Campaigns', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Target, value: '12', label: 'Total Campaigns', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: Users, value: '2', label: 'Pending', color: 'text-orange-600', bg: 'bg-orange-50' },
        ];
      default: // donor
        const totalDonated = recentDonations.reduce((sum, d) => sum + (parseFloat(d.amount?.toString() || '0') || 0), 0);
        const campaignsSupported = recentDonations.length > 0 
          ? new Set(recentDonations.map(d => d.campaign)).size 
          : 0;
        return [
          { icon: Heart, value: `₹${totalDonated.toLocaleString()}`, label: 'Total Donated', color: 'text-[#10b981]', bg: 'bg-[#ecfdf5]' },
          { icon: Target, value: campaignsSupported.toString(), label: 'Campaigns Supported', color: 'text-blue-600', bg: 'bg-blue-50' },
          { icon: Ticket, value: couponStats.total.toString(), label: 'Coupons Issued', color: 'text-purple-600', bg: 'bg-purple-50' },
          { icon: TrendingUp, value: 'Active', label: 'Status', color: 'text-green-600', bg: 'bg-green-50' },
        ];
    }
  };

  // Show skeleton loading instead of blocking entire page
  // if (loading) {
  //   return (
  //     <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
  //       <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
  //     </div>
  //   );
  // }

  // Calculate actual stats from live data
  const totalDonated = recentDonations
    .filter((d) => d.status === 'Completed')
    .reduce((sum, d) => sum + d.amount, 0);
  
  const activeCampaignsCount = myCampaigns.filter((c) => c.status === 'Active').length;
  const totalCampaignsCount = myCampaigns.length;
  const totalRaised = myCampaigns
    .filter((c) => c.status === 'Active' || c.status === 'Completed')
    .reduce((sum, c) => sum + c.currentAmount, 0);

  // Update stats with live data
  const updatedStats = stats.map((stat) => {
    if (stat.label === 'Total Donated') {
      return { ...stat, value: `₹${totalDonated.toLocaleString()}` };
    }
    if (stat.label === 'Total Raised') {
      return { ...stat, value: `₹${totalRaised.toLocaleString()}` };
    }
    if (stat.label === 'Active Campaigns') {
      return { ...stat, value: activeCampaignsCount.toString() };
    }
    if (stat.label === 'Total Campaigns') {
      return { ...stat, value: totalCampaignsCount.toString() };
    }
    if (stat.label === 'Campaigns Supported') {
      return { ...stat, value: recentDonations.length.toString() };
    }
    return stat;
  });

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back! 👋
        </h1>
        <p className="text-gray-600">
          {userRole === 'partner' && 'Claim and manage your coupons'}
          {userRole === 'vendor' && 'Manage your wallet and coupons'}
          {userRole === 'beneficiary' && 'Track your donations and support'}
          {userRole === 'volunteer' && 'View your volunteer activities'}
          {userRole === 'fundraiser' && 'Manage your fundraising campaigns'}
          {userRole === 'donor' && "Here's your impact summary"}
          {userRole === 'staff' && 'Manage organization activities'}
        </p>
      </div>
        
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {loading && updatedStats.length === 0 ? (
          // Show skeleton loaders while loading
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="p-6">
              <div className="bg-gray-200 w-12 h-12 rounded-lg mb-4 animate-pulse" />
              <div className="h-8 bg-gray-200 rounded mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </Card>
          ))
        ) : (
          updatedStats.map((stat, index) => (
            <Card key={index} hover className="p-6">
              <div className={`${stat.bg} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          ))
        )}
      </div>

      {/* Partner Dashboard - Coupon Claims */}
      {userRole === 'partner' && (
        <>
          {!isApproved ? (
            <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="text-yellow-600 text-2xl">⏳</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Account Pending Approval</h2>
                  <p className="text-gray-600">Your account is waiting for admin approval. Once approved, you'll be able to claim coupons.</p>
                </div>
              </div>
            </Card>
          ) : !partnerKycCompleted ? (
            <Card className="p-6 mb-8 bg-orange-50 border-orange-200">
              <div className="flex items-center gap-3">
                <div className="text-orange-600 text-2xl">📋</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Complete KYC to Activate</h2>
                  <p className="text-gray-600">Your account is approved! Please complete the partnership KYC form to start claiming coupons.</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    onClick={() => setShowKycModal(true)}
                  >
                    Complete KYC Form
                  </Button>
                </div>
              </div>
            </Card>
          ) : !partnerFormApproved ? (
            <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="text-yellow-600 text-2xl">⏳</div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Partner Form Pending Approval</h2>
                  <p className="text-gray-600">Your partnership form has been submitted and is waiting for admin approval. Once approved, you'll be able to claim coupons.</p>
                </div>
              </div>
            </Card>
          ) : (
            <>
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Available Coupons to Claim</h2>
                {availableCoupons.length === 0 ? (
                  <p className="text-gray-600">No available coupons at the moment.</p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-4">
                    {availableCoupons.slice(0, 4).map((coupon: any) => (
                      <div key={coupon._id || coupon.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900">{coupon.code}</h3>
                            <p className="text-sm text-gray-600">{coupon.description || 'No description'}</p>
                          </div>
                          <span className="text-sm font-semibold text-[#10b981]">
                            {coupon.discountType === 'percentage' 
                              ? `${coupon.discountValue}%` 
                              : `₹${coupon.discountValue}`}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="w-full mt-2"
                          onClick={() => handleClaimCoupon(coupon._id || coupon.id)}
                        >
                          Claim Coupon
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
              
              <Card className="p-6 mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">My Coupon Claims</h2>
                {myClaims.length === 0 ? (
                  <p className="text-gray-600">You haven't claimed any coupons yet.</p>
                ) : (
                  <div className="space-y-3">
                    {myClaims.map((claim: any) => (
                      <div key={claim._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{claim.couponId?.code || 'N/A'}</p>
                          <p className="text-sm text-gray-600">
                            {new Date(claim.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          claim.status === 'approved' 
                            ? 'bg-green-100 text-green-700'
                            : claim.status === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </>
          )}
        </>
      )}

      {/* Quick Actions for Donor/Fundraiser */}
      {(userRole === 'donor' || userRole === 'fundraiser') && (
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link href="/campaigns">
              <Button className="w-full">
                <Image src="/Logo.png" alt="Logo" width={20} height={20} className="object-contain mr-2" />
                Donate Now
              </Button>
            </Link>
            <Link href="/dashboard/my-donations">
              <Button variant="outline" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View All Donations
              </Button>
            </Link>
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Report
            </Button>
          </div>
        </Card>
      )}

      {/* Issue Coupons Section for Donor/Fundraiser */}
      {(userRole === 'donor' || userRole === 'fundraiser') && (
        <Card className="p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Issue Coupons</h2>
          </div>
          <p className="text-gray-600">Create coupons for beneficiaries</p>
        </Card>
      )}
        
        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'overview'
                  ? 'text-[#10b981] border-b-2 border-[#10b981]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'donations'
                  ? 'text-[#10b981] border-b-2 border-[#10b981]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Donations
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 font-medium text-sm transition-colors ${
                activeTab === 'campaigns'
                  ? 'text-[#10b981] border-b-2 border-[#10b981]'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Campaigns
            </button>
          </div>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Recent Donations */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">Recent Donations</h2>
                <Link href="/dashboard?tab=donations">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {loading && recentDonations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading donations...</p>
                  </div>
                ) : recentDonations.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No donations yet</p>
                ) : (
                  recentDonations.map((donation, index) => (
                  <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
                    <div>
                      <p className="font-medium text-gray-900">{donation.campaign}</p>
                      <p className="text-sm text-gray-500">{donation.date}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-[#10b981]">₹{donation.amount.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{donation.status}</p>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </Card>
            
            {/* My Campaigns Preview */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900">My Campaigns</h2>
                <Link href="/dashboard?tab=campaigns">
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-4">
                {loading && myCampaigns.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    <p>Loading campaigns...</p>
                  </div>
                ) : myCampaigns.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No campaigns yet</p>
                ) : (
                  myCampaigns.slice(0, 2).map((campaign) => (
                  <div key={campaign.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        campaign.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <ProgressBar
                      current={campaign.currentAmount}
                      goal={campaign.goalAmount}
                      showLabel={false}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{campaign.donors} donors</span>
                      <span>{campaign.daysLeft} days left</span>
                    </div>
                  </div>
                  ))
                )}
              </div>
              <Link href="/campaigns/new" className="mt-4">
                <Button variant="outline" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Campaign
                </Button>
              </Link>
            </Card>
          </div>
        )}
        
        {activeTab === 'donations' && (
          <Card className="p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Donation History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Campaign</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Date</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDonations.map((donation, index) => (
                    <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <Link href={`/campaigns/${index + 1}`} className="font-medium text-gray-900 hover:text-[#10b981]">
                          {donation.campaign}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-semibold text-[#10b981]">₹{donation.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-600">{donation.date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                          {donation.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/campaigns/${index + 1}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
        
        {activeTab === 'campaigns' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">My Campaigns</h2>
              <Link href="/campaigns/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Start New Campaign
                </Button>
              </Link>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCampaigns.map((campaign) => (
                <Card key={campaign.id} hover className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-gray-900">{campaign.title}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      campaign.status === 'Active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {campaign.status}
                    </span>
                  </div>
                  
                  <ProgressBar
                    current={campaign.currentAmount}
                    goal={campaign.goalAmount}
                    className="mb-4"
                  />
                  
                  <div className="flex justify-between text-sm text-gray-600 mb-4">
                    <span>{campaign.donors} donors</span>
                    <span>{campaign.daysLeft} days left</span>
                  </div>
                  
                  <div className="flex gap-2">
                    <Link href={`/campaigns/${campaign.id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

      {/* Partner KYC Modal */}
      {userRole === 'partner' && (
        <PartnerKycModal
          isOpen={showKycModal}
          onClose={() => {
            setShowKycModal(false);
            sessionStorage.setItem('kycModalDismissed', 'true');
          }}
          onComplete={() => {
            setShowKycModal(false);
            setPartnerKycCompleted(true);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}

