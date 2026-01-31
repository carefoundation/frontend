'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Download, Filter, Search, Calendar, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';

interface Donation {
  _id?: string;
  id?: string;
  campaignName: string;
  campaignId?: any;
  amount: number;
  date?: string;
  createdAt?: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
}

export default function MyDonationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyDonations();
  }, []);

  const fetchMyDonations = async () => {
    try {
      setLoading(true);
      const response = await api.get<Donation[]>('/donations');
      if (Array.isArray(response)) {
        const formatted = response.map((donation: any) => ({
          id: donation._id || donation.id,
          _id: donation._id,
          campaignName: donation.campaignId?.title || donation.campaign?.title || donation.campaignName || 'General Donation',
          campaignId: donation.campaignId || donation.campaign,
          amount: donation.amount || 0,
          date: donation.createdAt ? new Date(donation.createdAt).toISOString().split('T')[0] : 'N/A',
          createdAt: donation.createdAt,
          status: donation.status || 'completed',
          paymentMethod: donation.paymentMethod || 'N/A',
        }));
        setDonations(formatted);
      } else {
        setDonations([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        console.error('Failed to fetch donations:', error);
      }
      setDonations([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredDonations = donations.filter((donation) => {
    const matchesSearch = donation.campaignName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalDonated = donations
    .filter((d) => d.status === 'completed')
    .reduce((sum, d) => sum + d.amount, 0);

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Donations</h1>
        <p className="text-gray-600">View and manage all your donations</p>
      </div>

      {/* Summary Card */}
      <Card className="p-6 mb-6 bg-gradient-to-r from-[#10b981] to-[#059669] text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90 mb-1">Total Donated</p>
            <p className="text-4xl font-bold">₹{totalDonated.toLocaleString()}</p>
            <p className="text-sm opacity-90 mt-2">{donations.filter((d) => d.status === 'completed').length} successful donations</p>
          </div>
          <div className="bg-white/20 p-4 rounded-lg">
            <div className="relative w-20 h-20">
              <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
            </div>
          </div>
        </div>
      </Card>

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4">
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
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent appearance-none bg-white"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <Button variant="outline" className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download Report
          </Button>
        </div>
      </Card>

      {/* Donations List */}
      <div className="space-y-4">
        {filteredDonations.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="relative w-24 h-24 mx-auto mb-4">
              <Image src="/Logo.png" alt="Logo" fill className="object-contain opacity-30" />
            </div>
            <p className="text-gray-600 text-lg">No donations found</p>
          </Card>
        ) : (
          filteredDonations.map((donation) => (
            <Card key={donation.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{donation.campaignName}</h3>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {donation.date && donation.date !== 'N/A' ? new Date(donation.date).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) : 'N/A'}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Payment:</span>
                      <span className="font-medium">{donation.paymentMethod}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#10b981]">₹{donation.amount.toLocaleString()}</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                        donation.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : donation.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {donation.status}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

