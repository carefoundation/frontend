'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CreditCard, Lock, CheckCircle, ArrowLeft, Shield, Building2, Smartphone, QrCode, RefreshCw, Copy } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import Script from 'next/script';

interface DonationData {
  amount: string;
  name: string;
  email: string;
  phone: string;
  campaignId?: string;
  campaignTitle?: string;
}

export default function PaymentPage() {
  const router = useRouter();
  const [donationData, setDonationData] = useState<DonationData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'netbanking'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [bankName, setBankName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [upiMode, setUpiMode] = useState<'qr' | 'id'>('qr');
  const [paymentTimer, setPaymentTimer] = useState(600); // 10 minutes in seconds
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [paymentGateway, setPaymentGateway] = useState<'demo' | 'razorpay' | 'yesbank'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');

  useEffect(() => {
    // Get donation data from localStorage (no login required)
    if (typeof window !== 'undefined') {
      const pendingDonation = localStorage.getItem('pendingDonation');
      if (pendingDonation) {
        try {
          const data = JSON.parse(pendingDonation);
          // Get user info if available (optional - user may not be logged in)
          const userEmail = localStorage.getItem('userEmail') || '';
          const userName = localStorage.getItem('userName') || '';
          // Merge donation data with user info if missing
          const donationDataWithUser = {
            amount: data.amount || '',
            name: data.name || userName || '',
            email: data.email || userEmail || '',
            phone: data.phone || '',
            campaignId: data.campaignId || '',
            campaignTitle: data.campaignTitle || '',
          };
          setDonationData(donationDataWithUser);
          setDonorName(donationDataWithUser.name);
          setDonorEmail(donationDataWithUser.email);
          setDonorPhone(donationDataWithUser.phone);
          setIsAuthenticated(true);
          // Generate QR code URL for UPI payment if amount is available
          if (donationDataWithUser.amount) {
            const upiString = `upi://pay?pa=care@razorpay&pn=Care%20Foundation&am=${donationDataWithUser.amount}&cu=INR&tn=Donation`;
          const encodedUpi = encodeURIComponent(upiString);
          setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedUpi}`);
          }
        } catch (error) {
          console.error('Error parsing donation data:', error);
          router.push('/');
        }
      } else {
        // No donation data, redirect to home
        router.push('/');
      }
    }
  }, [router]);

  // Payment timer countdown
  useEffect(() => {
    if (paymentTimer > 0 && paymentMethod === 'upi' && upiMode === 'qr') {
      const timer = setInterval(() => {
        setPaymentTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [paymentTimer, paymentMethod, upiMode]);

  const handleRazorpayPayment = async () => {
    setIsProcessing(true);
    
    try {
      const finalDonorName = donorName || donationData?.name || '';
      const finalDonorEmail = (donorEmail || donationData?.email || '').trim().toLowerCase();
      const finalDonorPhone = donorPhone || donationData?.phone || '';
      
      if (!finalDonorName || !finalDonorEmail) {
        showToast('Please provide name and email for donation', 'error');
        setIsProcessing(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalDonorEmail)) {
        showToast('Please provide a valid email address', 'error');
        setIsProcessing(false);
        return;
      }

      const amount = parseFloat(donationData?.amount || '0');
      if (amount < 1) {
        showToast('Minimum donation amount is ₹1', 'error');
        setIsProcessing(false);
        return;
      }

      // Create Razorpay order
      const orderData = await api.post('/razorpay/create-order', {
        amount: amount,
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          donorName: finalDonorName,
          donorEmail: finalDonorEmail,
          campaignId: donationData?.campaignId || null,
        }
      });

      // Load Razorpay script if not already loaded
      if (typeof window !== 'undefined' && !(window as any).Razorpay) {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      const Razorpay = (window as any).Razorpay;

      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Care Foundation Trust',
        description: donationData?.campaignTitle ? `Donation for ${donationData.campaignTitle}` : 'Donation to Care Foundation Trust',
        order_id: orderData.orderId,
        prefill: {
          name: finalDonorName,
          email: finalDonorEmail,
          contact: finalDonorPhone || '',
        },
        theme: {
          color: '#10b981',
        },
        handler: async function (response: any) {
          try {
            // Verify payment on backend
            const nameParts = finalDonorName.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';

            await api.post('/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
              firstName: firstName,
              lastName: lastName || null,
              email: finalDonorEmail,
              phoneNumber: finalDonorPhone || null,
              campaignId: donationData?.campaignId || null,
              message: 'Donation via Razorpay',
            });

            // Clear pending donation data
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pendingDonation');
            }

            showToast(`Payment successful! Thank you for your donation of ₹${amount}`, 'success');
            
            setTimeout(() => {
              router.push('/');
            }, 1500);
          } catch (error) {
            console.error('Payment verification error:', error);
            if (error instanceof ApiError) {
              showToast(`Payment verification failed: ${error.message}`, 'error');
            } else {
              showToast('Payment verification failed. Please contact support.', 'error');
            }
          } finally {
            setIsProcessing(false);
          }
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        },
      };

      const razorpay = new Razorpay(options);
      razorpay.open();
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof ApiError) {
        showToast(`Payment failed: ${error.message}`, 'error');
      } else {
        showToast('Failed to initialize payment. Please try again.', 'error');
      }
      console.error('Razorpay initialization error:', error);
    }
  };

  const handleOtherPayment = async () => {
    setIsProcessing(true);
    
    try {
      const finalDonorName = donorName || donationData?.name || '';
      const finalDonorEmail = (donorEmail || donationData?.email || '').trim().toLowerCase();
      const finalDonorPhone = donorPhone || donationData?.phone || '';
      
      if (!finalDonorName || !finalDonorEmail) {
        showToast('Please provide name and email for donation', 'error');
        setIsProcessing(false);
        return;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(finalDonorEmail)) {
        showToast('Please provide a valid email address', 'error');
        setIsProcessing(false);
        return;
      }
      
      const nameParts = finalDonorName.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const donationPayload = {
        amount: donationData?.amount || '0',
        firstName: firstName,
        lastName: lastName || null,
        email: finalDonorEmail,
        phoneNumber: finalDonorPhone || null,
        campaignId: donationData?.campaignId || null,
        message: `Donation via ${paymentGateway}`,
        paymentMethod: paymentGateway,
        status: 'completed',
      };

      await api.post('/donations', donationPayload);
      
      // Clear pending donation data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingDonation');
      }

      // Show success message
      const gatewayName = paymentGateway === 'demo' ? 'Demo Payment' : 'Yes Bank';
      showToast(`Payment successful via ${gatewayName}! Thank you for your donation of ₹${donationData?.amount || '0'}`, 'success');
      
      // Redirect to home page (no login required)
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof ApiError) {
        showToast(`Payment failed: ${error.message}`, 'error');
      } else {
        showToast('Payment failed. Please try again.', 'error');
      }
      console.error('Donation submission error:', error);
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!isAuthenticated || !donationData) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#10b981] border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-[#10b981] transition-colors mb-4 text-sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Complete Payment</h1>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Shield className="h-4 w-4" />
              <span>Secure</span>
            </div>
          </div>
        </div>

        {/* Payment Options Layout */}
        <div className="grid lg:grid-cols-2 gap-8 mt-8">
          {/* Left Side - Image */}
          <div>
            <div className="relative w-full h-[70vh] min-h-[500px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-white rounded-xl overflow-hidden">
              <Image
                src="/razorpay.png"
                alt="Payment Assistant"
                fill
                className="object-contain p-8"
                unoptimized
              />
            </div>
          </div>

          {/* Right Side - Payment Options */}
          <div>
            <Card className="p-6 lg:p-8 h-full flex flex-col justify-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Payment</h2>
              
              {/* Donation Summary */}
              {donationData?.campaignTitle && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Campaign</p>
                  <p className="font-semibold text-gray-900">{donationData.campaignTitle}</p>
                </div>
              )}
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Donation Amount</p>
                <p className="text-2xl font-bold text-[#10b981]">₹{donationData?.amount || '0'}</p>
              </div>
              
              {/* Donor Information Form (if missing) */}
              {(!donationData?.name || !donationData?.email) && (
                <div className="mb-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">Your Information</h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={donorName}
                      onChange={(e) => {
                        setDonorName(e.target.value);
                        if (donationData) {
                          setDonationData({ ...donationData, name: e.target.value });
                        }
                      }}
                      placeholder="Enter your name"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => {
                        setDonorEmail(e.target.value);
                        if (donationData) {
                          setDonationData({ ...donationData, email: e.target.value });
                        }
                      }}
                      placeholder="your@email.com"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={donorPhone}
                      onChange={(e) => {
                        setDonorPhone(e.target.value);
                        if (donationData) {
                          setDonationData({ ...donationData, phone: e.target.value });
                        }
                      }}
                      placeholder="+91 9876543210"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
              
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Option</h3>
              
              <div className="space-y-4">
                {/* Razorpay Option */}
                <button
                  type="button"
                  onClick={() => setPaymentGateway('razorpay')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    paymentGateway === 'razorpay'
                      ? 'border-[#10b981] bg-[#ecfdf5]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield className={`h-6 w-6 ${paymentGateway === 'razorpay' ? 'text-[#10b981]' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Razorpay</h3>
                      <p className="text-sm text-gray-500">Secure payment gateway</p>
                    </div>
                  </div>
                </button>

                {/* Demo Payment Option */}
                <button
                  type="button"
                  onClick={() => setPaymentGateway('demo')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    paymentGateway === 'demo'
                      ? 'border-[#10b981] bg-[#ecfdf5]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className={`h-6 w-6 ${paymentGateway === 'demo' ? 'text-[#10b981]' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Demo Payment</h3>
                      <p className="text-sm text-gray-500">Test payment option</p>
                    </div>
                  </div>
                </button>

                {/* Yes Bank Option */}
                <button
                  type="button"
                  onClick={() => setPaymentGateway('yesbank')}
                  className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                    paymentGateway === 'yesbank'
                      ? 'border-[#10b981] bg-[#ecfdf5]'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Building2 className={`h-6 w-6 ${paymentGateway === 'yesbank' ? 'text-[#10b981]' : 'text-gray-400'}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900">Yes Bank</h3>
                      <p className="text-sm text-gray-500">Bank payment option</p>
                    </div>
                  </div>
                </button>
              </div>

              {/* Choose Button */}
              <div className="mt-8">
                <Button
                  type="button"
                  onClick={async () => {
                    if (paymentGateway === 'razorpay') {
                      await handleRazorpayPayment();
                    } else {
                      await handleOtherPayment();
                    }
                  }}
                  size="lg"
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold shadow-md hover:shadow-lg transition-all"
                  disabled={isProcessing}
                  isLoading={isProcessing}
                >
                  {isProcessing ? 'Processing Payment...' : paymentGateway === 'razorpay' ? 'Pay with Razorpay' : 'Proceed with Payment'}
                  {!isProcessing && <ArrowRight className="ml-2 h-5 w-5 inline" />}
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
    </div>
  );
}

