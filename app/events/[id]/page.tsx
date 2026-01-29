'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Loader2, CheckCircle, Share2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';
import { showToast } from '@/lib/toast';

const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params?.id as string;
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

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

  const handleRegisterClick = () => {
    router.push(`/events/${eventId}/register`);
  };

  const getLocationLink = (location: string) => {
    if (!location) return '#';
    if (location.startsWith('http://') || location.startsWith('https://')) {
      return location;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`;
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

  const handleShare = (platform: string) => {
    if (!event) return;
    
    const eventUrl = window.location.href;
    const eventDate = formatDate(event.startDate || event.startDateTime || '');
    let eventTime = '';
    if (event.time) {
      eventTime = formatTime(event.time);
    } else if (event.startDateTime) {
      const timeStr = new Date(event.startDateTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      eventTime = formatTime(timeStr);
    }
    const shareText = `Join us at ${event.title} organized by Care Foundation Trust®!\n\n📅 Date: ${eventDate}${eventTime ? `\n⏰ Time: ${eventTime}` : ''}\n📍 Location: ${event.location}\n\n${event.description || ''}\n\nRegister now: ${eventUrl}`;
    
    if (platform === 'copy') {
      navigator.clipboard.writeText(eventUrl);
      showToast('Event link copied to clipboard!', 'success');
    } else if (platform === 'facebook') {
      const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(shareText)}`;
      window.open(facebookUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'twitter') {
      const twitterText = `Join us at ${event.title} by Care Foundation Trust®! ${eventDate}${eventTime ? ` at ${eventTime}` : ''} - ${event.location}`;
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}&url=${encodeURIComponent(eventUrl)}`;
      window.open(twitterUrl, '_blank', 'width=600,height=400');
    } else if (platform === 'whatsapp') {
      const whatsappText = `Join us at ${event.title} by Care Foundation Trust®!\n\n📅 ${eventDate}${eventTime ? `\n⏰ ${eventTime}` : ''}\n📍 ${event.location}\n\n${eventUrl}`;
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');
    } else if (platform === 'native') {
      if (navigator.share) {
        navigator.share({
          title: `${event.title} - Care Foundation Trust®`,
          text: shareText,
          url: eventUrl,
        });
      } else {
        navigator.clipboard.writeText(eventUrl);
        showToast('Event link copied to clipboard!', 'success');
      }
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

  const startDate = event.startDate ? new Date(event.startDate) : null;
  const endDate = event.endDate ? new Date(event.endDate) : null;
  const dateStr = event.startDate 
    ? (typeof event.startDate === 'string' ? event.startDate : new Date(event.startDate).toISOString().split('T')[0])
    : '';

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => router.push('/events')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Button>

        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Event Image - Left Side */}
            {event.image && (
              <div className="relative h-full min-h-[500px] rounded-xl overflow-hidden">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute top-4 left-4">
                  <span className="px-4 py-2 bg-[#10b981] text-white text-sm font-semibold rounded-full">
                    {event.category || 'Event'}
                  </span>
                </div>
              </div>
            )}

            {/* Event Details - Right Side */}
            <Card className="p-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
            
            {event.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </div>
            )}

            {/* Event Information Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">Location</h3>
                    <a
                      href={getLocationLink(event.location)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#10b981] hover:text-[#059669] hover:underline break-all break-words block"
                      style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }}
                    >
                      {event.location}
                    </a>
                  </div>
                </div>

                {event.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">Address</h3>
                      <p className="text-gray-600 break-words">{event.address}</p>
                    </div>
                  </div>
                )}

                {(event.city || event.state) && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">City & State</h3>
                      <p className="text-gray-600 break-words">
                        {event.city && event.state ? `${event.city}, ${event.state}` : event.city || event.state}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">Attendees</h3>
                    <p className="text-gray-600 break-words">
                      {event.attendees || 0} registered
                      {event.expectedAttendees > 0 && ` / ${event.expectedAttendees} expected`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 mb-1">Start Date</h3>
                    <p className="text-gray-600 break-words">{formatDate(event.startDate)}</p>
                    {startDate && (
                      <p className="text-sm text-gray-500 break-words">
                        {startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    )}
                  </div>
                </div>

                {endDate && (
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">End Date</h3>
                      <p className="text-gray-600 break-words">{formatDate(event.endDate)}</p>
                      {endDate && (
                        <p className="text-sm text-gray-500 break-words">
                          {endDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {(event.time || event.endTime) && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-[#10b981] mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">Time</h3>
                      <div className="flex flex-col gap-1">
                        {event.time && (
                          <p className="text-gray-600 break-words font-medium">
                            Start: <span className="text-[#10b981]">{formatTime(event.time)}</span>
                          </p>
                        )}
                        {event.endTime && (
                          <p className="text-gray-600 break-words font-medium">
                            End: <span className="text-[#10b981]">{formatTime(event.endTime)}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="border-t border-gray-200 pt-6 mt-6">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-900">Status: </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    event.status === 'upcoming' ? 'bg-blue-100 text-blue-800' :
                    event.status === 'ongoing' ? 'bg-green-100 text-green-800' :
                    event.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {event.status?.charAt(0).toUpperCase() + event.status?.slice(1) || 'Upcoming'}
                  </span>
                </div>
                {event.createdBy && (
                  <div>
                    <span className="font-semibold text-gray-900">Created by: </span>
                    <span className="text-gray-600">
                      {typeof event.createdBy === 'object' ? event.createdBy.name || event.createdBy.email : 'Admin'}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Register Button */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <Button
                onClick={handleRegisterClick}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-lg py-3"
              >
                Register for Event
                <CheckCircle className="ml-2 h-5 w-5" />
              </Button>
            </div>

            {/* Share Section */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button
                onClick={() => handleShare('native')}
                className="w-full py-2.5 px-4 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors flex items-center justify-center gap-2 font-medium"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

