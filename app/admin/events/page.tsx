'use client';

import { useState, useEffect } from 'react';
import DataTable from '@/components/admin/DataTable';
import Button from '@/components/ui/Button';
import { Eye, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';
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
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [fullEvents, setFullEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedFullEvent, setSelectedFullEvent] = useState<any | null>(null);
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
      header: 'Expected Attendees',
      accessor: 'expectedAttendees' as keyof Event,
      render: (value: number) => value || 0,
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
    </div>
  );
}

