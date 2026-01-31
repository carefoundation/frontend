'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import ViewModal from '@/components/admin/ViewModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CheckCircle2, XCircle, Eye, Loader2, Trash2, Download } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { api, ApiError } from '@/lib/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable'; // If needed, otherwise skip


interface PartnerRequest {
  _id: string;
  id?: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  status: 'pending' | 'approved' | 'rejected' | 'active';
  createdAt: string;
  submittedDate?: string;
  description?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  formData?: Record<string, any>;
  logo?: string;
  photo?: string;
  [key: string]: any; // Allow additional properties
}

export default function PartnerRequestsPage() {
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      // Fetch all partners (pending, approved, rejected) for admin view
      const data = await api.get<PartnerRequest[]>('/partners');
      const formattedData = data.map((partner: any) => ({
        ...partner,
        id: partner._id,
        submittedDate: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : '',
        type: partner.type ? partner.type.charAt(0).toUpperCase() + partner.type.slice(1) : partner.type,
        formData: partner.formData || null, // Include full form data for admin review
      }));
      setRequests(formattedData);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to fetch partner requests', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setUpdating(id);
      await api.patch(`/partners/${id}/status`, { status: 'approved' });
      await fetchPartners();
      showToast('Partner approved successfully!', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to approve partner', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleDownload = async (request: PartnerRequest) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPos = 20;
      const lineHeight = 7;

      // Helper for adding new page if needed
      const checkPageBreak = (heightNeeded: number) => {
        if (yPos + heightNeeded > pageHeight - margin) {
          doc.addPage();
          yPos = margin;
          return true;
        }
        return false;
      };

      // Add Title
      doc.setFontSize(20);
      doc.setTextColor(16, 185, 129); // #10b981
      doc.text('Partner Request Details', margin, yPos);
      yPos += 15;

      // Add Basic Info
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);

      const addField = (label: string, value: string) => {
        checkPageBreak(lineHeight);
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, margin, yPos);
        doc.setFont('helvetica', 'normal');
        
        const splitValue = doc.splitTextToSize(value, pageWidth - margin - 60);
        doc.text(splitValue, margin + 50, yPos);
        
        yPos += lineHeight * splitValue.length + 2;
      };

      addField('Name', request.name);
      addField('Type', request.type);
      addField('Email', request.email);
      addField('Phone', request.phone || 'N/A');
      addField('Status', request.status);
      addField('Submitted', request.submittedDate || (request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'));
      addField('Address', request.address || 'N/A');
      addField('City', request.city || 'N/A');
      addField('State', request.state || 'N/A');
      
      yPos += 5;

      // Add Additional Details
      if (request.formData) {
        checkPageBreak(20);
        doc.setFontSize(16);
        doc.setTextColor(16, 185, 129);
        doc.text('Additional Details', margin, yPos);
        yPos += 15;
        
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);

        const imageFields = ['image', 'images', 'banner', 'logo', 'photo', 'pharmacyimages', 'labimages', 'hospitalimages', 'restaurantimages', 'clinicphotos', 'pancard', 'aadharcard', 'pan', 'aadhar'];
        const imagesToProcess: { key: string, data: string | string[] }[] = [];

        // Process text fields first
        Object.entries(request.formData).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            // Normalize key for checking: remove spaces and convert to lowercase
            const lowerKey = key.toLowerCase().replace(/\s+/g, '');
            const isImageField = imageFields.some(field => lowerKey.includes(field));
            
            if (isImageField) {
              imagesToProcess.push({ key, data: value as string | string[] });
            } else {
              let displayValue = '';
              if (typeof value === 'object') {
                if (key === 'operatingHours') {
                   const hours = value as any;
                   const slots = [];
                   if (hours.morning?.from) slots.push(`Morning: ${hours.morning.from}-${hours.morning.to}`);
                   if (hours.evening?.from) slots.push(`Evening: ${hours.evening.from}-${hours.evening.to}`);
                   if (hours.night?.from) slots.push(`Night: ${hours.night.from}-${hours.night.to}`);
                   displayValue = slots.join(', ');
                } else {
                   displayValue = JSON.stringify(value);
                }
              } else {
                displayValue = String(value);
              }
              addField(key.replace(/([A-Z])/g, ' $1').trim(), displayValue);
            }
          }
        });

        // Process images
        if (imagesToProcess.length > 0) {
          yPos += 10;
          checkPageBreak(20);
          doc.setFontSize(16);
          doc.setTextColor(16, 185, 129);
          doc.text('Documents & Images', margin, yPos);
          yPos += 15;

          for (const item of imagesToProcess) {
            const label = item.key.replace(/([A-Z])/g, ' $1').trim();
            const values = Array.isArray(item.data) ? item.data : [item.data];

            for (let i = 0; i < values.length; i++) {
              const imgData = values[i];
              
              if (typeof imgData !== 'string') continue;

              let base64Data = imgData;
              let imageType = 'JPEG';

              // Parse filename::base64 format if present
              if (imgData.includes('::')) {
                base64Data = imgData.split('::')[1];
              }

              // Detect image type and clean base64 string
              if (base64Data.startsWith('data:image/')) {
                const matches = base64Data.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
                if (matches) {
                  imageType = matches[1].toUpperCase();
                  if (imageType === 'JPG') imageType = 'JPEG';
                  base64Data = matches[2];
                }
              } else if (base64Data.startsWith('http')) {
                // Skip URLs for now as they require async loading/cors handling
                continue;
              }

              // Skip PDFs for addImage
              if (base64Data.includes('application/pdf')) {
                continue;
              }

              checkPageBreak(100); 
              
              doc.setFontSize(12);
              doc.setTextColor(0, 0, 0);
              doc.setFont('helvetica', 'bold');
              doc.text(`${label}${values.length > 1 ? ` (${i + 1})` : ''}:`, margin, yPos);
              yPos += 7;

              try {
                // Determine image aspect ratio by loading it
                const img = new Image();
                img.src = base64Data.startsWith('data:') ? base64Data : `data:image/${imageType.toLowerCase()};base64,${base64Data}`;
                
                await new Promise((resolve) => {
                  img.onload = () => {
                    const pageContentWidth = pageWidth - (margin * 2);
                    const aspectRatio = img.width / img.height;
                    
                    let imgWidth = pageContentWidth;
                    let imgHeight = imgWidth / aspectRatio;
                    
                    // If height is too big, scale down based on height
                    if (imgHeight > 150) {
                      imgHeight = 150;
                      imgWidth = imgHeight * aspectRatio;
                    }
                    
                    checkPageBreak(imgHeight + 10);
                    
                    try {
                      doc.addImage(base64Data, imageType, margin, yPos, imgWidth, imgHeight);
                      yPos += imgHeight + 10;
                    } catch (e) {
                      console.error('Error adding image to PDF:', e);
                      doc.setFont('helvetica', 'italic');
                      doc.text('(Image could not be rendered)', margin, yPos);
                      yPos += 10;
                    }
                    resolve(true);
                  };
                  img.onerror = (e) => {
                    console.error('Error loading image:', e);
                    doc.setFont('helvetica', 'italic');
                    doc.text('(Image could not be loaded)', margin, yPos);
                    yPos += 10;
                    resolve(true);
                  }
                });
              } catch (err) {
                console.error('Error adding image to PDF:', err);
                doc.setFont('helvetica', 'italic');
                doc.text('(Image could not be rendered)', margin, yPos);
                yPos += 10;
              }
            }
          }
        }
      }

      doc.save(`partner_request_${request.name.replace(/\s+/g, '_').toLowerCase()}.pdf`);
      showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download PDF', 'error');
    }
  };

  const handleRejectClick = (request: PartnerRequest) => {
    setSelectedRequest(request);
    setConfirmModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (selectedRequest) {
      try {
        setUpdating(selectedRequest._id || selectedRequest.id || '');
        await api.patch(`/partners/${selectedRequest._id || selectedRequest.id}/status`, { status: 'rejected' });
        await fetchPartners();
        showToast('Partner rejected.', 'info');
        setSelectedRequest(null);
        setConfirmModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError) {
          showToast(error.message, 'error');
        } else {
          showToast('Failed to reject partner', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PartnerRequest | null>(null);

  const handleView = (request: PartnerRequest) => {
    setSelectedRequest(request);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (request: PartnerRequest) => {
    setSelectedRequest(request);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedRequest) {
      try {
        setUpdating(selectedRequest._id || selectedRequest.id || '');
        await api.delete(`/partners/${selectedRequest._id || selectedRequest.id}`);
        await fetchPartners();
        showToast('Partner deleted successfully!', 'success');
        setSelectedRequest(null);
        setDeleteModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError) {
          showToast(error.message, 'error');
        } else {
          showToast('Failed to delete partner', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const columns = [
    {
      header: 'Name',
      accessor: 'name' as keyof PartnerRequest,
    },
    {
      header: 'Type',
      accessor: 'type' as keyof PartnerRequest,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof PartnerRequest,
    },
    {
      header: 'Phone',
      accessor: 'phone' as keyof PartnerRequest,
    },
    {
      header: 'Status',
      accessor: 'status' as keyof PartnerRequest,
      render: (value: string) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-700',
          approved: 'bg-green-100 text-green-700',
          rejected: 'bg-red-100 text-red-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
            {value}
          </span>
        );
      },
    },
    {
      header: 'Submitted',
      accessor: 'submittedDate' as keyof PartnerRequest,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Partner Request</h1>
        <p className="text-gray-600">Approve or reject partner applications</p>
      </div>
      <DataTable
        title=""
        columns={columns}
        data={requests}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'pending', label: 'Pending' },
              { value: 'approved', label: 'Approved' },
              { value: 'rejected', label: 'Rejected' },
            ],
          },
          {
            key: 'type',
            label: 'Type',
            options: [
              { value: 'health', label: 'Health' },
              { value: 'food', label: 'Food' },
            ],
          },
        ]}
        actions={(row) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(row)}
              title="View Details"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDownload(row)}
              title="Download PDF"
              className="text-[#10b981] hover:text-[#059669] hover:bg-[#ecfdf5]"
            >
              <Download className="h-4 w-4" />
            </Button>
            {row.status === 'pending' && (
              <>
                <Button
                  size="sm"
                  className="bg-[#10b981] hover:bg-[#059669]"
                  onClick={() => handleApprove(row._id || row.id || '')}
                  disabled={updating === (row._id || row.id)}
                >
                  {updating === (row._id || row.id) ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  )}
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleRejectClick(row)}
                  disabled={updating === (row._id || row.id)}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 cursor-pointer"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleDeleteClick(row);
              }}
              disabled={updating === (row._id || row.id)}
              title="Delete"
            >
              {updating === (row._id || row.id) ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      />

      {/* View Modal */}
      {selectedRequest && (
        <>
          <ViewModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedRequest(null);
            }}
            title="Partner Request Details"
            data={{
              'Name': selectedRequest.name,
              'Type': selectedRequest.type,
              'Email': selectedRequest.email,
              'Phone': selectedRequest.phone || 'N/A',
              'Status': selectedRequest.status,
              'Submitted Date': selectedRequest.submittedDate || selectedRequest.createdAt ? new Date(selectedRequest.createdAt).toLocaleDateString() : 'N/A',
              'Description': selectedRequest.description || 'N/A',
              'Address': selectedRequest.address || 'N/A',
              'City': selectedRequest.city || 'N/A',
              'State': selectedRequest.state || 'N/A',
              'Pincode': selectedRequest.pincode || 'N/A',
              ...(selectedRequest.logo ? { 'Logo': selectedRequest.logo } : {}),
              ...(selectedRequest.photo ? { 'Photo': selectedRequest.photo } : {}),
              ...(selectedRequest.formData ? Object.entries(selectedRequest.formData).reduce((acc, [key, value]) => {
                if (value !== null && value !== undefined && value !== '') {
                  // Check for image/PDF fields
                  const imageFields = ['image', 'images', 'banner', 'logo', 'photo', 'pharmacyImages', 'labImages', 'hospitalImages', 'restaurantImages', 'clinicPhotos', 'panCard', 'aadharCard'];
                  const pdfFields = ['businessLicense', 'drugLicense', 'labLicense', 'license', 'document', 'documents', 'foodLicense'];
                  
                  if (imageFields.some(field => key.toLowerCase().includes(field))) {
                    // Handle image fields
                    if (Array.isArray(value)) {
                      value.forEach((img: any, idx: number) => {
                        acc[`${key} ${idx + 1}`] = img;
                      });
                    } else {
                      acc[key] = value;
                    }
                  } else if (pdfFields.some(field => key.toLowerCase().includes(field))) {
                    // Handle PDF fields
                    acc[key] = value;
                  } else if (typeof value === 'object' && !Array.isArray(value)) {
                    acc[`${key} (Details)`] = value;
                  } else if (Array.isArray(value)) {
                    acc[key] = value.join(', ');
                  } else {
                    acc[key] = String(value);
                  }
                }
                return acc;
              }, {} as Record<string, any>) : {}),
            }}
          />
          <ConfirmModal
            isOpen={confirmModalOpen}
            onClose={() => {
              setConfirmModalOpen(false);
              setSelectedRequest(null);
            }}
            title="Reject Partner"
            message={`Are you sure you want to reject "${selectedRequest.name}"? This action cannot be undone.`}
            onConfirm={handleRejectConfirm}
            confirmText="Reject"
            variant="danger"
          />
          <ConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedRequest(null);
            }}
            title="Delete Partner Request"
            message={`Are you sure you want to delete "${selectedRequest.name}"? This action cannot be undone and all data will be permanently removed.`}
            onConfirm={handleDeleteConfirm}
            confirmText="Delete"
            variant="danger"
          />
        </>
      )}
    </div>
  );
}

