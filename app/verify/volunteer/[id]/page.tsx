'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { CheckCircle, XCircle, Loader2, Phone, Mail, MapPin, Calendar, Award, Shield, Building2, Heart, Users, Clock } from 'lucide-react';
import Footer from '@/components/layout/Footer';

interface Volunteer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city?: string;
  status?: string;
  hoursVolunteered?: number;
  eventsAttended?: number;
  createdAt?: string;
  profileImage?: string;
  userId?: {
    profileImage?: string;
  };
}

export default function VerifyVolunteerPage() {
  const params = useParams();
  const volunteerId = params?.id as string;
  const [volunteer, setVolunteer] = useState<Volunteer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (volunteerId) {
      fetchVolunteer();
    }
  }, [volunteerId]);

  const fetchVolunteer = async () => {
    try {
      setLoading(true);
      setError(null);
      // Use public verification endpoint without authentication
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${API_BASE_URL}/volunteers/verify/${volunteerId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Volunteer not found');
      }
      
      const volunteerData = data.success && data.data ? data.data : data;
      
      if (volunteerData && volunteerData._id) {
        setVolunteer(volunteerData);
        setIsValid(volunteerData.status === 'approved');
      } else {
        setError('Volunteer not found');
        setIsValid(false);
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('not found') || err.message.includes('404')) {
          setError('Volunteer ID not found or invalid');
        } else {
          setError('Failed to verify volunteer');
        }
      } else {
        setError('Failed to verify volunteer');
      }
      setIsValid(false);
    } finally {
      setLoading(false);
    }
  };

  const profileImage = volunteer?.profileImage || volunteer?.userId?.profileImage || '/founder.jpg';
  const joinDate = volunteer?.createdAt ? new Date(volunteer.createdAt).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }) : 'N/A';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#10b981] mx-auto mb-4" />
          <p className="text-gray-600">Verifying volunteer credentials...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/Logo.png"
                  alt="Care Foundation Trust Logo"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Care Foundation Trust®</h1>
                <p className="text-xs text-gray-600">Volunteer Verification System</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isValid === true && (
                <div className="flex items-center gap-2 bg-green-50 px-4 py-2 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-semibold text-green-700">Verified</span>
                </div>
              )}
              {isValid === false && (
                <div className="flex items-center gap-2 bg-red-50 px-4 py-2 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm font-semibold text-red-700">Invalid</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {error ? (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verification Failed</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <p className="text-sm text-gray-500">
              This volunteer ID may be invalid or the volunteer may not be registered with Care Foundation Trust®.
            </p>
          </div>
        ) : volunteer && isValid ? (
          <div className="space-y-6">
            {/* Verification Status Banner */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Shield className="h-8 w-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Verified Volunteer</h2>
                    <p className="text-green-50">This person is a registered volunteer under Care Foundation Trust®</p>
                  </div>
                </div>
                <CheckCircle className="h-12 w-12 text-white" />
              </div>
            </div>

            {/* Volunteer Details Card */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#10b981] to-[#059669] p-6">
                <h3 className="text-2xl font-bold text-white mb-2">Volunteer Information</h3>
                <p className="text-green-50">Official volunteer credentials</p>
              </div>
              
              <div className="p-8">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Profile Image */}
                  <div className="flex-shrink-0">
                    <div className="w-48 h-48 rounded-full border-4 border-[#10b981] overflow-hidden bg-gray-100 shadow-lg">
                      <Image
                        src={profileImage}
                        alt={volunteer.name}
                        width={192}
                        height={192}
                        className="w-full h-full object-cover"
                        unoptimized
                      />
                    </div>
                  </div>

                  {/* Volunteer Details */}
                  <div className="flex-1 space-y-6">
                    <div>
                      <h4 className="text-3xl font-bold text-gray-900 mb-2">{volunteer.name}</h4>
                      <div className="inline-flex items-center gap-2 bg-[#10b981] text-white px-4 py-1 rounded-full">
                        <Award className="h-4 w-4" />
                        <span className="font-semibold uppercase">Active Volunteer</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Phone className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Phone</p>
                          <p className="font-semibold text-gray-900">{volunteer.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Mail className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-semibold text-gray-900">{volunteer.email}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <MapPin className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Location</p>
                          <p className="font-semibold text-gray-900">{volunteer.city || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Join Date</p>
                          <p className="font-semibold text-gray-900">{joinDate}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Clock className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Hours Volunteered</p>
                          <p className="font-semibold text-gray-900">{volunteer.hoursVolunteered || 0} hrs</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                        <Users className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-600">Events Attended</p>
                          <p className="font-semibold text-gray-900">{volunteer.eventsAttended || 0}</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        <strong>Volunteer ID:</strong> CFT-{volunteer._id?.substring(0, 6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Care Foundation Trust Details */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#10b981] to-[#059669] p-6">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-white rounded-lg p-2">
                    <Image
                      src="/Logo.png"
                      alt="Care Foundation Trust Logo"
                      fill
                      sizes="64px"
                      className="object-contain"
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">Care Foundation Trust®</h3>
                    <p className="text-green-50">Est. Since 1997 | Registered Non-Profit Organization</p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-[#10b981]" />
                      Organization Details
                    </h4>
                    <div className="space-y-3 text-gray-700">
                      <p className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-[#10b981] flex-shrink-0 mt-1" />
                        <span className="text-sm">
                          <strong>Address:</strong> Alexander Tower, Sai World Empire Lane, opposite Swapnapoorti, Mhada Colony, Sector 36, Kharghar, Navi Mumbai, Maharashtra 410210
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Phone className="h-4 w-4 text-[#10b981] flex-shrink-0 mt-1" />
                        <span className="text-sm">
                          <strong>Phone:</strong> +91 9136521052
                        </span>
                      </p>
                      <p className="flex items-start gap-2">
                        <Mail className="h-4 w-4 text-[#10b981] flex-shrink-0 mt-1" />
                        <span className="text-sm">
                          <strong>Email:</strong> carefoundationtrustorg@gmail.com
                        </span>
                      </p>
                      <p className="text-sm">
                        <strong>Registration No:</strong> CFT/2025/029
                      </p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="relative w-6 h-6">
                        <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                      </div>
                      About Our Organization
                    </h4>
                    <div className="space-y-3 text-sm text-gray-700">
                      <p>
                        Care Foundation Trust® is a registered non-profit organization dedicated to serving communities and making a positive impact in society.
                      </p>
                      <p>
                        Our volunteers are verified members who actively contribute to our mission of helping those in need and creating a better world.
                      </p>
                      <p className="pt-2 border-t border-gray-200">
                        <strong>Website:</strong> www.carefoundationtrust.org
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Verification Notice</h4>
                  <p className="text-sm text-blue-800">
                    This verification confirms that <strong>{volunteer.name}</strong> is a registered and verified volunteer under Care Foundation Trust®. 
                    This person is authorized to represent our organization in official volunteer activities.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <Footer />
    </div>
  );
}

