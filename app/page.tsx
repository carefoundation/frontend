"use client";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { api, ApiError } from "@/lib/api";
import { showToast } from "@/lib/toast";
import {
    ArrowRight,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Copy,
    Heart,
    Mail,
    Phone,
    QrCode,
    Share2,
    Star,
    Target,
    Ticket,
    TrendingUp,
    User,
    Users,
    X,
} from "lucide-react";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const Footer = dynamic(() => import("@/components/layout/Footer"), {
  ssr: false,
});
const CampaignCard = dynamic(
  () => import("@/components/campaigns/CampaignCard"),
  { ssr: false },
);
const VideoImageSlider = dynamic(
  () => import("@/components/ui/VideoImageSlider"),
  { ssr: false },
);

export default function Home() {
  const router = useRouter();
  const [donationAmount, setDonationAmount] = useState("");
  const [donorName, setDonorName] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [healthPartnerIndex, setHealthPartnerIndex] = useState(0);
  const [foodPartnerIndex, setFoodPartnerIndex] = useState(0);
  const [hospitalPartnerIndex, setHospitalPartnerIndex] = useState(0);
  const [medicinePartnerIndex, setMedicinePartnerIndex] = useState(0);
  const [pathologyPartnerIndex, setPathologyPartnerIndex] = useState(0);
  const [trendingCampaignIndex, setTrendingCampaignIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleDonationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      showToast("Please enter a valid donation amount", "error");
      return;
    }
    if (!donorName || !donorEmail || !donorPhone) {
      showToast("Please fill all required fields", "error");
      return;
    }

    // Validate phone number - must be exactly 10 digits
    const phoneDigits = donorPhone.replace(/\D/g, "");
    if (!/^\d{10}$/.test(phoneDigits)) {
      showToast("Please enter a valid 10-digit phone number", "error");
      return;
    }

    // Save donation data
    if (typeof window !== "undefined") {
      const donationData = {
        amount: donationAmount,
        name: donorName,
        email: donorEmail,
        phone: donorPhone,
      };
      localStorage.setItem("pendingDonation", JSON.stringify(donationData));
    }

    // Redirect directly to payment (no login required)
    router.push("/payment");
  };

  const [trustStats, setTrustStats] = useState([
    {
      icon: Heart,
      value: "₹0",
      label: "Total Raised",
      color: "text-[#10b981]",
    },
    { icon: Users, value: "0", label: "Total Donors", color: "text-[#10b981]" },
    {
      icon: Target,
      value: "0",
      label: "Total Campaigns",
      color: "text-[#10b981]",
    },
    {
      icon: TrendingUp,
      value: "0%",
      label: "Success Rate",
      color: "text-[#10b981]",
    },
  ]);
  const [trendingCampaigns, setTrendingCampaigns] = useState<any[]>([]);
  const [healthPartners, setHealthPartners] = useState<any[]>([]);
  const [foodPartners, setFoodPartners] = useState<any[]>([]);
  const [hospitalPartners, setHospitalPartners] = useState<any[]>([]);
  const [medicinePartners, setMedicinePartners] = useState<any[]>([]);
  const [pathologyPartners, setPathologyPartners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [generatedCoupon, setGeneratedCoupon] = useState<any>(null);
  const [generatingCoupon, setGeneratingCoupon] = useState(false);
  const [selectedFoodPartner, setSelectedFoodPartner] = useState<any>(null);
  const [selectedHealthPartner, setSelectedHealthPartner] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHomeData();
    fetchSuccessStories();
  }, []);

  const fetchSuccessStories = async () => {
    try {
      const { api } = await import("@/lib/api");
      const data = await api.get<any[]>("/campaigns?status=completed");
      if (Array.isArray(data)) {
        // Filter only completed campaigns and sort by latest (most recent first)
        const completedCampaigns = data
          .filter((campaign: any) => campaign.status === "completed")
          .sort((a: any, b: any) => {
            const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
            const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
            return dateB - dateA; // Latest first
          })
          .slice(0, 2) // Get only latest 2
          .map((campaign: any) => ({
            title: campaign.title || "Success Story",
            description:
              campaign.description || "Campaign completed successfully",
            image:
              campaign.image ||
              "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
            raised: `₹${(campaign.currentAmount || 0).toLocaleString()}`,
          }));
        setSuccessStories(completedCampaigns);
      } else {
        setSuccessStories([]);
      }
    } catch (error) {
      console.error("Failed to fetch success stories:", error);
      setSuccessStories([]);
    }
  };

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      const { api } = await import("@/lib/api");
      const data = await api.get<{
        stats?: {
          totalRaised?: number;
          totalDonors?: number;
          totalCampaigns?: number;
          successRate?: number;
        };
        trendingCampaigns?: any[];
        healthPartners?: any[];
        foodPartners?: any[];
        hospitalPartners?: any[];
        medicinePartners?: any[];
        pathologyPartners?: any[];
      }>("/dashboard/home");

      if (data && data.stats) {
        const formatCurrency = (amount: number) => {
          if (amount >= 10000000)
            return `₹${(amount / 10000000).toFixed(1)}Cr+`;
          if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L+`;
          return `₹${amount.toLocaleString()}`;
        };

        setTrustStats([
          {
            icon: Heart,
            value: formatCurrency(data.stats.totalRaised || 0),
            label: "Total Raised",
            color: "text-[#10b981]",
          },
          {
            icon: Users,
            value: `${(data.stats.totalDonors || 0).toLocaleString()}+`,
            label: "Total Donors",
            color: "text-[#10b981]",
          },
          {
            icon: Target,
            value: `${(data.stats.totalCampaigns || 0).toLocaleString()}+`,
            label: "Total Campaigns",
            color: "text-[#10b981]",
          },
          {
            icon: TrendingUp,
            value: `${data.stats.successRate || 0}%`,
            label: "Success Rate",
            color: "text-[#10b981]",
          },
        ]);
      }

      if (data.trendingCampaigns) {
        setTrendingCampaigns(
          data.trendingCampaigns.map((campaign: any) => ({
            id: campaign._id,
            title: campaign.title,
            image:
              campaign.image ||
              "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=600&fit=crop&q=80",
            category: campaign.category,
            currentAmount: campaign.currentAmount || 0,
            goalAmount: campaign.goalAmount || 0,
            donors: campaign.donors || 0,
            daysLeft: campaign.endDate
              ? Math.ceil(
                  (new Date(campaign.endDate).getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24),
                )
              : 0,
            location: campaign.location || "India",
          })),
        );
      }

      if (data.healthPartners) {
        setHealthPartners(
          data.healthPartners.map((partner: any) => {
            // Extract image from formData if photo/logo are not available
            let photo = partner.photo || partner.logo;
            if (!photo && partner.formData) {
              if (partner.formData.banner) {
                photo = partner.formData.banner;
              } else if (
                partner.formData.clinicPhotos &&
                Array.isArray(partner.formData.clinicPhotos) &&
                partner.formData.clinicPhotos.length > 0
              ) {
                photo = partner.formData.clinicPhotos[0];
              } else if (
                partner.formData.labImages &&
                Array.isArray(partner.formData.labImages) &&
                partner.formData.labImages.length > 0
              ) {
                photo = partner.formData.labImages[0];
              } else if (
                partner.formData.hospitalImages &&
                Array.isArray(partner.formData.hospitalImages) &&
                partner.formData.hospitalImages.length > 0
              ) {
                photo = partner.formData.hospitalImages[0];
              } else if (
                partner.formData.pharmacyImages &&
                Array.isArray(partner.formData.pharmacyImages) &&
                partner.formData.pharmacyImages.length > 0
              ) {
                photo = partner.formData.pharmacyImages[0];
              }
            }
            return {
              ...partner,
              id: partner._id || partner.id,
              programs: partner.programs || [],
              photo: photo || partner.photo,
              logo: partner.logo || photo,
            };
          }),
        );
      }

      if (data.foodPartners) {
        setFoodPartners(
          data.foodPartners.map((partner: any) => {
            // Extract image from formData if photo/logo are not available
            let photo = partner.photo || partner.logo;
            if (!photo && partner.formData) {
              if (partner.formData.banner) {
                photo = partner.formData.banner;
              } else if (
                partner.formData.restaurantImages &&
                Array.isArray(partner.formData.restaurantImages) &&
                partner.formData.restaurantImages.length > 0
              ) {
                photo = partner.formData.restaurantImages[0];
              }
            }
            return {
              ...partner,
              id: partner._id || partner.id,
              programs: partner.programs || [],
              photo: photo || partner.photo,
              logo: partner.logo || photo,
            };
          }),
        );
      }

      if (data.hospitalPartners) {
        setHospitalPartners(
          data.hospitalPartners.map((partner: any) => {
            let photo = partner.photo || partner.logo;
            if (!photo && partner.formData) {
              if (partner.formData.banner) {
                photo = partner.formData.banner;
              } else if (
                partner.formData.hospitalImages &&
                Array.isArray(partner.formData.hospitalImages) &&
                partner.formData.hospitalImages.length > 0
              ) {
                photo = partner.formData.hospitalImages[0];
              }
            }
            return {
              ...partner,
              id: partner._id || partner.id,
              programs: partner.programs || [],
              photo: photo || partner.photo,
              logo: partner.logo || photo,
            };
          }),
        );
      }

      if (data.medicinePartners) {
        setMedicinePartners(
          data.medicinePartners.map((partner: any) => {
            let photo = partner.photo || partner.logo;
            if (!photo && partner.formData) {
              if (partner.formData.banner) {
                photo = partner.formData.banner;
              } else if (
                partner.formData.pharmacyImages &&
                Array.isArray(partner.formData.pharmacyImages) &&
                partner.formData.pharmacyImages.length > 0
              ) {
                photo = partner.formData.pharmacyImages[0];
              }
            }
            return {
              ...partner,
              id: partner._id || partner.id,
              programs: partner.programs || [],
              photo: photo || partner.photo,
              logo: partner.logo || photo,
            };
          }),
        );
      }

      if (data.pathologyPartners) {
        setPathologyPartners(
          data.pathologyPartners.map((partner: any) => {
            let photo = partner.photo || partner.logo;
            if (!photo && partner.formData) {
              if (partner.formData.banner) {
                photo = partner.formData.banner;
              } else if (
                partner.formData.labImages &&
                Array.isArray(partner.formData.labImages) &&
                partner.formData.labImages.length > 0
              ) {
                photo = partner.formData.labImages[0];
              }
            }
            return {
              ...partner,
              id: partner._id || partner.id,
              programs: partner.programs || [],
              photo: photo || partner.photo,
              logo: partner.logo || photo,
            };
          }),
        );
      }
    } catch (error) {
      console.error("Failed to fetch home data:", error);
    } finally {
      setLoading(false);
    }
  };

  const howItWorks = [
    {
      step: "1",
      title: "Choose a Cause",
      description:
        "Browse through campaigns and find a cause that resonates with you.",
      icon: Heart,
    },
    {
      step: "2",
      title: "Donate Securely",
      description: "Make a secure donation using our trusted payment gateway.",
      icon: CheckCircle,
    },
    {
      step: "3",
      title: "Track Impact",
      description: "See how your contribution is making a real difference.",
      icon: TrendingUp,
    },
    {
      step: "4",
      title: "Share & Spread",
      description: "Share campaigns with friends and family to amplify impact.",
      icon: Users,
    },
  ];

  const [successStories, setSuccessStories] = useState<any[]>([]);

  const handleGetCoupon = async (
    partner: any,
    type: "food" | "health" = "food",
  ) => {
    try {
      setGeneratingCoupon(true);
      if (type === "food") {
        setSelectedFoodPartner(partner);
      } else {
        setSelectedHealthPartner(partner);
      }

      // Check if user is logged in
      const token = localStorage.getItem("userToken");
      if (!token || token.trim() === "") {
        showToast("Please login to get a coupon", "info");
        localStorage.setItem("redirectAfterLogin", "/");
        router.push("/login");
        return;
      }

      // Generate coupon for partner
      const response = await api.post<any>("/coupons", {
        amount: 0, // Free coupon for partner
        paymentId: `${type}-partner-${partner._id || partner.id}-${Date.now()}`,
        paymentStatus: "completed",
        beneficiaryName:
          partner.name || `${type === "food" ? "Food" : "Health"} Partner`,
        partnerId: partner._id || partner.id,
      });

      if (response.data) {
        setGeneratedCoupon(response.data);
        setShowCouponModal(true);
        showToast("Coupon generated successfully!", "success");
      }
    } catch (error) {
      console.error("Error generating coupon:", error);
      if (error instanceof ApiError) {
        if (error.status === 401) {
          showToast("Please login to get a coupon", "error");
          localStorage.setItem("redirectAfterLogin", "/");
          router.push("/login");
        } else {
          showToast(`Failed to generate coupon: ${error.message}`, "error");
        }
      } else {
        showToast("Failed to generate coupon. Please try again.", "error");
      }
    } finally {
      setGeneratingCoupon(false);
    }
  };

  const handleCopyCouponCode = () => {
    if (generatedCoupon?.couponCode || generatedCoupon?.code) {
      const code = generatedCoupon.couponCode || generatedCoupon.code;
      navigator.clipboard.writeText(code);
      setCopied(true);
      showToast("Coupon code copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Slider items - only video
  const sliderItems = [
    {
      type: "video" as const,
      src: "/carevideo.mp4",
    },
  ];

  return (
    <div className="bg-white">
      {/* Video/Image Slider Section - Directly below navbar */}
      <div className="relative w-full h-[calc(100vh-6rem)] sm:h-[calc(100vh-7.5rem)] overflow-hidden">
        <VideoImageSlider items={sliderItems} imageSlideDuration={5} />
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-[#ecfdf5] via-white to-[#ecfdf5] py-8 md:py-20 lg:py-32">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Together We Can{" "}
                <span className="text-[#10b981]">Save Lives</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Join thousands of compassionate donors making a real difference.
                Support causes you care about and help create a better world.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/campaigns">
                  <Button size="lg" className="w-full sm:w-auto">
                    Donate Now
                    <ArrowRight className="ml-2 h-5 w-5 inline" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button
                    variant="outline"
                    size="lg"
                    className="w-full sm:w-auto"
                  >
                    Start Fundraiser
                  </Button>
                </Link>
              </div>
            </div>

            {/* Donation Form */}
            <div className="animate-slide-in">
              <Card className="p-6 lg:p-8 shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Make a Donation
                </h2>
                <p className="text-gray-600 mb-6">
                  Your contribution can make a real difference
                </p>

                <form onSubmit={handleDonationSubmit} className="space-y-4">
                  {/* Quick Amount Buttons */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Amount
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[500, 1000, 2000, 5000, 10000, 25000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDonationAmount(amount.toString())}
                          className={`py-2 px-3 rounded-lg border-2 transition-all text-sm ${
                            donationAmount === amount.toString()
                              ? "border-[#10b981] bg-[#ecfdf5] text-[#10b981] font-semibold"
                              : "border-gray-300 text-gray-700 hover:border-[#10b981]"
                          }`}
                          suppressHydrationWarning
                        >
                          ₹{amount}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Or enter custom amount
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter amount"
                      min="1"
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                      required
                      suppressHydrationWarning
                    />
                  </div>

                  {/* Donor Information */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="text"
                        value={donorName}
                        onChange={(e) => setDonorName(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={donorEmail}
                        onChange={(e) => setDonorEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="tel"
                        value={donorPhone}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
                          if (value.length <= 10) {
                            setDonorPhone(value);
                          }
                        }}
                        placeholder="9876543210"
                        maxLength={10}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#10b981] focus:border-transparent"
                        required
                        suppressHydrationWarning
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    size="lg"
                    className="w-full bg-[#10b981] hover:bg-[#059669] text-white"
                    disabled={isSubmitting || !donationAmount}
                  >
                    {isSubmitting
                      ? "Processing..."
                      : `Donate ₹${donationAmount || "0"}`}
                    <ArrowRight className="ml-2 h-5 w-5 inline" />
                  </Button>

                  <p className="text-xs text-gray-500 text-center">
                    Secure payment powered by trusted payment gateway
                  </p>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {trustStats.map((stat, index) => (
              <Card key={index} hover className="p-6 text-center">
                <stat.icon className={`h-10 w-10 mx-auto mb-4 ${stat.color}`} />
                <div className="text-3xl font-bold text-gray-900 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Fundraisers */}
      <section className="py-16 bg-[#ecfdf5]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Trending Fundraisers
              </h2>
              <p className="text-gray-600">
                Most supported campaigns this week
              </p>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost">
                View All
                <ArrowRight className="ml-2 h-4 w-4 inline" />
              </Button>
            </Link>
          </div>
          
          {trendingCampaigns.length > 0 ? (
            <div className="relative">
              {/* Left Arrow */}
              {trendingCampaigns.length > 3 && (
                <button
                  onClick={() => {
                    setTrendingCampaignIndex((prev) =>
                      prev === 0 ? Math.max(0, trendingCampaigns.length - 3) : prev - 1
                    );
                  }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-[#10b981] text-white rounded-full p-3 shadow-xl hover:bg-[#059669] transition-all duration-200 flex-shrink-0"
                  aria-label="Previous campaigns"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
              )}

              {/* Cards Container */}
              <div className="overflow-hidden w-full">
                <div
                  className="flex transition-transform duration-300 ease-in-out gap-6"
                  style={{
                    transform: `translateX(-${trendingCampaignIndex * (100 / 3)}%)`,
                  }}
                >
                  {trendingCampaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex-shrink-0 w-full lg:w-[calc(33.333%-1rem)]"
                    >
                      <CampaignCard {...campaign} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Arrow */}
              {trendingCampaigns.length > 3 && (
                <button
                  onClick={() => {
                    setTrendingCampaignIndex((prev) =>
                      prev >= Math.max(0, trendingCampaigns.length - 3)
                        ? 0
                        : prev + 1
                    );
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-[#10b981] text-white rounded-full p-3 shadow-xl hover:bg-[#059669] transition-all duration-200 flex-shrink-0"
                  aria-label="Next campaigns"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No trending campaigns at the moment
            </div>
          )}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Making a difference is simple. Follow these easy steps to start
              helping today.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {howItWorks.map((step) => (
              <Card key={step.step} hover className="p-6 text-center">
                <div className="bg-[#10b981] text-white w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {step.step}
                </div>
                <step.icon className="h-8 w-8 mx-auto mb-4 text-[#10b981]" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 text-sm">{step.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-16 bg-white">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Success Stories
            </h2>
            <p className="text-lg text-gray-600">
              Real impact from real people
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {successStories.length > 0 ? (
              successStories.map((story, index) => (
                <Card key={index} hover className="overflow-hidden">
                  <div className="relative h-64 w-full bg-gray-200">
                    <Image
                      src={story.image}
                      alt={story.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-semibold text-[#10b981]">
                        Success Story
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      {story.title}
                    </h3>
                    <p className="text-gray-600 mb-4">{story.description}</p>
                    <div className="text-lg font-bold text-[#10b981]">
                      Raised: {story.raised}{" "}
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <p>No success stories available yet</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Partners */}
      {(healthPartners.length > 0 ||
        foodPartners.length > 0 ||
        hospitalPartners.length > 0 ||
        medicinePartners.length > 0 ||
        pathologyPartners.length > 0) && (
        <section className="py-16 bg-[#ecfdf5]">
          <div className="w-full px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Partners
              </h2>
              <p className="text-lg text-gray-600">
                Trusted by leading health and food organizations
              </p>
            </div>

            {/* Health Partners */}
            {healthPartners.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Doctor's for u
                </h3>
                <div className="relative">
                  {healthPartners.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setHealthPartnerIndex(
                            Math.max(0, healthPartnerIndex - 1),
                          )
                        }
                        disabled={healthPartnerIndex === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          healthPartnerIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          const maxIndex = isMobile
                            ? healthPartners.length - 1
                            : healthPartners.length - 4;
                          setHealthPartnerIndex(
                            Math.min(maxIndex, healthPartnerIndex + 1),
                          );
                        }}
                        disabled={
                          healthPartnerIndex >=
                          (isMobile
                            ? healthPartners.length - 1
                            : healthPartners.length - 4)
                        }
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          healthPartnerIndex >=
                          (isMobile
                            ? healthPartners.length - 1
                            : healthPartners.length - 4)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                  <div className="overflow-hidden">
                    <div
                      className="flex gap-6 transition-transform duration-300 ease-in-out"
                      style={{
                        transform:
                          healthPartners.length > 1
                            ? isMobile
                              ? `translateX(calc(-${healthPartnerIndex} * (100% + 1.5rem)))`
                              : `translateX(calc(-${healthPartnerIndex} * (25% + 1.5rem)))`
                            : "none",
                      }}
                    >
                      {healthPartners.map((partner) => (
                        <div
                          key={partner._id || partner.id || Math.random()}
                          className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                        >
                          <Card
                            hover
                            className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                            onClick={() =>
                              router.push(
                                `/partners/health/${partner._id || partner.id}`,
                              )
                            }
                          >
                            <div className="relative w-full h-48 bg-gray-100">
                              {partner.photo || partner.logo ? (
                                <Image
                                  src={partner.photo || partner.logo}
                                  alt={partner.name || "Health Partner"}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {partner.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-4">
                                {partner.description}
                              </p>

                              {/* Programs */}
                              {partner.programs &&
                                partner.programs.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-gray-900 mb-2">
                                      Programs:
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {partner.programs
                                        .slice(0, 4)
                                        .map(
                                          (program: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                            >
                                              {program}
                                            </span>
                                          ),
                                        )}
                                      {partner.programs.length > 4 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                          +{partner.programs.length - 4} more...
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}


                              {/* Action Buttons */}
                              <div
                                className="grid grid-cols-2 gap-2 mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/partners/health/${partner._id || partner.id}`,
                                    );
                                  }}
                                >
                                  <Ticket className="h-3 w-3" />
                                  Consult Now
                                </button>
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const shareUrl = `${window.location.origin}/partners/health/${partner._id || partner.id}`;
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: partner.name || "Partner",
                                          text: `Check out ${partner.name || "this partner"}`,
                                          url: shareUrl,
                                        })
                                        .catch(() => {});
                                    } else {
                                      navigator.clipboard.writeText(shareUrl);
                                      showToast(
                                        "Link copied to clipboard!",
                                        "success",
                                      );
                                    }
                                  }}
                                >
                                  <Share2 className="h-3 w-3" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Food Partners */}
            {foodPartners.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Food Partners
                </h3>
                <div className="relative">
                  {foodPartners.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setFoodPartnerIndex(Math.max(0, foodPartnerIndex - 1))
                        }
                        disabled={foodPartnerIndex === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          foodPartnerIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          const maxIndex = isMobile
                            ? foodPartners.length - 1
                            : foodPartners.length - 4;
                          setFoodPartnerIndex(
                            Math.min(maxIndex, foodPartnerIndex + 1),
                          );
                        }}
                        disabled={
                          foodPartnerIndex >=
                          (isMobile
                            ? foodPartners.length - 1
                            : foodPartners.length - 4)
                        }
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          foodPartnerIndex >=
                          (isMobile
                            ? foodPartners.length - 1
                            : foodPartners.length - 4)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                  <div className="overflow-hidden">
                    <div
                      className="flex gap-6 transition-transform duration-300 ease-in-out"
                      style={{
                        transform:
                          foodPartners.length > 1
                            ? isMobile
                              ? `translateX(calc(-${foodPartnerIndex} * (100% + 1.5rem)))`
                              : `translateX(calc(-${foodPartnerIndex} * (25% + 1.5rem)))`
                            : "none",
                      }}
                    >
                      {foodPartners.map((partner) => (
                        <div
                          key={partner._id || partner.id || Math.random()}
                          className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                        >
                          <Card
                            hover
                            className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                            onClick={() =>
                              router.push(
                                `/partners/food/${partner._id || partner.id}`,
                              )
                            }
                          >
                            <div className="relative w-full h-48 bg-gray-100">
                              {partner.photo || partner.logo ? (
                                <Image
                                  src={partner.photo || partner.logo}
                                  alt={partner.name || "Food Partner"}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {partner.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-4">
                                {partner.description}
                              </p>

                              {/* Programs */}
                              {partner.programs &&
                                partner.programs.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-gray-900 mb-2">
                                      Programs:
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {partner.programs
                                        .slice(0, 4)
                                        .map(
                                          (program: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                            >
                                              {program}
                                            </span>
                                          ),
                                        )}
                                      {partner.programs.length > 4 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                          +{partner.programs.length - 4} more...
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}


                              {/* Action Buttons */}
                              <div
                                className="grid grid-cols-2 gap-2 mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/partners/food/${partner._id || partner.id}`,
                                    );
                                  }}
                                >
                                  <Ticket className="h-3 w-3 mr-1" />
                                  Get Coupon
                                </Button>
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const shareUrl = `${window.location.origin}/partners/food/${partner._id || partner.id}`;
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: partner.name || "Partner",
                                          text: `Check out ${partner.name || "this partner"}`,
                                          url: shareUrl,
                                        })
                                        .catch(() => {});
                                    } else {
                                      navigator.clipboard.writeText(shareUrl);
                                      showToast(
                                        "Link copied to clipboard!",
                                        "success",
                                      );
                                    }
                                  }}
                                >
                                  <Share2 className="h-3 w-3" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Hospital Partners */}
            {hospitalPartners.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Hospital Partners
                </h3>
                <div className="relative">
                  {hospitalPartners.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setHospitalPartnerIndex(
                            Math.max(0, hospitalPartnerIndex - 1),
                          )
                        }
                        disabled={hospitalPartnerIndex === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          hospitalPartnerIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          const maxIndex = isMobile
                            ? hospitalPartners.length - 1
                            : hospitalPartners.length - 4;
                          setHospitalPartnerIndex(
                            Math.min(maxIndex, hospitalPartnerIndex + 1),
                          );
                        }}
                        disabled={
                          hospitalPartnerIndex >=
                          (isMobile
                            ? hospitalPartners.length - 1
                            : hospitalPartners.length - 4)
                        }
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          hospitalPartnerIndex >=
                          (isMobile
                            ? hospitalPartners.length - 1
                            : hospitalPartners.length - 4)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                  <div className="overflow-hidden">
                    <div
                      className="flex gap-6 transition-transform duration-300 ease-in-out"
                      style={{
                        transform:
                          hospitalPartners.length > 1
                            ? isMobile
                              ? `translateX(calc(-${hospitalPartnerIndex} * (100% + 1.5rem)))`
                              : `translateX(calc(-${hospitalPartnerIndex} * (25% + 1.5rem)))`
                            : "none",
                      }}
                    >
                      {hospitalPartners.map((partner) => (
                        <div
                          key={partner._id || partner.id || Math.random()}
                          className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                        >
                          <Card
                            hover
                            className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                            onClick={() =>
                              router.push(
                                `/partners/hospital/${partner._id || partner.id}`,
                              )
                            }
                          >
                            <div className="relative w-full h-48 bg-gray-100">
                              {partner.photo || partner.logo ? (
                                <Image
                                  src={partner.photo || partner.logo}
                                  alt={partner.name || "Hospital Partner"}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {partner.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-4">
                                {partner.description}
                              </p>

                              {partner.programs &&
                                partner.programs.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-gray-900 mb-2">
                                      Services:
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {partner.programs
                                        .slice(0, 4)
                                        .map(
                                          (program: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                            >
                                              {program}
                                            </span>
                                          ),
                                        )}
                                      {partner.programs.length > 4 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                          +{partner.programs.length - 4} more...
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div className="mb-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">Impact:</span>
                                  <span className="font-semibold text-gray-900">
                                    {partner.impact || "Making a difference"}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Since {partner.since || "2020"}
                                </div>
                              </div>

                              <div
                                className="grid grid-cols-2 gap-2 mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/partners/hospital/${partner._id || partner.id}`,
                                    );
                                  }}
                                >
                                  <Ticket className="h-3 w-3" />
                                  Consult Now
                                </button>
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const shareUrl = `${window.location.origin}/partners/hospital/${partner._id || partner.id}`;
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: partner.name || "Partner",
                                          text: `Check out ${partner.name || "this partner"}`,
                                          url: shareUrl,
                                        })
                                        .catch(() => {});
                                    } else {
                                      navigator.clipboard.writeText(shareUrl);
                                      showToast(
                                        "Link copied to clipboard!",
                                        "success",
                                      );
                                    }
                                  }}
                                >
                                  <Share2 className="h-3 w-3" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Medicine/Pharmacy Partners */}
            {medicinePartners.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Medicine/Pharmacy Partners
                </h3>
                <div className="relative">
                  {medicinePartners.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setMedicinePartnerIndex(
                            Math.max(0, medicinePartnerIndex - 1),
                          )
                        }
                        disabled={medicinePartnerIndex === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          medicinePartnerIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          const maxIndex = isMobile
                            ? medicinePartners.length - 1
                            : medicinePartners.length - 4;
                          setMedicinePartnerIndex(
                            Math.min(maxIndex, medicinePartnerIndex + 1),
                          );
                        }}
                        disabled={
                          medicinePartnerIndex >=
                          (isMobile
                            ? medicinePartners.length - 1
                            : medicinePartners.length - 4)
                        }
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          medicinePartnerIndex >=
                          (isMobile
                            ? medicinePartners.length - 1
                            : medicinePartners.length - 4)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                  <div className="overflow-hidden">
                    <div
                      className="flex gap-6 transition-transform duration-300 ease-in-out"
                      style={{
                        transform:
                          medicinePartners.length > 1
                            ? isMobile
                              ? `translateX(calc(-${medicinePartnerIndex} * (100% + 1.5rem)))`
                              : `translateX(calc(-${medicinePartnerIndex} * (25% + 1.5rem)))`
                            : "none",
                      }}
                    >
                      {medicinePartners.map((partner) => (
                        <div
                          key={partner._id || partner.id || Math.random()}
                          className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                        >
                          <Card
                            hover
                            className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                            onClick={() =>
                              router.push(
                                `/partners/medicine/${partner._id || partner.id}`,
                              )
                            }
                          >
                            <div className="relative w-full h-48 bg-gray-100">
                              {partner.photo || partner.logo ? (
                                <Image
                                  src={partner.photo || partner.logo}
                                  alt={partner.name || "Medicine Partner"}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {partner.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-4">
                                {partner.description}
                              </p>

                              {partner.programs &&
                                partner.programs.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-gray-900 mb-2">
                                      Services:
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {partner.programs
                                        .slice(0, 4)
                                        .map(
                                          (program: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                            >
                                              {program}
                                            </span>
                                          ),
                                        )}
                                      {partner.programs.length > 4 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                          +{partner.programs.length - 4} more...
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div className="mb-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">Impact:</span>
                                  <span className="font-semibold text-gray-900">
                                    {partner.impact || "Making a difference"}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Since {partner.since || "2020"}
                                </div>
                              </div>

                              <div
                                className="grid grid-cols-2 gap-2 mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/partners/medicine/${partner._id || partner.id}`,
                                    );
                                  }}
                                >
                                  <Ticket className="h-3 w-3" />
                                  Consult Now
                                </button>
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const shareUrl = `${window.location.origin}/partners/medicine/${partner._id || partner.id}`;
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: partner.name || "Partner",
                                          text: `Check out ${partner.name || "this partner"}`,
                                          url: shareUrl,
                                        })
                                        .catch(() => {});
                                    } else {
                                      navigator.clipboard.writeText(shareUrl);
                                      showToast(
                                        "Link copied to clipboard!",
                                        "success",
                                      );
                                    }
                                  }}
                                >
                                  <Share2 className="h-3 w-3" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Pathology Lab Partners */}
            {pathologyPartners.length > 0 && (
              <div className="mb-16">
                <h3 className="text-2xl font-bold text-gray-900 mb-8 text-center">
                  Pathology Lab Partners
                </h3>
                <div className="relative">
                  {pathologyPartners.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setPathologyPartnerIndex(
                            Math.max(0, pathologyPartnerIndex - 1),
                          )
                        }
                        disabled={pathologyPartnerIndex === 0}
                        className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          pathologyPartnerIndex === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronLeft className="h-6 w-6 text-gray-700" />
                      </button>
                      <button
                        onClick={() => {
                          const maxIndex = isMobile
                            ? pathologyPartners.length - 1
                            : pathologyPartners.length - 4;
                          setPathologyPartnerIndex(
                            Math.min(maxIndex, pathologyPartnerIndex + 1),
                          );
                        }}
                        disabled={
                          pathologyPartnerIndex >=
                          (isMobile
                            ? pathologyPartners.length - 1
                            : pathologyPartners.length - 4)
                        }
                        className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white rounded-full p-2 shadow-lg hover:bg-gray-50 transition-all ${
                          pathologyPartnerIndex >=
                          (isMobile
                            ? pathologyPartners.length - 1
                            : pathologyPartners.length - 4)
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:scale-110"
                        }`}
                      >
                        <ChevronRight className="h-6 w-6 text-gray-700" />
                      </button>
                    </>
                  )}
                  <div className="overflow-hidden">
                    <div
                      className="flex gap-6 transition-transform duration-300 ease-in-out"
                      style={{
                        transform:
                          pathologyPartners.length > 1
                            ? isMobile
                              ? `translateX(calc(-${pathologyPartnerIndex} * (100% + 1.5rem)))`
                              : `translateX(calc(-${pathologyPartnerIndex} * (25% + 1.5rem)))`
                            : "none",
                      }}
                    >
                      {pathologyPartners.map((partner) => (
                        <div
                          key={partner._id || partner.id || Math.random()}
                          className="flex-shrink-0 w-full md:w-[calc(50%-12px)] lg:w-[calc(25%-18px)]"
                        >
                          <Card
                            hover
                            className="overflow-hidden bg-white rounded-lg cursor-pointer h-full"
                            onClick={() =>
                              router.push(
                                `/partners/pathology/${partner._id || partner.id}`,
                              )
                            }
                          >
                            <div className="relative w-full h-48 bg-gray-100">
                              {partner.photo || partner.logo ? (
                                <Image
                                  src={partner.photo || partner.logo}
                                  alt={partner.name || "Pathology Partner"}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                  No Image
                                </div>
                              )}
                            </div>
                            <div className="p-5">
                              <h4 className="text-lg font-bold text-gray-900 mb-2">
                                {partner.name}
                              </h4>
                              <p className="text-sm text-gray-600 mb-3 line-clamp-4">
                                {partner.description}
                              </p>

                              {partner.programs &&
                                partner.programs.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-semibold text-gray-900 mb-2">
                                      Tests:
                                    </h5>
                                    <div className="flex flex-wrap gap-1.5">
                                      {partner.programs
                                        .slice(0, 4)
                                        .map(
                                          (program: string, index: number) => (
                                            <span
                                              key={index}
                                              className="px-2 py-0.5 bg-[#ecfdf5] text-[#10b981] text-xs font-medium rounded"
                                            >
                                              {program}
                                            </span>
                                          ),
                                        )}
                                      {partner.programs.length > 4 && (
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                                          +{partner.programs.length - 4} more...
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                )}

                              <div className="mb-3 pt-3 border-t border-gray-200">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-600">Impact:</span>
                                  <span className="font-semibold text-gray-900">
                                    {partner.impact || "Making a difference"}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Since {partner.since || "2020"}
                                </div>
                              </div>

                              <div
                                className="grid grid-cols-2 gap-2 mt-3"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(
                                      `/partners/pathology/${partner._id || partner.id}`,
                                    );
                                  }}
                                >
                                  <Ticket className="h-3 w-3 mr-1" />
                                  Get Coupon
                                </Button>
                                <button
                                  className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-semibold text-xs py-2 px-2 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 shadow-md hover:shadow-lg"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const shareUrl = `${window.location.origin}/partners/pathology/${partner._id || partner.id}`;
                                    if (navigator.share) {
                                      navigator
                                        .share({
                                          title: partner.name || "Partner",
                                          text: `Check out ${partner.name || "this partner"}`,
                                          url: shareUrl,
                                        })
                                        .catch(() => {});
                                    } else {
                                      navigator.clipboard.writeText(shareUrl);
                                      showToast(
                                        "Link copied to clipboard!",
                                        "success",
                                      );
                                    }
                                  }}
                                >
                                  <Share2 className="h-3 w-3" />
                                  Share
                                </button>
                              </div>
                            </div>
                          </Card>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#10b981] to-[#059669] text-white">
        <div className="w-full px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 text-green-100">
            Join our community of changemakers and start making an impact today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/campaigns">
              <Button
                size="lg"
                variant="outline"
                className="bg-white text-[#10b981] border-white hover:bg-gray-100"
              >
                Browse Campaigns
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10"
              >
                Start Your Fundraiser
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Coupon Modal */}
      {showCouponModal && generatedCoupon && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => {
                setShowCouponModal(false);
                setGeneratedCoupon(null);
                setSelectedFoodPartner(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center mb-6">
              <div className="bg-[#10b981] rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Coupon Generated!
              </h2>
              <p className="text-gray-600">Your coupon is ready to use</p>
            </div>

            <Card className="p-6 mb-4">
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Coupon Code</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold font-mono text-[#10b981] flex-1">
                      {generatedCoupon.couponCode || generatedCoupon.code}
                    </p>
                    <button
                      onClick={handleCopyCouponCode}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Copy code"
                    >
                      {copied ? (
                        <CheckCircle className="h-5 w-5 text-[#10b981]" />
                      ) : (
                        <Copy className="h-5 w-5 text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                {(selectedFoodPartner || selectedHealthPartner) && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Partner</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {(selectedFoodPartner || selectedHealthPartner)?.name}
                    </p>
                  </div>
                )}

                {generatedCoupon.expiryDate && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Valid Until</p>
                    <p className="text-base font-semibold text-gray-900">
                      {new Date(generatedCoupon.expiryDate).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-center">
                    {generatedCoupon.qrCode?.url || generatedCoupon.qrCode ? (
                      <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                        <Image
                          src={
                            generatedCoupon.qrCode?.url ||
                            generatedCoupon.qrCode
                          }
                          alt="QR Code"
                          width={200}
                          height={200}
                          className="rounded"
                          unoptimized
                        />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          Scan to redeem
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-100 p-8 rounded-lg">
                        <QrCode className="h-16 w-16 text-gray-400 mx-auto" />
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          QR Code not available
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowCouponModal(false);
                  setGeneratedCoupon(null);
                  setSelectedFoodPartner(null);
                  setSelectedHealthPartner(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Close
              </Button>
              <Button
                onClick={() => {
                  router.push("/dashboard");
                }}
                className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white"
              >
                View in Dashboard
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
