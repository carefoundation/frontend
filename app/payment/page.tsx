'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, Lock, CheckCircle, ArrowLeft, Shield, Building2, Smartphone, QrCode, RefreshCw, Copy, Download, X } from 'lucide-react';
import Image from 'next/image';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import Script from 'next/script';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface DonationData {
  amount: string;
  name: string;
  email: string;
  phone: string;
  campaignId?: string;
  campaignTitle?: string;
  partnerId?: string;
}

interface CouponData {
  id: string;
  couponCode: string;
  qrCode: string;
  amount: number;
  expiryDate: string;
  partnerId?: string;
  partnerName?: string;
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
  const [paymentGateway, setPaymentGateway] = useState<'razorpay' | 'yesbank'>('razorpay');
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState('');
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [donorName, setDonorName] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<CouponData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [partnerName, setPartnerName] = useState<string>('');
  const couponRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if user is logged in first
    const token = localStorage.getItem('userToken');
    const loggedIn = !!token && token.trim() !== '';
    setIsLoggedIn(loggedIn);

    // Get donation data from localStorage
    const pendingDonation = localStorage.getItem('pendingDonation');
    if (!pendingDonation) {
      // No donation data, redirect to home
      router.push('/');
      return;
    }

    try {
      const data = JSON.parse(pendingDonation);
      // Get user info if available
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
        partnerId: data.partnerId || null,
      };

      // Check if login is required for partner donations - do this BEFORE setting state
      if (donationDataWithUser.partnerId && !loggedIn) {
        // Save redirect URL and preserve donation data
        localStorage.setItem('redirectAfterLogin', '/payment');
        // Donation data is already in localStorage, so it will be preserved
        showToast('Please login to create a coupon for partner donations', 'info');
        router.push('/login');
        return;
      }

      // Set donation data only if we're not redirecting
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
      const finalDonorName = donorName || donationData?.name || 'Donor';
      const finalDonorEmail = (donorEmail || donationData?.email || 'donor@example.com').trim().toLowerCase();
      const finalDonorPhone = donorPhone || donationData?.phone || '';

      const amount = parseFloat(donationData?.amount || '0');
      if (amount < 1) {
        showToast('Minimum donation amount is ₹1', 'error');
        setIsProcessing(false);
        return;
      }

      // Create Razorpay order
      const orderData = await api.post<{
        keyId: string;
        amount: number;
        currency: string;
        orderId: string;
      }>('/razorpay/create-order', {
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

            const paymentResponse = await api.post<any>('/razorpay/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
              firstName: firstName,
              lastName: lastName || null,
              email: finalDonorEmail,
              phoneNumber: finalDonorPhone || null,
              campaignId: donationData?.campaignId || null,
              partnerId: donationData?.partnerId || null,
              message: 'Donation via Razorpay',
            });

            // Check if coupon was created
            if (paymentResponse?.coupon) {
              const couponData = paymentResponse.coupon;
              setGeneratedCoupon(couponData);
              
              // Set partner name if available in response
              if (couponData.partnerName) {
                setPartnerName(couponData.partnerName);
              } else if (couponData.partnerId) {
                // Fallback: Fetch partner name if not in response
                try {
                  const partnerResponse = await api.get<any>(`/partners/${couponData.partnerId}`);
                  if (partnerResponse?.name || partnerResponse?.businessName) {
                    setPartnerName(partnerResponse.name || partnerResponse.businessName);
                  }
                } catch (error) {
                  console.error('Failed to fetch partner name:', error);
                }
              }
              
              setPaymentSuccess(true);
            }

            // Clear pending donation data
            if (typeof window !== 'undefined') {
              localStorage.removeItem('pendingDonation');
            }

            showToast(`Payment successful! Thank you for your donation of ₹${amount}`, 'success');
            
            // If no coupon, redirect immediately
            if (!paymentResponse?.coupon) {
              setTimeout(() => {
                router.push('/dashboard');
              }, 1500);
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            if (error instanceof ApiError) {
              if (error.status === 401) {
                showToast('Please login to create a coupon', 'error');
                // Preserve donation data and set redirect
                if (typeof window !== 'undefined') {
                  localStorage.setItem('redirectAfterLogin', '/payment');
                  // Donation data is already in localStorage, so it will be preserved
                }
                router.push('/login');
              } else {
                showToast(`Payment verification failed: ${error.message}`, 'error');
              }
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
      const finalDonorName = donorName || donationData?.name || 'Donor';
      const finalDonorEmail = (donorEmail || donationData?.email || 'donor@example.com').trim().toLowerCase();
      const finalDonorPhone = donorPhone || donationData?.phone || '';
      
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
        partnerId: donationData?.partnerId || null,
        message: `Donation via ${paymentGateway}`,
        paymentMethod: paymentGateway,
        status: 'completed',
      };

      const donationResponse = await api.post<any>('/donations', donationPayload);
      
      // Check if coupon was created
      if (donationResponse?.coupon) {
        const couponData = donationResponse.coupon;
        setGeneratedCoupon(couponData);
        
        // Set partner name if available in response
        if (couponData.partnerName) {
          setPartnerName(couponData.partnerName);
        } else if (couponData.partnerId) {
          // Fallback: Fetch partner name if not in response
          try {
            const partnerResponse = await api.get<any>(`/partners/${couponData.partnerId}`);
            if (partnerResponse?.name || partnerResponse?.businessName) {
              setPartnerName(partnerResponse.name || partnerResponse.businessName);
            }
          } catch (error) {
            console.error('Failed to fetch partner name:', error);
          }
        }
        
        setPaymentSuccess(true);
      }
      
      // Clear pending donation data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('pendingDonation');
      }

      // Show success message
      showToast(`Payment successful via Yes Bank! Thank you for your donation of ₹${donationData?.amount || '0'}`, 'success');
      
      // If no coupon, redirect immediately
      if (!donationResponse?.coupon) {
        setTimeout(() => {
          router.push('/dashboard');
        }, 1500);
      }
    } catch (error) {
      setIsProcessing(false);
      if (error instanceof ApiError) {
        if (error.status === 401) {
          showToast('Please login to create a coupon', 'error');
          // Preserve donation data and set redirect
          if (typeof window !== 'undefined') {
            localStorage.setItem('redirectAfterLogin', '/payment');
            // Donation data is already in localStorage, so it will be preserved
          }
          router.push('/login');
        } else {
          showToast(`Payment failed: ${error.message}`, 'error');
        }
      } else {
        showToast('Payment failed. Please try again.', 'error');
      }
      console.error('Donation submission error:', error);
    }
  };

  const handleDownloadCoupon = async () => {
    if (!generatedCoupon || !couponRef.current) {
      showToast('Coupon data not available', 'error');
      return;
    }
    
    try {
      showToast('Generating coupon PDF...', 'info');
      
      // Wait a bit for any rendering to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Convert HTML to canvas using html2canvas
      const canvas = await html2canvas(couponRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: couponRef.current.offsetWidth,
        height: couponRef.current.offsetHeight,
      });
      
      // Get canvas dimensions
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Calculate PDF dimensions (A4 portrait: 210mm x 297mm)
      const pdfWidth = 210; // mm
      const pdfHeight = 297; // mm
      const mmToPx = 3.779527559; // 1mm = 3.779527559px at 96dpi
      
      // Calculate image dimensions in mm maintaining aspect ratio
      const imgWidthMm = imgWidth / mmToPx;
      const imgHeightMm = imgHeight / mmToPx;
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // If content is taller than page, scale it down
      let finalWidth = imgWidthMm;
      let finalHeight = imgHeightMm;
      
      if (imgHeightMm > pdfHeight - 20) {
        // Scale down to fit with margins
        const scale = (pdfHeight - 20) / imgHeightMm;
        finalWidth = imgWidthMm * scale;
        finalHeight = imgHeightMm * scale;
      }
      
      if (finalWidth > pdfWidth - 20) {
        // Scale down width if needed
        const scale = (pdfWidth - 20) / finalWidth;
        finalWidth = finalWidth * scale;
        finalHeight = finalHeight * scale;
      }
      
      // Center the image on the page
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Save PDF
      pdf.save(`coupon-${generatedCoupon.couponCode}.pdf`);
      
      showToast('Coupon PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download coupon error:', error);
      showToast('Failed to download coupon. Please try again.', 'error');
    }
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
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

  // Show coupon success screen
  if (paymentSuccess && generatedCoupon) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 text-center">
            <CheckCircle className="h-16 w-16 text-[#10b981] mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600">Your coupon has been generated successfully</p>
          </div>

          <Card className="p-8 mb-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Donation Coupon</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coupon Code</p>
                  <p className="text-3xl font-bold font-mono text-[#10b981]">{generatedCoupon.couponCode}</p>
                </div>
                {partnerName && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Partner</p>
                    <p className="text-xl font-semibold text-gray-900">{partnerName}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="text-2xl font-bold text-gray-900">₹{generatedCoupon.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Expiry Date</p>
                  <p className="text-lg font-semibold text-gray-900">{new Date(generatedCoupon.expiryDate).toLocaleDateString()}</p>
                </div>
                <div className="pt-4">
                  <Button
                    onClick={handleDownloadCoupon}
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    Download Coupon
                  </Button>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <Image
                    src={generatedCoupon.qrCode}
                    alt="QR Code"
                    width={250}
                    height={250}
                    unoptimized
                    className="rounded"
                  />
                </div>
              </div>
            </div>
          </Card>

          <div className="text-center">
            <Button
              onClick={handleGoToDashboard}
              className="bg-[#10b981] hover:bg-[#059669] text-white"
              size="lg"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Hidden coupon template for PDF generation */}
          <div ref={couponRef} style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
            <div style={{
              width: '800px',
              minHeight: '600px',
              backgroundColor: '#ffffff',
              padding: '40px',
              fontFamily: 'Arial, sans-serif',
              boxSizing: 'border-box'
            }}>
              {/* Header */}
              <div style={{
                backgroundColor: '#10b981',
                padding: '30px',
                margin: '-40px -40px 30px -40px',
                textAlign: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '20px'
              }}>
                <img
                  src="/Logo.png"
                  alt="Care Foundation Logo"
                  style={{
                    height: '60px',
                    width: 'auto',
                    objectFit: 'contain'
                  }}
                />
                <h1 style={{
                  color: '#ffffff',
                  fontSize: '32px',
                  fontWeight: 'bold',
                  margin: 0
                }}>Donation Coupon</h1>
              </div>

              {/* Title */}
              <h2 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                textAlign: 'center',
                color: '#1f2937',
                marginBottom: '40px'
              }}>Your Donation Coupon</h2>

              {/* Content Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '40px',
                alignItems: 'start'
              }}>
                {/* Left Column - Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
                  {/* Coupon Code */}
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0',
                      fontWeight: 'normal'
                    }}>Coupon Code</p>
                    <p style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#10b981',
                      margin: 0,
                      fontFamily: 'monospace',
                      letterSpacing: '2px'
                    }}>{generatedCoupon.couponCode}</p>
                  </div>

                  {/* Partner Name */}
                  {partnerName && (
                    <div>
                      <p style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        margin: '0 0 8px 0',
                        fontWeight: 'normal'
                      }}>Partner</p>
                      <p style={{
                        fontSize: '20px',
                        fontWeight: 'bold',
                        color: '#1f2937',
                        margin: 0
                      }}>{partnerName}</p>
                    </div>
                  )}

                  {/* Amount */}
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0',
                      fontWeight: 'normal'
                    }}>Amount</p>
                    <p style={{
                      fontSize: '28px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0
                    }}>₹{generatedCoupon.amount}</p>
                  </div>

                  {/* Expiry Date */}
                  <div>
                    <p style={{
                      fontSize: '14px',
                      color: '#6b7280',
                      margin: '0 0 8px 0',
                      fontWeight: 'normal'
                    }}>Expiry Date</p>
                    <p style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#1f2937',
                      margin: 0
                    }}>{new Date(generatedCoupon.expiryDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}</p>
                  </div>
                </div>

                {/* Right Column - QR Code */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    backgroundColor: '#ffffff',
                    padding: '20px',
                    borderRadius: '8px',
                    border: '2px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center'
                  }}>
                    <img
                      src={generatedCoupon.qrCode}
                      alt="QR Code"
                      style={{
                        width: '250px',
                        height: '250px',
                        display: 'block'
                      }}
                    />
                    <p style={{
                      fontSize: '12px',
                      color: '#6b7280',
                      marginTop: '15px',
                      textAlign: 'center'
                    }}>Scan QR Code to Redeem</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div style={{
                marginTop: '50px',
                paddingTop: '30px',
                borderTop: '1px solid #e5e7eb',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '14px',
                  color: '#1f2937',
                  margin: '8px 0',
                  fontWeight: 'bold'
                }}>Care Foundation Trust</p>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '30px',
                  margin: '15px 0',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>📞</span>
                    <a href="tel:+919136521052" style={{
                      fontSize: '12px',
                      color: '#10b981',
                      textDecoration: 'none'
                    }}>+91 9136521052</a>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px',
                      color: '#6b7280'
                    }}>✉️</span>
                    <a href="mailto:carefoundationtrustorg@gmail.com" style={{
                      fontSize: '12px',
                      color: '#10b981',
                      textDecoration: 'none'
                    }}>carefoundationtrustorg@gmail.com</a>
                  </div>
                </div>
                <p style={{
                  fontSize: '10px',
                  color: '#9ca3af',
                  margin: '10px 0 5px 0'
                }}>Generated on {new Date().toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>
            </div>
          </div>
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

