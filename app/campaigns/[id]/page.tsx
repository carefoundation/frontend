'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Clock, Users, MapPin, Share2, Facebook, Twitter, Copy, Heart, CheckCircle, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });

export default function CampaignDetailPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params?.id as string;
  const [donationAmount, setDonationAmount] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [recentDonors, setRecentDonors] = useState<any[]>([]);
  
  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const userToken = localStorage.getItem('userToken');
      setIsLoggedIn(!!userToken);
    }
    
    if (campaignId) {
      fetchCampaign();
      fetchRecentDonors();
    }
  }, [campaignId]);
  
  const fetchCampaign = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(`/campaigns/${campaignId}`);
      if (data) {
        const endDate = data.endDate ? new Date(data.endDate) : null;
        const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
        
        setCampaign({
          id: data._id || data.id,
          title: data.title,
          image: data.image || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=1200',
          category: data.category,
          currentAmount: data.currentAmount || 0,
          goalAmount: data.goalAmount || 0,
          donors: data.donors || 0,
          daysLeft: daysLeft > 0 ? daysLeft : 0,
          location: data.location || 'India',
          organizer: data.createdBy?.name || 'Anonymous',
          description: data.description || '',
          story: data.story || data.description || '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch campaign:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentDonors = async () => {
    try {
      // Try to fetch donations - this may require auth, so we'll handle gracefully
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      if (!token) {
        // If not authenticated, skip fetching donors
        setRecentDonors([]);
        return;
      }
      
      const donations = await api.get<any[]>('/donations');
      if (Array.isArray(donations)) {
        const campaignDonations = donations
          .filter((donation: any) => {
            const donationCampaignId = donation.campaignId?._id || donation.campaignId?.id || donation.campaignId;
            return donationCampaignId === campaignId || donationCampaignId?.toString() === campaignId;
          })
          .slice(0, 5)
          .map((donation: any) => {
            const donorName = donation.userId?.name || 
                            `${donation.firstName || ''} ${donation.lastName || ''}`.trim() || 
                            donation.email?.split('@')[0] || 
                            'Anonymous';
            const timeAgo = donation.createdAt ? formatTimeAgo(donation.createdAt) : 'Recently';
            return {
              name: donorName,
              amount: donation.amount || 0,
              time: timeAgo,
            };
          });
        setRecentDonors(campaignDonations);
      }
    } catch (error) {
      // Silently fail - recent donors is optional
      setRecentDonors([]);
    }
  };

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
  
  
  const handleDonate = () => {
    if (!campaign) return;
    
    // Validate donation amount
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      showToast('Please enter a valid donation amount', 'error');
      return;
    }
    
    // Save donation data to localStorage
    if (typeof window !== 'undefined') {
      const donationData = {
        amount: donationAmount,
        campaignId: campaignId,
        campaignTitle: campaign.title,
      };
      localStorage.setItem('pendingDonation', JSON.stringify(donationData));
    }
    
    // Redirect directly to payment (no login required)
    router.push('/payment');
  };
  
  const handleShare = (platform: string) => {
    const url = window.location.href;
    const text = `Help support: ${campaign.title}`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(url);
      showToast('Link copied to clipboard!', 'success');
    } else if (platform === 'facebook') {
      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-4">Campaign not found</p>
          <Button onClick={() => router.push('/campaigns')}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Campaign Image */}
            <div className="relative h-96 w-full rounded-2xl overflow-hidden shadow-xl bg-gray-200">
              <Image
                src={campaign.image}
                alt={campaign.title}
                fill
                className="object-cover"
                unoptimized
              />
              <div className="absolute top-4 left-4">
                <span className="bg-[#10b981] text-white text-sm font-semibold px-4 py-2 rounded-full">
                  {campaign.category}
                </span>
              </div>
            </div>
            
            {/* Title & Info */}
            <Card className="p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
              
              <div className="flex flex-wrap gap-4 mb-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{campaign.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>{campaign.donors} donors</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{campaign.daysLeft} days left</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  <span>Verified Campaign</span>
                </div>
              </div>
              
              <ProgressBar current={campaign.currentAmount} goal={campaign.goalAmount} />
            </Card>
            
            {/* Story Section */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">The Story</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                  {campaign.description}
                </p>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {campaign.story}
                </p>
              </div>
            </Card>
            
            {/* Recent Donors */}
            {recentDonors.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Donors</h2>
                <div className="space-y-3">
                  {recentDonors.map((donor, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{donor.name}</p>
                        <p className="text-sm text-gray-500">{donor.time}</p>
                      </div>
                      <p className="font-semibold text-[#10b981]">₹{donor.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
          
          {/* Donate Sidebar */}
          <div className="lg:sticky lg:top-20 h-fit">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Make a Donation</h2>
              
              
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-3 gap-2">
                  {[500, 1000, 2000, 5000, 10000, 25000].map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setDonationAmount(amount.toString())}
                      className={`py-2 px-3 rounded-lg border-2 transition-all ${
                        donationAmount === amount.toString()
                          ? 'border-[#10b981] bg-[#ecfdf5] text-[#10b981] font-semibold'
                          : 'border-gray-300 text-gray-700 hover:border-[#10b981]'
                      }`}
                    >
                      ₹{amount}
                    </button>
                  ))}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Or enter custom amount
                  </label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  />
                </div>
              </div>
              
              <Button
                onClick={handleDonate}
                className="w-full mb-4"
                size="lg"
              >
                <Image src="/Logo.png" alt="Logo" width={24} height={24} className="object-contain mr-2" />
                Donate Now
              </Button>
              
              <div className="border-t border-gray-200 pt-4">
                <p className="text-sm text-gray-600 mb-3">Share this campaign</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleShare('facebook')}
                    className="flex-1 py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Facebook className="h-4 w-4" />
                    Facebook
                  </button>
                  <button
                    onClick={() => handleShare('twitter')}
                    className="flex-1 py-2 px-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <Twitter className="h-4 w-4" />
                    Twitter
                  </button>
                  <button
                    onClick={() => handleShare('copy')}
                    className="py-2 px-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Card>
            
            {/* Organizer Info */}
            <Card className="p-6 mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Organized by</h3>
              <p className="text-gray-700">{campaign.organizer}</p>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

