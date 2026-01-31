'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CheckCircle, Trophy, Heart, Users, Calendar, Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import CampaignCard from '@/components/campaigns/CampaignCard';
import { api, ApiError } from '@/lib/api';

export default function FundraisedPage() {
  const [fundraisedCampaigns, setFundraisedCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRaised, setTotalRaised] = useState(0);
  const [totalDonors, setTotalDonors] = useState(0);

  useEffect(() => {
    fetchCompletedCampaigns();
  }, []);

  const fetchCompletedCampaigns = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/campaigns?status=completed');
      if (Array.isArray(data)) {
        const formatted = data.map((campaign: any) => {
          const successRate = campaign.goalAmount > 0 
            ? Math.round((campaign.currentAmount / campaign.goalAmount) * 100)
            : 100;
          return {
            id: campaign._id || campaign.id,
            title: campaign.title || 'Untitled',
            image: campaign.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
            category: campaign.category || 'General',
            currentAmount: campaign.currentAmount || 0,
            goalAmount: campaign.goalAmount || 0,
            donors: campaign.donors || 0,
            daysLeft: 0,
            location: campaign.location || 'India',
            completedDate: campaign.updatedAt || campaign.createdAt || new Date().toISOString(),
            successRate: successRate,
          };
        });
        setFundraisedCampaigns(formatted);
        setTotalRaised(formatted.reduce((sum, campaign) => sum + campaign.currentAmount, 0));
        setTotalDonors(formatted.reduce((sum, campaign) => sum + campaign.donors, 0));
      } else {
        setFundraisedCampaigns([]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch completed campaigns:', error.message);
      } else {
        console.error('Failed to fetch completed campaigns');
      }
      setFundraisedCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <Trophy className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Successfully Fundraised</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Celebrate the campaigns that have successfully reached their goals and made a real impact in people's lives.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
            <CheckCircle className="h-10 w-10 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">{fundraisedCampaigns.length}</div>
            <div className="text-green-100">Campaigns Completed</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div className="text-3xl font-bold mb-2">₹{(totalRaised / 100000).toFixed(1)}L+</div>
            <div className="text-green-100">Total Raised</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
            <Users className="h-10 w-10 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">{totalDonors.toLocaleString()}+</div>
            <div className="text-green-100">Total Donors</div>
          </Card>
        </div>

        {/* Fundraised Campaigns */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Completed Campaigns</h2>
          {fundraisedCampaigns.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fundraisedCampaigns.map((campaign) => (
              <Card key={campaign.id} hover className="overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10">
                  <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </div>
                </div>
                <div className="relative h-48">
                  <Image
                    src={campaign.image}
                    alt={campaign.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-[#10b981] bg-[#ecfdf5] px-2 py-1 rounded">
                      {campaign.category}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {new Date(campaign.completedDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">{campaign.title}</h3>
                  
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Raised</span>
                      <span className="font-semibold text-gray-900">
                        ₹{campaign.currentAmount.toLocaleString()} / ₹{campaign.goalAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-green-600 font-semibold">
                        {campaign.successRate}% of goal
                      </span>
                      <span className="text-xs text-gray-600">
                        {campaign.donors} donors
                      </span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">{campaign.location}</span>
                      <div className="flex items-center gap-1 text-green-600 text-sm font-semibold">
                        <Trophy className="h-4 w-4" />
                        Success!
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-4">No completed campaigns yet</p>
              <p className="text-gray-400">Check back soon for successful fundraising stories</p>
            </div>
          )}
        </div>

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Be Part of the Success Story</h2>
          <p className="text-green-100 mb-6 text-lg">
            Start your own fundraiser and join these successful campaigns
          </p>
          <a href="/create-fundraiser" className="inline-block px-6 py-3 bg-white text-[#10b981] rounded-lg font-semibold hover:bg-gray-100 transition-colors">
            Start a Fundraiser
          </a>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

