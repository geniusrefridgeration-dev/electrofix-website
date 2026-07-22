import { MetadataRoute } from 'next'
const BASE = process.env.NEXT_PUBLIC_SITE_URL || 'https://electrofix.in'
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/bookings', '/profile'] }],
    sitemap: `${BASE}/sitemap.xml`,
    host: BASE,
  }
}
