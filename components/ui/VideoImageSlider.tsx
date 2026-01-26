'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';

interface SlideItem {
  type: 'video' | 'image';
  src: string;
  alt?: string;
}

interface VideoImageSliderProps {
  items: SlideItem[];
  videoDuration?: number; // in seconds, if not provided, will use video's actual duration
  imageSlideDuration?: number; // in seconds, default 5
}

export default function VideoImageSlider({
  items,
  videoDuration,
  imageSlideDuration = 5,
}: VideoImageSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [playError, setPlayError] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const imageTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the first video index - memoized to prevent dependency array changes
  const firstVideoIndex = useMemo(() => {
    return items.findIndex((item) => item.type === 'video');
  }, [items]);
  
  const imageItems = useMemo(() => {
    return items.filter((item) => item.type === 'image');
  }, [items]);

  const startImageSlideshow = useCallback(() => {
    // Clear any existing interval
    if (imageTimeoutRef.current) {
      clearInterval(imageTimeoutRef.current);
    }

    // Auto-slide images
    const slideImages = () => {
      setCurrentIndex((prevIndex) => {
        // Find all image indices
        const imageIndices = items
          .map((item, index) => (item.type === 'image' ? index : -1))
          .filter((index) => index !== -1);

        if (imageIndices.length === 0) return prevIndex;

        const currentImageIndex = imageIndices.indexOf(prevIndex);
        const nextImageIndex =
          currentImageIndex === -1 || currentImageIndex === imageIndices.length - 1
            ? 0
            : currentImageIndex + 1;

        return imageIndices[nextImageIndex];
      });
    };

    // Set interval for image slideshow
    imageTimeoutRef.current = setInterval(slideImages, imageSlideDuration * 1000);
  }, [items, imageSlideDuration]);

  const handleVideoEnd = useCallback(() => {
    setVideoEnded(true);
    setIsVideoPlaying(false);
    
    // Move to first image after video ends
    if (imageItems.length > 0) {
      const firstImageIndex = items.findIndex((item) => item.type === 'image');
      if (firstImageIndex !== -1) {
        setCurrentIndex(firstImageIndex);
        // Start slideshow after a brief delay to ensure state is updated
        setTimeout(() => {
          startImageSlideshow();
        }, 100);
      }
    }
  }, [imageItems, items, startImageSlideshow]);

  // Initialize slider - only run once on mount or when items change
  useEffect(() => {
    // Start with video if available
    if (firstVideoIndex !== -1) {
      setCurrentIndex(firstVideoIndex);
      setIsVideoPlaying(true);
      
      // Try to play video after a short delay to ensure it's loaded
      const timeoutId = setTimeout(() => {
        if (videoRef.current) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setPlayError(false);
              })
              .catch((error) => {
                // Silently handle autoplay errors - they're expected in modern browsers
                if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                  console.error('Error playing video:', error);
                }
                setPlayError(true);
              });
          }
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } else {
      // If no video, start with first image
      setCurrentIndex(0);
      startImageSlideshow();
    }
  }, [firstVideoIndex, startImageSlideshow]);

  // Handle user interaction for video playback
  useEffect(() => {
    const handleUserInteraction = () => {
      setUserInteracted(true);
      if (videoRef.current && !videoRef.current.paused) {
        // Video is already playing
        return;
      }
      if (videoRef.current && isVideoPlaying && !videoEnded && !playError) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setPlayError(false);
            })
            .catch((error) => {
              // Silently handle autoplay errors - they're expected
              if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                console.error('Error playing video:', error);
              }
              setPlayError(true);
            });
        }
      }
    };

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isVideoPlaying, videoEnded, playError]);

  // Intersection Observer to play video when in viewport
  useEffect(() => {
    if (!videoRef.current || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && isVideoPlaying && !videoEnded && !playError) {
            const playPromise = videoRef.current?.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setPlayError(false);
                })
                .catch((error) => {
                  // Silently handle autoplay errors
                  if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                    console.error('Error playing video:', error);
                  }
                  setPlayError(true);
                });
            }
          } else if (!entry.isIntersecting && videoRef.current) {
            // Pause video when not in viewport to save resources
            videoRef.current.pause();
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isVideoPlaying, videoEnded, playError]);

  // Try to play video when it becomes ready
  useEffect(() => {
    if (videoRef.current && isVideoPlaying && !videoEnded && userInteracted) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayError(false);
          })
          .catch((error) => {
            // Silently handle autoplay errors
            if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
              console.error('Error playing video:', error);
            }
            setPlayError(true);
          });
      }
    }
  }, [isVideoPlaying, videoEnded, userInteracted]);

  useEffect(() => {
    // Start slideshow when video ends and we're on an image
    if (videoEnded && items[currentIndex]?.type === 'image') {
      startImageSlideshow();
    }

    return () => {
      if (imageTimeoutRef.current) {
        clearInterval(imageTimeoutRef.current);
      }
    };
  }, [videoEnded, currentIndex, items, startImageSlideshow]);

  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  const handlePlayClick = () => {
    if (videoRef.current) {
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setPlayError(false);
            setUserInteracted(true);
          })
          .catch((error) => {
            console.error('Error playing video:', error);
            setPlayError(true);
          });
      }
    }
  };

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden">
      {currentItem.type === 'video' ? (
        <div className="relative w-full h-full">
          <video
            ref={videoRef}
            src={currentItem.src}
            className="w-full h-full object-contain"
            onEnded={handleVideoEnd}
            onLoadedData={() => {
              // Try to play when video is loaded
              if (userInteracted && isVideoPlaying && !videoEnded) {
                const playPromise = videoRef.current?.play();
                if (playPromise !== undefined) {
                  playPromise.catch((error) => {
                    // Silently handle autoplay errors
                    if (error.name !== 'AbortError' && error.name !== 'NotAllowedError') {
                      console.error('Error playing video:', error);
                    }
                  });
                }
              }
            }}
            muted
            playsInline
            preload="metadata"
            loop={false}
          />
          {playError && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <button
                onClick={handlePlayClick}
                className="bg-[#10b981] hover:bg-[#059669] text-white rounded-full p-4 transition-all shadow-lg"
                aria-label="Play video"
              >
                <svg
                  className="w-12 h-12"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative w-full h-full">
          <Image
            src={currentItem.src}
            alt={currentItem.alt || 'Slider image'}
            fill
            className="object-cover transition-opacity duration-1000"
            priority={currentIndex === 0}
            unoptimized
          />
        </div>
      )}
      
      {/* Optional: Progress indicator for images */}
      {videoEnded && currentItem.type === 'image' && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {imageItems.map((_, index) => {
            const imageIndices = items
              .map((item, idx) => (item.type === 'image' ? idx : -1))
              .filter((idx) => idx !== -1);
            const imageIndex = imageIndices.indexOf(currentIndex);
            return (
              <div
                key={index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  index === imageIndex
                    ? 'w-8 bg-white'
                    : 'w-2 bg-white/50'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

