import type { Metadata, Viewport } from 'next'
import './globals.css'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://electrofix.ind.in'
const GA_ID    = process.env.NEXT_PUBLIC_GA_ID || ''
const PHONE    = process.env.NEXT_PUBLIC_SHOP_PHONE || ''

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'ElectroFix — Genius Refrigeration | AC, Fridge, Washing Machine Repair',
    template: '%s | ElectroFix',
  },
  description: 'AC, Refrigerator, Washing Machine, RO & Geyser repair at your doorstep. Same-day service, verified technicians, affordable pricing.',
  keywords: [
    'AC repair', 'Refrigerator repair', 'Washing Machine repair',
    'RO service', 'Geyser repair', 'home appliance repair',
    'ElectroFix', 'genius refrigeration', 'appliance repair near me',
  ],
  authors:   [{ name: 'ElectroFix' }],
  creator:   'ElectroFix',
  publisher: 'ElectroFix',
  robots: { index: true, follow: true },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
  },
  icons: {
    icon:     [{ url: '/favicon.png', sizes: '64x64', type: 'image/png' }],
    apple:    [{ url: '/apple-touch-icon.png', sizes: '180x180'        }],
    shortcut:  '/favicon.png',
  },
  openGraph: {
    type:        'website',
    locale:      'en_IN',
    url:         SITE_URL,
    siteName:    'ElectroFix',
    title:       'ElectroFix — Genius Refrigeration',
    description: 'AC, Refrigerator, Washing Machine, RO & Geyser repair at your doorstep. Same-day service.',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'ElectroFix — Genius Refrigeration' }],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'ElectroFix — Genius Refrigeration',
    description: 'Home appliance repair at your doorstep. Same-day service.',
    images:      ['/og-image.png'],
  },
}

export const viewport: Viewport = {
  width:      'device-width',
  initialScale: 1,
  themeColor: '#EF4444',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* LocalBusiness Schema Markup */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          '@id': SITE_URL,
          name: 'ElectroFix — Genius Refrigeration',
          description: 'Home appliance repair — AC, Refrigerator, Washing Machine, RO, Geyser',
          url: SITE_URL,
          telephone: PHONE,
          image: `${SITE_URL}/og-image.png`,
          logo:  `${SITE_URL}/logo-icon.png`,
          priceRange: '₹₹',
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'IN',
          },
          hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'Appliance Repair Services',
            itemListElement: [
              'AC Repair & Service', 'Refrigerator Repair',
              'Washing Machine Repair', 'RO Service', 'Geyser Repair',
            ].map(name => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
          },
        }) }} />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* Google Analytics */}
        {GA_ID && <>
          <script async src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} />
          <script dangerouslySetInnerHTML={{ __html:
            `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_ID}');`
          }} />
        </>}
      </head>
      <body>{children}</body>
    </html>
  )
}
