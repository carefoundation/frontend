'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Loader2, CheckCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });

export default function EventRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    city: '',
    age: '',
    gender: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('userToken');
      setIsLoggedIn(!!token && token.trim() !== '');
      
      // If not logged in, redirect to login
      if (!token || token.trim() === '') {
        localStorage.setItem('pendingEventRegistration', eventId);
        localStorage.setItem('redirectAfterLogin', `/events/${eventId}/register`);
        showToast('Please login to register for events', 'info');
        router.push('/login');
        return;
      }
    }
    
    if (eventId) {
      fetchEvent();
    }
  }, [eventId, router]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(`/events/${eventId}`);
      setEvent(data);
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.status === 404) {
          showToast('Event not found', 'error');
          router.push('/events');
        } else {
          showToast(error.message || 'Failed to fetch event', 'error');
        }
      } else {
        showToast('Failed to fetch event', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!event) return;

    // Validate form
    if (!registrationForm.fullName || !registrationForm.email || !registrationForm.mobileNumber || !registrationForm.city || !registrationForm.age || !registrationForm.gender) {
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

    // Validate age
    const age = parseInt(registrationForm.age);
    if (isNaN(age) || age < 1 || age > 150) {
      showToast('Please enter a valid age', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.post<{ _id: string; id?: string }>('/event-registrations/register', {
        eventId: event._id || event.id,
        fullName: registrationForm.fullName,
        email: registrationForm.email,
        mobileNumber: registrationForm.mobileNumber,
        city: registrationForm.city,
        age: age,
        gender: registrationForm.gender,
      });

      // Generate unique ticket ID from registration response
      const registrationId = (response as any)?._id || (response as any)?.id;
      const eventIdShort = (event._id || event.id)?.slice(-6).toUpperCase() || 'EVENT';
      const ticketNumber = registrationId 
        ? `CFT-${eventIdShort}-${registrationId.slice(-8).toUpperCase()}`
        : `CFT-${eventIdShort}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      
      setTicketId(ticketNumber);
      setRegistrationSuccess(true);
      showToast("Successfully Registered! 🎉", 'success');
      
      // Refresh event to update attendee count
      await fetchEvent();
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

  const formatDate = (date: string | Date) => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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

  const handleDownloadTicket = async () => {
    if (!ticketId || !event || !ticketRef.current) {
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

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16 flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Not Found</h2>
          <Button onClick={() => router.push('/events')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Events
          </Button>
        </Card>
      </div>
    );
  }

  if (registrationSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl mx-auto">
            {/* Ticket Template for Download (Hidden) */}
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
                    <p style={{ fontSize: '18px', fontWeight: '600', color: '#111827' }}>{event.title}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Date</p>
                    <p style={{ fontSize: '16px', color: '#111827' }}>{formatDate(event.startDate)}</p>
                  </div>
                  {(event.time || event.endTime) && (
                    <div>
                      <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Time</p>
                      <div style={{ fontSize: '16px', color: '#111827' }}>
                        {event.time && (
                          <p>
                            Start: <span style={{ color: '#10b981', fontWeight: '600' }}>{formatTime(event.time)}</span>
                          </p>
                        )}
                        {event.endTime && (
                          <p>
                            End: <span style={{ color: '#10b981', fontWeight: '600' }}>{formatTime(event.endTime)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Location</p>
                    <p style={{ fontSize: '16px', color: '#111827' }}>{event.location}</p>
                    {event.address && (
                      <p style={{ fontSize: '14px', color: '#4b5563', marginTop: '4px' }}>{event.address}</p>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Registered By</p>
                    <p style={{ fontSize: '16px', color: '#111827' }}>{registrationForm.fullName}</p>
                    <p style={{ fontSize: '14px', color: '#4b5563' }}>{registrationForm.email}</p>
                    {registrationForm.mobileNumber && (
                      <p style={{ fontSize: '14px', color: '#4b5563' }}>{registrationForm.mobileNumber}</p>
                    )}
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

            <Card className="p-8 text-center">
              <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">Successfully Registered! 🎉</h1>
              <p className="text-xl text-gray-600 mb-6">Thank you for registering for {event.title}!</p>
              
              {/* Unique Ticket Display */}
              {ticketId && (
                <div className="mb-8 p-6 bg-gradient-to-r from-[#10b981] to-[#059669] rounded-lg text-white">
                  <p className="text-base font-medium mb-2 opacity-90">Your Unique Ticket Number</p>
                  <p className="text-3xl font-bold tracking-wider mb-2">{ticketId}</p>
                  <p className="text-sm mt-2 opacity-80">Please save this ticket number for your records</p>
                </div>
              )}
              
              <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
                <h2 className="font-semibold text-gray-900 mb-4 text-lg">Event Details:</h2>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Date</p>
                      <p className="text-gray-600">{formatDate(event.startDate)}</p>
                    </div>
                  </div>
                  {(event.time || event.endTime) && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Time</p>
                        <div className="flex flex-col gap-1">
                          {event.time && (
                            <p className="text-gray-600 font-medium">
                              Start: <span className="text-[#10b981] font-semibold">{formatTime(event.time)}</span>
                            </p>
                          )}
                          {event.endTime && (
                            <p className="text-gray-600 font-medium">
                              End: <span className="text-[#10b981] font-semibold">{formatTime(event.endTime)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Location</p>
                      <p className="text-gray-600">{event.location}</p>
                      {event.address && (
                        <p className="text-sm text-gray-500 mt-1">{event.address}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Download Button */}
              {ticketId && (
                <div className="mb-6">
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

              <div className="flex gap-4 justify-center">
                <Button
                  variant="outline"
                  onClick={() => router.push(`/events/${eventId}`)}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Event
                </Button>
                <Button
                  onClick={() => router.push('/events')}
                  className="bg-[#10b981] hover:bg-[#059669]"
                >
                  View All Events
                </Button>
              </div>
            </Card>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Back Button */}
          <Button
            variant="outline"
            onClick={() => router.push(`/events/${eventId}`)}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Event Info Card */}
            <Card className="p-6">
              {event.image && (
                <div className="relative h-48 w-full rounded-lg overflow-hidden mb-4">
                  <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{event.title}</h2>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-[#10b981] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Date</p>
                    <p className="text-gray-600">{formatDate(event.startDate)}</p>
                  </div>
                </div>
                  {(event.time || event.endTime) && (
                    <div className="flex items-start gap-3">
                      <Clock className="h-4 w-4 text-[#10b981] mt-1 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-1">Time</p>
                        <div className="flex flex-col gap-1">
                          {event.time && (
                            <p className="text-gray-600 font-medium">
                              Start: <span className="text-[#10b981] font-semibold">{formatTime(event.time)}</span>
                            </p>
                          )}
                          {event.endTime && (
                            <p className="text-gray-600 font-medium">
                              End: <span className="text-[#10b981] font-semibold">{formatTime(event.endTime)}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-[#10b981] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-600">{event.location}</p>
                    {event.address && (
                      <p className="text-xs text-gray-500 mt-1">{event.address}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-4 w-4 text-[#10b981] mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900">Attendees</p>
                    <p className="text-gray-600">
                      {event.attendees || 0} registered
                      {event.expectedAttendees > 0 && ` / ${event.expectedAttendees} expected`}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Registration Form */}
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Register for Event</h2>
              
              <form onSubmit={handleRegistrationSubmit} className="space-y-4">
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
                    Age <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="150"
                    value={registrationForm.age}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, age: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    placeholder="Enter your age"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={registrationForm.gender}
                    onChange={(e) => setRegistrationForm({ ...registrationForm, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
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

                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push(`/events/${eventId}`)}
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
                      <>
                        Register
                        <CheckCircle className="ml-2 h-4 w-4 inline" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

