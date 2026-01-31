'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Stethoscope, Users, Award, Map, Loader2, Ticket, X, QrCode, Copy, CheckCircle, Share2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function HealthPartnersPage() {
  const router = useRouter();
  const [healthPartners, setHealthPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patientsServed: 0, yearsCombined: 0 });
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<any>(null);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHealthPartners();
  }, []);

  const fetchHealthPartners = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/partners/type/health');
      if (Array.isArray(data)) {
        // Filter only doctors - check for doctor-specific fields
        const doctorsOnly = data.filter((partner: any) => {
          // Check if it's a doctor by looking for doctor-specific fields
          const hasSpecialization = partner.formData?.specialization;
          const hasQualification = partner.formData?.qualification;
          const hasRegistrationNo = partner.formData?.registrationNo;
          const hasDoctorFees = partner.formData?.doctorFees;
          const isDoctorCategory = partner.formData?.category === 'doctor';
          
          // Return true if it has any doctor-specific field
          return isDoctorCategory || hasSpecialization || hasQualification || hasRegistrationNo || hasDoctorFees;
        });
        
        const formatted = doctorsOnly.map((partner: any) => {
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
            id: partner._id || partner.id,
            name: partner.name || 'Unknown',
            logo: partner.logo || photo || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800&h=400&fit=crop',
            photo: photo || partner.photo || partner.logo || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&h=600&fit=crop',
            description: partner.description || 'Health partner',
            location: partner.city || partner.location || partner.address || 'India',
            website: partner.website || '#',
            contact: partner.phone || 'N/A',
            phone: partner.phone || 'N/A',
            email: partner.email || 'N/A',
            address: partner.address || partner.city || 'N/A',
            operatingHours: 'MON-TUE-WED-THU-FRI-SAT: 09:00 - 21:00',
            about: partner.description || '',
            programs: partner.programs || [],
            impact: partner.impact || 'Making a difference',
            since: partner.since || new Date(partner.createdAt).getFullYear().toString() || '2020',
          };
        });
        setHealthPartners(formatted);
        
        // Calculate stats
        let totalPatients = 0;
        let totalYears = 0;
        const currentYear = new Date().getFullYear();
        
        formatted.forEach((partner: any) => {
          // Extract patients from impact string (e.g., "23M+ patients", "10M+", "500K+")
          if (partner.impact) {
            const impactStr = partner.impact.toLowerCase();
            const patientsMatch = impactStr.match(/([\d.]+)([mk]?)\+?/);
            if (patientsMatch) {
              let patients = parseFloat(patientsMatch[1]);
              const unit = patientsMatch[2];
              if (unit === 'm') patients *= 1000000;
              else if (unit === 'k') patients *= 1000;
              totalPatients += patients;
            }
          }
          
          // Calculate years from since date
          if (partner.since) {
            const sinceYear = parseInt(partner.since);
            if (!isNaN(sinceYear) && sinceYear > 1900) {
              totalYears += (currentYear - sinceYear);
            }
          }
        });
        
        setStats({
          patientsServed: totalPatients,
          yearsCombined: totalYears,
        });
      } else {
        setHealthPartners([]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch health partners:', error.message);
      } else {
        console.error('Failed to fetch health partners');
      }
      setHealthPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGetCoupon = async (partner: any) => {
    try {
      setGeneratingCoupon(true);
      setSelectedPartner(partner);
      
      // Check if user is logged in
      const token = localStorage.getItem('userToken');
      if (!token || token.trim() === '') {
        showToast('Please login to get a coupon', 'info');
        localStorage.setItem('redirectAfterLogin', '/partners/health');
        router.push('/login');
        return;
      }

      // Generate coupon for health partner
      const response = await api.post<any>('/coupons', {
        amount: 0, // Free coupon for health partner
        paymentId: `health-partner-${partner.id}-${Date.now()}`,
        paymentStatus: 'completed',
        beneficiaryName: partner.name || 'Health Partner',
        partnerId: partner.id,
      });

      if (response.data) {
        setGeneratedCoupon(response.data);
        setShowCouponModal(true);
        showToast('Coupon generated successfully!', 'success');
      }
    } catch (error) {
      console.error('Error generating coupon:', error);
      if (error instanceof ApiError) {
        if (error.status === 401) {
          showToast('Please login to get a coupon', 'error');
          localStorage.setItem('redirectAfterLogin', '/partners/health');
          router.push('/login');
        } else {
          showToast(`Failed to generate coupon: ${error.message}`, 'error');
        }
      } else {
        showToast('Failed to generate coupon. Please try again.', 'error');
      }
    } finally {
      setGeneratingCoupon(false);
    }
  };

  const handleCopyCouponCode = () => {
    if (generatedCoupon?.couponCode || generatedCoupon?.code) {
      const code = generatedCoupon.couponCode || generatedCoupon.code;
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast('Coupon code copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
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
    <div className="min-h-screen bg-[#ecfdf5] pt-5">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <Stethoscope className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Health Partners</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Collaborating with leading healthcare institutions to provide quality medical care and health services to those in need.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="p-6 text-center bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
            <Users className="h-10 w-10 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">{healthPartners.length}</div>
            <div className="text-green-100">Health Partners</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
            <div className="relative w-16 h-16 mx-auto mb-4">
              <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <div className="text-3xl font-bold mb-2">
              {stats.patientsServed >= 1000000 
                ? `${(stats.patientsServed / 1000000).toFixed(0)}M+`
                : stats.patientsServed >= 1000
                ? `${(stats.patientsServed / 1000).toFixed(0)}K+`
                : stats.patientsServed > 0
                ? `${stats.patientsServed.toLocaleString()}+`
                : '0'}
            </div>
            <div className="text-green-100">Patients Served</div>
          </Card>
          <Card className="p-6 text-center bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
            <Award className="h-10 w-10 mx-auto mb-4" />
            <div className="text-3xl font-bold mb-2">{stats.yearsCombined > 0 ? `${stats.yearsCombined}+` : '0'}</div>
            <div className="text-green-100">Years Combined</div>
          </Card>
        </div>

        {/* Partners Grid */}
        {healthPartners.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {healthPartners.map((partner) => (
            <Card 
              key={partner.id} 
              hover 
              className="overflow-hidden cursor-pointer shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              onClick={() => router.push(`/partners/health/${partner.id}`)}
            >
              <div className="relative h-72 bg-gradient-to-br from-[#ecfdf5] to-white overflow-hidden">
                <Image
                  src={partner.photo || partner.logo}
                  alt={partner.name}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="absolute top-4 left-4">
                  <div className="bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-lg border border-gray-100">
                    <Image
                      src={partner.logo}
                      alt={`${partner.name} logo`}
                      width={120}
                      height={40}
                      className="object-contain h-8 w-auto"
                      unoptimized
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-white">
                <h3 className="text-2xl font-bold text-gray-900 mb-2 leading-tight">{partner.name}</h3>
                <p className="text-gray-600 text-sm mb-5 leading-relaxed line-clamp-3 min-h-[3.75rem]">{partner.description}</p>
                
                <div className="mb-5">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Programs</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(partner.programs) && partner.programs.slice(0, 4).map((program: any, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-[#ecfdf5] text-[#10b981] text-xs font-semibold rounded-md border border-[#10b981]/20"
                      >
                        {typeof program === 'string' ? program : (program?.name || program?.title || 'Program')}
                      </span>
                    ))}
                    {Array.isArray(partner.programs) && partner.programs.length > 4 && (
                      <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-md border border-gray-200">
                        +{partner.programs.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-3" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full border-2 border-[#10b981] text-[#10b981] hover:bg-[#10b981] hover:text-white font-semibold transition-all duration-200"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/partners/health/${partner.id}`);
                    }}
                  >
                    <Stethoscope className="h-4 w-4 mr-1.5" />
                    Consult Now
                  </Button>
                  <button
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-sm py-2.5 px-4 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (navigator.share) {
                        navigator.share({
                          title: partner.name || 'Partner',
                          text: `Check out ${partner.name || 'this partner'}`,
                          url: `${window.location.origin}/partners/health/${partner._id || partner.id}`,
                        }).catch(() => {});
                      } else {
                        navigator.clipboard.writeText(`${window.location.origin}/partners/health/${partner._id || partner.id}`);
                        showToast('Link copied to clipboard!', 'success');
                      }
                    }}
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              </div>
            </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No health partners available yet</p>
            <p className="text-gray-400">Check back soon for our partner listings</p>
          </div>
        )}

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Become a Health Partner</h2>
          <p className="text-green-100 mb-6 text-lg">
            Join us in providing quality healthcare to those in need. Partner with Care Foundation Trust® today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/become-partner">
              <Button size="lg" variant="outline" className="bg-white text-[#10b981] border-white hover:bg-gray-100">
                Become a Partner
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Contact Us
              </Button>
            </Link>
          </div>
        </Card>
      </div>
      
      {/* Coupon Modal */}
      {showCouponModal && generatedCoupon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowCouponModal(false);
                setGeneratedCoupon(null);
                setSelectedPartner(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <div className="bg-[#10b981] rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Coupon Generated!</h2>
              <p className="text-gray-600">Your coupon is ready to use</p>
            </div>

            <Card className="p-6 mb-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coupon Code</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold font-mono text-[#10b981] flex-1">
                      {generatedCoupon.couponCode || generatedCoupon.code}
                    </p>
                    <button
                      onClick={handleCopyCouponCode}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <CheckCircle className="h-5 w-5 text-[#10b981]" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {selectedPartner && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Partner</p>
                    <p className="text-lg font-semibold text-gray-900">{selectedPartner.name}</p>
                  </div>
                )}

                {generatedCoupon.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(generatedCoupon.expiryDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-center">
                    {generatedCoupon.qrCode?.url || generatedCoupon.qrCode ? (
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <Image
                          src={generatedCoupon.qrCode?.url || generatedCoupon.qrCode}
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                          unoptimized
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">Scan to redeem</p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-8 rounded-lg">
                        <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-500 mt-2 text-center">QR Code not available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowCouponModal(false);
                  setGeneratedCoupon(null);
                  setSelectedPartner(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  router.push('/dashboard');
                }}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white"
              >
                View in Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <Footer />
    </div>
  );
}

