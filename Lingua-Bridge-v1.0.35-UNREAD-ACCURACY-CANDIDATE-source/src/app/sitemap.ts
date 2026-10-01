import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lingua-github-import.vercel.app').replace(/\/$/, '');
  const lastModified = new Date('2026-09-25T00:00:00.000Z');
  return [
    { url: `${site}/`, lastModified, changeFrequency: 'weekly', priority: 1 },
    { url: `${site}/downloads`, lastModified, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${site}/install`, lastModified, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site}/privacy`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${site}/terms`, lastModified, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
