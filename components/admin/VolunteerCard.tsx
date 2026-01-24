/* eslint-disable @next/next/no-img-element */
import React, { forwardRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';

interface VolunteerCardProps {
  volunteer: any;
}

const VolunteerCard = forwardRef<HTMLDivElement, VolunteerCardProps>(({ volunteer }, ref) => {
  // Priority: Volunteer Application Image -> User Profile Image -> Default
  const profileImage = volunteer.profileImage || volunteer.userId?.profileImage || '/founder.jpg';
  
  const issueDate = new Date().toISOString().split('T')[0];
  const expireDate = new Date();
  expireDate.setFullYear(expireDate.getFullYear() + 1);
  const expiryDateStr = expireDate.toISOString().split('T')[0];

  return (
    <div ref={ref} className="w-[1000px] flex gap-8 p-8 bg-[#ffffff] font-sans">
      {/* Front Side */}
      <div className="w-[400px] h-[600px] bg-[#ffffff] rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] border border-[#d1d5db] flex flex-col relative">
        {/* Header Background with Curve */}
        <div className="h-[140px] bg-[#16a34a] relative">
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[#ffffff] z-10 p-4">
                <h1 className="text-xl font-bold tracking-wide uppercase text-center leading-tight">Care Foundation Trust®</h1>
                <p className="text-[10px] opacity-90 mt-1">Reg. No: CFT/2025/029</p>
                <p className="text-[10px] opacity-90">Head Office: Mumbai - 400003</p>
            </div>
            {/* Decorative Curve */}
            <div className="absolute -bottom-6 left-0 right-0 h-12 bg-[#ffffff] rounded-t-[50%] z-0"></div>
        </div>

        {/* Profile Section */}
        <div className="relative z-10 -mt-8 flex flex-col items-center">
            <div className="w-32 h-32 rounded-full border-4 border-[#ffffff] shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] overflow-hidden bg-[#f3f4f6]">
                <img 
                  src={profileImage} 
                  alt={volunteer.name} 
                  className="w-full h-full object-cover"
                />
            </div>
            <h2 className="mt-3 text-xl font-bold text-[#1f2937] uppercase text-center px-4">{volunteer.name}</h2>
            <p className="text-[#16a34a] font-semibold text-sm uppercase tracking-wider">Volunteer</p>
        </div>

        {/* Details Section */}
        <div className="flex-1 px-6 py-4 mt-2">
            <div className="grid grid-cols-[80px_1fr] gap-y-2 text-sm">
                <div className="text-[#6b7280] font-medium">ID No</div>
                <div className="text-[#1f2937] font-bold">: CFT-{volunteer._id?.substring(0, 6).toUpperCase()}</div>
                
                <div className="text-[#6b7280] font-medium">Phone</div>
                <div className="text-[#1f2937] font-semibold">: {volunteer.phone}</div>
                
                <div className="text-[#6b7280] font-medium">Location</div>
                <div className="text-[#1f2937] font-semibold">: {volunteer.city || 'Mumbai'}</div>

                <div className="text-[#6b7280] font-medium">Issued</div>
                <div className="text-[#1f2937] font-semibold">: {issueDate}</div>

                <div className="text-[#6b7280] font-medium">Valid Till</div>
                <div className="text-[#dc2626] font-semibold">: {expiryDateStr}</div>
            </div>
        </div>

        {/* Footer with QR */}
        <div className="bg-[#f9fafb] p-4 border-t border-[#e5e7eb] flex items-center justify-between">
            <div className="flex flex-col">
                <span className="text-[10px] text-[#6b7280] mb-1">Scan to Verify</span>
                <QRCodeCanvas 
                  value={`https://carefoundationtrust.org/verify/volunteer/${volunteer._id}`}
                  size={60}
                  level={"M"}
                  fgColor="#1f2937"
                />
            </div>
            <div className="text-right">
                 {/* Signature Placeholder */}
                 <div className="h-8 w-24 border-b border-[#9ca3af] mb-1"></div>
                 <p className="text-[10px] text-[#6b7280] font-medium uppercase">Authorized Signatory</p>
            </div>
        </div>
      </div>

      {/* Back Side */}
      <div className="w-[400px] h-[600px] bg-[#ffffff] rounded-xl overflow-hidden shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-1px_rgba(0,0,0,0.06)] border border-[#d1d5db] flex flex-col relative">
         <div className="h-16 bg-[#16a34a] flex items-center justify-center">
            <h3 className="text-[#ffffff] font-bold text-lg">Terms & Conditions</h3>
         </div>

         <div className="p-8 flex-1 flex flex-col">
            <ul className="list-disc pl-4 space-y-3 text-xs text-[#4b5563] leading-relaxed">
                <li>This card is the property of <strong>Care Foundation Trust®</strong>.</li>
                <li>This card is non-transferable and must be returned upon request or termination of volunteer service.</li>
                <li>If found, please return to the address mentioned below or contact us immediately.</li>
                <li>This card confirms the individual&apos;s role as a volunteer and does not authorize them to collect cash without an official receipt book.</li>
            </ul>

            <div className="mt-auto pt-6 border-t border-[#e5e7eb]">
                <h4 className="text-[#16a34a] font-bold text-sm mb-2">Care Foundation Trust®</h4>
                <p className="text-xs text-[#4b5563] mb-1">
                    <strong>Address:</strong> Shop No - S - 61, 2nd Flr, AL - EZZ Tower (SBUT), Ibrahim Rehmatullah Road, Bhendi Bazaar, Mumbai - 400003.
                </p>
                <p className="text-xs text-[#4b5563] mb-1">
                    <strong>Email:</strong> carefoundationtrustorg@gmail.com
                </p>
                <p className="text-xs text-[#4b5563]">
                    <strong>Phone:</strong> +91 9876543210
                </p>
            </div>
         </div>
         
         <div className="bg-[#f3f4f6] p-3 text-center">
            <p className="text-[10px] text-[#6b7280]">www.carefoundationtrust.org</p>
         </div>
      </div>
    </div>
  );
});

VolunteerCard.displayName = 'VolunteerCard';

export default VolunteerCard;
