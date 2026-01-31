'use client';

import Image from 'next/image';
import { User, Award, Heart, Quote, Mail, Linkedin, Users, Handshake, TrendingUp, CheckCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';

export default function FounderPage() {
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <User className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Founder</h1>
            <p className="text-xl text-gray-600">
              Meet the visionary behind Care Foundation Trust®
            </p>
          </div>

          {/* Founder Profile */}
          <Card className="p-8 mb-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="relative h-96 rounded-lg overflow-hidden">
                <Image
                  src="/founder.jpg"
                  alt="Aziz Gheewala"
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Aziz Gheewala</h2>
                <p className="text-lg text-[#10b981] font-semibold mb-4">Founder & CEO, Care Foundation Trust®️</p>
                <p className="text-gray-600 leading-relaxed mb-6">
                  Welcome to Care Foundation Trust®. Since 1997, we have been committed to making a meaningful difference in the lives of those in need through transparent donations, volunteer support, and meaningful partnerships.
                </p>
                <div className="flex gap-4">
                  <a href="mailto:carefoundationtrustorg@gmail.com" className="p-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors">
                    <Mail className="h-5 w-5" />
                  </a>
                  <a href="#" className="p-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors">
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </div>
            </div>
          </Card>

          {/* About the Founder */}
          <Card className="p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">About the Founder</h3>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Since 1997, Care Foundation Trust® has been committed to making a meaningful difference in the lives of those in need. Our mission is to address critical social issues and uplift lives through compassion, empathy, and dedicated service. With over two decades of service, we have touched thousands of lives through our various programs including food relief, medical assistance, education support, and community development initiatives. Every donation, every volunteer, and every partner contributes to our shared vision of a better, more compassionate world.
              </p>
            </div>
          </Card>

          {/* Impact Statistics */}
          <Card className="p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Impact</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Over 10,000+ beneficiaries helped</h4>
                  <p className="text-sm text-gray-600">Lives transformed through our programs</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <div className="relative w-10 h-10">
                    <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">500+ active volunteers</h4>
                  <p className="text-sm text-gray-600">Dedicated individuals making a difference</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <Handshake className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">100+ partner organizations</h4>
                  <p className="text-sm text-gray-600">Collaborating for greater impact</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Transparent fund utilization</h4>
                  <p className="text-sm text-gray-600">Accountability and trust in every donation</p>
                </div>
              </div>
            </div>
          </Card>

        </div>
      </div>
      
      <Footer />
    </div>
  );
}

