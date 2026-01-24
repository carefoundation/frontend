import { Metadata } from 'next';

interface SEOConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'profile';
  keywords?: string[];
  noIndex?: boolean;
}

const defaultOgImage = '/Logo.png';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carefoundation.org';

export function generateMetadata(config: SEOConfig): Metadata {
  const { title, description, canonical, ogImage = defaultOgImage, ogType = 'website', keywords = [], noIndex = false } = config;

  const fullTitle = `${title} | Care Foundation Trust®`;
  const canonicalUrl = canonical || siteUrl;
  let ogImageUrl = ogImage;
  if (!ogImage.startsWith('http')) {
    ogImageUrl = `${siteUrl}${ogImage}`;
  }

  return {
    title: fullTitle,
    description,
    keywords: keywords.length > 0 ? keywords.join(', ') : undefined,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalUrl,
      siteName: 'Care Foundation Trust®',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      type: ogType,
      locale: 'en_US',
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImageUrl],
    },
    robots: {
      index: !noIndex,
      follow: !noIndex,
      googleBot: {
        index: !noIndex,
        follow: !noIndex,
      },
    },
  };
}

