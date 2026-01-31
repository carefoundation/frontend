'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Users, ArrowRight, Award, Calendar } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function BecomeVolunteerPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="text-center mb-12">
            <Users className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Become a Volunteer</h1>
            <p className="text-xl text-gray-600">
              Join our community of dedicated volunteers and make a real difference in people's lives.
            </p>
          </div>

          {/* CTA Card */}
          <Card className="p-8 mb-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Make a Difference?</h2>
            <p className="text-green-100 mb-6">
              Fill out our volunteer registration form to get started
            </p>
            <Link href="/volunteer">
              <Button size="lg" variant="outline" className="bg-white text-[#10b981] border-white hover:bg-gray-100">
                Register as Volunteer
                <ArrowRight className="ml-2 h-5 w-5 inline" />
              </Button>
            </Link>
          </Card>

          {/* Why Volunteer */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Volunteer With Us?</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <div className="relative w-10 h-10">
                    <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Make a Real Impact</h3>
                  <p className="text-gray-600 text-sm">
                    Your time and effort directly help those in need and create lasting change in communities.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Join a Community</h3>
                  <p className="text-gray-600 text-sm">
                    Connect with like-minded individuals who share your passion for helping others.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Gain Experience</h3>
                  <p className="text-gray-600 text-sm">
                    Develop new skills, gain valuable experience, and receive recognition for your contributions.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Flexible Commitment</h3>
                  <p className="text-gray-600 text-sm">
                    Volunteer on your own schedule - we offer flexible time commitments to fit your lifestyle.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Volunteer Opportunities */}
          <Card className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Volunteer Opportunities</h2>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Field Work</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Help with on-ground activities, distribution drives, and community outreach programs.
                </p>
                <span className="text-xs text-[#10b981] font-medium">On-site • Flexible hours</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Campaign Support</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Assist with campaign management, donor communication, and fundraising activities.
                </p>
                <span className="text-xs text-[#10b981] font-medium">Remote/On-site • Part-time</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Education Programs</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Teach, mentor, or support educational initiatives for underprivileged children.
                </p>
                <span className="text-xs text-[#10b981] font-medium">On-site • Regular schedule</span>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2">Event Management</h3>
                <p className="text-gray-600 text-sm mb-3">
                  Help organize and manage fundraising events, awareness campaigns, and community programs.
                </p>
                <span className="text-xs text-[#10b981] font-medium">On-site • Event-based</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

