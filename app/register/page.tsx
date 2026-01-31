'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, Lock, Eye, EyeOff, User, Phone, FileText, Upload, X, CheckCircle, Shield, Award, TrendingUp, Users, Target, Heart } from 'lucide-react';
import Button from '@/components/ui/Button';
import { showToast } from '@/lib/toast';
import { ApiError } from '@/lib/api';

type Role = 'partner' | 'volunteer' | 'fundraiser' | 'donor' | 'staff';

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<'role' | 'form'>('role');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    // Partner specific fields
    businessName: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessType: '',
    gstNumber: '',
    website: '',
  });
  const [documents, setDocuments] = useState<string[]>([]);
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const roles: { value: Role; label: string; description: string; icon: any }[] = [
    { value: 'partner', label: 'Partner', description: 'Join as a business partner', icon: Heart },
    { value: 'volunteer', label: 'Volunteer', description: 'Help make a difference', icon: User },
    { value: 'fundraiser', label: 'Fundraiser', description: 'Create and manage campaigns', icon: Heart },
    { value: 'donor', label: 'Donor', description: 'Support causes you care about', icon: Heart },
    { value: 'staff', label: 'Staff', description: 'Organization staff member', icon: User },
  ];

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setStep('form');
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocumentFiles([...documentFiles, ...files]);
    setDocuments([...documents, ...files.map(f => f.name)]);
  };

  const removeDocument = (index: number) => {
    setDocumentFiles(documentFiles.filter((_, i) => i !== index));
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Validate phone number - must be exactly 10 digits
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return;
    }

    if (selectedRole === 'partner') {
      if (documents.length === 0) {
        setError('Please upload required documents for partner registration');
        return;
      }
      if (!formData.businessName || !formData.address || !formData.city || !formData.state || !formData.pincode) {
        setError('Please fill all required partner details');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      const { api } = await import('@/lib/api');
      
      // Convert files to base64 for partner documents
      let documentUrls: string[] = [];
      if (selectedRole === 'partner' && documentFiles.length > 0) {
        // Check total file size (limit to 10MB total to stay well under MongoDB 16MB limit)
        const totalSize = documentFiles.reduce((acc, file) => acc + file.size, 0);
        if (totalSize > 10 * 1024 * 1024) {
          setError('Total file size must be less than 10MB');
          setIsLoading(false);
          return;
        }

        // Convert files to base64 so they can be stored and viewed
        const filePromises = documentFiles.map((file) => {
          return new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64String = reader.result as string;
              // Include file name in the data
              resolve(`${file.name}::${base64String}`);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        });
        documentUrls = await Promise.all(filePromises);
      }

      const registrationData: any = {
        name: formData.name,
        email: formData.email,
        mobileNumber: formData.phone.replace(/\D/g, ''), // Ensure only digits
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: selectedRole,
        documents: documentUrls,
      };

      // Add partner specific fields
      if (selectedRole === 'partner') {
        registrationData.address = formData.address;
        registrationData.city = formData.city;
        registrationData.state = formData.state;
        registrationData.pincode = formData.pincode;
        registrationData.businessName = formData.businessName;
        registrationData.businessType = formData.businessType;
        if (formData.gstNumber) registrationData.gstNumber = formData.gstNumber;
        if (formData.website) registrationData.website = formData.website;
      }

      await api.post('/auth/register', registrationData);
      
      // Registration successful - redirect to login page
      router.push('/login?registered=true');
    } catch (error: any) {
      let errorMessage = 'Registration failed. Please try again.';
      let showToastError = false;
      
      // Handle ApiError specifically
      if (error instanceof ApiError) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('already exists') || errorMsg.includes('email') || errorMsg.includes('user already exists')) {
          errorMessage = 'An account with this email already exists. Please login instead or use a different email.';
          showToastError = true;
          showToast(errorMessage, 'error');
        } else if (errorMsg.includes('phone') || errorMsg.includes('mobile')) {
          errorMessage = 'This phone number is already registered. Please use a different number.';
          showToastError = true;
          showToast(errorMessage, 'error');
        } else {
          errorMessage = error.message || errorMessage;
          showToastError = true;
          showToast(errorMessage, 'error');
        }
      } else if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('already exists') || errorMsg.includes('email') || errorMsg.includes('user already exists')) {
          errorMessage = 'An account with this email already exists. Please login instead or use a different email.';
          showToastError = true;
          showToast(errorMessage, 'error');
        } else if (errorMsg.includes('password')) {
          errorMessage = error.message;
        } else if (errorMsg.includes('phone') || errorMsg.includes('mobile')) {
          errorMessage = 'This phone number is already registered. Please use a different number.';
          showToastError = true;
          showToast(errorMessage, 'error');
        } else {
          errorMessage = error.message || errorMessage;
        }
      }
      
      // Only set error state if not showing toast (for validation errors)
      if (!showToastError) {
        setError(errorMessage);
      } else {
        setError(''); // Clear error state when showing toast
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const benefits = {
    partner: [
      { icon: TrendingUp, title: 'Grow Your Business', desc: 'Reach thousands of potential customers' },
      { icon: Users, title: 'Build Trust', desc: 'Showcase your social responsibility' },
      { icon: Award, title: 'Recognition', desc: 'Get featured as a trusted partner' },
      { icon: Target, title: 'Impact Lives', desc: 'Make a real difference in your community' },
    ],
    volunteer: [
      { icon: Heart, title: 'Make Impact', desc: 'Help those in need directly' },
      { icon: Award, title: 'Get Certified', desc: 'Receive volunteer certificates' },
      { icon: Users, title: 'Join Community', desc: 'Connect with like-minded people' },
      { icon: TrendingUp, title: 'Build Skills', desc: 'Gain valuable experience' },
    ],
    fundraiser: [
      { icon: Target, title: 'Raise Funds', desc: 'Create campaigns for causes you care about' },
      { icon: TrendingUp, title: 'Track Progress', desc: 'Monitor your fundraising goals' },
      { icon: Users, title: 'Engage Donors', desc: 'Connect with generous supporters' },
      { icon: Award, title: 'Make Change', desc: 'Turn your vision into reality' },
    ],
    donor: [
      { icon: Heart, title: 'Support Causes', desc: 'Donate to campaigns you believe in' },
      { icon: Shield, title: 'Transparent', desc: 'See exactly where your money goes' },
      { icon: Award, title: 'Get Rewards', desc: 'Receive coupons and benefits' },
      { icon: Users, title: 'Join Community', desc: 'Be part of a movement' },
    ],
    staff: [
      { icon: Users, title: 'Team Work', desc: 'Work with a dedicated team' },
      { icon: Target, title: 'Make Impact', desc: 'Help manage impactful programs' },
      { icon: Award, title: 'Career Growth', desc: 'Develop professional skills' },
      { icon: Heart, title: 'Purpose', desc: 'Work for a meaningful cause' },
    ],
  };

  const currentBenefits = selectedRole ? benefits[selectedRole] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#ecfdf5] via-white to-[#ecfdf5] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          {/* Left Side - Attractive Content */}
          <div className="hidden lg:block lg:pl-8">
            <div className="sticky top-6 max-w-lg">
              

              {step === 'role' ? (
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    Join Our Mission to{' '}
                    <span className="text-[#10b981]">Make a Difference</span>
                  </h1>
                  <p className="text-lg text-gray-600 mb-8">
                    Be part of a community that's changing lives every day. Choose how you want to contribute and start making an impact today.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    {[
                      { icon: Heart, text: 'Transparent & Trustworthy Platform' },
                      { icon: Users, text: 'Join 10,000+ Active Members' },
                      { icon: Target, text: 'Support Real Causes' },
                      { icon: Award, text: 'Get Recognition & Rewards' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="bg-[#10b981] p-2 rounded-lg">
                          <item.icon className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-gray-700 font-medium">{item.text}</span>
                      </div>
                    ))}
                  </div>

                  <div className="bg-[#ecfdf5] rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">Why Join Us?</h3>
                    <ul className="space-y-2">
                      {[
                        '100% Transparent Donations',
                        'Verified Campaigns',
                        'Secure Payment Gateway',
                        '24/7 Support Available',
                      ].map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0" />
                          <span className="text-gray-600">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                    {selectedRole === 'partner' && 'Become a Partner'}
                    {selectedRole === 'volunteer' && 'Join as Volunteer'}
                    {selectedRole === 'fundraiser' && 'Start Fundraising'}
                    {selectedRole === 'donor' && 'Become a Donor'}
                    {selectedRole === 'staff' && 'Join Our Team'}
                  </h1>
                  <p className="text-lg text-gray-600 mb-8">
                    {selectedRole === 'partner' && 'Partner with us to create meaningful impact while growing your business.'}
                    {selectedRole === 'volunteer' && 'Use your time and skills to help those in need and make a real difference.'}
                    {selectedRole === 'fundraiser' && 'Create campaigns for causes you care about and raise funds effectively.'}
                    {selectedRole === 'donor' && 'Support causes you believe in and help create positive change in the world.'}
                    {selectedRole === 'staff' && 'Join our dedicated team and help manage impactful programs and initiatives.'}
                  </p>

                  {currentBenefits.length > 0 && (
                    <div className="space-y-4 mb-8">
                      <h3 className="text-xl font-bold text-gray-900">Benefits</h3>
                      {currentBenefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-start gap-4 p-4 bg-white rounded-lg border border-gray-100">
                          <div className="bg-[#10b981] p-2 rounded-lg flex-shrink-0">
                            <benefit.icon className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-1">{benefit.title}</h4>
                            <p className="text-sm text-gray-600">{benefit.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="bg-[#ecfdf5] rounded-xl p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">What Happens Next?</h3>
                    <div className="space-y-3">
                      {[
                        { step: '1', text: 'Fill out the registration form' },
                        { step: '2', text: 'Wait for admin approval' },
                        { step: '3', text: 'Start making an impact!' },
                      ].map((item) => (
                        <div key={item.step} className="flex items-center gap-3">
                          <div className="bg-[#10b981] text-white rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0">
                            {item.step}
                          </div>
                          <span className="text-gray-700">{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="w-full max-w-lg mx-auto lg:mx-0 lg:pr-8">
            {/* Mobile Logo */}
            <div className="text-center mb-4 lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2 mb-2">
                <div className="relative w-8 h-8">
                  <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                </div>
                <span className="text-xl font-bold text-gray-900">Care</span>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {step === 'role' ? 'Choose Your Role' : 'Create Account'}
              </h1>
              <p className="text-sm text-gray-600">
                {step === 'role' ? 'Select how you want to contribute' : 'Start your journey of making a difference'}
              </p>
            </div>
            
            {/* Register Card */}
            <div className={`bg-white rounded-2xl shadow-xl ${selectedRole === 'partner' ? 'p-4 max-h-[85vh] overflow-y-auto' : 'p-6'}`}>
          {step === 'role' ? (
            <div className="space-y-4">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <button
                    key={role.value}
                      onClick={() => handleRoleSelect(role.value)}
                      className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-[#10b981] hover:bg-[#ecfdf5] transition-all text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="bg-[#10b981] p-2 rounded-lg">
                          <Icon className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{role.label}</h3>
                          <p className="text-sm text-gray-600">{role.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
            </div>
          ) : (
            <>
              <button
                onClick={() => {
                  setStep('role');
                  setSelectedRole(null);
                  setError('');
                }}
                className="mb-4 text-sm text-[#10b981] hover:underline flex items-center gap-1"
              >
                ← Back to role selection
              </button>
              
              <form onSubmit={handleSubmit} className={selectedRole === 'partner' ? 'space-y-3' : 'space-y-4'}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    <div className="flex items-start gap-2">
                      <span className="font-semibold">⚠️</span>
                      <div className="flex-1">
                        <p className="font-medium mb-1">{error}</p>
                        {(error.includes('already exists') || error.includes('email')) && (
                          <Link 
                            href="/login" 
                            className="text-red-600 hover:text-red-800 underline text-xs"
                          >
                            Click here to login instead →
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                <div>
                  <label htmlFor="name" className="block text-xs font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-xs font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-xs font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                        if (value.length <= 10) {
                          setFormData({ ...formData, phone: value });
                        }
                      }}
                      maxLength={10}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="9876543210"
                    />
                  </div>
                </div>
                
                {selectedRole === 'partner' && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="businessName" className="block text-xs font-medium text-gray-700 mb-1">
                          Business Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="businessName"
                          type="text"
                          required
                          value={formData.businessName}
                          onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="Business name"
                        />
                      </div>
                      <div>
                        <label htmlFor="businessType" className="block text-xs font-medium text-gray-700 mb-1">
                          Business Type <span className="text-red-500">*</span>
                        </label>
                        <select
                          id="businessType"
                          required
                          value={formData.businessType}
                          onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        >
                          <option value="">Select type</option>
                          <option value="health">Health</option>
                          <option value="food">Food</option>
                          <option value="education">Education</option>
                          <option value="retail">Retail</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="address" className="block text-xs font-medium text-gray-700 mb-1">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="address"
                        required
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        placeholder="Enter business address"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label htmlFor="city" className="block text-xs font-medium text-gray-700 mb-1">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="city"
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <label htmlFor="state" className="block text-xs font-medium text-gray-700 mb-1">
                          State <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="state"
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="State"
                        />
                      </div>
                      <div>
                        <label htmlFor="pincode" className="block text-xs font-medium text-gray-700 mb-1">
                          Pincode <span className="text-red-500">*</span>
                        </label>
                        <input
                          id="pincode"
                          type="text"
                          required
                          value={formData.pincode}
                          onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="Pincode"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label htmlFor="gstNumber" className="block text-xs font-medium text-gray-700 mb-1">
                          GST Number
                        </label>
                        <input
                          id="gstNumber"
                          type="text"
                          value={formData.gstNumber}
                          onChange={(e) => setFormData({ ...formData, gstNumber: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="GST (optional)"
                        />
                      </div>
                      <div>
                        <label htmlFor="website" className="block text-xs font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="Website (optional)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Required Documents <span className="text-red-500">*</span>
                      </label>
                      <div className="space-y-1.5">
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-2">
                          <input
                            type="file"
                            multiple
                            onChange={handleDocumentUpload}
                            className="hidden"
                            id="documents"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          />
                          <label
                            htmlFor="documents"
                            className="flex flex-col items-center justify-center cursor-pointer"
                          >
                            <Upload className="h-5 w-5 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-600">Click to upload</span>
                            <span className="text-xs text-gray-500">PDF, JPG, PNG (Max 5MB)</span>
                          </label>
                        </div>
                        {documents.length > 0 && (
                          <div className="space-y-1">
                            {documents.map((doc, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-1.5 rounded text-xs">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <FileText className="h-3 w-3 text-gray-400 flex-shrink-0" />
                                  <span className="text-gray-700 truncate">{doc}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeDocument(index)}
                                  className="text-red-500 hover:text-red-700 flex-shrink-0 ml-2"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                
                <div>
                  <label htmlFor="password" className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full pl-9 pr-9 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    required
                    className="mt-0.5 rounded border-gray-300 text-[#10b981] focus:ring-[#10b981]"
                  />
                  <label className="ml-2 text-xs text-gray-600">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#10b981] hover:underline">
                      Terms & Conditions
                    </Link>{' '}
                    and{' '}
                    <Link href="/privacy" className="text-[#10b981] hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                
                <Button
                  type="submit"
                  className="w-full"
                  size={selectedRole === 'partner' ? 'md' : 'lg'}
                  isLoading={isLoading}
                >
                  Create Account
                </Button>
              </form>
            </>
          )}
          
          {step === 'role' && (
            <>
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link href="/login" className="text-[#10b981] font-semibold hover:underline">
                    Login
                  </Link>
                </p>
              </div>
              
              {/* Additional Content Below Role Selection */}
              <div className="mt-6 space-y-3">
                <div className="bg-[#ecfdf5] rounded-xl p-4 border border-[#10b981]/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">100% Secure</h4>
                      <p className="text-xs text-gray-600">Your data is encrypted and protected. We follow industry-standard security practices.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Free to Join</h4>
                      <p className="text-xs text-gray-600">No registration fees. Start contributing to causes you care about today.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <Users className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Join 10,000+ Members</h4>
                      <p className="text-xs text-gray-600">Be part of a growing community making real impact across India.</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
            </div>
            
            {/* Additional Content Below Form */}
            {step === 'form' && (
              <div className="mt-6 space-y-4">
                <div className="bg-[#ecfdf5] rounded-xl p-4 border border-[#10b981]/20">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Secure & Safe</h4>
                      <p className="text-xs text-gray-600">Your information is encrypted and protected. We never share your data with third parties.</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Quick Approval</h4>
                      <p className="text-xs text-gray-600">Our team reviews applications within 24-48 hours. You'll receive an email notification once approved.</p>
                    </div>
                  </div>
                </div>

                {selectedRole === 'partner' && (
                  <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-start gap-3">
                      <Users className="h-5 w-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm mb-1">Partner Support</h4>
                        <p className="text-xs text-gray-600">Need help? Contact our partnership team at partners@carefoundation.org or call +91-XXX-XXXX.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-4 text-center lg:hidden">
              <Link href="/" className="text-sm text-gray-600 hover:text-[#10b981]">
                ← Back to home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
