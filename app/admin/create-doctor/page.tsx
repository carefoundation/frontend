'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Stethoscope, Upload, Clock, Sun, Moon, Building2, FileText, AlertTriangle, MapPin, User, Loader2, X } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

const Cropper = dynamic<import('react-easy-crop').CropperProps>(
  () => import('react-easy-crop'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#10b981]" /></div>
  }
);

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
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    // For phone number fields, only allow digits and limit to 10 digits
    if (name === 'contactNumber' || name === 'contactPhone') {
      const numericValue = value.replace(/\D/g, ''); // Remove non-digits
      if (numericValue.length <= 10) {
        setFormData(prev => ({ ...prev, [name]: numericValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  const getCroppedImg = async (imageSrc: string, pixelCrop: any, maxWidth: number = 1200, maxHeight: number = 675, quality: number = 0.75): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;

    if (finalWidth > maxWidth || finalHeight > maxHeight) {
      const aspectRatio = finalWidth / finalHeight;
      if (finalWidth > finalHeight) {
        finalWidth = maxWidth;
        finalHeight = maxWidth / aspectRatio;
      } else {
        finalHeight = maxHeight;
        finalWidth = maxHeight * aspectRatio;
      }
    }

    canvas.width = finalWidth;
    canvas.height = finalHeight;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      finalWidth,
      finalHeight
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
      }, 'image/jpeg', quality);
    });
  };

  const onCropComplete = useCallback(async (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
    if (imageToCrop && croppedAreaPixels) {
      try {
        const preview = await getCroppedImg(imageToCrop, croppedAreaPixels, 800, 450, 0.8);
        setCroppedPreview(preview);
      } catch (error) {
        console.error('Preview error:', error);
      }
    }
  }, [imageToCrop]);

  const handleCropComplete = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    try {
      const croppedImageDataUrl = await getCroppedImg(imageToCrop, croppedAreaPixels, 1200, 675, 0.75);
      
      // Convert data URL to File
      const response = await fetch(croppedImageDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'banner.jpg', { type: 'image/jpeg' });
      
      setFiles(prev => ({ ...prev, banner: file }));
      setBannerPreview(croppedImageDataUrl); // Set preview URL
      setShowCropModal(false);
      setImageToCrop(null);
      setCroppedPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      showToast('Image cropped successfully', 'success');
    } catch (error) {
      showToast('Failed to crop image', 'error');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
    if (e.target.files) {
      if (field === 'clinicPhotos') {
        setFiles(prev => ({ ...prev, clinicPhotos: Array.from(e.target.files || []) }));
      } else if (field === 'banner') {
        const file = e.target.files[0];
        if (file) {
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
        }
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
        email: '',
        phone: '',
        address: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        status: isAdmin ? 'approved' : 'pending', // Admin creates are auto-approved, users need approval
        formData: {
          category: 'doctor',
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
      if (!formData.name) {
        showToast('Please fill all required fields (Name)', 'error');
        setIsSubmitting(false);
        return;
      }

      // Validate contact phone if provided - must be exactly 10 digits
      if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone)) {
        showToast('Please enter a valid 10-digit phone number', 'error');
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
              {bannerPreview && (
                <div className="mt-4">
                  <img 
                    src={bannerPreview} 
                    alt="Banner Preview" 
                    className="w-full max-w-2xl h-auto rounded-lg border border-gray-300 object-contain"
                  />
                </div>
              )}
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
                      placeholder="9876543210"
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
