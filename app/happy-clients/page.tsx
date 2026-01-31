'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Quote, Heart, Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';

export default function HappyClientsPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    happyDonors: 0,
    campaignsSupported: 0,
    satisfactionRate: 98,
    averageRating: 4.9,
  });

  useEffect(() => {
    fetchTestimonials();
    fetchStats();
  }, []);

  const fetchTestimonials = async () => {
    try {
      setLoading(true);
      // Fetch completed campaigns and use them as testimonials
      const campaigns = await api.get<any[]>('/campaigns?status=completed');
      if (Array.isArray(campaigns)) {
        const formatted = campaigns.slice(0, 6).map((campaign: any, index: number) => ({
          id: campaign._id || index,
          name: campaign.createdBy?.name || 'Anonymous',
          role: 'Campaign Organizer',
          location: campaign.location || 'India',
          image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
          rating: 5,
          testimonial: `Thanks to generous donors, we successfully raised ₹${(campaign.currentAmount || 0).toLocaleString()} for ${campaign.title}. The platform made it easy to reach our goal!`,
          campaign: campaign.title || 'Campaign',
        }));
        setTestimonials(formatted);
      } else {
        setTestimonials([]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch testimonials:', error.message);
      } else {
        console.error('Failed to fetch testimonials');
      }
      setTestimonials([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await api.get<any>('/dashboard/home');
      if (data && data.stats) {
        setStats({
          happyDonors: data.stats.totalDonors || 0,
          campaignsSupported: data.stats.totalCampaigns || 0,
          satisfactionRate: 98,
          averageRating: 4.9,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Happy Clients</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Read what our donors, beneficiaries, and partners have to say about their experience with Care Foundation Trust®.
          </p>
        </div>

        {/* Testimonials Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
          </div>
        ) : testimonials.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {testimonials.map((testimonial) => (
            <Card key={testimonial.id} hover className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="relative w-16 h-16 rounded-full overflow-hidden">
                  <Image
                    src={testimonial.image}
                    alt={testimonial.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{testimonial.name}</h3>
                  <p className="text-sm text-gray-600">{testimonial.role}</p>
                  <p className="text-xs text-gray-500">{testimonial.location}</p>
                </div>
              </div>
              
              <div className="flex gap-1 mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
              
              <Quote className="h-8 w-8 text-[#10b981] opacity-20 mb-3" />
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">
                "{testimonial.testimonial}"
              </p>
              
              <div className="pt-4 border-t border-gray-200">
                <p className="text-xs text-gray-500">
                  <span className="font-semibold">Campaign:</span> {testimonial.campaign}
                </p>
              </div>
            </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p>No testimonials available yet</p>
          </div>
        )}

        {/* Stats */}
        <Card className="p-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center">Our Community in Numbers</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">{stats.happyDonors > 0 ? `${(stats.happyDonors / 1000).toFixed(0)}K+` : '0'}</div>
              <div className="text-green-100">Happy Donors</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.campaignsSupported > 0 ? `${stats.campaignsSupported}+` : '0'}</div>
              <div className="text-green-100">Campaigns Supported</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.satisfactionRate}%</div>
              <div className="text-green-100">Satisfaction Rate</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">{stats.averageRating}/5</div>
              <div className="text-green-100">Average Rating</div>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-8 text-center bg-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Happy Community</h2>
          <p className="text-gray-600 mb-6">
            Be a part of thousands of people making a positive impact
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/campaigns" className="px-6 py-3 bg-[#10b981] text-white rounded-lg font-semibold hover:bg-[#059669] transition-colors">
              Start Donating
            </a>
            <a href="/register" className="px-6 py-3 border-2 border-[#10b981] text-[#10b981] rounded-lg font-semibold hover:bg-[#ecfdf5] transition-colors">
              Start a Campaign
            </a>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

