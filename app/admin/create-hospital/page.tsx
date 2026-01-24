'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Building2, Upload, MapPin, User, FileText, CreditCard, Loader2, Clock } from 'lucide-react';
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

export default function CreateHospitalPage() {
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
    hospitalName: '',
    email: '',
    phone: '',
    bedCapacity: '',
    specializations: '',
    description: '',
    streetAddress: '',
    city: '',
    state: '',
    pincode: '',
    contactName: '',
    contactDesignation: '',
    contactPhone: '',
    contactEmail: '',
    gstNumber: '',
    panNumber: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    accountHolderName: '',
    timing: {
      morning: { from: '', to: '', days: [] as string[] },
      evening: { from: '', to: '', days: [] as string[] },
      night: { from: '', to: '', days: [] as string[] },
    },
  });

  const [files, setFiles] = useState({
    businessLicense: null as File | null,
    hospitalImages: [] as File[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files) {
      if (field === 'hospitalImages') {
        setFiles(prev => ({ ...prev, hospitalImages: Array.from(e.target.files || []) }));
      } else {
        setFiles(prev => ({ ...prev, [field]: e.target.files?.[0] || null }));
      }
    }
  };

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
    setError('');
    setIsSubmitting(true);

    try {
      // Convert files to base64
      const businessLicenseBase64 = files.businessLicense ? await convertFileToBase64(files.businessLicense) : null;
      const hospitalImagesBase64 = files.hospitalImages.length > 0 
        ? await Promise.all(files.hospitalImages.map(file => convertFileToBase64(file)))
        : [];

      const partnerData = {
        name: formData.hospitalName,
        type: 'health',
        description: formData.description || `Hospital - ${formData.specializations || 'General Healthcare'}. Bed Capacity: ${formData.bedCapacity || 'N/A'}`,
        email: formData.email,
        phone: formData.phone,
        address: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        programs: formData.specializations ? formData.specializations.split(',').map(s => s.trim()) : [],
        status: isAdmin ? 'approved' : 'pending', // Admin creates are auto-approved, users need approval
        formData: {
          bedCapacity: formData.bedCapacity,
          timing: formData.timing,
          contactName: formData.contactName,
          contactDesignation: formData.contactDesignation,
          contactPhone: formData.contactPhone,
          contactEmail: formData.contactEmail,
          gstNumber: formData.gstNumber,
          panNumber: formData.panNumber,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode,
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          businessLicense: businessLicenseBase64,
          hospitalImages: hospitalImagesBase64,
        },
      };

      await api.post('/partners', partnerData);
      if (isAdmin) {
        showToast('Hospital partner added successfully!', 'success');
        // Reset form
        setFormData({
          hospitalName: '',
          email: '',
          phone: '',
          bedCapacity: '',
          specializations: '',
          description: '',
          streetAddress: '',
          city: '',
          state: '',
          pincode: '',
          contactName: '',
          contactDesignation: '',
          contactPhone: '',
          contactEmail: '',
          gstNumber: '',
          panNumber: '',
          accountNumber: '',
          ifscCode: '',
          bankName: '',
          accountHolderName: '',
          timing: {
            morning: { from: '', to: '', days: [] as string[] },
            evening: { from: '', to: '', days: [] as string[] },
            night: { from: '', to: '', days: [] as string[] },
          },
        });
        setFiles({
          businessLicense: null,
          hospitalImages: [],
        });
      } else {
        showToast('Partner request submitted successfully! Admin will contact you within 24 hours.', 'success');
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/');
        }, 2000);
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        // Error handled below
      } else {
        const errorMsg = error.message || 'Failed to add hospital partner. Please try again.';
        setError(errorMsg);
        showToast(errorMsg, 'error');
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Hospital Partner</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-[#10b981]">Home</Link>
            <span>/</span>
            <span>Add Hospital Partner</span>
          </div>
        </div>

        <Card className="p-6 lg:p-8 mx-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#10b981] mb-1">Add Hospital Partner</h2>
            <p className="text-[#10b981]">Adding Hospital Partner</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information */}
            <div className="bg-[#ecfdf5] rounded-lg p-5 border border-[#10b981]">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Hospital Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="hospitalName"
                    value={formData.hospitalName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Enter hospital name"
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
                      placeholder="hospital@example.com"
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
                    Bed Capacity
                  </label>
                  <input
                    type="number"
                    name="bedCapacity"
                    value={formData.bedCapacity}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Number of beds"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Specializations (comma separated)
                  </label>
                  <input
                    type="text"
                    name="specializations"
                    value={formData.specializations}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Cardiology, Neurology, Orthopedics, etc."
                  />
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
                    placeholder="Hospital description and services"
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

            {/* Operating Hours / Timing */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Clock className="h-5 w-5 text-[#10b981]" />
                Operating Hours / Timing
              </h3>
              <TimingSelector
                value={formData.timing}
                onChange={(timing) => setFormData(prev => ({ ...prev, timing }))}
              />
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#10b981]" />
                Documents
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Business License <span className="text-red-500">*</span>
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
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    GST Number
                  </label>
                  <input
                    type="text"
                    name="gstNumber"
                    value={formData.gstNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter GST number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter PAN number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Hospital Images
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
                      onChange={(e) => handleFileChange(e, 'hospitalImages')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.hospitalImages.length > 0 
                      ? `${files.hospitalImages.length} file(s) selected`
                      : 'No file chosen'}
                  </p>
                </div>
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

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="bg-[#10b981] hover:bg-[#059669] text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Building2 className="h-4 w-4 mr-2" />
                    Add Hospital Partner
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
