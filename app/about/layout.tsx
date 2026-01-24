import { Metadata } from 'next';
import { generateMetadata as generateSEOMetadata } from '@/lib/seo';

export const metadata: Metadata = generateSEOMetadata({
  title: 'About Us',
  description: 'Learn about Care Foundation Trust® - Our mission, journey, and impact. Established in 1997, we have raised ₹2.5Cr+ and impacted 15,000+ lives across India.',
  canonical: '/about',
  keywords: ['about', 'mission', 'non-profit', 'charity', 'foundation', 'social impact'],
  ogType: 'website',
});

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

