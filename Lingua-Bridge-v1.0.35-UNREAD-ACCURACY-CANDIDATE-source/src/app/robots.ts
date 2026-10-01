import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://lingua-github-import.vercel.app';
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/downloads', '/install', '/privacy', '/terms'],
      disallow: ['/admin', '/api/', '/billing', '/dashboard'],
    },
    sitemap: `${site.replace(/\/$/, '')}/sitemap.xml`,
  };
}
