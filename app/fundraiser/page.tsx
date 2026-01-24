'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, TrendingUp, Clock, Users, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';

const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });
const CampaignCard = dynamic(() => import('@/components/campaigns/CampaignCard'), { ssr: false });

export default function FundraiserPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [fundraisers, setFundraisers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categories = ['all', 'Medical', 'Education', 'Disaster Relief', 'Food', 'Health', 'Animals'];
  
  useEffect(() => {
    fetchActiveFundraisers();
  }, []);

  const fetchActiveFundraisers = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/campaigns?status=active');
      if (Array.isArray(data)) {
        const formatted = data.map((campaign: any) => {
          const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
          const daysLeft = endDate ? Math.ceil((endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;
          return {
            id: campaign._id || campaign.id,
            title: campaign.title || 'Untitled',
            image: campaign.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
            category: campaign.category || 'General',
            currentAmount: campaign.currentAmount || 0,
            goalAmount: campaign.goalAmount || 0,
            donors: campaign.donors || 0,
            daysLeft: daysLeft > 0 ? daysLeft : 0,
            location: campaign.location || 'India',
            organizer: campaign.createdBy?.name || 'Anonymous',
            trending: campaign.isTrending || false,
          };
        });
        setFundraisers(formatted);
      } else {
        setFundraisers([]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch fundraisers:', error.message);
      } else {
        console.error('Failed to fetch fundraisers');
      }
      setFundraisers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredFundraisers = fundraisers.filter((fundraiser) => {
    const matchesSearch = fundraiser.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         fundraiser.organizer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || fundraiser.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedFundraisers = [...filteredFundraisers].sort((a, b) => {
    if (sortBy === 'trending') {
      if (a.trending && !b.trending) return -1;
      if (!a.trending && b.trending) return 1;
      return b.donors - a.donors;
    }
    if (sortBy === 'newest') return b.daysLeft - a.daysLeft;
    if (sortBy === 'ending') return a.daysLeft - b.daysLeft;
    if (sortBy === 'most-funded') return b.currentAmount - a.currentAmount;
    return 0;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Active Fundraisers</h1>
          <p className="text-gray-600">Discover and support active fundraising campaigns</p>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#ecfdf5] p-4 rounded-lg">
                <TrendingUp className="h-8 w-8 text-[#10b981]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{fundraisers.length}</div>
                <div className="text-sm text-gray-600">Active Fundraisers</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#ecfdf5] p-4 rounded-lg">
                <Clock className="h-8 w-8 text-[#10b981]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {fundraisers.filter(f => f.daysLeft <= 7).length}
                </div>
                <div className="text-sm text-gray-600">Ending Soon</div>
              </div>
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-[#ecfdf5] p-4 rounded-lg">
                <Users className="h-8 w-8 text-[#10b981]" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {fundraisers.reduce((sum, f) => sum + f.donors, 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Donors</div>
              </div>
            </div>
          </Card>
        </div>
        
        {/* Filter Bar */}
        <Card className="p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search fundraisers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              />
            </div>
            
            {/* Category Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent appearance-none bg-white"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Sort */}
            <div className="relative">
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent appearance-none bg-white"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="ending">Ending Soon</option>
                <option value="most-funded">Most Funded</option>
              </select>
            </div>
          </div>
        </Card>
        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            Showing <span className="font-semibold text-gray-900">{sortedFundraisers.length}</span> fundraisers
          </p>
        </div>
        
        {/* Fundraisers Grid */}
        {sortedFundraisers.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFundraisers.map((fundraiser) => (
              <div key={fundraiser.id} className="relative">
                {fundraiser.trending && (
                  <div className="absolute top-4 left-4 z-10 bg-[#10b981] text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </div>
                )}
                <CampaignCard {...fundraiser} />
              </div>
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No fundraisers found</p>
            <p className="text-gray-400 mb-6">Try adjusting your filters</p>
            <Link href="/create-fundraiser">
              <Button>Start a Fundraiser</Button>
            </Link>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

