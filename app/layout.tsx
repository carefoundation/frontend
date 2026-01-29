import ClientComponentsWrapper from "@/components/layout/ClientComponentsWrapper";
import { generateMetadata as generateSEOMetadata } from "@/lib/seo";
import type { Metadata, Viewport } from "next";
import dynamic from "next/dynamic";
import { Inter, Roboto_Mono } from "next/font/google";
import "./globals.css";

const Header = dynamic(() => import("@/components/layout/Header"), {
  ssr: true,
});

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const robotoMono = Roboto_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = generateSEOMetadata({
  title: "Vishal Rajput - Crowdfunding & Donation Platform",
  description:
    "Together We Can Save Lives - Support causes, start fundraisers, and make a difference",
  keywords: ["donation", "crowdfunding", "charity", "fundraiser", "non-profit"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body
        className={`${inter.variable} ${robotoMono.variable} antialiased`}
        suppressHydrationWarning
      >
        <ClientComponentsWrapper>
          <Header />
          {children}
        </ClientComponentsWrapper>
      </body>
    </html>
  );
}
