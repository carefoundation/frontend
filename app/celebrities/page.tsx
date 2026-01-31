'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Star, Instagram, Youtube, Loader2, ExternalLink, Share2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';

interface Celebrity {
  _id: string;
  name: string;
  profession?: string;
  bio?: string;
  image?: string;
  socialLinks?: {
    instagram?: string;
    youtube?: string;
  };
  status: string;
}

// Convert YouTube URL to embed URL
const getYouTubeEmbedUrl = (url: string): string | null => {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/,
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=0`;
    }
  }
  
  if (url.includes('youtube.com/embed/')) {
    const videoId = url.split('/embed/')[1]?.split('?')[0];
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`;
    }
  }
  
  return null;
};

export default function CelebritiesPage() {
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCelebrities();
  }, []);

  const fetchCelebrities = async () => {
    try {
      setLoading(true);
      const response = await api.get<any>('/celebrities');
      
      // Handle both array and object with data property
      let celebritiesData: any[] = [];
      if (Array.isArray(response)) {
        celebritiesData = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        celebritiesData = response.data;
      }
      
      // Filter only active celebrities
      const activeCelebrities = celebritiesData.filter((celebrity: any) => 
        celebrity.status === 'active' || !celebrity.status
      );
      
      setCelebrities(activeCelebrities);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Not logged in, but celebrities should be public
        console.error('Failed to fetch celebrities:', error);
      } else {
        console.error('Failed to fetch celebrities:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-16 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Our Celebrities
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Meet the inspiring personalities who support our cause and help us make a difference
          </p>
        </div>

        {celebrities.length === 0 ? (
          <Card className="p-12 text-center">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Celebrities Yet</h3>
            <p className="text-gray-600">Check back soon to see our celebrity supporters!</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {celebrities.map((celebrity) => {
              const youtubeEmbedUrl = celebrity.socialLinks?.youtube 
                ? getYouTubeEmbedUrl(celebrity.socialLinks.youtube) 
                : null;

              return (
                <Card key={celebrity._id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300">
                  {/* Image or YouTube Video */}
                  <div className="relative w-full h-64 bg-gray-200">
                    {youtubeEmbedUrl ? (
                      <div className="relative w-full h-full">
                        <iframe
                          src={youtubeEmbedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={`${celebrity.name} video`}
                        />
                      </div>
                    ) : celebrity.image ? (
                      <Image
                        src={celebrity.image}
                        alt={celebrity.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#10b981] to-[#059669]">
                        <Star className="h-20 w-20 text-white opacity-50" />
                      </div>
                    )}
                    {/* Share Button */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        const url = typeof window !== 'undefined' ? `${window.location.origin}/celebrities#${celebrity._id}` : '';
                        const text = `Check out ${celebrity.name}${celebrity.profession ? ` - ${celebrity.profession}` : ''}`;
                        if (navigator.share) {
                          navigator.share({
                            title: celebrity.name,
                            text: text,
                            url: url,
                          }).catch(() => {});
                        } else {
                          navigator.clipboard.writeText(url).then(() => {
                            alert('Link copied to clipboard!');
                          });
                        }
                      }}
                      className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-colors"
                      title="Share"
                    >
                      <Share2 className="h-4 w-4 text-gray-700" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <div className="mb-3">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {celebrity.name}
                      </h3>
                      {celebrity.profession && (
                        <p className="text-[#10b981] font-semibold">
                          {celebrity.profession}
                        </p>
                      )}
                    </div>

                    {celebrity.bio && (
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {celebrity.bio}
                      </p>
                    )}

                    {/* Share Button */}
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          const url = typeof window !== 'undefined' ? `${window.location.origin}/celebrities#${celebrity._id}` : '';
                          const text = `Check out ${celebrity.name}${celebrity.profession ? ` - ${celebrity.profession}` : ''}`;
                          if (navigator.share) {
                            navigator.share({
                              title: celebrity.name,
                              text: text,
                              url: url,
                            }).catch(() => {});
                          } else {
                            navigator.clipboard.writeText(url).then(() => {
                              alert('Link copied to clipboard!');
                            });
                          }
                        }}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#10b981] transition-colors"
                        title="Share"
                      >
                        <Share2 className="h-5 w-5" />
                        <span className="text-sm font-medium">Share</span>
                      </button>
                    </div>

                    {/* Social Links */}
                    <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                      {celebrity.socialLinks?.instagram && (
                        <a
                          href={celebrity.socialLinks.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-pink-600 hover:text-pink-700 transition-colors"
                        >
                          <Instagram className="h-5 w-5" />
                          <span className="text-sm">Instagram</span>
                        </a>
                      )}
                      {celebrity.socialLinks?.youtube && (
                        <a
                          href={celebrity.socialLinks.youtube}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-red-600 hover:text-red-700 transition-colors ml-auto"
                        >
                          <Youtube className="h-5 w-5" />
                          <span className="text-sm">YouTube</span>
                        </a>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}

