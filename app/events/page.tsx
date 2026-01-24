'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Users, ArrowRight, Loader2, X, CheckCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function EventsPage() {
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrationModalOpen, setRegistrationModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/events');
      if (Array.isArray(data)) {
        const now = new Date();
        const upcoming: any[] = [];
        const past: any[] = [];

        data.forEach((event: any) => {
          const eventDate = event.startDateTime ? new Date(event.startDateTime) : (event.startDate ? new Date(event.startDate) : null);
          const formatted = {
            id: event._id || event.id,
            title: event.title || 'Untitled Event',
            image: event.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
            date: event.startDate || (event.startDateTime ? new Date(event.startDateTime).toISOString().split('T')[0] : ''),
            time: event.time || (event.startDateTime 
              ? `${new Date(event.startDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${event.endDateTime ? new Date(event.endDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : ''}`
              : ''),
            location: event.location || 'India',
            address: event.address || event.location || 'N/A',
            latitude: event.latitude || null,
            longitude: event.longitude || null,
            attendees: event.attendees || 0,
            expectedAttendees: event.expectedAttendees || 0,
            category: event.category || 'General',
            description: event.description || 'Join us for this event',
          };

          if (eventDate && eventDate >= now) {
            upcoming.push(formatted);
          } else {
            past.push(formatted);
          }
        });

        setUpcomingEvents(upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
        setPastEvents(past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        setUpcomingEvents([]);
        setPastEvents([]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch events:', error.message);
      } else {
        console.error('Failed to fetch events');
      }
      setUpcomingEvents([]);
      setPastEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const isUrl = (str: string) => {
    try {
      return str.startsWith('http://') || str.startsWith('https://');
    } catch {
      return false;
    }
  };

  const getLocationLink = (location: string) => {
    if (isUrl(location)) {
      return location;
    }
    // If it's not a URL, create a Google Maps search link
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
  };

  const handleRegisterClick = (event: any) => {
    setSelectedEvent(event);
    setRegistrationModalOpen(true);
    setRegistrationSuccess(false);
    setRegistrationForm({
      fullName: '',
      email: '',
      mobileNumber: '',
      city: '',
    });
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent) return;

    // Validate form
    if (!registrationForm.fullName || !registrationForm.email || !registrationForm.mobileNumber || !registrationForm.city) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registrationForm.email)) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.post('/event-registrations/register', {
        eventId: selectedEvent.id,
        fullName: registrationForm.fullName,
        email: registrationForm.email,
        mobileNumber: registrationForm.mobileNumber,
        city: registrationForm.city,
      });

      setRegistrationSuccess(true);
      showToast("You're registered 🎉", 'success');
      
      // Refresh events to update attendee count
      await fetchEvents();
      
      // Close modal after 2 seconds
      setTimeout(() => {
        setRegistrationModalOpen(false);
        setRegistrationSuccess(false);
        setSelectedEvent(null);
      }, 2000);
    } catch (error) {
      if (error instanceof ApiError) {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
      } else {
        showToast('Registration failed. Please try again.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <Calendar className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Events</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join us at our upcoming events and be part of the change. Together we can make a difference.
          </p>
        </div>

        {/* Upcoming Events */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Upcoming Events</h2>
          {upcomingEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event) => (
              <Card key={event.id} hover className="overflow-hidden">
                <div className="relative h-48">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-[#10b981] text-white text-xs font-semibold rounded-full">
                      {event.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{event.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4 text-[#10b981]" />
                      {new Date(event.date).toLocaleDateString('en-US', { 
                        weekday: 'short', 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4 text-[#10b981]" />
                      {event.time}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4 text-[#10b981]" />
                      <a
                        href={getLocationLink(event.location)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#10b981] hover:text-[#059669] hover:underline cursor-pointer"
                      >
                        {event.location}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-[#10b981]" />
                      {event.expectedAttendees > 0 ? event.expectedAttendees : event.attendees} expected attendees
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">{event.address}</p>
                    {(event.latitude && event.longitude) || event.address ? (
                      <div className="mb-3 w-full h-48 border border-gray-200 rounded-lg overflow-hidden">
                        <iframe
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          style={{ border: 0 }}
                          src={
                            event.latitude && event.longitude
                              ? `https://www.google.com/maps?q=${event.latitude},${event.longitude}&output=embed`
                              : `https://www.google.com/maps?q=${encodeURIComponent(event.address || event.location)}&output=embed`
                          }
                          allowFullScreen
                        />
                      </div>
                    ) : null}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => handleRegisterClick(event)}
                    >
                      Register for Event
                      <ArrowRight className="ml-2 h-4 w-4 inline" />
                    </Button>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No upcoming events scheduled</p>
            </div>
          )}
        </div>

        {/* Past Events */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Past Events</h2>
          {pastEvents.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-6">
              {pastEvents.map((event) => (
              <Card key={event.id} className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                    {event.category}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(event.date).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <a
                      href={getLocationLink(event.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-600 hover:text-[#10b981] hover:underline cursor-pointer"
                    >
                      {event.location}
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {event.attendees} attendees
                  </div>
                </div>
              </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No past events available</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Registration Modal */}
      {registrationModalOpen && selectedEvent && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => {
              if (!isSubmitting) {
                setRegistrationModalOpen(false);
                setSelectedEvent(null);
                setRegistrationSuccess(false);
              }
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              {registrationSuccess ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">You're registered 🎉</h2>
                  <p className="text-gray-600">Thank you for registering for {selectedEvent.title}!</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Register for Event</h2>
                    <button
                      onClick={() => {
                        if (!isSubmitting) {
                          setRegistrationModalOpen(false);
                          setSelectedEvent(null);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isSubmitting}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  
                  <form onSubmit={handleRegistrationSubmit} className="p-6">
                    <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-1">{selectedEvent.title}</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                        {selectedEvent.time && ` • ${selectedEvent.time}`}
                      </p>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={registrationForm.fullName}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, fullName: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="Enter your full name"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email Address <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={registrationForm.email}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, email: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="your@email.com"
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mobile Number <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={registrationForm.mobileNumber}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, mobileNumber: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="+91 9876543210"
                          maxLength={15}
                          disabled={isSubmitting}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={registrationForm.city}
                          onChange={(e) => setRegistrationForm({ ...registrationForm, city: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="Enter your city"
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>

                    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          if (!isSubmitting) {
                            setRegistrationModalOpen(false);
                            setSelectedEvent(null);
                          }
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-[#10b981] hover:bg-[#059669]"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                            Submitting...
                          </>
                        ) : (
                          'Confirm / Submit'
                        )}
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </>
      )}
      
      <Footer />
    </div>
  );
}

