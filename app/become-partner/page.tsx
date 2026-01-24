'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Handshake, ArrowRight, ChevronDown, Building2, CheckCircle, Mail, Phone, MapPin, Stethoscope, UtensilsCrossed, Pill, FlaskConical, Calendar, Heart } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';

export default function BecomePartnerPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      setIsLoggedIn(!!token);
    }
  }, []);

  const handlePartnerTypeClick = (formPath: string) => {
    // Allow access without login - forms will handle submission
    router.push(formPath);
  };

  const [formData, setFormData] = useState({
    partnerFor: '',
    name: '',
    contactNumber: '',
    email: '',
    addressOfOperation: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    try {
      // Convert partner type to lowercase to match backend enum
      const partnerType = formData.partnerFor.toLowerCase();
      
      if (!['health', 'food'].includes(partnerType)) {
        setError('Please select a valid partner type (Health or Food)');
        setIsSubmitting(false);
        return;
      }
      
      await api.post('/partners', {
        type: partnerType,
        name: formData.name,
        description: formData.message || 'Partner application',
        phone: formData.contactNumber,
        email: formData.email,
        address: formData.addressOfOperation,
      });
      setSuccess(true);
      setFormData({
        partnerFor: '',
        name: '',
        contactNumber: '',
        email: '',
        addressOfOperation: '',
        message: '',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to submit partner application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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
            <p className="text-xl text-gray-600">
              Join hands with Care Foundation Trust® to create a greater impact. Together we can make a difference.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Partnership Form */}
            <Card className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Partner For Dropdown */}
              <div>
                <label htmlFor="partnerFor" className="block text-sm font-medium text-gray-700 mb-2">
                  Partner For
                </label>
                <div className="relative">
                  <select
                    id="partnerFor"
                    name="partnerFor"
                    value={formData.partnerFor}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent appearance-none bg-white text-gray-900"
                    suppressHydrationWarning
                  >
                    <option value="">Select partner type</option>
                    <option value="food">Food Partner</option>
                    <option value="health">Health Partner</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Your Name */}
              <div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Your Name"
                  suppressHydrationWarning
                />
              </div>

              {/* Contact Number */}
              <div>
                <input
                  type="tel"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Contact Number"
                  suppressHydrationWarning
                />
              </div>

              {/* Email ID */}
              <div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white text-gray-900 placeholder-gray-400"
                  placeholder="Email ID"
                  suppressHydrationWarning
                />
              </div>

              {/* Address Of Operation */}
              <div>
                <textarea
                  id="addressOfOperation"
                  name="addressOfOperation"
                  value={formData.addressOfOperation}
                  onChange={handleChange}
                  required
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
                  placeholder="Address Of Operation"
                  suppressHydrationWarning
                />
              </div>

              {/* Your Message */}
              <div>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white text-gray-900 placeholder-gray-400 resize-none"
                  placeholder="Your Message"
                  suppressHydrationWarning
                />
              </div>

              {/* Request Now Button */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Thank you for your interest in becoming a partner! We will contact you within 48 hours.
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-[#10b981] to-[#059669] hover:from-[#059669] hover:to-[#047857] text-white font-semibold"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : (
                  <>
                    Request Now
                    <ArrowRight className="ml-2 h-5 w-5 inline" />
                  </>
                )}
              </Button>
            </form>
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
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-doctor')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Stethoscope className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Doctor</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Join as a medical professional to provide healthcare services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-doctor');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>

              {/* Hospital Card */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-hospital')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Building2 className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Hospital</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Partner with us to provide comprehensive healthcare services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-hospital');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>

              {/* Food Partner Card */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-restaurant')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <UtensilsCrossed className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Food Partner</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Help us fight hunger by providing food services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-restaurant');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>

              {/* Medicine/Pharmacy Card */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-medicine')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Pill className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Medicine/Pharmacy</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Provide pharmaceutical services and medicines
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-medicine');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>

              {/* Pathology Lab Card */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-pathology')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <FlaskConical className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Pathology Lab</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Offer diagnostic and laboratory testing services
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-pathology');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>

              {/* Event Form Card */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-event')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Calendar className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Event Form</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create and submit new events and activities
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-event');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>

              {/* Fundraiser Form Card */}
              <Card className="p-6 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => handlePartnerTypeClick('/admin/create-fundraiser')}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-[#10b981] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Heart className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Fundraiser</h3>
                  <p className="text-gray-600 text-sm mb-4">
                    Create and submit new fundraising campaigns
                  </p>
                  <Button 
                    className="bg-[#10b981] hover:bg-[#059669] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePartnerTypeClick('/admin/create-fundraiser');
                    }}
                  >
                    Select <ArrowRight className="ml-2 h-4 w-4 inline" />
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

