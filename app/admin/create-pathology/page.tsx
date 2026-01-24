'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Microscope, Upload, FileText, AlertTriangle, MapPin, User, CreditCard, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import TimingSelector from '@/components/admin/TimingSelector';

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const testTypes = [
  'Blood Tests', 'Urine Tests', 'Pathology', 'Radiology', 'Ultrasound',
  'X-Ray', 'CT Scan', 'MRI', 'ECG', 'Complete Health Checkup', 'Other'
];

export default function CreatePathologyPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      const userRole = localStorage.getItem('userRole');
      setIsLoggedIn(!!token);
      setIsAdmin(userRole === 'admin');
    }
  }, []);

  const [formData, setFormData] = useState({
    labName: '',
    email: '',
    phone: '',
    testTypes: '',
    description: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    contactName: '',
    contactDesignation: '',
    contactPhone: '',
    contactEmail: '',
    operatingHours: '',
    timing: {
      morning: { from: '', to: '', days: [] as string[] },
      evening: { from: '', to: '', days: [] as string[] },
      night: { from: '', to: '', days: [] as string[] },
    },
    gstNumber: '',
    panNumber: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    foundationFees: '',
    googleBusinessLink: '',
    agreeAdminCharges: '',
    agreeWeeklyReimbursement: '',
    agreeTerms: '',
  });

  const [files, setFiles] = useState({
    banner: null as File | null,
    businessLicense: null as File | null,
    labLicense: null as File | null,
    labImages: [] as File[],
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files) {
      if (field === 'labImages') {
        setFiles(prev => ({ ...prev, labImages: Array.from(e.target.files || []) }));
      } else {
        setFiles(prev => ({ ...prev, [field]: e.target.files?.[0] || null }));
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Convert files to base64
      const bannerBase64 = files.banner ? await convertFileToBase64(files.banner) : null;
      const businessLicenseBase64 = files.businessLicense ? await convertFileToBase64(files.businessLicense) : null;
      const labLicenseBase64 = files.labLicense ? await convertFileToBase64(files.labLicense) : null;
      const labImagesBase64 = files.labImages.length > 0 
        ? await Promise.all(files.labImages.map(file => convertFileToBase64(file)))
        : [];

      const partnerData = {
        name: formData.labName,
        type: 'health',
        description: `Pathology Lab - ${formData.testTypes || 'Various Tests'}. ${formData.description || ''}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        status: isAdmin ? 'approved' : 'pending', // Admin creates are auto-approved, users need approval
        formData: {
          testTypes: formData.testTypes,
          operatingHours: formData.operatingHours,
          timing: formData.timing,
          gstNumber: formData.gstNumber,
          panNumber: formData.panNumber,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          foundationFees: formData.foundationFees,
          googleBusinessLink: formData.googleBusinessLink,
          contactName: formData.contactName,
          contactDesignation: formData.contactDesignation,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          banner: bannerBase64,
          businessLicense: businessLicenseBase64,
          labLicense: labLicenseBase64,
          labImages: labImagesBase64,
        },
      };

      await api.post('/partners', partnerData);
      if (isAdmin) {
        showToast('Pathology partner added successfully!', 'success');
      // Reset form
      setFormData({
        labName: '',
        email: '',
        phone: '',
        testTypes: '',
        description: '',
        streetAddress: '',
        city: '',
        state: '',
        pincode: '',
        contactName: '',
        contactDesignation: '',
        contactPhone: '',
        contactEmail: '',
        operatingHours: '',
        gstNumber: '',
        panNumber: '',
        accountNumber: '',
        ifscCode: '',
        bankName: '',
        accountHolderName: '',
        foundationFees: '',
        googleBusinessLink: '',
        agreeAdminCharges: '',
        agreeWeeklyReimbursement: '',
        agreeTerms: '',
        timing: {
          morning: { from: '', to: '', days: [] as string[] },
          evening: { from: '', to: '', days: [] as string[] },
          night: { from: '', to: '', days: [] as string[] },
        },
      });
      setFiles({ banner: null, businessLicense: null, labLicense: null, labImages: [] });
      } else {
        showToast('Partner request submitted successfully! Admin will contact you within 24 hours.', 'success');
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to create pathology partner. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="w-full">
        {/* Header */}
        <div className="mb-6 px-6 pt-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Pathology Partner</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-[#10b981]">Home</Link>
            <span>/</span>
            <span>Add Pathology Partner</span>
          </div>
        </div>

        <Card className="p-6 lg:p-8 mx-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#10b981] mb-1">Add Pathology Partner</h2>
            <p className="text-[#10b981]">Adding Pathology Partner</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
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

            {/* Basic Information */}
            <div className="rounded-lg p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Lab/Pathology Center Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="labName"
                    value={formData.labName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Enter lab or pathology center name"
                    required
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                      placeholder="lab@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Phone <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      maxLength={10}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                      placeholder="10-digit phone number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Test Types (comma separated)
                  </label>
                  <input
                    type="text"
                    name="testTypes"
                    value={formData.testTypes}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Blood Tests, Urine Tests, Pathology, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Operating Hours / Timing
                  </label>
                  <TimingSelector
                    value={formData.timing}
                    onChange={(timing) => setFormData(prev => ({ ...prev, timing }))}
                  />
                  <div className="mt-2">
                    <input
                      type="text"
                      name="operatingHours"
                      value={formData.operatingHours}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                      placeholder="Or enter simple text format (e.g., 8:00 AM - 8:00 PM)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white resize-y"
                    placeholder="Lab description and services"
                  />
                </div>
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

            {/* Documents */}
            <div className="bg-[#ecfdf5] border border-[#10b981] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-[#10b981]" />
                <label className="text-sm font-bold text-gray-900">Required Documents</label>
              </div>
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    Upload Business License <span className="text-red-500">*</span>
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'businessLicense')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.businessLicense ? files.businessLicense.name : 'No file chosen'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    Upload Lab License <span className="text-red-500">*</span>
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'labLicense')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.labLicense ? files.labLicense.name : 'No file chosen'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Enter GST number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Enter PAN number"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                  Upload Lab Images (Multiple)
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
                    onChange={(e) => handleFileChange(e, 'labImages')}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {files.labImages.length > 0 
                    ? `${files.labImages.length} file(s) selected`
                    : 'No file chosen'}
                </p>
                <p className="text-xs text-gray-500 mt-1">You can select multiple photos</p>
              </div>
            </div>

            {/* Bank Details */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#10b981]" />
                Bank Details
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter IFSC code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Account Holder Name
                  </label>
                  <input
                    type="text"
                    name="accountHolderName"
                    value={formData.accountHolderName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter account holder name"
                  />
                </div>
              </div>
            </div>

            {/* Agreement Questions */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  1.Every registered restaurant must honor Care Foundation Trust customer coupons,<br /> created as per prior understanding and the enclosed menu.?
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
                  3. Any dispute between the restaurant and Care Foundation Trust shall be referred to arbitration by the Care Foundation Trust Committee.
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
                    <Microscope className="h-4 w-4 mr-2" />
                    Submit
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
