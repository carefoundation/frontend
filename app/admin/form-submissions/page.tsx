'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import ViewModal from '@/components/admin/ViewModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { CheckCircle2, XCircle, Eye, Loader2, Trash2 } from 'lucide-react';
import { showToast } from '@/lib/toast';
import { api, ApiError } from '@/lib/api';

interface FormSubmission {
  _id?: string;
  id?: string;
  formType: string;
  submittedBy: string;
  name?: string;
  email: string;
  status: 'new' | 'pending' | 'approved' | 'rejected';
  submittedDate?: string;
  createdAt?: string;
  message?: string;
  phone?: string;
  subject?: string;
}

export default function FormSubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<FormSubmission | null>(null);

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const response = await api.get<FormSubmission[]>('/form-submissions');
      if (Array.isArray(response)) {
        const formatted = response.map((sub: any) => ({
          id: sub._id || sub.id,
          _id: sub._id,
          formType: sub.formType || 'Contact',
          submittedBy: sub.name || sub.submittedBy || 'Anonymous',
          name: sub.name,
          email: sub.email || 'N/A',
          status: sub.status === 'new' ? 'pending' : sub.status,
          submittedDate: sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A',
          message: sub.message,
          phone: sub.phone,
          subject: sub.subject,
        }));
        setSubmissions(formatted);
      } else {
        setSubmissions([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to fetch form submissions', 'error');
        console.error('Failed to fetch form submissions:', error);
      }
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      setUpdating(id);
      const submission = submissions.find(s => (s._id || s.id) === id);
      if (submission) {
        await api.put(`/form-submissions/${id}`, { ...submission, status: 'approved' });
        showToast('Form submission approved successfully!', 'success');
        await fetchSubmissions();
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to approve submission', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleRejectClick = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setConfirmModalOpen(true);
  };

  const handleRejectConfirm = async () => {
    if (selectedSubmission && selectedSubmission._id) {
      try {
        setUpdating(selectedSubmission._id);
        await api.put(`/form-submissions/${selectedSubmission._id}`, { ...selectedSubmission, status: 'rejected' });
        showToast('Form submission rejected.', 'info');
        await fetchSubmissions();
        setSelectedSubmission(null);
        setConfirmModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = '/login';
        } else {
          showToast('Failed to reject submission', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  const handleView = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setViewModalOpen(true);
  };

  const handleDeleteClick = (submission: FormSubmission) => {
    setSelectedSubmission(submission);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (selectedSubmission && (selectedSubmission._id || selectedSubmission.id)) {
      try {
        const id = selectedSubmission._id || selectedSubmission.id;
        setUpdating(String(id));
        await api.delete(`/form-submissions/${id}`);
        showToast('Form submission deleted successfully!', 'success');
        await fetchSubmissions();
        setSelectedSubmission(null);
        setDeleteModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = '/login';
        } else {
          showToast('Failed to delete form submission', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  const columns = [
    {
      header: 'Form Type',
      accessor: 'formType' as keyof FormSubmission,
      render: (value: string) => (
        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
          {value}
        </span>
      ),
    },
    {
      header: 'Submitted By',
      accessor: 'submittedBy' as keyof FormSubmission,
    },
    {
      header: 'Email',
      accessor: 'email' as keyof FormSubmission,
    },
    {
      header: 'Status',
      accessor: 'status' as keyof FormSubmission,
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
      accessor: 'submittedDate' as keyof FormSubmission,
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">All Form Submissions</h1>
        <p className="text-gray-600">View beneficiary, vendor, donor, volunteer forms</p>
      </div>
      <DataTable
        title=""
        columns={columns}
        data={submissions}
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
            key: 'formType',
            label: 'Form Type',
            options: [
              { value: 'Beneficiary', label: 'Beneficiary' },
              { value: 'Vendor', label: 'Vendor' },
              { value: 'Donor', label: 'Donor' },
              { value: 'Volunteer', label: 'Volunteer' },
            ],
          },
        ]}
        actions={(row) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleView(row);
              }}
              title="View Details"
              disabled={updating === (row._id || row.id)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {updating === (row._id || row.id) ? (
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            ) : (row.status === 'pending' || row.status === 'new') && (
              <>
                <Button
                  size="sm"
                  className="bg-[#10b981] hover:bg-[#059669]"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleApprove(row._id || row.id || '');
                  }}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Approve
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRejectClick(row);
                  }}
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
      {selectedSubmission && (
        <>
          <ViewModal
            isOpen={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedSubmission(null);
            }}
            title="Form Submission Details"
            data={{
              'Form Type': selectedSubmission.formType,
              'Submitted By': selectedSubmission.submittedBy,
              'Email': selectedSubmission.email,
              'Phone': selectedSubmission.phone || 'N/A',
              'Subject': selectedSubmission.subject || 'N/A',
              'Message': selectedSubmission.message || 'N/A',
              'Status': selectedSubmission.status,
              'Submitted Date': selectedSubmission.submittedDate,
            }}
          />
          <ConfirmModal
            isOpen={confirmModalOpen}
            onClose={() => {
              setConfirmModalOpen(false);
              setSelectedSubmission(null);
            }}
            title="Reject Submission"
            message={`Are you sure you want to reject this ${selectedSubmission.formType} submission? This action cannot be undone.`}
            onConfirm={handleRejectConfirm}
            confirmText="Reject"
            variant="danger"
          />
          <ConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedSubmission(null);
            }}
            title="Delete Form Submission"
            message={`Are you sure you want to delete this ${selectedSubmission.formType} submission? This action cannot be undone and all data will be permanently removed.`}
            onConfirm={handleDeleteConfirm}
            confirmText="Delete"
            variant="danger"
          />
        </>
      )}
    </div>
  );
}

