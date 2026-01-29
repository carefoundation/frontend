'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import ViewModal from '@/components/admin/ViewModal';
import EditModal from '@/components/admin/EditModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Eye, Edit, Trash2, UserCheck, UserX, Loader2 } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { api, ApiError } from '@/lib/api';

interface User {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  role: string;
  status?: 'active' | 'inactive' | 'pending';
  registeredDate?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  mobileNumber?: string;
  isVerified?: boolean;
  isApproved?: boolean;
  isActive?: boolean;
  profileImage?: string;
  documents?: string[];
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  businessName?: string;
  businessType?: string;
  gstNumber?: string;
  website?: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get<User[]>('/users');
      if (Array.isArray(response)) {
        const formattedUsers = response
          .filter((user: any) => user.role !== 'admin') // Filter out admin users
          .map((user: any) => ({
            id: user._id || user.id,
            _id: user._id,
            name: user.name || 'N/A',
            email: user.email || 'N/A',
            role: user.role || 'donor',
            status: (user.isApproved ? (user.isVerified ? 'active' : 'inactive') : 'pending') as 'active' | 'inactive' | 'pending',
            registeredDate: user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A',
            lastLogin: 'N/A',
            mobileNumber: user.mobileNumber,
            isVerified: user.isVerified,
            isApproved: user.isApproved,
            // Include all user data for viewing
            profileImage: user.profileImage,
            documents: user.documents || [],
            address: user.address,
            city: user.city,
            state: user.state,
            pincode: user.pincode,
            businessName: user.businessName,
            businessType: user.businessType,
            gstNumber: user.gstNumber,
            website: user.website,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          }));
        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to fetch users', 'error');
        console.error('Failed to fetch users:', error);
      }
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setViewModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleSave = async (data: Record<string, any>) => {
    if (selectedUser && selectedUser._id) {
      // Prevent editing admin users
      if (selectedUser.role === 'admin') {
        showToast('Cannot edit admin users', 'error');
        setEditModalOpen(false);
        setSelectedUser(null);
        return;
      }
      try {
        setUpdating(selectedUser._id);
        
        // Convert string boolean values to actual booleans
        const updateData: Record<string, any> = { ...data };
        if (updateData.isApproved !== undefined) {
          updateData.isApproved = updateData.isApproved === 'true' || updateData.isApproved === true;
        }
        if (updateData.isVerified !== undefined) {
          updateData.isVerified = updateData.isVerified === 'true' || updateData.isVerified === true;
        }
        if (updateData.isActive !== undefined) {
          updateData.isActive = updateData.isActive === 'true' || updateData.isActive === true;
        }
        
        // Prevent changing role to admin
        if (updateData.role === 'admin') {
          showToast('Cannot change role to admin', 'error');
          return;
        }
        
        // Remove status field as it's not a database field
        delete updateData.status;
        
        // Validate mobile number if provided - must be exactly 10 digits
        if (updateData.mobileNumber && !/^\d{10}$/.test(updateData.mobileNumber.toString().trim())) {
          showToast('Please enter a valid 10-digit mobile number', 'error');
          setUpdating(null);
          return;
        }
        
        await api.put(`/users/${selectedUser._id}`, updateData);
        showToast('User updated successfully!', 'success');
        await fetchUsers();
        setEditModalOpen(false);
        setSelectedUser(null);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = '/login';
        } else {
          showToast('Failed to update user', 'error');
          console.error('Update error:', error);
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!user._id) return;
    try {
      setUpdating(user._id);
      const newStatus = user.status === 'active' ? 'inactive' : 'active';
      await api.put(`/users/${user._id}`, { isVerified: newStatus === 'active' });
      showToast(`User ${user.name} status changed to ${newStatus}`, 'success');
      await fetchUsers();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to update user status', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleApprove = async (user: User) => {
    if (!user._id) return;
    try {
      setUpdating(user._id);
      await api.put(`/users/${user._id}/approve`);
      showToast(`User ${user.name} approved successfully`, 'success');
      await fetchUsers();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to approve user', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleReject = async (user: User) => {
    if (!user._id) return;
    try {
      setUpdating(user._id);
      await api.delete(`/users/${user._id}/reject`);
      showToast(`User ${user.name} rejected and removed`, 'success');
      await fetchUsers();
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to reject user', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setConfirmModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedUser && selectedUser._id) {
      // Prevent deleting admin users
      if (selectedUser.role === 'admin') {
        showToast('Cannot delete admin users', 'error');
        setSelectedUser(null);
        setConfirmModalOpen(false);
        return;
      }
      try {
        setUpdating(selectedUser._id);
        await api.delete(`/users/${selectedUser._id}`);
        showToast(`User ${selectedUser.name} deleted successfully`, 'success');
        await fetchUsers();
        setSelectedUser(null);
        setConfirmModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = '/login';
        } else {
          showToast('Failed to delete user', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  const columns = [
    {
      header: 'Name',
      accessor: 'name' as keyof User,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof User,
    },
    {
      header: 'Role',
      accessor: 'role' as keyof User,
      render: (value: string) => (
        <span className="capitalize px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status' as keyof User,
      render: (value: string) => {
        const statusColors = {
          active: 'bg-green-100 text-green-700',
          inactive: 'bg-red-100 text-red-700',
          pending: 'bg-yellow-100 text-yellow-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
            {value}
          </span>
        );
      },
    },
    {
      header: 'Registered',
      accessor: 'registeredDate' as keyof User,
    },
    {
      header: 'Last Login',
      accessor: 'lastLogin' as keyof User,
    },
  ];

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Registered</h1>
        <p className="text-gray-600">View and manage all registered</p>
      </div>
      <DataTable
        title=""
        columns={columns}
        data={users}
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending' },
            ],
          },
          {
            key: 'role',
            label: 'Role',
            options: [
              { value: 'donor', label: 'Donor' },
              { value: 'beneficiary', label: 'Beneficiary' },
              { value: 'volunteer', label: 'Volunteer' },
              { value: 'vendor', label: 'Vendor' },
              { value: 'fundraiser', label: 'Fundraiser' },
              { value: 'partner', label: 'Partner' },
              { value: 'staff', label: 'Staff' },
            ],
          },
        ]}
        actions={(row) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleView(row)}
              title="View"
              disabled={updating === row._id}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {!row.isApproved ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600"
                  onClick={() => handleApprove(row)}
                  title="Approve"
                  disabled={updating === row._id}
                >
                  {updating === row._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleReject(row)}
                  title="Reject"
                  disabled={updating === row._id}
                >
                  {updating === row._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <UserX className="h-4 w-4" />
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(row)}
                  title="Edit"
                  disabled={updating === row._id}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                {updating === row._id ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                ) : row.status === 'active' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-orange-600"
                    onClick={() => handleToggleStatus(row)}
                    title="Deactivate"
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600"
                    onClick={() => handleToggleStatus(row)}
                    title="Activate"
                  >
                    <UserCheck className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => handleDeleteClick(row)}
                  title="Delete"
                  disabled={updating === row._id}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        )}
      />

      {/* View Modal */}
      {selectedUser && (
        <>
          <ViewModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedUser(null);
            }}
            title="User Details"
            data={{
              'Name': selectedUser.name,
              'Email': selectedUser.email,
              'Mobile Number': selectedUser.mobileNumber || 'N/A',
              'Role': selectedUser.role,
              'Status': selectedUser.status || 'pending',
              'Approved': selectedUser.isApproved ? 'Yes' : 'No',
              'Verified': selectedUser.isVerified ? 'Yes' : 'No',
              'Active': selectedUser.isActive !== undefined ? (selectedUser.isActive ? 'Yes' : 'No') : 'N/A',
              'Profile Image': selectedUser.profileImage || 'N/A',
              'Documents': selectedUser.documents || [],
              'Address': selectedUser.address || 'N/A',
              'City': selectedUser.city || 'N/A',
              'State': selectedUser.state || 'N/A',
              'Pincode': selectedUser.pincode || 'N/A',
              ...(selectedUser.role === 'partner' && {
                'Business Name': selectedUser.businessName || 'N/A',
                'Business Type': selectedUser.businessType || 'N/A',
                'GST Number': selectedUser.gstNumber || 'N/A',
                'Website': selectedUser.website || 'N/A',
              }),
              'Registered Date': selectedUser.registeredDate || (selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString() : 'N/A'),
              'Last Updated': selectedUser.updatedAt ? new Date(selectedUser.updatedAt).toLocaleString() : 'N/A',
              'Last Login': selectedUser.lastLogin || 'N/A',
            }}
          />
          <EditModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedUser(null);
            }}
            title="Edit User"
            fields={[
              { key: 'name', label: 'Name', type: 'text' as const },
              { key: 'email', label: 'Email', type: 'email' as const },
              { key: 'mobileNumber', label: 'Mobile Number', type: 'text' as const },
              {
                key: 'role',
                label: 'Role',
                type: 'select' as const,
                options: [
                  { value: 'donor', label: 'Donor' },
                  { value: 'beneficiary', label: 'Beneficiary' },
                  { value: 'volunteer', label: 'Volunteer' },
                  { value: 'vendor', label: 'Vendor' },
                  { value: 'fundraiser', label: 'Fundraiser' },
                  { value: 'partner', label: 'Partner' },
                  { value: 'staff', label: 'Staff' },
                ],
              },
              { key: 'address', label: 'Address', type: 'textarea' as const },
              { key: 'city', label: 'City', type: 'text' as const },
              { key: 'state', label: 'State', type: 'text' as const },
              { key: 'pincode', label: 'Pincode', type: 'text' as const },
              ...(selectedUser?.role === 'partner' ? [
                { key: 'businessName', label: 'Business Name', type: 'text' as const },
                {
                  key: 'businessType',
                  label: 'Business Type',
                  type: 'select' as const,
                  options: [
                    { value: 'health', label: 'Health' },
                    { value: 'food', label: 'Food' },
                    { value: 'education', label: 'Education' },
                    { value: 'retail', label: 'Retail' },
                    { value: 'other', label: 'Other' },
                  ],
                },
                { key: 'gstNumber', label: 'GST Number', type: 'text' as const },
                { key: 'website', label: 'Website', type: 'text' as const },
              ] : []),
              {
                key: 'isApproved',
                label: 'Approved',
                type: 'select' as const,
                options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ],
              },
              {
                key: 'isVerified',
                label: 'Verified',
                type: 'select' as const,
                options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ],
              },
              {
                key: 'isActive',
                label: 'Active',
                type: 'select' as const,
                options: [
                  { value: 'true', label: 'Yes' },
                  { value: 'false', label: 'No' },
                ],
              },
            ]}
            initialData={{
              ...selectedUser,
              isApproved: selectedUser.isApproved ? 'true' : 'false',
              isVerified: selectedUser.isVerified ? 'true' : 'false',
              isActive: selectedUser.isActive !== undefined ? (selectedUser.isActive ? 'true' : 'false') : 'true',
            }}
            onSave={handleSave}
          />
          <ConfirmModal
            isOpen={confirmModalOpen}
            onClose={() => {
              setConfirmModalOpen(false);
              setSelectedUser(null);
            }}
            title="Delete User"
            message={`Are you sure you want to delete ${selectedUser.name}? This action cannot be undone.`}
            onConfirm={handleDeleteConfirm}
            confirmText="Delete"
            variant="danger"
          />
        </>
      )}
    </div>
  );
}

