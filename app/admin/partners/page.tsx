'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import { Eye, Edit, Trash2, Ban, Building2, Stethoscope, UtensilsCrossed, Microscope, Pill, Loader2 } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ViewModal from '@/components/admin/ViewModal';
import EditModal from '@/components/admin/EditModal';

interface Partner {
  _id?: string;
  id?: string;
  name: string;
  type: string;
  email?: string;
  phone?: string;
  location?: string;
  address?: string;
  city?: string;
  joinDate?: string;
  createdAt?: string;
  status?: string;
  description?: string;
  logo?: string;
  photo?: string;
  programs?: string[];
  impact?: string;
  since?: string;
  state?: string;
  pincode?: string;
  website?: string;
  isActive?: boolean;
  formData?: Record<string, any>;
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [fullPartnerData, setFullPartnerData] = useState<any>(null);
  const [updating, setUpdating] = useState<string | null>(null);
  const [loadingPartner, setLoadingPartner] = useState(false);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setLoading(true);
      const response = await api.get<Partner[]>('/partners?status=approved');
      if (Array.isArray(response)) {
        const formatted = response.map((partner: any) => ({
          id: partner._id || partner.id,
          _id: partner._id,
          name: partner.name || 'Unknown',
          type: partner.type === 'health' ? 'Health' : partner.type === 'food' ? 'Food' : partner.type || 'Unknown',
          email: partner.email || 'N/A',
          phone: partner.phone || 'N/A',
          location: partner.city || partner.address || partner.location || 'N/A',
          joinDate: partner.createdAt ? new Date(partner.createdAt).toLocaleDateString() : 'N/A',
          status: partner.status,
        }));
        setPartners(formatted);
      } else {
        setPartners([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        console.error('Failed to fetch partners:', error);
      }
      setPartners([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPartner) return;

    try {
      setUpdating(selectedPartner._id || selectedPartner.id || '');
      await api.delete(`/partners/${selectedPartner._id || selectedPartner.id}`);
      await fetchPartners();
      showToast('Partner deleted successfully', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to delete partner', 'error');
      }
    } finally {
      setDeleteModalOpen(false);
      setSelectedPartner(null);
      setUpdating(null);
    }
  };

  const handleBlockClick = (partner: Partner) => {
    setSelectedPartner(partner);
    setBlockModalOpen(true);
  };

  const handleBlockConfirm = async () => {
    if (!selectedPartner) return;

    try {
      setUpdating(selectedPartner._id || selectedPartner.id || '');
      await api.patch(`/partners/${selectedPartner._id || selectedPartner.id}/status`, { status: 'suspended' });
      await fetchPartners();
      showToast('Partner blocked successfully', 'success');
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to block partner', 'error');
      }
    } finally {
      setBlockModalOpen(false);
      setSelectedPartner(null);
      setUpdating(null);
    }
  };

  const handleViewClick = async (partner: Partner) => {
    try {
      setLoadingPartner(true);
      setSelectedPartner(partner);
      const partnerId = partner._id || partner.id;
      if (!partnerId) {
        showToast('Partner ID not found', 'error');
        return;
      }
      const data = await api.get<any>(`/partners/${partnerId}`);
      setFullPartnerData(data);
      setViewModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to fetch partner details', 'error');
      }
    } finally {
      setLoadingPartner(false);
    }
  };

  const handleEditClick = async (partner: Partner) => {
    try {
      setLoadingPartner(true);
      setSelectedPartner(partner);
      const partnerId = partner._id || partner.id;
      if (!partnerId) {
        showToast('Partner ID not found', 'error');
        return;
      }
      const data = await api.get<any>(`/partners/${partnerId}`);
      setFullPartnerData(data);
      setEditModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to fetch partner details', 'error');
      }
    } finally {
      setLoadingPartner(false);
    }
  };

  const handleEditSave = async (data: Record<string, any>) => {
    if (!selectedPartner) return;

    // Validate phone number if provided - must be exactly 10 digits
    if (data.phone && !/^\d{10}$/.test(data.phone.toString().trim())) {
      showToast('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    try {
      setUpdating(selectedPartner._id || selectedPartner.id || '');
      const partnerId = selectedPartner._id || selectedPartner.id;
      await api.put(`/partners/${partnerId}`, data);
      await fetchPartners();
      showToast('Partner updated successfully', 'success');
      setEditModalOpen(false);
      setSelectedPartner(null);
      setFullPartnerData(null);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to update partner', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  const getTypeIcon = (type: string) => {
    const icons: Record<string, any> = {
      Hospital: Building2,
      Doctor: Stethoscope,
      Restaurant: UtensilsCrossed,
      Pathology: Microscope,
      Medicine: Pill,
    };
    return icons[type] || Building2;
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name' as keyof Partner,
    },
    {
      header: 'Type',
      accessor: 'type' as keyof Partner,
      render: (value: string) => {
        const Icon = getTypeIcon(value);
        return (
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-[#10b981]" />
            <span>{value}</span>
          </div>
        );
      },
    },
    {
      header: 'Email',
      accessor: 'email' as keyof Partner,
    },
    {
      header: 'Phone',
      accessor: 'phone' as keyof Partner,
    },
    {
      header: 'Location',
      accessor: 'location' as keyof Partner,
    },
    {
      header: 'Join Date',
      accessor: 'joinDate' as keyof Partner,
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Partners</h1>
        <p className="text-gray-600">View all partners</p>
      </div>
      <DataTable
        title=""
        columns={columns}
        data={partners}
        actions={(row) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              title="View"
              onClick={() => handleViewClick(row)}
              disabled={loadingPartner}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Edit"
              onClick={() => handleEditClick(row)}
              disabled={loadingPartner || updating === (row._id || row.id)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              onClick={() => handleBlockClick(row)}
              disabled={updating === (row._id || row.id)}
              title="Block"
            >
              <Ban className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => handleDeleteClick(row)}
              disabled={updating === (row._id || row.id)}
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      />

      {/* Delete Modal */}
      {selectedPartner && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedPartner(null);
          }}
          title="Delete Partner"
          message={`Are you sure you want to delete "${selectedPartner.name}"? This action cannot be undone and all data will be permanently removed.`}
          onConfirm={handleDeleteConfirm}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {/* Block Modal */}
      {selectedPartner && (
        <ConfirmModal
          isOpen={blockModalOpen}
          onClose={() => {
            setBlockModalOpen(false);
            setSelectedPartner(null);
          }}
          title="Block Partner"
          message={`Are you sure you want to block "${selectedPartner.name}"? The user will be suspended and cannot create a new account with these details.`}
          onConfirm={handleBlockConfirm}
          confirmText="Block"
          variant="danger"
        />
      )}

      {/* View Modal */}
      {fullPartnerData && (
        <ViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedPartner(null);
            setFullPartnerData(null);
          }}
          title="Partner Details"
          data={{
            'Name': fullPartnerData.name || 'N/A',
            'Type': fullPartnerData.type === 'health' ? 'Health' : fullPartnerData.type === 'food' ? 'Food' : fullPartnerData.type || 'N/A',
            'Email': fullPartnerData.email || 'N/A',
            'Phone': fullPartnerData.phone || 'N/A',
            'Description': fullPartnerData.description || 'N/A',
            'Address': fullPartnerData.address || 'N/A',
            'City': fullPartnerData.city || 'N/A',
            'State': fullPartnerData.state || 'N/A',
            'Pincode': fullPartnerData.pincode || 'N/A',
            'Website': fullPartnerData.website || 'N/A',
            'Status': fullPartnerData.status || 'N/A',
            'Active': fullPartnerData.isActive !== undefined ? (fullPartnerData.isActive ? 'Yes' : 'No') : 'N/A',
            'Since': fullPartnerData.since || 'N/A',
            'Impact': fullPartnerData.impact || 'N/A',
            'Programs': fullPartnerData.programs && Array.isArray(fullPartnerData.programs) ? fullPartnerData.programs.join(', ') : 'N/A',
            'Join Date': fullPartnerData.createdAt ? new Date(fullPartnerData.createdAt).toLocaleString() : 'N/A',
            'Last Updated': fullPartnerData.updatedAt ? new Date(fullPartnerData.updatedAt).toLocaleString() : 'N/A',
            ...(fullPartnerData.logo ? { 'Logo': fullPartnerData.logo } : {}),
            ...(fullPartnerData.photo ? { 'Photo': fullPartnerData.photo } : {}),
            ...(fullPartnerData.formData ? Object.entries(fullPartnerData.formData).reduce((acc, [key, value]) => {
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
      )}

      {/* Edit Modal */}
      {fullPartnerData && (
        <EditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedPartner(null);
            setFullPartnerData(null);
          }}
          title={`Edit Partner: ${fullPartnerData.name || 'Unknown'}`}
          fields={[
            { key: 'name', label: 'Name', type: 'text' },
            { 
              key: 'type', 
              label: 'Type', 
              type: 'select',
              options: [
                { value: 'health', label: 'Health' },
                { value: 'food', label: 'Food' }
              ]
            },
            { key: 'email', label: 'Email', type: 'email' },
            { key: 'phone', label: 'Phone', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'address', label: 'Address', type: 'text' },
            { key: 'city', label: 'City', type: 'text' },
            { key: 'state', label: 'State', type: 'text' },
            { key: 'pincode', label: 'Pincode', type: 'text' },
            { key: 'website', label: 'Website', type: 'text' },
            { 
              key: 'status', 
              label: 'Status', 
              type: 'select',
              options: [
                { value: 'pending', label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
                { value: 'active', label: 'Active' }
              ]
            },
            { key: 'since', label: 'Since', type: 'text' },
            { key: 'impact', label: 'Impact', type: 'textarea' },
          ]}
          initialData={{
            name: fullPartnerData.name || '',
            type: fullPartnerData.type || 'health',
            email: fullPartnerData.email || '',
            phone: fullPartnerData.phone || '',
            description: fullPartnerData.description || '',
            address: fullPartnerData.address || '',
            city: fullPartnerData.city || '',
            state: fullPartnerData.state || '',
            pincode: fullPartnerData.pincode || '',
            website: fullPartnerData.website || '',
            status: fullPartnerData.status || 'pending',
            since: fullPartnerData.since || '',
            impact: fullPartnerData.impact || '',
          }}
          onSave={handleEditSave}
        />
      )}
    </div>
  );
}
