import { MetadataRoute } from 'next'
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://electrofix.ind.in'
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${BASE}`,          lastModified: new Date(), changeFrequency: 'weekly',  priority: 1.0 },
    { url: `${BASE}/home`,     lastModified: new Date(), changeFrequency: 'weekly',  priority: 0.9 },
    { url: `${BASE}/register`, lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.6 },
    { url: `${BASE}/login`,    lastModified: new Date(), changeFrequency: 'yearly',  priority: 0.5 },
  ]
}
