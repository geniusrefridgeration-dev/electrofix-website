/** @type {import('next').NextConfig} */
const nextConfig = {
  // Image optimization
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Compression
  compress: true,

  // Security headers
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options',        value: 'DENY' },
        { key: 'X-XSS-Protection',       value: '1; mode=block' },
        { key: 'Referrer-Policy',        value: 'strict-origin-when-cross-origin' },
        { key: 'Permissions-Policy',     value: 'camera=(), microphone=(), geolocation=(self)' },
      ],
    }]
  },

  // Redirects
  async redirects() {
    return [
      { source: '/', destination: '/home', permanent: false },
    ]
  },
}

module.exports = nextConfig
