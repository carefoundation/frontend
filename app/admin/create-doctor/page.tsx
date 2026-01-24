'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Stethoscope, Upload, Clock, Sun, Moon, Building2, FileText, AlertTriangle, MapPin, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

export default function CreateDoctorPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is logged in (optional - no login required)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      const userRole = localStorage.getItem('userRole');
      setIsLoggedIn(!!token);
      setIsAdmin(userRole === 'admin');
    }
  }, []);

  const [formData, setFormData] = useState({
    username: '',
    registrationNo: '',
    name: '',
    qualification: '',
    specialization: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    email: '',
    contactNumber: '',
    contactName: '',
    contactDesignation: '',
    contactPhone: '',
    contactEmail: '',
    doctorFees: '',
    morningFrom: '',
    morningTo: '',
    eveningFrom: '',
    eveningTo: '',
    nightFrom: '',
    nightTo: '',
    foundationFees: '',
    googleBusinessLink: '',
    agreeAdminCharges: '',
    agreeWeeklyReimbursement: '',
    agreeTerms: '',
  });

  const [selectedDays, setSelectedDays] = useState({
    morning: [] as string[],
    evening: [] as string[],
    night: [] as string[],
  });

  const [files, setFiles] = useState({
    banner: null as File | null,
    panCard: null as File | null,
    aadharCard: null as File | null,
    clinicPhotos: [] as File[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files) {
      if (field === 'clinicPhotos') {
        setFiles(prev => ({ ...prev, clinicPhotos: Array.from(e.target.files || []) }));
      } else {
        setFiles(prev => ({ ...prev, [field]: e.target.files?.[0] || null }));
      }
    }
  };

  const toggleDay = (timeSlot: 'morning' | 'evening' | 'night', day: string) => {
    setSelectedDays(prev => {
      const current = prev[timeSlot];
      const updated = current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day];
      return { ...prev, [timeSlot]: updated };
    });
  };

  const selectAllDays = (timeSlot: 'morning' | 'evening' | 'night') => {
    setSelectedDays(prev => ({ ...prev, [timeSlot]: [...daysOfWeek] }));
  };

  const clearDays = (timeSlot: 'morning' | 'evening' | 'night') => {
    setSelectedDays(prev => ({ ...prev, [timeSlot]: [] }));
  };

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Check file size (max 5MB per file to avoid issues)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        reject(new Error(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 5MB per file.`));
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        reject(new Error(`File "${file.name}" is empty.`));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = () => {
        try {
          if (reader.result && typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error(`Failed to read file "${file.name}": Invalid result type`));
          }
        } catch (error: any) {
          reject(new Error(`Error processing file "${file.name}": ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error(`Error reading file "${file.name}". The file may be corrupted or too large.`));
      };

      reader.onabort = () => {
        reject(new Error(`File reading was aborted for "${file.name}"`));
      };
      
      try {
        // Use readAsDataURL with error handling
        reader.readAsDataURL(file);
      } catch (error: any) {
        reject(new Error(`Cannot read file "${file.name}": ${error.message || 'Unknown error'}`));
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Validate required files
      if (!files.panCard) {
        showToast('Please upload PAN Card', 'error');
        setIsSubmitting(false);
        return;
      }
      if (!files.aadharCard) {
        showToast('Please upload Aadhar Card', 'error');
        setIsSubmitting(false);
        return;
      }

      // Convert files to base64 with error handling
      let bannerBase64 = null;
      let panCardBase64 = null;
      let aadharCardBase64 = null;
      let clinicPhotosBase64: string[] = [];

      try {
        if (files.banner) {
          bannerBase64 = await convertFileToBase64(files.banner);
        }
        panCardBase64 = await convertFileToBase64(files.panCard);
        aadharCardBase64 = await convertFileToBase64(files.aadharCard);
        
        if (files.clinicPhotos.length > 0) {
          clinicPhotosBase64 = await Promise.all(
            files.clinicPhotos.map(file => convertFileToBase64(file))
          );
        }
      } catch (fileError: any) {
        showToast(fileError.message || 'Error processing files. Please check file sizes (max 5MB each).', 'error');
        setIsSubmitting(false);
        return;
      }

      const partnerData = {
        name: formData.name,
        type: 'health',
        description: `Doctor - ${formData.specialization || 'General Practitioner'}. ${formData.qualification || ''}. Registration: ${formData.registrationNo || 'N/A'}`,
        email: formData.email,
        phone: formData.contactNumber,
        address: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        status: isAdmin ? 'approved' : 'pending', // Admin creates are auto-approved, users need approval
        formData: {
          username: formData.username,
          registrationNo: formData.registrationNo,
          qualification: formData.qualification,
          specialization: formData.specialization,
          doctorFees: formData.doctorFees,
          foundationFees: formData.foundationFees,
          contactName: formData.contactName,
          contactDesignation: formData.contactDesignation,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          googleBusinessLink: formData.googleBusinessLink,
          operatingHours: {
            morning: { from: formData.morningFrom, to: formData.morningTo, days: selectedDays.morning },
            evening: { from: formData.eveningFrom, to: formData.eveningTo, days: selectedDays.evening },
            night: { from: formData.nightFrom, to: formData.nightTo, days: selectedDays.night },
          },
          // Include files as base64
          banner: bannerBase64,
          panCard: panCardBase64,
          aadharCard: aadharCardBase64,
          clinicPhotos: clinicPhotosBase64,
        },
      };

      // Validate required fields before submission
      if (!formData.name || !formData.email || !formData.contactNumber) {
        showToast('Please fill all required fields (Name, Email, Contact Number)', 'error');
        setIsSubmitting(false);
        return;
      }

      await api.post('/partners', partnerData);
      if (isAdmin) {
        showToast('Doctor partner added successfully!', 'success');
      // Reset form
      setFormData({
        username: '',
        registrationNo: '',
        name: '',
        qualification: '',
        specialization: '',
        streetAddress: '',
        city: '',
        state: '',
        pincode: '',
        email: '',
        contactNumber: '',
        contactName: '',
        contactDesignation: '',
        contactPhone: '',
        contactEmail: '',
        doctorFees: '',
        morningFrom: '',
        morningTo: '',
        eveningFrom: '',
        eveningTo: '',
        nightFrom: '',
        nightTo: '',
        foundationFees: '',
        googleBusinessLink: '',
        agreeAdminCharges: '',
        agreeWeeklyReimbursement: '',
        agreeTerms: '',
      });
      setSelectedDays({ morning: [], evening: [], night: [] });
      setFiles({ banner: null, panCard: null, aadharCard: null, clinicPhotos: [] });
      } else {
        showToast('Partner request submitted successfully! Admin will contact you within 24 hours.', 'success');
        // Redirect to home after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error: any) {
      const errorMsg = error instanceof ApiError ? error.message : 'Failed to create doctor partner. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 px-6 pt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Doctor Partner</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-[#10b981]">Home</Link>
            <span>/</span>
            <span>Add Doctor Partner</span>
          </div>
        </div>

        <Card className="p-6 lg:p-8 mx-0">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Adding Doctor Partner</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Upload Banner */}
            <div className="bg-[#ecfdf5] border border-[#10b981] rounded-lg p-4">
              <label className="block text-sm font-semibold text-[#10b981] mb-2 uppercase">
                Upload Banner
              </label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose File
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    className="hidden"
                  />
                </label>
                <span className="text-sm text-gray-500">
                  {files.banner ? files.banner.name : 'No file chosen'}
                </span>
              </div>
              <div className="flex items-start gap-2 mt-2 text-sm text-[#10b981]">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>Select an image to open the crop tool (16:9 aspect ratio)</span>
              </div>
            </div>

            {/* Username and Registration No */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Username
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Username Of Doctor"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Registration No.
                </label>
                <input
                  type="text"
                  name="registrationNo"
                  value={formData.registrationNo}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter Registration no. here"
                />
              </div>
            </div>

            {/* Name of Doctor */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                Name Of The Doctor
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter Name Of Doctor"
              />
            </div>

            {/* Qualification and Specialization */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Qualification
                </label>
                <input
                  type="text"
                  name="qualification"
                  value={formData.qualification}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter qualification here"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Specialization
                </label>
                <input
                  type="text"
                  name="specialization"
                  value={formData.specialization}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter Specialization here"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-[#10b981]" />
                Address
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="streetAddress"
                    value={formData.streetAddress}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter street address"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      City <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Enter city"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      State <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent appearance-none bg-white"
                      required
                    >
                      <option value="">Select State</option>
                      {indianStates.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    maxLength={6}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter pincode"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Contact Person */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <User className="h-5 w-5 text-[#10b981]" />
                Contact Person
              </h3>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="contactName"
                      value={formData.contactName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Enter contact person name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Designation
                    </label>
                    <input
                      type="text"
                      name="contactDesignation"
                      value={formData.contactDesignation}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="e.g., Administrator, Manager"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      name="contactPhone"
                      value={formData.contactPhone}
                      onChange={handleInputChange}
                      maxLength={10}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="10-digit phone number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      name="contactEmail"
                      value={formData.contactEmail}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="contact@example.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Email and Contact Number */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Email ID
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter Email here"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Contact Number
                </label>
                <input
                  type="tel"
                  name="contactNumber"
                  value={formData.contactNumber}
                  onChange={handleInputChange}
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                  placeholder="Enter 10 digit mobile number (e.g., 9876543210)"
                />
              </div>
            </div>

            {/* Doctor's Actual Fees */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Doctors Actual Fees
              </label>
              <input
                type="text"
                name="doctorFees"
                value={formData.doctorFees}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter actual Fees of Doctor"
              />
            </div>

            {/* Time Slots Section */}
            <div className="space-y-3">
              {/* Morning Time */}
              <div className="bg-[#ecfdf5] rounded-md p-3 border-l-4 border-[#10b981]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Sun className="h-4 w-4 text-yellow-500" />
                    <label className="text-xs font-bold text-gray-900 uppercase">Morning Time</label>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selectAllDays('morning')}
                      className="text-[#10b981] hover:text-[#059669] font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => clearDays('morning')}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">From</label>
                    <input
                      type="time"
                      name="morningFrom"
                      value={formData.morningFrom}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                    />
                  </div>
                  <span className="text-gray-400 text-xs pt-5">→</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">To</label>
                    <input
                      type="time"
                      name="morningTo"
                      value={formData.morningTo}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay('morning', day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedDays.morning.includes(day)
                          ? 'bg-[#10b981] text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-[#ecfdf5]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Evening Time */}
              <div className="bg-[#ecfdf5] rounded-md p-3 border-l-4 border-[#10b981]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-[#10b981]" />
                    <label className="text-xs font-bold text-gray-900 uppercase">Evening Time</label>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selectAllDays('evening')}
                      className="text-[#10b981] hover:text-[#059669] font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => clearDays('evening')}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">From</label>
                    <input
                      type="time"
                      name="eveningFrom"
                      value={formData.eveningFrom}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                    />
                  </div>
                  <span className="text-gray-400 text-xs pt-5">→</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">To</label>
                    <input
                      type="time"
                      name="eveningTo"
                      value={formData.eveningTo}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay('evening', day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedDays.evening.includes(day)
                          ? 'bg-[#10b981] text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-[#ecfdf5]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              {/* Night Time */}
              <div className="bg-[#ecfdf5] rounded-md p-3 border-l-4 border-[#10b981]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-[#10b981]" />
                    <label className="text-xs font-bold text-gray-900 uppercase">Night Time</label>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => selectAllDays('night')}
                      className="text-[#10b981] hover:text-[#059669] font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => clearDays('night')}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">From</label>
                    <input
                      type="time"
                      name="nightFrom"
                      value={formData.nightFrom}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                    />
                  </div>
                  <span className="text-gray-400 text-xs pt-5">→</span>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-0.5">To</label>
                    <input
                      type="time"
                      name="nightTo"
                      value={formData.nightTo}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#10b981] focus:border-[#10b981]"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay('night', day)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        selectedDays.night.includes(day)
                          ? 'bg-[#10b981] text-white'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-[#ecfdf5]'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Fees For Care Foundation Trust® */}
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-2">
                Fees For Care Foundation Trust®
              </label>
              <input
                type="text"
                name="foundationFees"
                value={formData.foundationFees}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter Any Offer For NGO"
              />
            </div>

            {/* Google Business Link */}
            <div>
              <label className="block text-sm font-bold text-[#10b981] mb-2">
                Paste Google Business Link
              </label>
              <input
                type="url"
                name="googleBusinessLink"
                value={formData.googleBusinessLink}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Paste Google Business Link"
              />
            </div>

            {/* Required Documents */}
            <div className="bg-[#ecfdf5] border border-[#10b981] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[#10b981]" />
                <label className="text-sm font-bold text-gray-900">Required Documents</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    Upload PAN Card <span className="text-red-500">*</span>
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'panCard')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.panCard ? files.panCard.name : 'No file chosen'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    Upload Aadhar Card <span className="text-red-500">*</span>
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'aadharCard')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.aadharCard ? files.aadharCard.name : 'No file chosen'}
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Upload Clinic Photos (Multiple)
                </label>
                <label className="cursor-pointer">
                  <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFileChange(e, 'clinicPhotos')}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {files.clinicPhotos.length > 0 
                    ? `${files.clinicPhotos.length} file(s) selected`
                    : 'No file chosen'}
                </p>
                <p className="text-xs text-gray-500 mt-1">You can select multiple photos</p>
              </div>
            </div>

            {/* Agreement Questions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  1. Every registered restaurant must honor Care Foundation Trust customer coupons, <br />created as per prior understanding and the enclosed menu.?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreeAdminCharges"
                      value="yes"
                      checked={formData.agreeAdminCharges === 'yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]"
                    />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreeAdminCharges"
                      value="no"
                      checked={formData.agreeAdminCharges === 'no'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]"
                    />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  2.THE CARE FOUNDATION TRUST USERS HAVE TO BE TREATED AS REGULAR CUSTOMERS AND FEED WELL.?
                </label>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreeWeeklyReimbursement"
                      value="yes"
                      checked={formData.agreeWeeklyReimbursement === 'yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]"
                    />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreeWeeklyReimbursement"
                      value="no"
                      checked={formData.agreeWeeklyReimbursement === 'no'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]"
                    />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  3. Any dispute between the restaurant and Care Foundation Trust shall be <br />referred to arbitration by the Care Foundation Trust Committee.
                </label>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreeTerms"
                      value="yes"
                      checked={formData.agreeTerms === 'yes'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]"
                    />
                    <span className="text-gray-700">Yes</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="agreeTerms"
                      value="no"
                      checked={formData.agreeTerms === 'no'}
                      onChange={handleInputChange}
                      className="w-4 h-4 text-[#10b981] focus:ring-[#10b981]"
                    />
                    <span className="text-gray-700">No</span>
                  </label>
                </div>

                
              </div>
            </div>


            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Create Doctor Partner
                  </>
                )}
              </Button>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
