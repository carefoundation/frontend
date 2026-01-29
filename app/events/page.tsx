'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Users, ArrowRight, Loader2, X, CheckCircle, Share2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

export default function EventsPage() {
  const router = useRouter();
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [pastEvents, setPastEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check login status
    const checkLogin = () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('userToken');
        setIsLoggedIn(!!token && token.trim() !== '');
      }
    };
    
    checkLogin();
    fetchEvents();
    
    // Check login status when page gains focus (user returns from login)
    const handleFocus = () => {
      checkLogin();
    };
    
    // Listen for storage changes (when user logs in from another tab/window)
    window.addEventListener('storage', checkLogin);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('storage', checkLogin);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // Check for pending event registration after events are loaded
  useEffect(() => {
    if (!loading && isLoggedIn && upcomingEvents.length > 0) {
      const pendingEventId = localStorage.getItem('pendingEventRegistration');
      if (pendingEventId) {
        // Find the event in upcoming or past events
        const allEvents = [...upcomingEvents, ...pastEvents];
        const event = allEvents.find(e => e.id === pendingEventId);
        if (event) {
          setSelectedEvent(event);
          setRegistrationModalOpen(true);
          localStorage.removeItem('pendingEventRegistration');
        } else {
          // Event not found, clear the pending registration
          localStorage.removeItem('pendingEventRegistration');
        }
      }
    }
  }, [loading, isLoggedIn, upcomingEvents, pastEvents]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/events');
      if (Array.isArray(data)) {
        const now = new Date();
        const upcoming: any[] = [];
        const past: any[] = [];

        data.forEach((event: any) => {
          // Use startDate (which is what backend provides) or startDateTime as fallback
          const startDate = event.startDate ? new Date(event.startDate) : (event.startDateTime ? new Date(event.startDateTime) : null);
          const endDate = event.endDate ? new Date(event.endDate) : (event.endDateTime ? new Date(event.endDateTime) : null);
          
          // Format date for display
          const dateStr = event.startDate 
            ? (typeof event.startDate === 'string' ? event.startDate : new Date(event.startDate).toISOString().split('T')[0])
            : (event.startDateTime ? new Date(event.startDateTime).toISOString().split('T')[0] : '');
          
          const formatted = {
            id: event._id || event.id,
            title: event.title || 'Untitled Event',
            image: event.image || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=800',
            date: dateStr,
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

          // Check if event is upcoming: 
          // 1. If status is 'upcoming' or 'ongoing', it's upcoming
          // 2. If endDate hasn't passed yet, it's upcoming
          // 3. Otherwise, it's past
          const isUpcoming = event.status === 'upcoming' || event.status === 'ongoing' || 
                            (endDate && endDate >= now) || 
                            (startDate && startDate >= now);

          if (isUpcoming) {
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

  const formatTime = (time: string) => {
    if (!time) return '';
    // Convert 24-hour format (HH:MM) to 12-hour format (HH:MM AM/PM)
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handleShare = (event: any, platform: string) => {
    const eventUrl = typeof window !== 'undefined' ? `${window.location.origin}/events/${event.id}` : '';
    const eventDate = new Date(event.date).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const shareText = `Join us at ${event.title} organized by Care Foundation Trust®!\n\n📅 Date: ${eventDate}${event.time ? `\n⏰ Time: ${event.time}` : ''}\n📍 Location: ${event.location}\n\n${event.description}\n\nRegister now: ${eventUrl}`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(eventUrl);
      showToast('Event link copied to clipboard!', 'success');
    } else if (platform === 'facebook') {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(facebookUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'twitter') {
      const twitterText = `Join us at ${event.title} by Care Foundation Trust®! ${eventDate}${event.time ? ` at ${event.time}` : ''} - ${event.location}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(eventUrl)}`;
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'instagram') {
      // Instagram doesn't support direct sharing via URL, so copy text
      navigator.clipboard.writeText(shareText);
      showToast('Event details copied! Paste on Instagram', 'info');
    } else if (platform === 'whatsapp') {
      const whatsappText = `Join us at ${event.title} by Care Foundation Trust®!\n\n📅 ${eventDate}${event.time ? `\n⏰ ${event.time}` : ''}\n📍 ${event.location}\n\n${eventUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');
    } else if (platform === 'native') {
      if (navigator.share) {
        navigator.share({
          title: `${event.title} - Care Foundation Trust®`,
          text: shareText,
          url: eventUrl,
        }).catch(() => {});
      } else {
        navigator.clipboard.writeText(eventUrl);
        showToast('Event link copied to clipboard!', 'success');
      }
    }
  };

  const handleRegisterClick = (event: any, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setSelectedEvent(event);
    setRegistrationModalOpen(true);
    setRegistrationSuccess(false);
    setTicketId(null);
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

    // Validate mobile number - must be exactly 10 digits
    const mobileRegex = /^\d{10}$/;
    if (!mobileRegex.test(registrationForm.mobileNumber)) {
      showToast('Please enter a valid 10-digit mobile number', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post<{ _id: string; id?: string }>('/event-registrations/register', {
        eventId: selectedEvent.id,
        fullName: registrationForm.fullName,
        email: registrationForm.email,
        mobileNumber: registrationForm.mobileNumber,
        city: registrationForm.city,
      });

      // Generate unique ticket ID from registration response
      const registrationId = (response as any)?._id || (response as any)?.id;
      const eventIdShort = selectedEvent.id?.slice(-6).toUpperCase() || 'EVENT';
      const ticketNumber = registrationId 
        ? `CFT-${eventIdShort}-${registrationId.slice(-8).toUpperCase()}`
        : `CFT-${eventIdShort}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      setTicketId(ticketNumber);
      setRegistrationSuccess(true);
      showToast("Successfully Registered! 🎉", 'success');
      
      // Refresh events to update attendee count
      await fetchEvents();
      
      // Modal will stay open until user explicitly closes it
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

  const handleDownloadTicket = async () => {
    if (!ticketId || !selectedEvent || !ticketRef.current) {
      showToast('Ticket information not available', 'error');
      return;
    }

    try {
      setDownloadingTicket(true);
      showToast('Generating ticket PDF...', 'info');

      // Make ticket visible temporarily for rendering
      const originalDisplay = ticketRef.current.style.display;
      ticketRef.current.style.display = 'block';
      ticketRef.current.style.position = 'absolute';
      ticketRef.current.style.left = '-9999px';
      ticketRef.current.style.visibility = 'visible';
      
      // Wait for rendering
      await new Promise(resolve => setTimeout(resolve, 300));

      // Convert HTML to canvas
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: ticketRef.current.offsetWidth,
        height: ticketRef.current.offsetHeight,
      });
      
      // Restore original display
      ticketRef.current.style.display = originalDisplay || 'none';
      ticketRef.current.style.position = '';
      ticketRef.current.style.left = '';
      ticketRef.current.style.visibility = '';

      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate dimensions to fit the ticket
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = imgWidth / imgHeight;
      
      let finalWidth = pdfWidth - 20; // 10mm margin on each side
      let finalHeight = finalWidth / ratio;
      
      // If height is too large, scale down
      if (finalHeight > pdfHeight - 20) {
        finalHeight = pdfHeight - 20;
        finalWidth = finalHeight * ratio;
      }

      // Center the image
      const xOffset = (pdfWidth - finalWidth) / 2;
      const yOffset = (pdfHeight - finalHeight) / 2;

      const imgData = canvas.toDataURL('image/png');
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalWidth, finalHeight);
      
      // Save PDF
      const fileName = `Event_Ticket_${ticketId.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
      pdf.save(fileName);
      
      showToast('Ticket downloaded successfully!', 'success');
    } catch (error) {
      console.error('Download error:', error);
      showToast('Failed to download ticket', 'error');
    } finally {
      setDownloadingTicket(false);
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
              <Card key={event.id} hover className="overflow-hidden cursor-pointer" onClick={() => router.push(`/events/${event.id}`)}>
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
                  <h3 className="text-xl font-bold text-gray-900 mb-3 hover:text-[#10b981] transition-colors">{event.title}</h3>
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
                      <div className="flex flex-col gap-0.5">
                        {event.time && (
                          <span className="font-medium">
                            Start: <span className="text-[#10b981] font-semibold">{formatTime(event.time)}</span>
                          </span>
                        )}
                        {event.endTime && (
                          <span className="font-medium">
                            End: <span className="text-[#10b981] font-semibold">{formatTime(event.endTime)}</span>
                          </span>
                        )}
                        {!event.time && !event.endTime && <span>N/A</span>}
                      </div>
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
                      {event.expectedAttendees > 0 ? event.expectedAttendees : event.attendees} expected count
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    {event.address && (
                      <p className="text-xs text-gray-500 mb-3">{event.address}</p>
                    )}
                    <Button 
                      variant="outline" 
                      className="w-full mb-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRegisterClick(event);
                      }}
                    >
                      Register for Event
                      <ArrowRight className="ml-2 h-4 w-4 inline" />
                    </Button>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <p className="text-xs text-gray-600 mb-2 font-medium">Share this event</p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(event, 'native');
                        }}
                        className="w-full py-2 px-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-1 font-medium"
                        title="Share"
                      >
                        <Share2 className="h-3.5 w-3.5" />
                        <span className="text-xs">Share</span>
                      </button>
                    </div>
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
              if (!isSubmitting && !downloadingTicket) {
                setRegistrationModalOpen(false);
                setSelectedEvent(null);
                setRegistrationSuccess(false);
                setTicketId(null);
              }
            }}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={(e) => {
            // Close modal when clicking on the overlay (outside the modal content)
            if (e.target === e.currentTarget && !isSubmitting && !downloadingTicket) {
              setRegistrationModalOpen(false);
              setSelectedEvent(null);
              setRegistrationSuccess(false);
              setTicketId(null);
            }
          }}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
              {registrationSuccess ? (
                <div className="p-8 text-center">
                  <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">Successfully Registered! 🎉</h2>
                  <p className="text-gray-600 mb-6">Thank you for registering for {selectedEvent.title}!</p>
                  
                  {/* Ticket Template for Download */}
                  <div ref={ticketRef} className="hidden">
                    <div style={{ 
                      backgroundColor: '#ffffff', 
                      padding: '32px', 
                      maxWidth: '448px', 
                      margin: '0 auto', 
                      border: '2px solid #10b981', 
                      borderRadius: '8px',
                      fontFamily: 'system-ui, -apple-system, sans-serif'
                    }}>
                      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981', marginBottom: '8px' }}>
                          Care Foundation Trust®
                        </h3>
                        <p style={{ fontSize: '14px', color: '#4b5563' }}>Event Registration Ticket</p>
                      </div>
                      
                      {ticketId && (
                        <div style={{ 
                          marginBottom: '24px', 
                          padding: '16px', 
                          background: 'linear-gradient(to right, #10b981, #059669)', 
                          borderRadius: '8px', 
                          color: '#ffffff', 
                          textAlign: 'center' 
                        }}>
                          <p style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', opacity: 0.9 }}>
                            Ticket Number
                          </p>
                          <p style={{ fontSize: '30px', fontWeight: 'bold', letterSpacing: '0.05em' }}>
                            {ticketId}
                          </p>
                        </div>
                      )}
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px', textAlign: 'left' }}>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Event Name</p>
                          <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{selectedEvent.title}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date</p>
                          <p style={{ fontSize: '16px', color: '#111827' }}>
                            {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                              weekday: 'long', 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </p>
                        </div>
                        {selectedEvent.time && (
                          <div>
                            <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time</p>
                            <p style={{ fontSize: '16px', color: '#111827' }}>
                              Start: <span style={{ color: '#10b981', fontWeight: '600' }}>{formatTime(selectedEvent.time)}</span>
                            </p>
                          </div>
                        )}
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Location</p>
                          <p style={{ fontSize: '16px', color: '#111827' }}>{selectedEvent.location}</p>
                        </div>
                        <div>
                          <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Registered By</p>
                          <p style={{ fontSize: '16px', color: '#111827' }}>{registrationForm.fullName}</p>
                          <p style={{ fontSize: '14px', color: '#4b5563' }}>{registrationForm.email}</p>
                        </div>
                      </div>
                      
                      <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '16px', textAlign: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#6b7280' }}>Please bring this ticket to the event</p>
                        <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>
                          Generated on {new Date().toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Unique Ticket Display */}
                  {ticketId && (
                    <div className="mb-6 p-5 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-lg text-white">
                      <p className="text-sm font-medium mb-2 opacity-90">Your Unique Ticket Number</p>
                      <p className="text-2xl font-bold tracking-wider">{ticketId}</p>
                      <p className="text-xs mt-2 opacity-80">Please save this ticket number for your records</p>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg text-left">
                    <h3 className="font-semibold text-gray-900 mb-2">Event Details:</h3>
                    <p className="text-sm text-gray-600 mb-1">
                      <Calendar className="h-4 w-4 inline mr-2" />
                      {new Date(selectedEvent.date).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    {selectedEvent.time && (
                      <p className="text-sm text-gray-600 mb-1">
                        <Clock className="h-4 w-4 inline mr-2" />
                        Start: <span className="text-[#10b981] font-semibold">{formatTime(selectedEvent.time)}</span>
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      <MapPin className="h-4 w-4 inline mr-2" />
                      {selectedEvent.location}
                    </p>
                  </div>
                  
                  {/* Download Button */}
                  {ticketId && (
                    <div className="mt-6">
                      <Button
                        onClick={handleDownloadTicket}
                        disabled={downloadingTicket}
                        className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
                      >
                        {downloadingTicket ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin inline" />
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2 inline" />
                            Download Ticket
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">Register for Event</h2>
                    <button
                      onClick={() => {
                        if (!isSubmitting && !downloadingTicket) {
                          setRegistrationModalOpen(false);
                          setSelectedEvent(null);
                          setRegistrationSuccess(false);
                          setTicketId(null);
                        }
                      }}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                      disabled={isSubmitting || downloadingTicket}
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
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, ''); // Remove non-digits
                            if (value.length <= 10) {
                              setRegistrationForm({ ...registrationForm, mobileNumber: value });
                            }
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                          placeholder="9876543210"
                          maxLength={10}
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
                            setRegistrationSuccess(false);
                            setTicketId(null);
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

