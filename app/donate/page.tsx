'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, ArrowRight } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { showToast } from '@/lib/toast';

export default function DonatePage() {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });

  const presetAmounts = ['500', '1000', '2000', '5000', '10000', '25000'];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate amount
    const amount = customAmount || selectedAmount;
    if (!amount || parseFloat(amount) <= 0) {
      showToast('Please select or enter a donation amount', 'error');
      return;
    }

    // Validate form fields
    if (!formData.name.trim()) {
      showToast('Please enter your name', 'error');
      return;
    }

    if (!formData.email.trim()) {
      showToast('Please enter your email address', 'error');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    if (!formData.phone.trim()) {
      showToast('Please enter your phone number', 'error');
      return;
    }

    // Basic phone validation (at least 10 digits)
    const phoneRegex = /^\d{10,}$/;
    if (!phoneRegex.test(formData.phone.replace(/\D/g, ''))) {
      showToast('Please enter a valid phone number (at least 10 digits)', 'error');
      return;
    }

    // Store donation data in localStorage
    const donationData = {
      amount: amount,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.replace(/\D/g, ''),
      campaignId: null,
      campaignTitle: 'General Donation to Care Foundation Trust',
      partnerId: null,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('pendingDonation', JSON.stringify(donationData));
    }

    // Redirect to payment page
    router.push('/payment');
  };

  const finalAmount = customAmount || selectedAmount || '0';

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-2xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Make a Donation
            </h1>
            <p className="text-lg sm:text-xl text-gray-600">
              Your contribution can make a real difference
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-6 sm:p-8">
              {/* Select Amount */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-3 sm:mb-4">
                  Select Amount
                </label>
                <div className="grid grid-cols-3 gap-3 sm:gap-4">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amount);
                        setCustomAmount('');
                      }}
                      className={`px-4 py-3 sm:py-3.5 text-sm sm:text-base font-semibold rounded-lg border-2 transition-all duration-200 ${
                        selectedAmount === amount
                          ? 'border-[#10b981] bg-[#ecfdf5] text-[#10b981] shadow-md'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-[#10b981] hover:bg-gray-50'
                      }`}
                    >
                      ₹{parseInt(amount).toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount */}
              <div className="mb-6 sm:mb-8">
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                  Or enter custom amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedAmount('');
                    }}
                    className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all text-base font-medium"
                    min="1"
                    step="1"
                  />
                </div>
              </div>

              {/* Your Name */}
              <div className="mb-6 sm:mb-8">
                <label htmlFor="name" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                  Your Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all text-base"
                  />
                </div>
              </div>

              {/* Email Address */}
              <div className="mb-6 sm:mb-8">
                <label htmlFor="email" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="your@email.com"
                    className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all text-base"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="mb-6 sm:mb-8">
                <label htmlFor="phone" className="block text-sm sm:text-base font-semibold text-gray-700 mb-2 sm:mb-3">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="9876543210"
                    className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-all text-base"
                  />
                </div>
              </div>

              {/* Donate Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-lg sm:text-xl py-4 sm:py-5 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Donate ₹{parseInt(finalAmount).toLocaleString()}
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </Card>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}

