'use client';

import Image from 'next/image';
import { Users, Target, Award, Calendar, TrendingUp } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';

export default function AboutPage() {
  const stats = [
    { icon: Heart, value: '₹2.5Cr+', label: 'Total Raised', color: 'text-[#10b981]' },
    { icon: Users, value: '15K+', label: 'Total Donors', color: 'text-[#10b981]' },
    { icon: Target, value: '500+', label: 'Total Campaigns', color: 'text-[#10b981]' },
    { icon: TrendingUp, value: '98%', label: 'Success Rate', color: 'text-[#10b981]' },
  ];

  const milestones = [
    { year: '1997', title: 'Foundation Established', description: 'Care Foundation Trust® was founded with a vision to create positive social change.' },
    { year: '2005', title: 'First Major Campaign', description: 'Launched our first large-scale healthcare initiative, impacting 1,000+ lives.' },
    { year: '2010', title: 'Education Programs', description: 'Expanded to include comprehensive education programs for underprivileged children.' },
    { year: '2015', title: 'Digital Platform Launch', description: 'Launched our online platform to reach more donors and beneficiaries.' },
    { year: '2020', title: 'COVID-19 Relief', description: 'Provided critical support during the pandemic, helping thousands of families.' },
    { year: '2024', title: 'Reaching New Heights', description: 'Crossed ₹2.5Cr in total funds raised, impacting 15,000+ lives.' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">About Us</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Care Foundation Trust® is a non-profit organisation committed to compassion and empathy. 
            Our goal is to address critical social issues and uplift lives.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {stats.map((stat, index) => (
            <Card key={index} hover className="p-6 text-center">
              {stat.icon ? (
                <stat.icon className={`h-10 w-10 mx-auto mb-4 ${stat.color}`} />
              ) : (
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                </div>
              )}
              <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </Card>
          ))}
        </div>

        {/* Our Story */}
        <Card className="p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>
                Established in 1997, Care Foundation Trust® has been at the forefront of social change in India. 
                What started as a small initiative to help those in need has grown into a trusted platform that 
                connects compassionate donors with genuine causes.
              </p>
              <p>
                Over the years, we have worked tirelessly to address critical issues including healthcare, education, 
                disaster relief, and community development. Our approach is rooted in transparency, accountability, 
                and a deep commitment to making a real difference.
              </p>
              <p>
                Today, we are proud to have facilitated over ₹2.5 crores in donations, supported 500+ campaigns, 
                and impacted the lives of more than 15,000 individuals across India. But our journey is far from over. 
                With your support, we continue to expand our reach and deepen our impact.
              </p>
            </div>
          </div>
        </Card>

        {/* Milestones */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Journey</h2>
          <div className="relative">
            <div className="absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-[#10b981] hidden md:block"></div>
            <div className="space-y-8">
              {milestones.map((milestone, index) => (
                <div key={index} className={`flex items-center gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  <div className="flex-1">
                    <Card className="p-6">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="bg-[#10b981] text-white w-12 h-12 rounded-full flex items-center justify-center font-bold">
                          <Calendar className="h-6 w-6" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-[#10b981]">{milestone.year}</div>
                          <h3 className="text-xl font-bold text-gray-900">{milestone.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-600">{milestone.description}</p>
                    </Card>
                  </div>
                  <div className="hidden md:block w-12 h-12 bg-[#10b981] rounded-full border-4 border-white shadow-lg flex-shrink-0"></div>
                  <div className="md:hidden w-12 h-12 bg-[#10b981] rounded-full border-4 border-white shadow-lg flex-shrink-0"></div>
                  <div className="flex-1 hidden md:block"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Our Team */}
        <Card className="p-8 mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Team</h2>
          <p className="text-gray-600 text-center max-w-3xl mx-auto mb-8">
            Our team consists of dedicated professionals, volunteers, and partners who share a common vision 
            of creating positive social change. Together, we work to ensure that every donation reaches 
            those who need it most.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-[#ecfdf5] p-6 rounded-lg mb-4">
                <Users className="h-12 w-12 text-[#10b981] mx-auto" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Dedicated Staff</h3>
              <p className="text-sm text-gray-600">Professional team committed to our mission</p>
            </div>
            <div className="text-center">
              <div className="bg-[#ecfdf5] p-6 rounded-lg mb-4">
                <div className="relative w-20 h-20 mx-auto">
                  <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                </div>
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Active Volunteers</h3>
              <p className="text-sm text-gray-600">Hundreds of volunteers across India</p>
            </div>
            <div className="text-center">
              <div className="bg-[#ecfdf5] p-6 rounded-lg mb-4">
                <Award className="h-12 w-12 text-[#10b981] mx-auto" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">Trusted Partners</h3>
              <p className="text-sm text-gray-600">Collaborating with NGOs and organizations</p>
            </div>
          </div>
        </Card>

        {/* CTA */}
        <Card className="p-8 bg-gradient-to-r from-[#10b981] to-[#059669] text-white text-center">
          <h2 className="text-3xl font-bold mb-4">Join Us in Making a Difference</h2>
          <p className="text-green-100 mb-6 text-lg">
            Together, we can create a better world for everyone
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/campaigns" className="px-6 py-3 bg-white text-[#10b981] rounded-lg font-semibold hover:bg-gray-100 transition-colors">
              Donate Now
            </a>
            <a href="/volunteer" className="px-6 py-3 border-2 border-white text-white rounded-lg font-semibold hover:bg-white/10 transition-colors">
              Become a Volunteer
            </a>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

