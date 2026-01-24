'use client';

import { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import Footer from '@/components/layout/Footer';
import Card from '@/components/ui/Card';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Donations',
      questions: [
        {
          question: 'How can I donate?',
          answer: 'You can donate through our website by selecting a campaign and clicking the "Donate" button. We accept multiple payment methods including UPI, credit/debit cards, net banking, and digital wallets. You can also donate directly on our homepage donation form.',
        },
        {
          question: 'Is my donation tax-deductible?',
          answer: 'Yes, Care Foundation Trust® is registered under Section 80G of the Income Tax Act, 1961. Donations made to us are eligible for tax deduction up to 50% of the donated amount, subject to certain limits. You will receive a receipt via email that can be used for tax purposes.',
        },
        {
          question: 'Can I donate anonymously?',
          answer: 'Yes, you have the option to make anonymous donations. When making a donation, you can choose to keep your name private. Your contribution will still be counted, but your name will not be displayed publicly.',
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept UPI, credit cards, debit cards, net banking, and digital wallets (Paytm, Google Pay, PhonePe, etc.). All transactions are processed through secure payment gateways.',
        },
        {
          question: 'Will I get a receipt for my donation?',
          answer: 'Yes, you will receive an email receipt immediately after your donation is processed. This receipt includes all necessary details for tax deduction purposes under Section 80G.',
        },
        {
          question: 'Can I get a refund?',
          answer: 'Donations are generally non-refundable as they are used for charitable purposes. However, in cases of technical errors or fraudulent transactions, refunds will be processed within 7-10 business days. Please contact us for assistance.',
        },
      ],
    },
    {
      category: 'Campaigns',
      questions: [
        {
          question: 'How do I start a campaign?',
          answer: 'To start a campaign, click on "Start Fundraiser" or "Register" on our website. Fill out the campaign form with details about your cause, goal amount, and required documents. Our team will review your application and get back to you within 2-3 business days.',
        },
        {
          question: 'What documents do I need to start a campaign?',
          answer: 'You will need identity proof, address proof, medical reports (for medical campaigns), bank account details, and any relevant documents supporting your cause. Our team will guide you through the specific requirements.',
        },
        {
          question: 'How long does it take for a campaign to be approved?',
          answer: 'Campaign approval typically takes 2-3 business days after submission. Our team reviews each campaign to ensure authenticity and compliance with our guidelines.',
        },
        {
          question: 'Can I track my campaign\'s progress?',
          answer: 'Yes, once your campaign is live, you can track its progress through your dashboard. You\'ll see real-time updates on funds raised, number of donors, and other metrics.',
        },
        {
          question: 'What happens if my campaign doesn\'t reach its goal?',
          answer: 'Even if your campaign doesn\'t reach its full goal, you will still receive the funds raised. However, we recommend setting realistic goals and actively promoting your campaign to maximize donations.',
        },
      ],
    },
    {
      category: 'Volunteering',
      questions: [
        {
          question: 'How can I become a volunteer?',
          answer: 'You can apply to become a volunteer by visiting our "Volunteer" page and filling out the volunteer registration form. Our team will review your application and contact you with available opportunities.',
        },
        {
          question: 'What are the requirements to volunteer?',
          answer: 'We welcome volunteers from all backgrounds. There are no specific requirements, but we value commitment, compassion, and a willingness to help. Some roles may require specific skills, which will be mentioned in the opportunity description.',
        },
        {
          question: 'Do I get a certificate for volunteering?',
          answer: 'Yes, volunteers who complete a minimum number of hours or contribute significantly to our programs receive a certificate of recognition. This can be valuable for your resume and personal growth.',
        },
        {
          question: 'Can I volunteer remotely?',
          answer: 'Yes, we have both on-ground and remote volunteering opportunities. Remote volunteers can help with social media, content creation, campaign management, and other digital tasks.',
        },
      ],
    },
    {
      category: 'General',
      questions: [
        {
          question: 'How is Care Foundation Trust® funded?',
          answer: 'Care Foundation Trust® is funded through donations from individuals, corporations, and grants. We maintain complete transparency about our funding sources and how funds are utilized.',
        },
        {
          question: 'How do you ensure transparency?',
          answer: 'We maintain transparency through regular updates on campaigns, detailed financial reports, and public disclosure of our certificates and legal documents. Donors receive regular updates on how their contributions are being used.',
        },
        {
          question: 'Can I visit your office?',
          answer: 'Yes, you are welcome to visit our office. Our address is: 1106, Alexander Tower, Sai World Empire, Navi Mumbai - 410210. Please contact us in advance to schedule a visit.',
        },
        {
          question: 'How can I partner with Care Foundation Trust®?',
          answer: 'We welcome partnerships with corporations, NGOs, and other organizations. Please contact us through our "Contact" page or email us at carefoundationtrustorg@gmail.com with your partnership proposal.',
        },
        {
          question: 'Is Care Foundation Trust® a registered organization?',
          answer: 'Yes, Care Foundation Trust® is a registered public charitable trust under the Indian Trusts Act, 1882. We are also registered under Section 12A and 80G of the Income Tax Act. You can view all our certificates on our "Certificates" page.',
        },
      ],
    },
  ];

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-16">
        {/* Page Header */}
        <div className="text-center mb-12">
          <HelpCircle className="h-16 w-16 text-[#10b981] mx-auto mb-6" />
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-gray-600">
            Find answers to common questions about donations, campaigns, volunteering, and more.
          </p>
        </div>

        {/* FAQ Sections */}
        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{category.category}</h2>
              <div className="space-y-4">
                {category.questions.map((faq, questionIndex) => {
                  const index = categoryIndex * 100 + questionIndex;
                  const isOpen = openIndex === index;
                  
                  return (
                    <Card key={questionIndex} className="overflow-hidden">
                      <button
                        onClick={() => toggleQuestion(index)}
                        className="w-full p-6 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <span className="font-semibold text-gray-900 pr-4">{faq.question}</span>
                        {isOpen ? (
                          <ChevronUp className="h-5 w-5 text-[#10b981] flex-shrink-0" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="px-6 pb-6">
                          <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <Card className="mt-12 p-8 text-center bg-[#ecfdf5]">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Please get in touch with our friendly team.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/contact" className="px-6 py-3 bg-[#10b981] text-white rounded-lg font-semibold hover:bg-[#059669] transition-colors">
              Contact Us
            </a>
            <a href="/ask-question" className="px-6 py-3 border-2 border-[#10b981] text-[#10b981] rounded-lg font-semibold hover:bg-[#ecfdf5] transition-colors">
              Ask a Question
            </a>
          </div>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}

