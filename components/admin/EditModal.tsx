'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import Button from '@/components/ui/Button';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: {
    key: string;
    label: string;
    type?: 'text' | 'email' | 'number' | 'select' | 'textarea' | 'date' | 'time';
    options?: { value: string; label: string }[];
  }[];
  initialData: Record<string, any>;
  onSave: (data: Record<string, any>) => void;
}

export default function EditModal({
  isOpen,
  onClose,
  title,
  fields,
  initialData,
  onSave,
}: EditModalProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone number fields - must be exactly 10 digits if provided
    for (const field of fields) {
      const isPhoneField = field.key.toLowerCase().includes('phone') || 
                          field.key.toLowerCase().includes('mobile') || 
                          field.key.toLowerCase().includes('contact');
      if (isPhoneField && formData[field.key]) {
        const phoneValue = formData[field.key].toString().trim();
        if (phoneValue && !/^\d{10}$/.test(phoneValue)) {
          alert(`Please enter a valid 10-digit ${field.label.toLowerCase()}`);
          return;
        }
      }
    }
    
    onSave(formData);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
            <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6">
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {field.label}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      rows={4}
                    />
                  ) : field.type === 'select' && field.options ? (
                    <select
                      value={formData[field.key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    >
                      {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : field.type === 'date' ? (
                    <input
                      type="date"
                      value={formData[field.key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    />
                  ) : field.type === 'time' ? (
                    <input
                      type="time"
                      value={formData[field.key] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    />
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.key] || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        // For phone/mobile/contact number fields, only allow digits and limit to 10
                        const isPhoneField = field.key.toLowerCase().includes('phone') || 
                                          field.key.toLowerCase().includes('mobile') || 
                                          field.key.toLowerCase().includes('contact');
                        if (isPhoneField) {
                          const numericValue = value.replace(/\D/g, ''); // Remove non-digits
                          if (numericValue.length <= 10) {
                            setFormData({ ...formData, [field.key]: numericValue });
                          }
                        } else {
                          setFormData({ ...formData, [field.key]: value });
                        }
                      }}
                      maxLength={
                        (field.key.toLowerCase().includes('phone') || 
                         field.key.toLowerCase().includes('mobile') || 
                         field.key.toLowerCase().includes('contact')) ? 10 : undefined
                      }
                      placeholder={
                        (field.key.toLowerCase().includes('phone') || 
                         field.key.toLowerCase().includes('mobile') || 
                         field.key.toLowerCase().includes('contact')) ? '9876543210' : undefined
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}

