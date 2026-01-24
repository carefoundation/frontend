'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, Stethoscope, Users, Award, Map, Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';

export default function HealthPartnersPage() {
  const router = useRouter();
  const [healthPartners, setHealthPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ patientsServed: 0, yearsCombined: 0 });

  useEffect(() => {
    fetchHealthPartners();
  }, []);

  const fetchHealthPartners = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/partners/type/health');
      if (Array.isArray(data)) {
        const formatted = data.map((partner: any) => {
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
            <Heart className="h-10 w-10 mx-auto mb-4" />
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
              className="overflow-hidden cursor-pointer"
              onClick={() => router.push(`/partners/health/${partner.id}`)}
            >
              <div className="relative h-64 bg-gradient-to-br from-[#ecfdf5] to-white">
                <Image
                  src={partner.photo || partner.logo}
                  alt={partner.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md">
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
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{partner.name}</h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-4">{partner.description}</p>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Programs:</h4>
                  <div className="flex flex-wrap gap-2">
                    {Array.isArray(partner.programs) && partner.programs.slice(0, 4).map((program: any, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                      >
                        {typeof program === 'string' ? program : (program?.name || program?.title || 'Program')}
                      </span>
                    ))}
                    {Array.isArray(partner.programs) && partner.programs.length > 4 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                        +{partner.programs.length - 4} more...
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center text-sm">
                    <div>
                      <span className="text-gray-600">Impact:</span>
                      <span className="font-semibold text-gray-900 ml-1">{partner.impact}</span>
                    </div>
                    <div className="text-gray-500">Since {partner.since}</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-4 grid grid-cols-2 gap-2" onClick={(e) => e.stopPropagation()}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(partner.address || partner.location)}`, '_blank')}
                  >
                    <Map className="h-4 w-4 mr-1" />
                    View Map
                  </Button>
                  <button
                    className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white font-semibold text-sm py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
                    onClick={(e) => {
                      e.stopPropagation();
                      let phoneNumber = (partner.phone || partner.contact || '').replace(/[\s\-+()]/g, '');
                      // Ensure country code is present (add 91 for India if not present)
                      if (phoneNumber && !phoneNumber.startsWith('91') && phoneNumber.length === 10) {
                        phoneNumber = '91' + phoneNumber;
                      }
                      if (phoneNumber) {
                        window.open(`https://wa.me/${phoneNumber}`, '_blank');
                      }
                    }}
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.239-.375a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                    </svg>
                    Contact on WhatsApp
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
      
      <Footer />
    </div>
  );
}

