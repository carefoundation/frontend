'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Target, Upload, Calendar, MapPin, FileText, Image as ImageIcon } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { showToast } from '@/lib/toast';

export default function CreateFundraiserPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    goalAmount: '',
    description: '',
    story: '',
    location: '',
    endDate: '',
    image: '',
    documents: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const categories = [
    'Medical',
    'Education',
    'Disaster Relief',
    'Food',
    'Health',
    'Animals',
    'Community Development',
    'Other',
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB. Please compress or choose a smaller image.', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        // Compress image if it's too large
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Resize if image is too large (max 1920x1080)
          const maxWidth = 1920;
          const maxHeight = 1080;
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setFormData({
          ...formData,
              image: compressed,
        });
          }
        };
        img.src = result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const { api } = await import('@/lib/api');
      const token = typeof window !== 'undefined' ? localStorage.getItem('userToken') : null;
      
      if (!token) {
        showToast('Please login to create a fundraiser', 'info');
        router.push('/login');
        setIsSubmitting(false);
        return;
      }

      const campaignData = {
        title: formData.title,
        category: formData.category,
        goalAmount: parseFloat(formData.goalAmount),
        description: formData.description,
        story: formData.story,
        location: formData.location,
        endDate: formData.endDate,
        image: formData.image,
        isUrgent: false,
      };

      await api.post('/campaigns', campaignData);
      
      showToast('Your fundraiser has been submitted for review! We will contact you soon.', 'success');
      router.push('/campaigns');
    } catch (error: any) {
      setIsSubmitting(false);
      if (error instanceof Error) {
        showToast(`Failed to create fundraiser: ${error.message}`, 'error');
      } else {
        showToast('Failed to create fundraiser. Please try again.', 'error');
      }
      console.error('Fundraiser creation error:', error);
    }
  };

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <Target className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Start a Fundraiser</h1>
            <p className="text-xl text-gray-600">
              Create a campaign to raise funds for your cause. Fill out the form below to get started.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center mb-4">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep >= 1
                    ? 'bg-[#10b981] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  1
                </div>
                <span className="text-sm text-gray-600 mt-2">Basic Info</span>
              </div>
              
              {/* Line 1-2 */}
              <div className={`flex-1 h-1 mx-4 ${
                currentStep > 1 ? 'bg-[#10b981]' : 'bg-gray-200'
              }`} />
              
              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep >= 2
                    ? 'bg-[#10b981] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  2
                </div>
                <span className="text-sm text-gray-600 mt-2">Details</span>
              </div>
              
              {/* Line 2-3 */}
              <div className={`flex-1 h-1 mx-4 ${
                currentStep > 2 ? 'bg-[#10b981]' : 'bg-gray-200'
              }`} />
              
              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                  currentStep >= 3
                    ? 'bg-[#10b981] text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  3
                </div>
                <span className="text-sm text-gray-600 mt-2">Review</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card className="p-8">
              {/* Step 1: Basic Information */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information</h2>
                  
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Title *
                    </label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="e.g., Help Save Little Rohan - Cancer Treatment"
                      suppressHydrationWarning
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                        Category *
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        suppressHydrationWarning
                      >
                        <option value="">Select category</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                        Goal Amount (₹) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                        <input
                          type="number"
                          id="goalAmount"
                          name="goalAmount"
                          value={formData.goalAmount}
                          onChange={handleChange}
                          required
                          min="1000"
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="50000"
                          suppressHydrationWarning
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                      Location *
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        placeholder="Mumbai, India"
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign End Date *
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="date"
                        id="endDate"
                        name="endDate"
                        value={formData.endDate}
                        onChange={handleChange}
                        required
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={nextStep} size="lg">
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Campaign Details */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Campaign Details</h2>
                  
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                      Short Description * (Max 250 characters)
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      required
                      maxLength={250}
                      rows={4}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Brief description of your campaign (will be shown on campaign cards)"
                      suppressHydrationWarning
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {formData.description.length}/250 characters
                    </p>
                  </div>

                  <div>
                    <label htmlFor="story" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Story *
                    </label>
                    <textarea
                      id="story"
                      name="story"
                      value={formData.story}
                      onChange={handleChange}
                      required
                      rows={8}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      placeholder="Tell your story in detail. Explain why you need help, what the funds will be used for, and how it will make a difference..."
                      suppressHydrationWarning
                    />
                  </div>

                  <div>
                    <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Image *
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-[#10b981] transition-colors">
                      {formData.image ? (
                        <div className="space-y-4">
                          <img src={formData.image} alt="Preview" className="max-h-48 mx-auto rounded-lg" />
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, image: '' })}
                            className="text-sm text-red-600 hover:text-red-700"
                          >
                            Remove Image
                          </button>
                        </div>
                      ) : (
                        <div>
                          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <label htmlFor="image-upload" className="cursor-pointer">
                            <span className="text-[#10b981] font-semibold">Click to upload</span>
                            <span className="text-gray-600"> or drag and drop</span>
                          </label>
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                          <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF up to 5MB (will be automatically compressed)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep} size="lg">
                      Previous
                    </Button>
                    <Button type="button" onClick={nextStep} size="lg">
                      Next Step
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Review & Submit */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Review & Submit</h2>
                  
                  <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Campaign Title</h3>
                      <p className="text-gray-600">{formData.title || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Category</h3>
                      <p className="text-gray-600">{formData.category || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Goal Amount</h3>
                      <p className="text-gray-600">₹{parseFloat(formData.goalAmount || '0').toLocaleString()}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                      <p className="text-gray-600">{formData.location || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">End Date</h3>
                      <p className="text-gray-600">{formData.endDate || 'Not provided'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                      <p className="text-gray-600">{formData.description || 'Not provided'}</p>
                    </div>
                  </div>

                  <div className="bg-[#ecfdf5] border border-[#10b981] rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                      <strong>Note:</strong> Your fundraiser will be reviewed by our team before going live. 
                      This usually takes 24-48 hours. You will be notified via email once approved.
                    </p>
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep} size="lg">
                      Previous
                    </Button>
                    <Button type="submit" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Submit Fundraiser'}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </form>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

