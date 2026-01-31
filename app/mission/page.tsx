'use client';

import Image from 'next/image';
import { Target, Users, Award, Eye, HandHeart } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';

export default function MissionPage() {
  const values = [
    {
      icon: null as any,
      title: 'Compassion',
      description: 'We believe in showing genuine care and empathy towards those in need, treating every individual with dignity and respect.',
    },
    {
      icon: Target,
      title: 'Transparency',
      description: 'We maintain complete transparency in all our operations, ensuring donors know exactly how their contributions are being used.',
    },
    {
      icon: Users,
      title: 'Community',
      description: 'We build strong communities by bringing people together to create lasting positive change.',
    },
    {
      icon: Award,
      title: 'Excellence',
      description: 'We strive for excellence in everything we do, continuously improving our programs and services.',
    },
    {
      icon: Eye,
      title: 'Accountability',
      description: 'We hold ourselves accountable to our donors, beneficiaries, and the communities we serve.',
    },
    {
      icon: HandHeart,
      title: 'Impact',
      description: 'We focus on creating measurable, sustainable impact that transforms lives and communities.',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Mission</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            To create a world where every individual has access to basic necessities, quality education, and healthcare, 
            regardless of their circumstances.
          </p>
        </div>

        {/* Mission Statement */}
        <Card className="p-8 mb-12 bg-gradient-to-br from-[#ecfdf5] to-white">
          <div className="max-w-4xl mx-auto text-center">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission Statement</h2>
            <p className="text-lg text-gray-700 leading-relaxed mb-4">
              Care Foundation Trust® is committed to addressing critical social issues and uplifting lives through 
              compassion, empathy, and collective action. We believe that every individual deserves dignity, respect, 
              and the opportunity to thrive.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Our mission is to bridge the gap between those who want to help and those who need help, creating 
              a platform where generosity meets genuine need. We work tirelessly to ensure that every donation 
              makes a real, measurable difference in someone's life.
            </p>
          </div>
        </Card>

        {/* Vision */}
        <Card className="p-8 mb-12">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">Our Vision</h2>
            <div className="space-y-4 text-gray-700">
              <p className="text-lg leading-relaxed">
                We envision a society where:
              </p>
              <ul className="space-y-3 list-disc list-inside text-lg">
                <li>Every child has access to quality education and healthcare</li>
                <li>No family goes to bed hungry</li>
                <li>Communities are empowered to become self-sufficient</li>
                <li>Compassion and empathy drive social change</li>
                <li>Transparency and accountability are the foundation of all charitable work</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Core Values */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Our Core Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => (
              <Card key={index} hover className="p-6 text-center">
                <div className="bg-[#10b981] p-4 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  {value.icon ? (
                    <value.icon className="h-8 w-8 text-white" />
                  ) : (
                    <div className="relative w-10 h-10">
                      <Image src="/Logo.png" alt="Logo" fill className="object-contain" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">{value.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* What We Do */}
        <Card className="p-8 bg-white">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">What We Do</h2>
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Healthcare Initiatives</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Free medical camps</li>
                  <li>• Critical illness treatment support</li>
                  <li>• Health awareness programs</li>
                  <li>• Medicine distribution</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Education Programs</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Learning centers for underprivileged children</li>
                  <li>• Scholarship programs</li>
                  <li>• Digital learning resources</li>
                  <li>• Skill development workshops</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Community Development</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Clean water initiatives</li>
                  <li>• Food distribution drives</li>
                  <li>• Disaster relief support</li>
                  <li>• Infrastructure development</li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Empowerment</h3>
                <ul className="space-y-2 text-gray-600">
                  <li>• Women empowerment programs</li>
                  <li>• Livelihood support</li>
                  <li>• Volunteer opportunities</li>
                  <li>• Community engagement</li>
                </ul>
              </div>
            </div>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

