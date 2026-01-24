/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react';

interface CertificateTemplateProps {
  certificate: {
    volunteerName: string;
    certificateType: string;
    issueDate: string;
    description?: string;
    hoursCompleted?: number;
    id?: string;
  };
}

const CertificateTemplate = forwardRef<HTMLDivElement, CertificateTemplateProps>(({ certificate }, ref) => {
  return (
    <div ref={ref} className="w-[1123px] h-[794px] bg-white relative p-0 font-sans text-[#1f2937]">
      {/* Outer Border (White padding handled by container, this is the green frame) */}
      <div className="w-full h-full bg-white border-[20px] border-[#365314] relative flex flex-col items-center">
        
        {/* Top Ribbon/Badge Container */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            {/* The Green Shape */}
            <div className="w-48 h-32 bg-[#365314] flex items-center justify-center rounded-b-full shadow-lg relative">
                 {/* White Circle for Logo */}
                 <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center p-2 shadow-inner">
                    <img src="/Logo.png" alt="Logo" className="w-full h-full object-contain" />
                 </div>
            </div>
        </div>

        {/* Content Container - Pushed down to clear the ribbon */}
        <div className="flex-1 w-full flex flex-col items-center pt-40 px-24 text-center">
            
            {/* Header Details */}
            <div className="w-full flex justify-between text-xs font-bold tracking-[0.2em] text-[#6b7280] uppercase mb-16">
                <div>Date: {certificate.issueDate}</div>
                <div>ID: {certificate.id ? certificate.id.substring(0, 8).toUpperCase() : 'CFT-000'}</div>
            </div>

            {/* Title */}
            <h1 className="text-6xl font-serif font-bold text-[#365314] tracking-widest uppercase mb-4">
                Certificate
            </h1>
            <h2 className="text-2xl font-sans font-medium text-[#1f2937] tracking-[0.4em] uppercase mb-12">
                Of Appreciation
            </h2>

            <p className="text-sm font-bold tracking-[0.2em] text-[#9ca3af] uppercase mb-8">
                This certificate is proudly presented to
            </p>

            {/* Name */}
            <div className="relative mb-12">
                <div className="text-6xl font-serif text-[#1f2937] font-bold capitalize border-b-2 border-[#365314] pb-4 px-12 min-w-[600px]">
                    {certificate.volunteerName}
                </div>
            </div>

            {/* Description Body */}
            <div className="max-w-4xl text-[#4b5563] text-base leading-loose font-medium uppercase tracking-wide">
                <p>
                    For outstanding support to the <span className="text-[#365314] font-bold">Care Foundation Trust®</span>.
                </p>
                <p>
                    In recognition of their selfless dedication and voluntary service{certificate.hoursCompleted ? ` of ${certificate.hoursCompleted} hours` : ''}.
                    Your contribution helps us create a better future for those in need.
                </p>
            </div>
        </div>

        {/* Footer */}
        <div className="w-full px-24 pb-16 flex justify-between items-end">
            {/* Signature Area */}
            <div className="flex flex-col items-center w-64">
                <div className="h-16 w-full border-b-2 border-[#1f2937] mb-2"></div>
                <p className="font-bold text-[#365314] text-sm uppercase tracking-wider">Authorized Signatory</p>
                <p className="text-[10px] text-[#6b7280] uppercase tracking-widest font-bold">Care Foundation Trust®</p>
            </div>

            {/* Brand Area */}
            <div className="flex flex-col items-end">
                 <div className="flex items-center gap-4 opacity-80">
                    <div className="text-right">
                        <p className="font-bold text-[#365314] text-lg uppercase leading-none">Care Foundation Trust®</p>
                        <p className="text-[10px] text-[#6b7280] uppercase tracking-widest font-bold mt-1">Est. 1997</p>
                    </div>
                    <img src="/Logo.png" alt="Logo" className="w-12 h-12 object-contain grayscale opacity-50" />
                 </div>
            </div>
        </div>
        
        {/* Corner Accents (Inner) */}
        <div className="absolute top-6 left-6 w-32 h-32 border-t-[1px] border-l-[1px] border-[#365314] opacity-30"></div>
        <div className="absolute top-6 right-6 w-32 h-32 border-t-[1px] border-r-[1px] border-[#365314] opacity-30"></div>
        <div className="absolute bottom-6 left-6 w-32 h-32 border-b-[1px] border-l-[1px] border-[#365314] opacity-30"></div>
        <div className="absolute bottom-6 right-6 w-32 h-32 border-b-[1px] border-r-[1px] border-[#365314] opacity-30"></div>

      </div>
    </div>
  );
});

CertificateTemplate.displayName = 'CertificateTemplate';

export default CertificateTemplate;
