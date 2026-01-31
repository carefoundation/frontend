'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Award, FileText, CheckCircle, Download, Loader2 } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';
import { api, ApiError } from '@/lib/api';

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>('/certificates');
      if (Array.isArray(data)) {
        const formatted = data.map((cert: any) => ({
          id: cert._id || cert.id,
          title: cert.type || cert.title || 'Certificate',
          description: cert.description || 'Certificate issued by Care Foundation Trust®',
          image: cert.image || 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
          issuedBy: cert.issuedBy || 'Care Foundation Trust®',
          validity: cert.validity || cert.expiryDate ? `Valid until ${new Date(cert.expiryDate).getFullYear()}` : 'Permanent',
          certificateNumber: cert.certificateNumber || cert._id,
        }));
        setCertificates(formatted);
      } else {
        // If no certificates from backend, show default trust certificates
        setCertificates([
          {
            id: 1,
            title: '80G Tax Exemption Certificate',
            description: 'Donations to Care Foundation Trust® are eligible for tax deduction under Section 80G of the Income Tax Act, 1961.',
            image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
            issuedBy: 'Income Tax Department, Government of India',
            validity: 'Valid until 2026',
          },
          {
            id: 2,
            title: '12A Registration Certificate',
            description: 'Registered under Section 12A of the Income Tax Act, exempting the trust from income tax on its income.',
            image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
            issuedBy: 'Income Tax Department, Government of India',
            validity: 'Valid until 2026',
          },
        ]);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        console.error('Failed to fetch certificates:', error.message);
      } else {
        console.error('Failed to fetch certificates');
      }
      // Show default certificates on error
      setCertificates([
        {
          id: 1,
          title: '80G Tax Exemption Certificate',
          description: 'Donations to Care Foundation Trust are eligible for tax deduction under Section 80G of the Income Tax Act, 1961.',
          image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
          issuedBy: 'Income Tax Department, Government of India',
          validity: 'Valid until 2026',
        },
        {
          id: 2,
          title: '12A Registration Certificate',
          description: 'Registered under Section 12A of the Income Tax Act, exempting the trust from income tax on its income.',
          image: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800',
          issuedBy: 'Income Tax Department, Government of India',
          validity: 'Valid until 2026',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-15 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#10b981]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-16">
          <Award className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Our Certificates</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We are a registered and certified charitable trust. All our legal documents and certifications are available for your review.
          </p>
        </div>

        {/* Certificates Grid */}
        {certificates.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {certificates.map((certificate) => (
            <Card key={certificate.id} hover className="overflow-hidden">
              <div className="relative h-48 bg-gradient-to-br from-[#ecfdf5] to-white">
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="h-24 w-24 text-[#10b981] opacity-20" />
                </div>
                <div className="absolute top-4 right-4">
                  <CheckCircle className="h-8 w-8 text-[#10b981]" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{certificate.title}</h3>
                <p className="text-gray-600 mb-4 text-sm leading-relaxed">{certificate.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-semibold">Issued by:</span>
                    <span>{certificate.issuedBy}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <span className="font-semibold">Validity:</span>
                    <span className="text-[#10b981] font-semibold">{certificate.validity}</span>
                  </div>
                </div>
                <button className="mt-4 flex items-center gap-2 text-[#10b981] hover:text-[#059669] transition-colors text-sm font-semibold">
                  <Download className="h-4 w-4" />
                  View Certificate
                </button>
              </div>
            </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No certificates available</p>
            <p className="text-gray-400">Check back soon for certificate listings</p>
          </div>
        )}

        {/* Additional Information */}
        <Card className="p-8 bg-gradient-to-r from-[#ecfdf5] to-white">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Our Certifications Matter</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tax Benefits</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                With our 80G certificate, your donations are eligible for tax deduction up to 50% of the donated amount, 
                subject to certain limits under the Income Tax Act.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Legal Compliance</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                All our registrations ensure that we operate within the legal framework and maintain the highest standards 
                of transparency and accountability.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Trust & Credibility</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Our certifications demonstrate our commitment to operating as a legitimate, registered charitable organization 
                that you can trust with your contributions.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Transparency</h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                We believe in complete transparency. All our certificates and legal documents are available for public review 
                to ensure accountability.
              </p>
            </div>
          </div>
        </Card>

        {/* Contact for Verification */}
        <Card className="mt-8 p-6 text-center bg-white">
          <p className="text-gray-600 mb-2">
            Need to verify our certificates or have questions about our legal status?
          </p>
          <a href="/contact" className="text-[#10b981] hover:text-[#059669] font-semibold">
            Contact us for verification →
          </a>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

