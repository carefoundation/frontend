'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart, TrendingUp, Users, Target, ArrowRight, CheckCircle, Star, User, Mail, Phone, Map, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { showToast } from '@/lib/toast';

const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });
const CampaignCard = dynamic(() => import('@/components/campaigns/CampaignCard'), { ssr: false });
const VideoImageSlider = dynamic(() => import('@/components/ui/VideoImageSlider'), { ssr: false });

export default function Home() {
  const router = useRouter();
  const [donationAmount, setDonationAmount] = useState('');
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthPartnerIndex, setHealthPartnerIndex] = useState(0);
  const [foodPartnerIndex, setFoodPartnerIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form fields
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      showToast('Please enter a valid donation amount', 'error');
      return;
    }
    if (!donorName || !donorEmail || !donorPhone) {
      showToast('Please fill all required fields', 'error');
      return;
    }
    
    // Save donation data
    if (typeof window !== 'undefined') {
      const donationData = {
        amount: donationAmount,
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
      };
      localStorage.setItem('pendingDonation', JSON.stringify(donationData));
    }
    
    // Redirect directly to payment (no login required)
    router.push('/payment');
  };

  const [trustStats, setTrustStats] = useState([
    { icon: Heart, value: '₹0', label: 'Total Raised', color: 'text-[#10b981]' },
    { icon: Users, value: '0', label: 'Total Donors', color: 'text-[#10b981]' },
    { icon: Target, value: '0', label: 'Total Campaigns', color: 'text-[#10b981]' },
    { icon: TrendingUp, value: '0%', label: 'Success Rate', color: 'text-[#10b981]' },
  ]);
  const [urgentCampaigns, setUrgentCampaigns] = useState<any[]>([]);
  const [trendingCampaigns, setTrendingCampaigns] = useState<any[]>([]);
  const [healthPartners, setHealthPartners] = useState<any[]>([]);
  const [foodPartners, setFoodPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
    fetchSuccessStories();
  }, []);

  const fetchSuccessStories = async () => {
    try {
      const { api } = await import('@/lib/api');
      const data = await api.get<any[]>('/campaigns?status=completed');
      if (Array.isArray(data)) {
        // Filter only completed campaigns and sort by latest (most recent first)
        const completedCampaigns = data
          .filter((campaign: any) => campaign.status === 'completed')
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA; // Latest first
          })
          .slice(0, 2) // Get only latest 2
          .map((campaign: any) => ({
            title: campaign.title || 'Success Story',
            description: campaign.description || 'Campaign completed successfully',
            image: campaign.image || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400',
            raised: `₹${(campaign.currentAmount || 0).toLocaleString()}`,
          }));
        setSuccessStories(completedCampaigns);
      } else {
        setSuccessStories([]);
      }
    } catch (error) {
      console.error('Failed to fetch success stories:', error);
      setSuccessStories([]);
    }
  };

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const { api } = await import('@/lib/api');
      const data = await api.get('/dashboard/home');
      
      if (data && data.stats) {
        const formatCurrency = (amount: number) => {
          if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr+`;
          if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L+`;
          return `₹${amount.toLocaleString()}`;
        };

        setTrustStats([
          { icon: Heart, value: formatCurrency(data.stats.totalRaised || 0), label: 'Total Raised', color: 'text-[#10b981]' },
          { icon: Users, value: `${(data.stats.totalDonors || 0).toLocaleString()}+`, label: 'Total Donors', color: 'text-[#10b981]' },
          { icon: Target, value: `${(data.stats.totalCampaigns || 0).toLocaleString()}+`, label: 'Total Campaigns', color: 'text-[#10b981]' },
          { icon: TrendingUp, value: `${data.stats.successRate || 0}%`, label: 'Success Rate', color: 'text-[#10b981]' },
        ]);
      }
      
      if (data.urgentCampaigns) {
        setUrgentCampaigns(data.urgentCampaigns.map((campaign: any) => ({
          id: campaign._id,
          title: campaign.title,
          image: campaign.image || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80',
          category: campaign.category,
          currentAmount: campaign.currentAmount || 0,
          goalAmount: campaign.goalAmount || 0,
          donors: campaign.donors || 0,
          daysLeft: campaign.endDate ? Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
          location: campaign.location || 'India',
        })));
      }
      
      if (data.trendingCampaigns) {
        setTrendingCampaigns(data.trendingCampaigns.map((campaign: any) => ({
          id: campaign._id,
          title: campaign.title,
          image: campaign.image || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80',
          category: campaign.category,
          currentAmount: campaign.currentAmount || 0,
          goalAmount: campaign.goalAmount || 0,
          donors: campaign.donors || 0,
          daysLeft: campaign.endDate ? Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
          location: campaign.location || 'India',
        })));
      }
      
      if (data.healthPartners) {
        setHealthPartners(data.healthPartners.map((partner: any) => {
          // Extract image from formData if photo/logo are not available
          let photo = partner.photo || partner.logo;
          if (!photo && partner.formData) {
            if (partner.formData.banner) {
              photo = partner.formData.banner;
            } else if (partner.formData.clinicPhotos && Array.isArray(partner.formData.clinicPhotos) && partner.formData.clinicPhotos.length > 0) {
              photo = partner.formData.clinicPhotos[0];
            } else if (partner.formData.labImages && Array.isArray(partner.formData.labImages) && partner.formData.labImages.length > 0) {
              photo = partner.formData.labImages[0];
            } else if (partner.formData.hospitalImages && Array.isArray(partner.formData.hospitalImages) && partner.formData.hospitalImages.length > 0) {
              photo = partner.formData.hospitalImages[0];
            } else if (partner.formData.pharmacyImages && Array.isArray(partner.formData.pharmacyImages) && partner.formData.pharmacyImages.length > 0) {
              photo = partner.formData.pharmacyImages[0];
            }
          }
          return {
            ...partner,
            id: partner._id || partner.id,
            programs: partner.programs || [],
            photo: photo || partner.photo,
            logo: partner.logo || photo,
          };
        }));
      }
      
      if (data.foodPartners) {
        setFoodPartners(data.foodPartners.map((partner: any) => {
          // Extract image from formData if photo/logo are not available
          let photo = partner.photo || partner.logo;
          if (!photo && partner.formData) {
            if (partner.formData.banner) {
              photo = partner.formData.banner;
            } else if (partner.formData.restaurantImages && Array.isArray(partner.formData.restaurantImages) && partner.formData.restaurantImages.length > 0) {
              photo = partner.formData.restaurantImages[0];
            }
          }
          return {
            ...partner,
            id: partner._id || partner.id,
            programs: partner.programs || [],
            photo: photo || partner.photo,
            logo: partner.logo || photo,
          };
        }));
      }
    } catch (error) {
      console.error('Failed to fetch home data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const howItWorks = [
    {
      step: '1',
      title: 'Choose a Cause',
      description: 'Browse through campaigns and find a cause that resonates with you.',
      icon: Heart,
    },
    {
      step: '2',
      title: 'Donate Securely',
      description: 'Make a secure donation using our trusted payment gateway.',
      icon: CheckCircle,
    },
    {
      step: '3',
      title: 'Track Impact',
      description: 'See how your contribution is making a real difference.',
      icon: TrendingUp,
    },
    {
      step: '4',
      title: 'Share & Spread',
      description: 'Share campaigns with friends and family to amplify impact.',
      icon: Users,
    },
  ];
  
  const [successStories, setSuccessStories] = useState<any[]>([]);
  
  // Slider items - only video
  const sliderItems = [
    {
      type: 'video' as const,
      src: encodeURI('/When I_m Hungry _ Feed the Children(720P_HD).mp4'),
    },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Video/Image Slider Section - Directly below navbar */}
      <div className="relative w-full mt-16">
        <VideoImageSlider
          items={sliderItems}
          imageSlideDuration={5}
        />
      </div>
      
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#ecfdf5] via-white to-[#ecfdf5] py-20 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Together We Can{' '}
                <span className="text-[#10b981]">Save Lives</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join thousands of compassionate donors making a real difference. 
                Support causes you care about and help create a better world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/campaigns">
                  <Button size="lg" className="w-full sm:w-auto">
                    Donate Now
                    <ArrowRight className="ml-2 h-5 w-5 inline" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Start Fundraiser
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Donation Form */}
            <div className="animate-slide-in">
              <Card className="p-6 lg:p-8 shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Make a Donation</h2>
                <p className="text-gray-600 mb-6">Your contribution can make a real difference</p>
                
                <form onSubmit={handleDonationSubmit} className="space-y-4">
                  {/* Quick Amount Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Amount
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[500, 1000, 2000, 5000, 10000, 25000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDonationAmount(amount.toString())}
                          className={`py-2 px-3 rounded-lg border-2 transition-all text-sm ${
                            donationAmount === amount.toString()
                              ? 'border-[#10b981] bg-[#ecfdf5] text-[#10b981] font-semibold'
                              : 'border-gray-300 text-gray-700 hover:border-[#10b981]'
                          }`}
                          suppressHydrationWarning
                        >
                          ₹{amount}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Custom Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or enter custom amount
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      required
                      suppressHydrationWarning
                    />
                  </div>
                  
                  {/* Donor Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={donorPhone}
                        onChange={(e) => setDonorPhone(e.target.value)}
                        placeholder="+91 9876543210"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>
                  
                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
                    disabled={isSubmitting || !donationAmount}
                  >
                    {isSubmitting ? 'Processing...' : `Donate ₹${donationAmount || '0'}`}
                    <ArrowRight className="ml-2 h-5 w-5 inline" />
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    Secure payment powered by trusted payment gateway
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>
      
      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustStats.map((stat, index) => (
              <Card key={index} hover className="p-6 text-center">
                <stat.icon className={`h-10 w-10 mx-auto mb-4 ${stat.color}`} />
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Urgent Campaigns */}
      <section className="py-16 bg-[#ecfdf5]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Urgent Campaigns</h2>
              <p className="text-gray-600">Help these causes reach their goals</p>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost">
                View All
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {urgentCampaigns.length > 0 ? (
              urgentCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} {...campaign} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No urgent campaigns at the moment
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Trending Fundraisers */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Trending Fundraisers</h2>
              <p className="text-gray-600">Most supported campaigns this week</p>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost">
                View All
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingCampaigns.length > 0 ? (
              trendingCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} {...campaign} />
              ))
            ) : (
              <div className="col-span-3 text-center py-8 text-gray-500">
                No trending campaigns at the moment
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Making a difference is simple. Follow these easy steps to start helping today.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <Card key={step.step} hover className="p-6 text-center">
                <div className="bg-[#10b981] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <step.icon className="h-8 w-8 mx-auto mb-4 text-[#10b981]" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Success Stories */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Success Stories</h2>
            <p className="text-lg text-gray-600">Real impact from real people</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {successStories.length > 0 ? (
              successStories.map((story, index) => (
              <Card key={index} hover className="overflow-hidden">
                <div className="relative h-64 w-full bg-gray-200">
                  <Image
                    src={story.image}
                    alt={story.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-semibold text-[#10b981]">Success Story</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{story.title}</h3>
                  <p className="text-gray-600 mb-4">{story.description}</p>
                  <div className="text-lg font-bold text-[#10b981]">Raised: {story.raised}                  </div>
                </div>
              </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <p>No success stories available yet</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* Partners */}
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Partners</h2>
            <p className="text-lg text-gray-600">Trusted by leading health and food organizations</p>
          </div>
          
          {/* Health Partners */}
          <div className="mb-16">
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Health Partners</h3>
            <div className="relative">
              {healthPartners.length > 1 && (
                <>
                  <button
                    onClick={() => setHealthPartnerIndex(Math.max(0, healthPartnerIndex - 1))}
                    disabled={healthPartnerIndex === 0}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                      healthPartnerIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                    }`}
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => {
                      const maxIndex = isMobile 
                        ? healthPartners.length - 1 
                        : healthPartners.length - 4;
                      setHealthPartnerIndex(Math.min(maxIndex, healthPartnerIndex + 1));
                    }}
                    disabled={healthPartnerIndex >= (isMobile ? healthPartners.length - 1 : healthPartners.length - 4)}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                      healthPartnerIndex >= (isMobile ? healthPartners.length - 1 : healthPartners.length - 4) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                    }`}
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </button>
                </>
              )}
              <div className="overflow-hidden">
                <div 
                  className="flex gap-6 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: healthPartners.length > 1 
                      ? isMobile
                        ? `translateX(calc(-${healthPartnerIndex} * (100% + 1.5rem)))`
                        : `translateX(calc(-${healthPartnerIndex} * (25% + 1.5rem)))`
                      : 'none'
                  }}
                >
                  {healthPartners.map((partner) => (
                    <div key={partner._id || partner.id || Math.random()} className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                <Card 
                  hover 
                        className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                  onClick={() => router.push(`/partners/health/${partner._id || partner.id}`)}
                >
                        <div className="relative w-full h-48 bg-gray-100">
                    {(partner.photo || partner.logo) ? (
                      <Image
                        src={partner.photo || partner.logo}
                        alt={partner.name || 'Health Partner'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                        <div className="p-5">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-4">{partner.description}</p>
                          
                          {/* Programs */}
                          {partner.programs && partner.programs.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold text-gray-900 mb-2">Programs:</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {partner.programs.slice(0, 4).map((program: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                  >
                                    {program}
                                  </span>
                                ))}
                                {partner.programs.length > 4 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                    +{partner.programs.length - 4} more...
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Impact */}
                          <div className="mb-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">Impact:</span>
                              <span className="font-semibold text-gray-900">{partner.impact}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Since {partner.since}</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(partner.address)}`, '_blank')}
                            >
                              <Map className="h-3 w-3 mr-1" />
                              View Map
                            </Button>
                            <button
                              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                let phoneNumber = (partner.phone || '').replace(/[\s\-+()]/g, '');
                                if (phoneNumber && !phoneNumber.startsWith('91') && phoneNumber.length === 10) {
                                  phoneNumber = '91' + phoneNumber;
                                }
                                if (phoneNumber) {
                                  window.open(`https://wa.me/${phoneNumber}`, '_blank');
                                }
                              }}
                            >
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              WhatsApp
                            </button>
                          </div>
                        </div>
                </Card>
                    </div>
              ))}
                </div>
              </div>
            </div>
          </div>

          {/* Food Partners */}
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">Food Partners</h3>
            <div className="relative">
              {foodPartners.length > 1 && (
                <>
                  <button
                    onClick={() => setFoodPartnerIndex(Math.max(0, foodPartnerIndex - 1))}
                    disabled={foodPartnerIndex === 0}
                    className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                      foodPartnerIndex === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                    }`}
                  >
                    <ChevronLeft className="h-6 w-6 text-gray-700" />
                  </button>
                  <button
                    onClick={() => {
                      const maxIndex = isMobile 
                        ? foodPartners.length - 1 
                        : foodPartners.length - 4;
                      setFoodPartnerIndex(Math.min(maxIndex, foodPartnerIndex + 1));
                    }}
                    disabled={foodPartnerIndex >= (isMobile ? foodPartners.length - 1 : foodPartners.length - 4)}
                    className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                      foodPartnerIndex >= (isMobile ? foodPartners.length - 1 : foodPartners.length - 4) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'
                    }`}
                  >
                    <ChevronRight className="h-6 w-6 text-gray-700" />
                  </button>
                </>
              )}
              <div className="overflow-hidden">
                <div 
                  className="flex gap-6 transition-transform duration-300 ease-in-out"
                  style={{
                    transform: foodPartners.length > 1 
                      ? isMobile
                        ? `translateX(calc(-${foodPartnerIndex} * (100% + 1.5rem)))`
                        : `translateX(calc(-${foodPartnerIndex} * (25% + 1.5rem)))`
                      : 'none'
                  }}
                >
                  {foodPartners.map((partner) => (
                    <div key={partner._id || partner.id || Math.random()} className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]">
                <Card 
                  hover 
                        className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                  onClick={() => router.push(`/partners/food/${partner._id || partner.id}`)}
                >
                        <div className="relative w-full h-48 bg-gray-100">
                    {(partner.photo || partner.logo) ? (
                      <Image
                        src={partner.photo || partner.logo}
                        alt={partner.name || 'Food Partner'}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                        No Image
                      </div>
                    )}
                  </div>
                        <div className="p-5">
                          <h4 className="text-lg font-bold text-gray-900 mb-2">{partner.name}</h4>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-4">{partner.description}</p>
                          
                          {/* Programs */}
                          {partner.programs && partner.programs.length > 0 && (
                            <div className="mb-3">
                              <h5 className="text-xs font-semibold text-gray-900 mb-2">Programs:</h5>
                              <div className="flex flex-wrap gap-1.5">
                                {partner.programs.slice(0, 4).map((program: string, index: number) => (
                                  <span
                                    key={index}
                                    className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                  >
                                    {program}
                                  </span>
                                ))}
                                {partner.programs.length > 4 && (
                                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                    +{partner.programs.length - 4} more...
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Impact */}
                          <div className="mb-3 pt-3 border-t border-gray-200">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-gray-600">Impact:</span>
                              <span className="font-semibold text-gray-900">{partner.impact}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">Since {partner.since}</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full text-xs"
                              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(partner.address)}`, '_blank')}
                            >
                              <Map className="h-3 w-3 mr-1" />
                              View Map
                            </Button>
                            <button
                              className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                let phoneNumber = (partner.phone || '').replace(/[\s\-+()]/g, '');
                                if (phoneNumber && !phoneNumber.startsWith('91') && phoneNumber.length === 10) {
                                  phoneNumber = '91' + phoneNumber;
                                }
                                if (phoneNumber) {
                                  window.open(`https://wa.me/${phoneNumber}`, '_blank');
                                }
                              }}
                            >
                              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                              </svg>
                              WhatsApp
                            </button>
                          </div>
                        </div>
                </Card>
                    </div>
              ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#10b981] to-[#059669] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 text-green-100">
            Join our community of changemakers and start making an impact today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/campaigns">
              <Button size="lg" variant="outline" className="bg-white text-[#10b981] border-white hover:bg-gray-100">
                Browse Campaigns
              </Button>
            </Link>
            <Link href="/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Start Your Fundraiser
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
