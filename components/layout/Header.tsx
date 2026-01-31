'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Heart, Menu, X, User, LogIn, LogOut, ChevronDown, Info, Target, Users, Award, FileText, TrendingUp, PlusCircle, FolderOpen, UtensilsCrossed, Stethoscope, Handshake, UserPlus, Calendar, LayoutDashboard, Star, BookOpen, Building2, Pill, Microscope, Mail, Phone, MapPin } from 'lucide-react';
import AnimatedHamburger from '../ui/AnimatedHamburger';
import Button from '../ui/Button';
import { checkAdminSession, clearAdminSession } from '@/lib/auth';
import { showToast } from '@/lib/toast';

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [moreDropdownLeft, setMoreDropdownLeft] = useState(0);
  const aboutDropdownRef = useRef<HTMLDivElement>(null);
  const campaignsDropdownRef = useRef<HTMLDivElement>(null);
  const joinUsDropdownRef = useRef<HTMLDivElement>(null);
  const moreDropdownRef = useRef<HTMLDivElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setIsMounted(true);
    checkAuthStatus();
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [pathname]);

  const checkAuthStatus = () => {
    if (typeof window !== 'undefined') {
      const adminLoggedIn = checkAdminSession();
      const userToken = localStorage.getItem('userToken');
      // Check if token exists and is not empty
      const userLoggedIn = !!userToken && userToken.trim() !== '';
      
      setIsAdmin(adminLoggedIn);
      setIsLoggedIn(adminLoggedIn || userLoggedIn);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      if (isAdmin) {
        clearAdminSession();
      }
      // Clear all user-related localStorage items
      localStorage.removeItem('userToken');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      localStorage.removeItem('redirectAfterLogin');
      
      setIsLoggedIn(false);
      setIsAdmin(false);
      
      // Redirect to home page
      router.push('/');
    }
  };

  useEffect(() => {
    const updateMoreDropdownPosition = () => {
      if (moreButtonRef.current) {
        const rect = moreButtonRef.current.getBoundingClientRect();
        setMoreDropdownLeft(rect.left);
      }
    };

    if (openDropdown === 'more') {
      updateMoreDropdownPosition();
      window.addEventListener('resize', updateMoreDropdownPosition);
      window.addEventListener('scroll', updateMoreDropdownPosition);
    }

    return () => {
      window.removeEventListener('resize', updateMoreDropdownPosition);
      window.removeEventListener('scroll', updateMoreDropdownPosition);
    };
  }, [openDropdown]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        aboutDropdownRef.current &&
        !aboutDropdownRef.current.contains(target) &&
        campaignsDropdownRef.current &&
        !campaignsDropdownRef.current.contains(target) &&
        joinUsDropdownRef.current &&
        !joinUsDropdownRef.current.contains(target) &&
        moreDropdownRef.current &&
        !moreDropdownRef.current.contains(target)
      ) {
        setOpenDropdown(null);
      }
    };

    if (openDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
    setOpenDropdown(null);
  };

  const handleMobileLinkClick = (href: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setOpenDropdown(null);
    router.push(href);
    setTimeout(() => {
      setIsMenuOpen(false);
    }, 100);
  };

  const toggleDropdown = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

  const aboutDropdownItems = [
    { href: '/create-fundraiser', label: 'Start a Fundraiser', icon: PlusCircle },
    { href: '/fundraised', label: 'Fundraised', icon: TrendingUp },
    { href: '/fundraiser', label: 'Fundraiser', icon: FolderOpen },
  ];

  const campaignsDropdownItems = [
    { href: '/partners/food', label: 'Food Partners', icon: UtensilsCrossed },
    { href: '/partners/health', label: 'Doctors for u', icon: Stethoscope },
    { href: '/partners/hospital', label: 'Hospital', icon: Building2 },
    { href: '/partners/medicine', label: 'Medicine/Pharmacy', icon: Pill },
    { href: '/partners/pathology', label: 'Pathology Lab', icon: Microscope },
  ];

  const joinUsDropdownItems = [
    { href: '/become-partner', label: 'Become A Partner', icon: Handshake },
    { href: '/volunteer', label: 'Become A Volunteer', icon: UserPlus },
    { href: '/volunteer-directory', label: 'Volunteer Directory', icon: Users },
  ];

  const moreDropdownItems = [
    { href: '/events', label: 'Events', icon: Calendar },
    { href: '/celebrities', label: 'Social Celebrities', icon: Star },
    { href: '/blogs', label: 'Blogs', icon: BookOpen },
    { href: '/founder', label: 'Founder', icon: User },
  ];

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/contact', label: 'Contact' },
  ];

  // Check if we're on admin pages or dashboard
  const isAdminPage = pathname?.startsWith('/admin') || pathname?.startsWith('/dashboard');
  // Only hide top bar if we're on admin pages (not based on isAdmin login status to avoid hydration issues)
  const shouldHideTopBar = isAdminPage;

  return (
    <>
      {/* Top Bar - Hidden for admin pages */}
      {!shouldHideTopBar && (
      <div className="fixed top-0 left-0 right-0 z-[60] bg-[#10b981] text-white text-xs sm:text-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-auto min-h-[2.5rem] sm:min-h-[2.75rem] py-1.5 sm:py-2">
            {/* Left Side - Address, Email, Contact */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
              <a 
                href="https://maps.google.com/?q=1106+Alexander+Tower+Sai+World+Empire+Navi+Mumbai+410210" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
              >
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden xl:inline">1106, Alexander Tower, Sai World Empire, Navi Mumbai - 410210</span>
                <span className="hidden md:inline xl:hidden">Navi Mumbai - 410210</span>
                <span className="md:hidden">Address</span>
              </a>
              <a 
                href="mailto:carefoundationtrustorg@gmail.com" 
                className="hidden md:flex items-center gap-1.5 hover:text-gray-200 transition-colors"
              >
                <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden lg:inline">carefoundationtrustorg@gmail.com</span>
                <span className="hidden md:inline lg:hidden">Email</span>
              </a>
              <a 
                href="https://wa.me/919136521052" 
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-gray-200 transition-colors"
              >
                <Phone className="h-3 w-3 sm:h-3.5 sm:w-3.5 flex-shrink-0" />
                <span className="hidden sm:inline">+91 9136521052</span>
                <span className="sm:hidden">Call</span>
              </a>
            </div>

            {/* Right Side - Social Links */}
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <a 
                href="https://www.facebook.com/carefoundationtrustorg/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors p-1"
                aria-label="Facebook"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a 
                href="https://x.com/carefoundationm" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors p-1"
                aria-label="Twitter"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a 
                href="https://www.instagram.com/carefoundationtrust/?hl=en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors p-1"
                aria-label="Instagram"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://www.linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors p-1"
                aria-label="LinkedIn"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
              <a 
                href="https://www.youtube.com/@CareFoundationTrust" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-gray-200 transition-colors p-1"
                aria-label="YouTube"
              >
                <svg className="h-3.5 w-3.5 sm:h-4 sm:w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
      )}

      <header
        className={`fixed ${shouldHideTopBar ? 'top-0' : 'top-8 sm:top-10'} left-0 right-0 z-50 transition-all duration-300 relative ${
          isScrolled
            ? 'bg-white shadow-md'
            : 'bg-white/95 backdrop-blur-sm'
        }`}
        suppressHydrationWarning
      >
      <nav className="w-full px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center group" onClick={closeMenu}>
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex-shrink-0">
              <Image
                src="/Logo.png"
                alt="Care Foundation Trust Logo"
                fill
                sizes="(max-width: 640px) 80px, 96px"
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            {/* Home Link */}
            <Link
              href="/"
              className="text-gray-700 hover:text-[#10b981] font-medium transition-colors relative group"
            >
              Home
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#10b981] group-hover:w-full transition-all duration-300"></span>
            </Link>

            {/* Crowd Funding Dropdown */}
            <div className="relative" ref={aboutDropdownRef}>
              <button
                onClick={() => toggleDropdown('about')}
                className="text-gray-700 hover:text-[#10b981] font-medium transition-colors relative group flex items-center gap-1"
                suppressHydrationWarning
              >
                Crowd Funding
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openDropdown === 'about' ? 'rotate-180' : ''
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#10b981] group-hover:w-full transition-all duration-300"></span>
              </button>
              {openDropdown === 'about' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                  {aboutDropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Partners Dropdown */}
            <div className="relative" ref={campaignsDropdownRef}>
              <button
                onClick={() => toggleDropdown('campaigns')}
                className="text-gray-700 hover:text-[#10b981] font-medium transition-colors relative group flex items-center gap-1"
                suppressHydrationWarning
              >
                Partners
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openDropdown === 'campaigns' ? 'rotate-180' : ''
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#10b981] group-hover:w-full transition-all duration-300"></span>
              </button>
              {openDropdown === 'campaigns' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                  {campaignsDropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Join Us Dropdown */}
            <div className="relative" ref={joinUsDropdownRef}>
              <button
                onClick={() => toggleDropdown('joinUs')}
                className="text-gray-700 hover:text-[#10b981] font-medium transition-colors relative group flex items-center gap-1"
                suppressHydrationWarning
              >
                Join Us
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openDropdown === 'joinUs' ? 'rotate-180' : ''
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#10b981] group-hover:w-full transition-all duration-300"></span>
              </button>
              {openDropdown === 'joinUs' && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100 translate-y-0">
                  {joinUsDropdownItems.map((item) => {
                    if (item.href === '/volunteer') {
                      return (
                        <button
                          key={item.href}
                          onClick={() => {
                            setOpenDropdown(null);
                            if (!isLoggedIn) {
                              if (typeof window !== 'undefined') {
                                localStorage.setItem('redirectAfterLogin', '/volunteer');
                              }
                              showToast('Please login to become a volunteer', 'info');
                              router.push('/login');
                            } else {
                              router.push('/volunteer');
                            }
                          }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] transition-colors text-left"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] transition-colors"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* More Dropdown */}
            <div className="relative" ref={moreDropdownRef}>
              <button
                ref={moreButtonRef}
                onClick={() => toggleDropdown('more')}
                className="text-gray-700 hover:text-[#10b981] font-medium transition-colors relative group flex items-center gap-1"
                suppressHydrationWarning
              >
                More
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${
                    openDropdown === 'more' ? 'rotate-180' : ''
                  }`}
                />
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#10b981] group-hover:w-full transition-all duration-300"></span>
              </button>
              {openDropdown === 'more' && (
                <div 
                  className="fixed w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 transform transition-all duration-200 ease-out opacity-100"
                  style={{ 
                    top: '80px',
                    left: `${moreDropdownLeft}px`,
                    transform: 'translateX(-50%)'
                  }}
                >
                  {moreDropdownItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpenDropdown(null)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] transition-colors"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Other Links */}
            {navLinks.filter(link => link.href !== '/').map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-[#10b981] font-medium transition-colors relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-[#10b981] group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link href={isAdmin ? '/admin' : '/dashboard'}>
                  <Button variant="ghost" size="sm">
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : pathname?.startsWith('/admin') ? null : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    <User className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <AnimatedHamburger
              isOpen={isMenuOpen}
              onClick={toggleMenu}
              variant="green"
            />
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden transition-all duration-300 ease-in-out ${
            isMenuOpen ? 'max-h-[80vh] opacity-100 overflow-y-auto' : 'max-h-0 opacity-0 overflow-hidden'
          }`}
        >
          <div className="py-4 space-y-2 border-t border-gray-200">
            <button
              onClick={() => handleMobileLinkClick('/')}
              className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors font-medium"
            >
              Home
            </button>

            {/* Mobile Crowd Funding */}
            <div>
              <div className="px-4 py-3 text-gray-700 font-medium">
                Crowd Funding
              </div>
              <div className="pl-4 mt-1 space-y-1">
                {aboutDropdownItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={(e) => handleMobileLinkClick(item.href, e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors text-sm text-left"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Partners */}
            <div>
              <div className="px-4 py-3 text-gray-700 font-medium">
                Partners
              </div>
              <div className="pl-4 mt-1 space-y-1">
                {campaignsDropdownItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={(e) => handleMobileLinkClick(item.href, e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors text-sm text-left"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Join Us */}
            <div>
              <div className="px-4 py-3 text-gray-700 font-medium">
                Join Us
              </div>
              <div className="pl-4 mt-1 space-y-1">
                {joinUsDropdownItems.map((item) => {
                  if (item.href === '/volunteer') {
                    return (
                      <button
                        key={item.href}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (!isLoggedIn) {
                            if (typeof window !== 'undefined') {
                              localStorage.setItem('redirectAfterLogin', '/volunteer');
                            }
                            showToast('Please login to become a volunteer', 'info');
                            router.push('/login');
                          } else {
                            router.push('/volunteer');
                          }
                          setTimeout(() => {
                            setIsMenuOpen(false);
                          }, 100);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors text-sm text-left"
                      >
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </button>
                    );
                  }
                  return (
                    <button
                      key={item.href}
                      onClick={(e) => handleMobileLinkClick(item.href, e)}
                      className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors text-sm text-left"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mobile More */}
            <div>
              <div className="px-4 py-3 text-gray-700 font-medium">
                More
              </div>
              <div className="pl-4 mt-1 space-y-1">
                {moreDropdownItems.map((item) => (
                  <button
                    key={item.href}
                    onClick={(e) => handleMobileLinkClick(item.href, e)}
                    className="w-full flex items-center gap-3 px-4 py-2 text-gray-600 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors text-sm text-left"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Other Mobile Links */}
            {navLinks.filter(link => link.href !== '/').map((link) => (
              <button
                key={link.href}
                onClick={() => handleMobileLinkClick(link.href)}
                className="block w-full text-left px-4 py-3 text-gray-700 hover:bg-[#ecfdf5] hover:text-[#10b981] rounded-lg transition-colors font-medium"
              >
                {link.label}
              </button>
            ))}
            <div className="pt-4 border-t border-gray-200 space-y-2 px-4">
              {isLoggedIn ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center" 
                    onClick={() => handleMobileLinkClick(isAdmin ? '/admin' : '/dashboard')}
                  >
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Button>
                  <Button variant="ghost" className="w-full justify-center" onClick={() => { handleLogout(); closeMenu(); }}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </>
              ) : pathname?.startsWith('/admin') ? null : (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-center"
                    onClick={() => handleMobileLinkClick('/login')}
                  >
                    <LogIn className="h-4 w-4 mr-2" />
                    Login
                  </Button>
                  <Button 
                    className="w-full justify-center"
                    onClick={() => handleMobileLinkClick('/register')}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Register
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
    </>
  );
}

