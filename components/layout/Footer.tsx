'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function Footer() {
  const [currentYear, setCurrentYear] = useState<number | null>(null);
  const [email, setEmail] = useState('');
  
  useEffect(() => {
    setCurrentYear(new Date().getFullYear());
  }, []);
  
  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle newsletter subscription
    console.log('Subscribing:', email);
    setEmail('');
  };
  
  return (
    <footer className="bg-white text-black">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div>
            <Link href="/" className="flex items-start gap-3 mb-4 cursor-pointer hover:opacity-80 transition-opacity">
              <div className="relative w-16 h-16 flex-shrink-0">
                <Image src="/Logo.png" alt="Care Foundation Trust Logo" fill className="object-contain" />
              </div>
              <div>
                <div className="text-gray-900 font-bold text-lg">Care Foundation Trust®</div>
                <div className="text-gray-600 text-sm">Est Since 1997</div>
              </div>
            </Link>
            <p className="text-gray-600 mb-6 text-sm leading-relaxed">
              Care Foundation Trust® is a non-profit organisation committed to compassion and empathy. Our goal is to address critical social issues and uplift lives.
            </p>
            <div className="flex gap-3">
              <a href="https://www.facebook.com/carefoundationtrustorg/" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer">
                <Facebook className="h-5 w-5 text-gray-700" />
              </a>
              <a href="https://www.instagram.com/carefoundationtrust/?hl=en" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer">
                <Instagram className="h-5 w-5 text-gray-700" />
              </a>
              <a href="https://x.com/carefoundationm" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer">
                <Twitter className="h-5 w-5 text-gray-700" />
              </a>
              <a href="https://www.youtube.com/@CareFoundationTrust" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors border border-gray-300 cursor-pointer">
                <Youtube className="h-5 w-5 text-gray-700" />
              </a>
            </div>
          </div>
          
          {/* Resources Section */}
          <div>
            <h3 className="font-bold mb-4 text-lg text-gray-900">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/ask-question" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Ask A Question
                </Link>
              </li>
              <li>
                <Link href="/project-story" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Project Story
                </Link>
              </li>
              <li>
                <Link href="/mission" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Mission
                </Link>
              </li>
              <li>
                <Link href="/certificates" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Certificates
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Terms And Conditions
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Company Section */}
          <div>
            <h3 className="font-bold mb-4 text-lg text-gray-900">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/volunteer" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Volunteer
                </Link>
              </li>
              <li>
                <Link href="/happy-clients" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Happy Clients
                </Link>
              </li>
              <li>
                <Link href="/projects" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Projects
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* Get in Touch Section */}
          <div className="w-full">
            <h3 className="font-bold mb-4 text-lg text-gray-900">Get in Touch</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-700 mt-0.5 flex-shrink-0" />
                <a 
                  href="https://maps.google.com/?q=1106+Alexander+Tower+Sai+World+Empire+Navi+Mumbai+410210" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer"
                >
                  1106, Alexander Tower, Sai World Empire, opposite Swapnapoorti Mhada colony, valley Shilp Road, Navi Mumbai :- 410210. Sector 36, kharghar.
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-700 flex-shrink-0" />
                <a href="https://wa.me/919136521052" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-gray-900 transition-colors text-sm cursor-pointer">
                  +91 9136521052
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-700 flex-shrink-0" />
                <a href="mailto:carefoundationtrustorg@gmail.com" className="text-gray-600 hover:text-gray-900 transition-colors text-sm break-all cursor-pointer">
                  carefoundationtrustorg@gmail.com
                </a>
              </li>
            </ul>
            
            {/* Newsletter Subscription */}
            <div className="w-full">
              <h4 className="font-semibold mb-3 text-sm text-gray-900">Subscribe to Newsletter</h4>
              <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-2 w-full">
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 min-w-0 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#10b981] text-sm"
                  suppressHydrationWarning
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] rounded-lg transition-colors text-white font-medium text-sm whitespace-nowrap flex-shrink-0"
                  suppressHydrationWarning
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-300 mt-8 pt-8 text-center text-gray-600 text-sm">
          <p>&copy; {currentYear ?? new Date().getFullYear()} Care Foundation Trust®. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

