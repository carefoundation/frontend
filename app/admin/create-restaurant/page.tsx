'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { UtensilsCrossed, Upload, FileText, AlertTriangle, MapPin, User, CreditCard, Clock, Loader2, Crop, X } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import TimingSelector from '@/components/admin/TimingSelector';

const Cropper = dynamic<import('react-easy-crop').CropperProps>(
  () => import('react-easy-crop'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#10b981]" /></div>
  }
);

const indianStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
];

const cuisineTypes = [
  'North Indian', 'South Indian', 'Chinese', 'Continental', 'Italian',
  'Mexican', 'Thai', 'Japanese', 'Fast Food', 'Bakery', 'Desserts', 'Other'
];

export default function CreateRestaurantPage() {
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
    organizationName: '',
    email: '',
    phone: '',
    time: '',
    cuisineType: '',
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
    foodLicense: null as File | null,
    restaurantImages: [] as File[],
    cftMenu: [] as File[],
  });

  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
            'image/jpeg',
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve('');
          return;
        }
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.9);
    });
  };

  const onCropComplete = useCallback(async (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    if (imageToCrop && croppedAreaPixels) {
      try {
        const preview = await getCroppedImg(imageToCrop, croppedAreaPixels);
        setCroppedPreview(preview);
      } catch (error) {
        console.error('Preview error:', error);
      }
    }
  }, [imageToCrop]);

  const handleCropComplete = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setBannerPreview(croppedImage);
      
      const base64Response = await fetch(croppedImage);
      const blob = await base64Response.blob();
      const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
      setFiles(prev => ({ ...prev, banner: file }));
      
      setShowCropModal(false);
      setImageToCrop(null);
      setCroppedPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      showToast('Image cropped successfully', 'success');
    } catch (error) {
      console.error('Crop error:', error);
      showToast('Failed to crop image', 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files) {
      if (field === 'restaurantImages') {
        setFiles(prev => ({ ...prev, restaurantImages: Array.from(e.target.files || []) }));
      } else if (field === 'cftMenu') {
        const selectedFiles = Array.from(e.target.files || []);
        if (selectedFiles.length > 2) {
          showToast('Maximum 2 CFT Menu files allowed', 'error');
          return;
        }
        setFiles(prev => ({ ...prev, cftMenu: selectedFiles }));
      } else if (field === 'banner') {
        const file = e.target.files[0];
        if (file.size > 10 * 1024 * 1024) {
          showToast('Image size should be less than 10MB', 'error');
          return;
        }
        try {
          const resizedImage = await resizeImage(file, 1920, 1080, 0.9);
          setImageToCrop(resizedImage);
          setShowCropModal(true);
        } catch (error) {
          showToast('Failed to process image', 'error');
        }
      } else {
        setFiles(prev => ({ ...prev, [field]: e.target.files?.[0] || null }));
      }
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setSuccess(false);
    setIsSubmitting(true);

    try {
      // Convert files to base64
      const bannerBase64 = bannerPreview || (files.banner ? await convertFileToBase64(files.banner) : null);
      const businessLicenseBase64 = files.businessLicense ? await convertFileToBase64(files.businessLicense) : null;
      const foodLicenseBase64 = files.foodLicense ? await convertFileToBase64(files.foodLicense) : null;
      const restaurantImagesBase64 = files.restaurantImages.length > 0 
        ? await Promise.all(files.restaurantImages.map(file => convertFileToBase64(file)))
        : [];
      const cftMenuBase64 = files.cftMenu.length > 0 
        ? await Promise.all(files.cftMenu.map(file => convertFileToBase64(file)))
        : [];
      
      const partnerData = {
        name: formData.organizationName,
        type: 'food',
        description: formData.description,
        email: formData.email,
        phone: formData.phone,
        address: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        programs: formData.cuisineType ? [formData.cuisineType] : [],
        status: isAdmin ? 'approved' : 'pending',
        formData: {
          ...formData,
          timing: formData.timing,
          banner: bannerBase64,
          businessLicense: businessLicenseBase64,
          foodLicense: foodLicenseBase64,
          restaurantImages: restaurantImagesBase64,
          cftMenu: cftMenuBase64,
        },
      };

      await api.post('/partners', partnerData);
      
      if (isAdmin) {
        showToast('Food partner added successfully!', 'success');
        // Reset form
        setFormData({
          organizationName: '',
          email: '',
          phone: '',
          time: '',
          cuisineType: '',
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
        setFiles({
          banner: null,
          businessLicense: null,
          foodLicense: null,
          restaurantImages: [],
          cftMenu: [],
        });
        setBannerPreview(null);
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
        const errorMsg = error.message || 'Failed to add food partner. Please try again.';
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Add Food Partner</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Link href="/admin" className="hover:text-[#10b981]">Home</Link>
            <span>/</span>
            <span>Add Food Partner</span>
          </div>
        </div>

        <Card className="p-6 lg:p-8 mx-0">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#10b981] mb-1">Add Food Partner</h2>
            <p className="text-[#10b981]">Adding Food Partner</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Upload Banner */}
            <div className="bg-[#ecfdf5] border border-[#10b981] rounded-lg p-4">
              <label className="block text-sm font-semibold text-[#10b981] mb-2 uppercase">
                Upload Banner
              </label>
              {bannerPreview ? (
                <div className="mb-4">
                  <div className="relative border border-gray-300 rounded-lg overflow-hidden max-w-md mx-auto">
                    <img
                      src={bannerPreview}
                      alt="Banner preview"
                      className="w-full h-auto"
                      style={{ maxWidth: '100%', height: 'auto' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setBannerPreview(null);
                        setFiles(prev => ({ ...prev, banner: null }));
                        const input = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement;
                        if (input) input.value = '';
                      }}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Remove Image
                    </button>
                    <span className="text-gray-400">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setImageToCrop(bannerPreview);
                        setShowCropModal(true);
                      }}
                      className="text-sm text-[#10b981] hover:text-[#059669] flex items-center gap-1"
                    >
                      <Crop className="h-4 w-4" />
                      Crop Image
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                </>
              )}
            </div>

            {/* Basic Information */}
            <div className="rounded-lg p-5">
              <h3 className="text-xl font-bold text-gray-900 mb-5">Basic Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Organization/Restaurant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    placeholder="Enter organization or restaurant name"
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
                      placeholder="restaurant@example.com"
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

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Time
                    </label>
                    <input
                      type="time"
                      name="time"
                      value={formData.time}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                      Cuisine Type
                    </label>
                    <select
                      name="cuisineType"
                      value={formData.cuisineType}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent appearance-none bg-white"
                    >
                      <option value="">Select Cuisine Type</option>
                      {cuisineTypes.map(cuisine => (
                        <option key={cuisine} value={cuisine}>{cuisine}</option>
                      ))}
                    </select>
                  </div>
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
                      placeholder="Or enter simple text format (e.g., 9:00 AM - 10:00 PM)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-900 mb-2">
                    Description <span className="text-gray-500 text-xs">(Max 120 characters)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    maxLength={120}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent bg-white resize-y"
                    placeholder="Restaurant description and services"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/120 characters
                  </p>
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
                    Upload Food License <span className="text-red-500">*</span>
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileChange(e, 'foodLicense')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.foodLicense ? files.foodLicense.name : 'No file chosen'}
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
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    Upload Restaurant Images (Multiple)
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
                      onChange={(e) => handleFileChange(e, 'restaurantImages')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.restaurantImages.length > 0 
                      ? `${files.restaurantImages.length} file(s) selected`
                      : 'No file chosen'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">You can select multiple photos</p>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">
                    Upload CFT Menu
                  </label>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700">
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Files
                    </span>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      multiple
                      max={2}
                      onChange={(e) => handleFileChange(e, 'cftMenu')}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">
                    {files.cftMenu.length > 0 
                      ? `${files.cftMenu.length} file(s) selected`
                      : 'No file chosen'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Maximum 2 files allowed</p>
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

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Terms and Conditions</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3 text-sm text-gray-700">
                <p>Every registered restaurant must honor Care Foundation Trust customer coupons, created as per prior understanding and the enclosed menu.</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 mb-3">
                  1.Every registered restaurant must honor Care Foundation Trust customer coupons, <br />created as per prior understanding and the enclosed menu.?
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

              <div className="mt-4">
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

              <div className="mt-4">
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
                    <UtensilsCrossed className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </div>
          </form>

          {showCropModal && imageToCrop && (
            <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Crop Image</h3>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCropModal(false);
                      setImageToCrop(null);
                      setCroppedPreview(null);
                      setCrop({ x: 0, y: 0 });
                      setZoom(1);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="relative w-full h-96 bg-gray-900">
                  {/* @ts-ignore - react-easy-crop types are incomplete */}
                  <Cropper
                    image={imageToCrop}
                    crop={crop}
                    zoom={zoom}
                    aspect={16 / 9}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    cropShape="rect"
                    showGrid={true}
                    restrictPosition={true}
                  />
                </div>
                <div className="p-4 border-t">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 flex-1">
                      <label className="text-sm text-gray-700">
                        Zoom:
                        <input
                          type="range"
                          min={1}
                          max={3}
                          step={0.1}
                          value={zoom}
                          onChange={(e) => setZoom(Number(e.target.value))}
                          className="ml-2 w-32"
                        />
                      </label>
                    </div>
                    {croppedPreview && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-600">Preview:</span>
                        <div className="w-24 h-14 border border-gray-300 rounded overflow-hidden">
                          <img
                            src={croppedPreview}
                            alt="Crop preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCropModal(false);
                        setImageToCrop(null);
                        setCroppedPreview(null);
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      onClick={handleCropComplete}
                      className="bg-[#10b981] hover:bg-[#059669]"
                      disabled={!croppedAreaPixels}
                    >
                      Apply Crop
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
