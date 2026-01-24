'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';

const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });
const CampaignCard = dynamic(() => import('@/components/campaigns/CampaignCard'), { ssr: false });

export default function CampaignsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('trending');
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const categories = ['all', 'Medical', 'Education', 'Disaster Relief', 'Food', 'Health', 'Animals'];
  
  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/campaigns');
      if (Array.isArray(data)) {
        const formattedCampaigns = data
          .filter((campaign: any) => campaign.status === 'active') // Only show active campaigns
          .map((campaign: any) => ({
          id: campaign._id,
          title: campaign.title,
          image: campaign.image || 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80',
          category: campaign.category,
          currentAmount: campaign.currentAmount || 0,
          goalAmount: campaign.goalAmount || 0,
          donors: campaign.donors || 0,
          daysLeft: campaign.endDate ? Math.ceil((new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0,
          location: campaign.location || 'India',
        }));
        setCampaigns(formattedCampaigns);
      } else {
        setCampaigns([]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch campaigns:', error.message);
      } else {
        console.error('Failed to fetch campaigns');
      }
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || campaign.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">All Campaigns</h1>
          <p className="text-gray-600">Discover causes that need your support</p>
        </div>
        
        {/* Filter Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search campaigns..."
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
        </div>
        
        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-700 text-base">
            Showing <span className="font-semibold text-gray-900">{filteredCampaigns.length}</span> {filteredCampaigns.length === 1 ? 'campaign' : 'campaigns'}
          </p>
        </div>
        
        {/* Campaigns Grid */}
        {filteredCampaigns.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard key={campaign.id} {...campaign} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No campaigns found</p>
            <p className="text-gray-400">Try adjusting your filters</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
}

