'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Heart, Award, Calendar, Mail, Phone, MapPin, CheckCircle, TrendingUp, Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function VolunteerPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    city: '',
    availability: '',
    interests: '',
    message: '',
    profileImage: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      const loggedIn = !!token && token.trim() !== '';
      setIsLoggedIn(loggedIn);
      setCheckingAuth(false);
      
      if (!loggedIn) {
        localStorage.setItem('redirectAfterLogin', '/volunteer');
        showToast('Please login to become a volunteer', 'info');
        router.push('/login');
      }
    }
  }, [router]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image size should be less than 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, profileImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    
    // Validate phone number - must be exactly 10 digits
    if (!formData.phone || !/^\d{10}$/.test(formData.phone)) {
      setError('Please enter a valid 10-digit phone number');
      setIsSubmitting(false);
      return;
    }
    
    try {
      await api.post('/volunteers', formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        city: '',
        availability: '',
        interests: '',
        message: '',
        profileImage: '',
      });
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to submit volunteer application. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For phone number field, only allow digits and limit to 10
    if (name === 'phone') {
      const numericValue = value.replace(/\D/g, ''); // Remove non-digits
      if (numericValue.length <= 10) {
        setFormData({
          ...formData,
          [name]: numericValue,
        });
      }
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const volunteerOpportunities = [
    {
      title: 'Field Work',
      description: 'Help with on-ground activities, distribution drives, and community outreach programs.',
      icon: Users,
    },
    {
      title: 'Campaign Support',
      description: 'Assist with campaign management, donor communication, and fundraising activities.',
      icon: Heart,
    },
    {
      title: 'Education Programs',
      description: 'Teach, mentor, or support educational initiatives for underprivileged children.',
      icon: Award,
    },
    {
      title: 'Event Management',
      description: 'Help organize and manage fundraising events, awareness campaigns, and community programs.',
      icon: Calendar,
    },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <Users className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Become a Volunteer</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our community of dedicated volunteers and make a real difference in people's lives. 
            Your time and skills can change the world.
          </p>
        </div>

        {/* Volunteer Opportunities */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Volunteer Opportunities</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {volunteerOpportunities.map((opportunity, index) => (
              <Card key={index} hover className="p-6 text-center">
                <div className="bg-[#10b981] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <opportunity.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{opportunity.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{opportunity.description}</p>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Volunteer Form */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Volunteer Registration Form</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter your full name"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Profile Image
                </label>
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                    {formData.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={formData.profileImage} 
                        alt="Profile Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <Users className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-xs text-gray-500 mt-1">Recommended: Square image, max 5MB</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="your@email.com"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    maxLength={10}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="9876543210"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter your city"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                  Availability
                </label>
                <select
                  id="availability"
                  name="availability"
                  value={formData.availability}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  suppressHydrationWarning
                >
                  <option value="">Select availability</option>
                  <option value="weekdays">Weekdays</option>
                  <option value="weekends">Weekends</option>
                  <option value="flexible">Flexible</option>
                  <option value="full-time">Full Time</option>
                </select>
              </div>

              <div>
                <label htmlFor="interests" className="block text-sm font-medium text-gray-700 mb-2">
                  Areas of Interest
                </label>
                <input
                  type="text"
                  id="interests"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="e.g., Education, Healthcare, Community Development"
                  suppressHydrationWarning
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to volunteer?
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Tell us about your motivation..."
                  suppressHydrationWarning
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  Thank you for your interest in volunteering! We will contact you soon.
                </div>
              )}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </Button>
            </form>
          </Card>

          {/* Benefits & Info */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Benefits of Volunteering</h3>
              <ul className="space-y-3">
                {[
                  'Make a real difference in people\'s lives',
                  'Gain valuable experience and skills',
                  'Meet like-minded individuals',
                  'Certificate of recognition',
                  'Flexible time commitment',
                  'Opportunity to work on meaningful projects',
                ].map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{benefit}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 bg-[#ecfdf5]">
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

            {/* Impact Statistics */}
            <Card className="p-6 bg-gradient-to-br from-[#10b981] to-[#059669] text-white">
              <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="h-6 w-6" />
                Our Impact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">500+</div>
                  <div className="text-sm opacity-90">Active Volunteers</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">50K+</div>
                  <div className="text-sm opacity-90">Lives Impacted</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">1000+</div>
                  <div className="text-sm opacity-90">Events Organized</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold mb-1">25+</div>
                  <div className="text-sm opacity-90">Cities Covered</div>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-white/20">
                <p className="text-sm text-center opacity-90">
                  Join us and be part of this incredible journey of making a difference!
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

