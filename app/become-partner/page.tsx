'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Handshake, ArrowRight, ChevronDown, Building2, CheckCircle, Mail, Phone, MapPin, Stethoscope, UtensilsCrossed, Pill, FlaskConical, Calendar, X, Upload, Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function BecomePartnerPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Event Form Modal State
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    address: '',
    city: '',
    state: '',
    category: '',
    expectedAttendees: '0',
    time: '',
    endTime: '',
  });
  const [startTime, setStartTime] = useState({ hour: '12', minute: '00', ampm: 'AM' });
  const [endTime, setEndTime] = useState({ hour: '12', minute: '00', ampm: 'PM' });
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    }
  }, []);

  const handlePartnerTypeClick = (formPath: string) => {
    if (!isLoggedIn) {
      showToast('Please login to continue', 'error');
      router.push('/login');
      return;
    }
    router.push(formPath);
  };

  // Event Form Handlers
  const openEventModal = () => {
    if (!isLoggedIn) {
      showToast('Please login to create events', 'error');
      router.push('/login');
      return;
    }
    setEventModalOpen(true);
    setEventFormData({
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      address: '',
      city: '',
      state: '',
      category: '',
      expectedAttendees: '0',
      time: '',
      endTime: '',
    });
    setStartTime({ hour: '12', minute: '00', ampm: 'AM' });
    setEndTime({ hour: '12', minute: '00', ampm: 'PM' });
  };

  const convertTo24Hour = (hour: string, minute: string, ampm: string): string => {
    let h = parseInt(hour, 10);
    if (ampm === 'PM' && h !== 12) {
      h += 12;
    } else if (ampm === 'AM' && h === 12) {
      h = 0;
    }
    return `${h.toString().padStart(2, '0')}:${minute.padStart(2, '0')}`;
  };

  useEffect(() => {
    const time24 = convertTo24Hour(startTime.hour, startTime.minute, startTime.ampm);
    setEventFormData(prev => ({ ...prev, time: time24 }));
  }, [startTime]);

  useEffect(() => {
    const time24 = convertTo24Hour(endTime.hour, endTime.minute, endTime.ampm);
    setEventFormData(prev => ({ ...prev, endTime: time24 }));
  }, [endTime]);

  const handleEventSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingEvent(true);

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        showToast('Please login to submit event', 'error');
        setIsSubmittingEvent(false);
        return;
      }

      const eventData = {
        title: eventFormData.title,
        description: eventFormData.description,
        startDate: eventFormData.startDate,
        endDate: eventFormData.endDate,
        location: eventFormData.location,
        address: eventFormData.address,
        city: eventFormData.city,
        state: eventFormData.state,
        category: eventFormData.category || 'Community',
        expectedAttendees: eventFormData.expectedAttendees ? parseInt(eventFormData.expectedAttendees) : 0,
        time: eventFormData.time || null,
        endTime: eventFormData.endTime || null,
        status: 'pending',
      };

      await api.post('/events', eventData);
      showToast('Event submitted successfully! Admin will review and contact you.', 'success');
      setEventModalOpen(false);
      setEventFormData({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        address: '',
        city: '',
        state: '',
        category: '',
        expectedAttendees: '0',
        time: '',
        endTime: '',
      });
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        showToast('Please login to submit event', 'error');
        router.push('/login');
      } else {
        showToast(error instanceof ApiError ? error.message : 'Failed to submit event', 'error');
      }
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  // Fundraiser Form Handlers
  const openFundraiserModal = () => {
    if (!isLoggedIn) {
      showToast('Please login to create fundraisers', 'error');
      router.push('/login');
      return;
    }
    setFundraiserModalOpen(true);
    setFundraiserFormData({
      title: '',
      description: '',
      goalAmount: '',
      category: '',
      image: null,
    });
  };

  const handleFundraiserFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFundraiserFormData({ ...fundraiserFormData, image: e.target.files[0] });
    }
  };

  const handleFundraiserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingFundraiser(true);

    try {
      const token = localStorage.getItem('userToken');
      if (!token) {
        showToast('Please login to submit fundraiser', 'error');
        setIsSubmittingFundraiser(false);
        return;
      }

      const campaignData = {
        title: fundraiserFormData.title,
        description: fundraiserFormData.description,
        goalAmount: parseFloat(fundraiserFormData.goalAmount) || 0,
        category: fundraiserFormData.category || 'Other',
        status: 'pending',
      };

      await api.post('/campaigns', campaignData);
      showToast('Fundraiser submitted successfully! Admin will review and contact you.', 'success');
      setFundraiserModalOpen(false);
      setFundraiserFormData({
        title: '',
        description: '',
        goalAmount: '',
        category: '',
        image: null,
      });
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        showToast('Please login to submit fundraiser', 'error');
        router.push('/login');
      } else {
        showToast(error instanceof ApiError ? error.message : 'Failed to submit fundraiser', 'error');
      }
    } finally {
      setIsSubmittingFundraiser(false);
    }
  };

  // Fundraiser Form Modal State
  const [fundraiserModalOpen, setFundraiserModalOpen] = useState(false);
  const [fundraiserFormData, setFundraiserFormData] = useState({
    title: '',
    description: '',
    goalAmount: '',
    category: '',
    image: null as File | null,
  });
  const [isSubmittingFundraiser, setIsSubmittingFundraiser] = useState(false);

  const benefits = [
    {
      icon: Handshake,
      title: 'Strategic Partnership',
      description: 'Build long-term relationships with a trusted organization',
    },
    {
      icon: Building2,
      title: 'Brand Visibility',
      description: 'Increase your brand awareness through our platform',
    },
    {
      icon: CheckCircle,
      title: 'Impact Recognition',
      description: 'Get recognized for your contributions to social causes',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <Handshake className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Become a Partner</h1>
            <p className="text-xl text-gray-600 mb-4">
              Join hands with Care Foundation Trust® to create a greater impact. Together we can make a difference.
            </p>
            {!isLoggedIn && (
              <div className="max-w-2xl mx-auto bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-yellow-800 text-sm">
                  <strong>Note:</strong> Please login to access partner registration forms and submit applications.
                </p>
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Care Foundation Information */}
            <Card className="p-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">About Care Foundation Trust®</h2>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    Care Foundation Trust® is a non-profit organisation committed to compassion and empathy. Established in 1997, we have been dedicated to making a meaningful difference in the lives of those in need through transparent donations, volunteer support, and meaningful partnerships.
                  </p>
                  <p className="text-gray-700 leading-relaxed">
                    Our goal is to address critical social issues and uplift lives through various initiatives including healthcare services, food distribution, education support, and community development programs.
                  </p>
                </div>

                <div className="bg-[#ecfdf5] rounded-lg p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Our Mission</h3>
                  <p className="text-gray-700 leading-relaxed">
                    To create a positive impact in society by providing essential services, supporting those in need, and building a network of compassionate partners who share our vision of a better world.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">Our Values</h3>
                  <ul className="space-y-3 text-gray-700">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                      <span>Transparency and accountability in all operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                      <span>Commitment to social welfare</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                      <span>Building strong community partnerships</span>
                    </li>
                  </ul>
                </div>
              </div>
            </Card>

            {/* Benefits & Info */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Partnership Benefits</h3>
                <div className="space-y-4">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-4">
                      <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                        <benefit.icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                        <p className="text-sm text-gray-600">{benefit.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6 bg-[#ecfdf5]">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Why Partner With Us?</h3>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>Reach thousands of beneficiaries</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>Transparent and accountable operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>Tax benefits under Section 80G</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>Recognition and visibility</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span>Dedicated partnership support</span>
                  </li>
                </ul>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Contact Us</h3>
                <div className="space-y-3 text-gray-700">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-[#10b981]" />
                    <a href="mailto:carefoundationtrustorg@gmail.com" className="hover:text-[#10b981]">
                      carefoundationtrustorg@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-[#10b981]" />
                    <a href="tel:+919136521052" className="hover:text-[#10b981]">
                      +91 9136521052
                    </a>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-sm">1106, Alexander Tower, Sai World Empire, Navi Mumbai - 410210</span>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          {/* Partner Type Selection Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Join Us in Fighting Hunger and Transform Lives Together!
              </h2>
              <p className="text-xl text-gray-600">
                Select your partner type below to get started with your registration
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Doctor Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? () => handlePartnerTypeClick('/admin/create-doctor') : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Join as a medical professional to provide healthcare services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-doctor');
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Hospital Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? () => handlePartnerTypeClick('/admin/create-hospital') : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hospital</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Partner with us to provide comprehensive healthcare services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-hospital');
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Food Partner Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? () => handlePartnerTypeClick('/admin/create-restaurant') : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <UtensilsCrossed className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Food Partner</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Help us fight hunger by providing food services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-restaurant');
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Medicine/Pharmacy Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? () => handlePartnerTypeClick('/admin/create-medicine') : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <Pill className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Medicine/Pharmacy</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Provide pharmaceutical services and medicines
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-medicine');
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Pathology Lab Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? () => handlePartnerTypeClick('/admin/create-pathology') : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <FlaskConical className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pathology Lab</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Offer diagnostic and laboratory testing services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-pathology');
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Event Form Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? openEventModal : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Event Form</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create and submit new events and activities
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openEventModal();
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Fundraiser Form Card */}
              <Card className={`p-6 transition-all duration-300 group ${isLoggedIn ? 'hover:shadow-lg cursor-pointer' : 'opacity-75 cursor-not-allowed'}`} onClick={isLoggedIn ? openFundraiserModal : undefined}>
                <div className="flex flex-col items-center text-center">
                  <div className={`relative w-16 h-16 mb-4 transition-transform ${isLoggedIn ? 'group-hover:scale-110' : ''}`}>
                    <Image src="/Logo.png" alt="Care Foundation Trust Logo" fill className="object-contain opacity-90" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Fundraiser</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create and submit new fundraising campaigns
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!isLoggedIn}
                    onClick={(e) => {
                      e.stopPropagation();
                      openFundraiserModal();
                    }}
                  >
                    {isLoggedIn ? (
                      <>Select <ArrowRight className="ml-2 h-4 w-4 inline" /></>
                    ) : (
                      <>Login Required</>
                    )}
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      {/* Event Form Modal */}
      {eventModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmittingEvent && setEventModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-gray-900">Create Event</h2>
                <button
                  onClick={() => !isSubmittingEvent && setEventModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmittingEvent}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleEventSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={eventFormData.title}
                    onChange={(e) => setEventFormData({ ...eventFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter event title"
                    disabled={isSubmittingEvent}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={eventFormData.description}
                    onChange={(e) => setEventFormData({ ...eventFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter event description"
                    disabled={isSubmittingEvent}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={eventFormData.startDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, startDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      disabled={isSubmittingEvent}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={eventFormData.endDate}
                      onChange={(e) => setEventFormData({ ...eventFormData, endDate: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      disabled={isSubmittingEvent}
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 items-end">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Time</label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={startTime.hour}
                        onChange={(e) => setStartTime({ ...startTime, hour: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        disabled={isSubmittingEvent}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h.toString()}>{h.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="text-gray-600 font-semibold">:</span>
                      <select
                        value={startTime.minute}
                        onChange={(e) => setStartTime({ ...startTime, minute: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        disabled={isSubmittingEvent}
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                          <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <select
                        value={startTime.ampm}
                        onChange={(e) => setStartTime({ ...startTime, ampm: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                        disabled={isSubmittingEvent}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center justify-center pb-2">
                    <span className="text-gray-700 font-semibold text-lg">TO</span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Time</label>
                    <div className="flex gap-2 items-center">
                      <select
                        value={endTime.hour}
                        onChange={(e) => setEndTime({ ...endTime, hour: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        disabled={isSubmittingEvent}
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                          <option key={h} value={h.toString()}>{h.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <span className="text-gray-600 font-semibold">:</span>
                      <select
                        value={endTime.minute}
                        onChange={(e) => setEndTime({ ...endTime, minute: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        disabled={isSubmittingEvent}
                      >
                        {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                          <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                        ))}
                      </select>
                      <select
                        value={endTime.ampm}
                        onChange={(e) => setEndTime({ ...endTime, ampm: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                        disabled={isSubmittingEvent}
                      >
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={eventFormData.location}
                      onChange={(e) => setEventFormData({ ...eventFormData, location: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Enter event location"
                      disabled={isSubmittingEvent}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select 
                      value={eventFormData.category}
                      onChange={(e) => setEventFormData({ ...eventFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      disabled={isSubmittingEvent}
                    >
                      <option value="">Select category</option>
                      <option value="Volunteer">Volunteer</option>
                      <option value="Fundraising">Fundraising</option>
                      <option value="Community">Community</option>
                      <option value="Health">Health</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Expected Attendees</label>
                  <input
                    type="number"
                    value={eventFormData.expectedAttendees}
                    onChange={(e) => setEventFormData({ ...eventFormData, expectedAttendees: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="0"
                    min="0"
                    disabled={isSubmittingEvent}
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Button type="submit" disabled={isSubmittingEvent} className="flex-1">
                    {isSubmittingEvent ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Event'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setEventModalOpen(false)}
                    disabled={isSubmittingEvent}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Fundraiser Form Modal */}
      {fundraiserModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => !isSubmittingFundraiser && setFundraiserModalOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full my-8 max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
                <h2 className="text-2xl font-bold text-gray-900">Create Fundraiser</h2>
                <button
                  onClick={() => !isSubmittingFundraiser && setFundraiserModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  disabled={isSubmittingFundraiser}
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleFundraiserSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fundraiser Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fundraiserFormData.title}
                    onChange={(e) => setFundraiserFormData({ ...fundraiserFormData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter fundraiser title"
                    disabled={isSubmittingFundraiser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={fundraiserFormData.description}
                    onChange={(e) => setFundraiserFormData({ ...fundraiserFormData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter fundraiser description"
                    disabled={isSubmittingFundraiser}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Goal Amount (₹) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={fundraiserFormData.goalAmount}
                      onChange={(e) => setFundraiserFormData({ ...fundraiserFormData, goalAmount: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Enter goal amount"
                      min="0"
                      disabled={isSubmittingFundraiser}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={fundraiserFormData.category}
                      onChange={(e) => setFundraiserFormData({ ...fundraiserFormData, category: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      disabled={isSubmittingFundraiser}
                    >
                      <option value="">Select category</option>
                      <option value="Medical">Medical</option>
                      <option value="Education">Education</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-500 mb-4">PNG, JPG, GIF up to 10MB</p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFundraiserFileChange}
                      className="hidden"
                      id="fundraiser-image-upload"
                      disabled={isSubmittingFundraiser}
                    />
                    <label
                      htmlFor="fundraiser-image-upload"
                      className="mt-4 inline-block px-4 py-2 bg-[#10b981] text-white rounded-lg cursor-pointer hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Choose File
                    </label>
                    {fundraiserFormData.image && (
                      <p className="mt-2 text-sm text-gray-600">{fundraiserFormData.image.name}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-gray-200">
                  <Button type="submit" disabled={isSubmittingFundraiser} className="flex-1">
                    {isSubmittingFundraiser ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Fundraiser'
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    type="button" 
                    onClick={() => setFundraiserModalOpen(false)}
                    disabled={isSubmittingFundraiser}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      
      <Footer />
    </div>
  );
}

