'use client';

import { FileText, Shield, Lock, AlertCircle } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';

export default function TermsPage() {
  const sections = [
    {
      icon: FileText,
      title: 'Acceptance of Terms',
      content: `By accessing and using the Care Foundation Trust® website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.`,
    },
    {
      icon: Shield,
      title: 'Use License',
      content: `Permission is granted to temporarily download one copy of the materials on Care Foundation Trust®'s website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
      • Modify or copy the materials
      • Use the materials for any commercial purpose or for any public display
      • Attempt to decompile or reverse engineer any software contained on the website
      • Remove any copyright or other proprietary notations from the materials`,
    },
    {
      icon: Lock,
      title: 'Donations and Refunds',
      content: `All donations made through our platform are final and non-refundable, except in cases of technical errors or fraudulent transactions. In such cases, refunds will be processed within 7-10 business days. Donations are used for charitable purposes as stated in our mission.`,
    },
    {
      icon: AlertCircle,
      title: 'Disclaimer',
      content: `The materials on Care Foundation Trust®'s website are provided on an 'as is' basis. Care Foundation Trust® makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.`,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms and Conditions</h1>
          <p className="text-gray-600">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Terms Sections */}
        <div className="space-y-6 mb-8">
          {sections.map((section, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-[#10b981] p-3 rounded-lg flex-shrink-0">
                  <section.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-3">{section.title}</h2>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-line">{section.content}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Additional Terms */}
        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Privacy and Data Protection</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We are committed to protecting your privacy. All personal information collected through our website is used solely for the purpose of processing donations and communicating with you about our activities. We do not sell, trade, or share your personal information with third parties without your consent, except as required by law.
          </p>
          <p className="text-gray-600 leading-relaxed">
            For more details, please refer to our Privacy Policy, which is incorporated into these Terms by reference.
          </p>
        </Card>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Intellectual Property</h2>
          <p className="text-gray-600 leading-relaxed">
            All content on this website, including text, graphics, logos, images, and software, is the property of Care Foundation Trust® or its content suppliers and is protected by Indian and international copyright laws. You may not reproduce, distribute, or transmit any content from this website without prior written permission.
          </p>
        </Card>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed">
            In no event shall Care Foundation Trust® or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Care Foundation Trust®'s website, even if Care Foundation Trust® or a Care Foundation Trust® authorized representative has been notified orally or in writing of the possibility of such damage.
          </p>
        </Card>

        <Card className="p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Governing Law</h2>
          <p className="text-gray-600 leading-relaxed">
            These terms and conditions are governed by and construed in accordance with the laws of India. Any disputes relating to these terms and conditions shall be subject to the exclusive jurisdiction of the courts of Mumbai, Maharashtra, India.
          </p>
        </Card>

        <Card className="p-6 bg-[#ecfdf5]">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            If you have any questions about these Terms and Conditions, please contact us:
          </p>
          <div className="space-y-2 text-gray-700">
            <p><strong>Email:</strong> carefoundationtrustorg@gmail.com</p>
            <p><strong>Phone:</strong> +91 9136521052</p>
            <p><strong>Address:</strong> 1106, Alexander Tower, Sai World Empire, opposite Swapnapoorti Mhada colony, valley Shilp Road, Navi Mumbai - 410210. Sector 36, kharghar.</p>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

