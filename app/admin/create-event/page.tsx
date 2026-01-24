'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Calendar, Upload, Loader2, X, Crop } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

const Cropper = dynamic<import('react-easy-crop').CropperProps>(
  () => import('react-easy-crop'),
  { 
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin text-[#10b981]" /></div>
  }
);

export default function CreateEventPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
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
    image: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      const userRole = localStorage.getItem('userRole');
      setIsLoggedIn(!!token);
      setIsAdmin(userRole === 'admin');
      
      if (!token) {
        localStorage.setItem('redirectAfterLogin', '/admin/create-event');
        router.push('/login');
        return;
      }
    }
  }, [router]);

  const resizeImage = (file: File, maxWidth: number = 1920, maxHeight: number = 1080, quality: number = 0.9): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 10 * 1024 * 1024) {
        showToast('Image size should be less than 10MB', 'error');
        return;
      }
      
      try {
        // Resize image before cropping
        const resizedImage = await resizeImage(file, 1920, 1080, 0.9);
        setImageToCrop(resizedImage);
        setShowCropModal(true);
      } catch (error) {
        showToast('Failed to process image', 'error');
      }
    }
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

    // Calculate final dimensions with max size limit
    let finalWidth = pixelCrop.width;
    let finalHeight = pixelCrop.height;

    // Resize if larger than max dimensions while maintaining aspect ratio
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

    // Set canvas size to final dimensions
    canvas.width = finalWidth;
    canvas.height = finalHeight;

    // Draw and scale the cropped portion of the image
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
        // Preview with smaller size for faster rendering
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
      // Final image with smaller size (800x450 max, 70% quality)
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels, 800, 450, 0.7);
      
      // Further reduce size to ensure it's small
      const finalImage = await compressImage(croppedImage, 0.65);
      setImagePreview(finalImage);
      
      // Convert base64 to File for formData
      const base64Response = await fetch(finalImage);
      const blob = await base64Response.blob();
      const file = new File([blob], 'event-image.jpg', { type: 'image/jpeg' });
      setFormData({ ...formData, image: file });
      
      // Show file size info
      const fileSizeMB = (blob.size / (1024 * 1024)).toFixed(2);
      const fileSizeKB = (blob.size / 1024).toFixed(0);
      if (parseFloat(fileSizeMB) < 1) {
        showToast(`Image compressed to ${fileSizeKB}KB. Image cropped successfully`, 'success');
      } else {
        showToast(`Image compressed to ${fileSizeMB}MB. Image cropped successfully`, 'success');
      }
      
      setShowCropModal(false);
      setImageToCrop(null);
      setCroppedPreview(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    } catch (error) {
      console.error('Crop error:', error);
      showToast('Failed to crop image', 'error');
    }
  };

  const compressImage = async (imageSrc: string, quality: number = 0.65, maxWidth: number = 800, maxHeight: number = 450): Promise<string> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    // Reduce size to max dimensions while maintaining aspect ratio
    let width = image.width;
    let height = image.height;

    if (width > maxWidth || height > maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxWidth;
        height = maxWidth / aspectRatio;
      } else {
        height = maxHeight;
        width = maxHeight * aspectRatio;
      }
    }

    canvas.width = width;
    canvas.height = height;
    ctx.drawImage(image, 0, 0, width, height);

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
      const imageBase64 = imagePreview || (formData.image ? await convertFileToBase64(formData.image) : null);

      const eventData = {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        category: formData.category || 'Community',
        expectedAttendees: formData.expectedAttendees ? parseInt(formData.expectedAttendees) : 0,
        time: formData.time || null,
        image: imageBase64,
      };

      await api.post('/events', eventData);
      if (isAdmin) {
        showToast('Event created successfully!', 'success');
        // Reset form
        setFormData({
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
          image: null,
        });
        setImagePreview(null);
        setShowCropModal(false);
        setImageToCrop(null);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      } else {
        showToast('Admin will contact you within 24 hours.', 'success');
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    } catch (error: any) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        let errorMsg = 'Failed to create event. Please try again.';
        if (error instanceof ApiError) {
          errorMsg = error.message;
          // Check if it's a connection error
          if (error.message.includes('Cannot connect to server') || error.message.includes('ERR_CONNECTION_REFUSED')) {
            errorMsg = 'Backend server is not running. Please start the server on port 5000.';
          }
        }
        showToast(errorMsg, 'error');
        console.error('Event creation error:', error);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return null; // Will redirect to login
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Event</h1>
        <p className="text-gray-600">Submit a new event for review</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              placeholder="Enter event title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              rows={6}
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              placeholder="Enter event description"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date *
              </label>
              <input
                type="date"
                required
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Attendees
              </label>
              <input
                type="number"
                value={formData.expectedAttendees}
                onChange={(e) => setFormData({ ...formData, expectedAttendees: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter event location"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
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

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter city"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State
              </label>
              <input
                type="text"
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                placeholder="Enter state"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              rows={3}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
              placeholder="Enter full address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image
            </label>
            {imagePreview ? (
              <div className="mb-4">
                <div className="relative w-full border border-gray-300 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById('event-image') as HTMLInputElement;
                      if (input) input.value = '';
                      setFormData({ ...formData, image: null });
                      setImagePreview(null);
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Remove Image
                  </button>
                  <span className="text-gray-400">|</span>
                  <button
                    type="button"
                    onClick={async () => {
                      if (formData.image) {
                        const base64 = await convertFileToBase64(formData.image);
                        setImageToCrop(base64);
                      } else if (imagePreview) {
                        setImageToCrop(imagePreview);
                      }
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
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="event-image"
                />
                <label
                  htmlFor="event-image"
                  className="cursor-pointer inline-block px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors"
                >
                  Choose File
                </label>
                <p className="text-sm text-gray-500 mt-2">PNG, JPG, GIF up to 10MB</p>
              </div>
            )}
          </div>

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

          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="bg-[#10b981] hover:bg-[#059669]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4 mr-2" />
                  Submit Event
                </>
              )}
            </Button>
            <Button variant="outline" type="button" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
