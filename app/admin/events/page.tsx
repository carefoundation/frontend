'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import { Eye, Edit, Trash2, Calendar, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';
import ConfirmModal from '@/components/ui/ConfirmModal';
import ViewModal from '@/components/admin/ViewModal';
import EditModal from '@/components/admin/EditModal';

interface Event {
  _id?: string;
  id?: string;
  title: string;
  startDate?: string;
  startDateTime?: string;
  endDate?: string;
  endDateTime?: string;
  location: string;
  category?: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  createdAt?: string;
  expectedAttendees?: number;
  time?: string;
  attendees?: number;
  registeredUsersCount?: number;
}

interface RegisteredUser {
  _id?: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  city: string;
  status: string;
  createdAt?: string;
  userId?: any;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [fullEvents, setFullEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [registeredUsersModalOpen, setRegisteredUsersModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedFullEvent, setSelectedFullEvent] = useState<any | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [loadingRegisteredUsers, setLoadingRegisteredUsers] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await api.get<Event[]>('/events');
      if (Array.isArray(response)) {
        // Store full event data
        setFullEvents(response);
        
        const formatted = response.map((event: any) => ({
          id: event._id || event.id,
          _id: event._id,
          title: event.title || 'Untitled',
          startDate: event.startDateTime ? new Date(event.startDateTime).toLocaleDateString() : (event.startDate ? new Date(event.startDate).toLocaleDateString() : 'N/A'),
          endDate: event.endDateTime ? new Date(event.endDateTime).toLocaleDateString() : (event.endDate ? new Date(event.endDate).toLocaleDateString() : 'N/A'),
          location: event.location || 'N/A',
          category: event.category || 'General',
          status: event.status || 'upcoming',
          expectedAttendees: event.expectedAttendees || 0,
          attendees: event.attendees || 0,
          time: event.time || '',
        }));
        setEvents(formatted);
      } else {
        setEvents([]);
        setFullEvents([]);
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        console.error('Failed to fetch events:', error);
      }
      setEvents([]);
      setFullEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleViewClick = (event: Event) => {
    const fullEvent = fullEvents.find(e => (e._id || e.id) === (event._id || event.id));
    if (fullEvent) {
      setSelectedFullEvent(fullEvent);
      setViewModalOpen(true);
    }
  };

  const handleEditClick = (event: Event) => {
    const fullEvent = fullEvents.find(e => (e._id || e.id) === (event._id || event.id));
    if (fullEvent) {
      setSelectedFullEvent(fullEvent);
      setEditModalOpen(true);
    }
  };

  const handleDeleteClick = (event: Event) => {
    setSelectedEvent(event);
    setDeleteModalOpen(true);
  };

  const handleRegisteredUsersClick = async (event: Event) => {
    try {
      setLoadingRegisteredUsers(true);
      setSelectedEvent(event);
      const eventId = event._id || event.id;
      if (!eventId) {
        showToast('Event ID not found', 'error');
        return;
      }
      const response = await api.get<RegisteredUser[]>(`/event-registrations/event/${eventId}`);
      // API client automatically unwraps { success: true, data: [...] } to just the array
      if (Array.isArray(response)) {
        setRegisteredUsers(response);
      } else {
        setRegisteredUsers([]);
      }
      setRegisteredUsersModalOpen(true);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message, 'error');
      } else {
        showToast('Failed to fetch registered', 'error');
      }
      setRegisteredUsers([]);
    } finally {
      setLoadingRegisteredUsers(false);
    }
  };

  const handleUpdateEvent = async (data: Record<string, any>) => {
    if (!selectedFullEvent || !(selectedFullEvent._id || selectedFullEvent.id)) {
      return;
    }

    try {
      const id = selectedFullEvent._id || selectedFullEvent.id;
      setUpdating(String(id));
      
      // Format dates properly
      const updateData: any = { ...data };
      if (updateData.startDate) {
        updateData.startDate = new Date(updateData.startDate).toISOString();
      }
      if (updateData.endDate) {
        updateData.endDate = new Date(updateData.endDate).toISOString();
      }
      if (updateData.expectedAttendees) {
        updateData.expectedAttendees = parseInt(updateData.expectedAttendees);
      }

      await api.put(`/events/${id}`, updateData);
      showToast('Event updated successfully!', 'success');
      await fetchEvents();
      setEditModalOpen(false);
      setSelectedFullEvent(null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        window.location.href = '/login';
      } else {
        showToast('Failed to update event', 'error');
      }
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedEvent && (selectedEvent._id || selectedEvent.id)) {
      try {
        const id = selectedEvent._id || selectedEvent.id;
        setUpdating(String(id));
        await api.delete(`/events/${id}`);
        showToast('Event deleted successfully!', 'success');
        await fetchEvents();
        setSelectedEvent(null);
        setDeleteModalOpen(false);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          window.location.href = '/login';
        } else {
          showToast('Failed to delete event', 'error');
        }
      } finally {
        setUpdating(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  const columns = [
    {
      header: 'Title',
      accessor: 'title' as keyof Event,
    },
    {
      header: 'Start Date',
      accessor: 'startDate' as keyof Event,
    },
    {
      header: 'Time',
      accessor: 'time' as keyof Event,
      render: (value: string) => value || 'N/A',
    },
    {
      header: 'Expected count',
      accessor: 'expectedAttendees' as keyof Event,
      render: (value: number) => value || 0,
    },
    {
      header: 'Registered',
      accessor: 'attendees' as keyof Event,
      render: (value: number) => (
        <span className="font-medium text-[#10b981]">{value || 0}</span>
      ),
    },
    {
      header: 'Location',
      accessor: 'location' as keyof Event,
    },
    {
      header: 'Category',
      accessor: 'category' as keyof Event,
    },
    {
      header: 'Status',
      accessor: 'status' as keyof Event,
      render: (value: string) => {
        const statusColors = {
          upcoming: 'bg-blue-100 text-blue-700',
          ongoing: 'bg-green-100 text-green-700',
          completed: 'bg-gray-100 text-gray-700',
        };
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[value as keyof typeof statusColors]}`}>
            {value}
          </span>
        );
      },
    },
  ];

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Our Events</h1>
          <p className="text-gray-600">Manage all events</p>
        </div>
        <Link href="/admin/create-event">
          <Button>
            <Calendar className="h-4 w-4 mr-2" />
            Create Event
          </Button>
        </Link>
      </div>
      <DataTable
        title=""
        columns={columns}
        data={events}
        actions={(row) => (
          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
            <Button 
              variant="ghost" 
              size="sm" 
              title="View"
              onClick={() => handleViewClick(row)}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Registered"
              onClick={() => handleRegisteredUsersClick(row)}
              disabled={loadingRegisteredUsers}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Users className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              title="Edit"
              onClick={() => handleEditClick(row)}
              disabled={updating === (row._id || row.id)}
            >
              <Edit className="h-4 w-4" />
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

      {/* View Modal */}
      {selectedFullEvent && (
        <ViewModal
          isOpen={viewModalOpen}
          onClose={() => {
            setViewModalOpen(false);
            setSelectedFullEvent(null);
          }}
          title={`Event Details: ${selectedFullEvent.title || 'Untitled'}`}
          data={selectedFullEvent}
        />
      )}

      {/* Edit Modal */}
      {selectedFullEvent && (
        <EditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedFullEvent(null);
          }}
          title={`Edit Event: ${selectedFullEvent.title || 'Untitled'}`}
          fields={[
            { key: 'title', label: 'Title', type: 'text' },
            { key: 'description', label: 'Description', type: 'textarea' },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'endDate', label: 'End Date', type: 'date' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'address', label: 'Address', type: 'textarea' },
            { key: 'city', label: 'City', type: 'text' },
            { key: 'state', label: 'State', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: [
              { value: 'Volunteer', label: 'Volunteer' },
              { value: 'Fundraising', label: 'Fundraising' },
              { value: 'Community', label: 'Community' },
              { value: 'Health', label: 'Health' },
              { value: 'Education', label: 'Education' },
              { value: 'Other', label: 'Other' },
            ]},
            { key: 'expectedAttendees', label: 'Expected Attendees', type: 'number' },
            { key: 'time', label: 'Time', type: 'time' },
            { key: 'status', label: 'Status', type: 'select', options: [
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'ongoing', label: 'Ongoing' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]},
          ]}
          initialData={{
            title: selectedFullEvent.title || '',
            description: selectedFullEvent.description || '',
            startDate: selectedFullEvent.startDate ? new Date(selectedFullEvent.startDate).toISOString().split('T')[0] : '',
            endDate: selectedFullEvent.endDate ? new Date(selectedFullEvent.endDate).toISOString().split('T')[0] : '',
            location: selectedFullEvent.location || '',
            address: selectedFullEvent.address || '',
            city: selectedFullEvent.city || '',
            state: selectedFullEvent.state || '',
            category: selectedFullEvent.category || '',
            expectedAttendees: selectedFullEvent.expectedAttendees || 0,
            time: selectedFullEvent.time || '',
            status: selectedFullEvent.status || 'upcoming',
          }}
          onSave={handleUpdateEvent}
        />
      )}

      {/* Delete Modal */}
      {selectedEvent && (
        <ConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedEvent(null);
          }}
          title="Delete Event"
          message={`Are you sure you want to delete "${selectedEvent.title}"? This action cannot be undone and all data will be permanently removed.`}
          onConfirm={handleDeleteConfirm}
          confirmText="Delete"
          variant="danger"
        />
      )}

      {/* Registered Users Modal */}
      {selectedEvent && (
        <div className={`fixed inset-0 z-50 ${registeredUsersModalOpen ? 'block' : 'hidden'}`}>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              setRegisteredUsersModalOpen(false);
              setSelectedEvent(null);
              setRegisteredUsers([]);
            }}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Registered- {selectedEvent.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Total: {registeredUsers.length} registered user{registeredUsers.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setRegisteredUsersModalOpen(false);
                    setSelectedEvent(null);
                    setRegisteredUsers([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                {loadingRegisteredUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
                  </div>
                ) : registeredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">No registered users yet</p>
                    <p className="text-gray-500 text-sm mt-2">Users will appear here once they register for this event</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Full Name</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Mobile Number</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">City</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Registered Date</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {registeredUsers.map((user, index) => (
                          <tr key={user._id || index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{user.fullName}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.mobileNumber}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{user.city}</td>
                            <td className="px-4 py-3 text-sm">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                user.status === 'registered' ? 'bg-green-100 text-green-700' :
                                user.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {user.status || 'registered'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {user.createdAt ? new Date(user.createdAt).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 sticky bottom-0 bg-white">
                <Button variant="outline" onClick={() => {
                  setRegisteredUsersModalOpen(false);
                  setSelectedEvent(null);
                  setRegisteredUsers([]);
                }}>
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

