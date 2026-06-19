'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import type { Service } from '@/types'
import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'
import {
  Phone, MessageCircle, Star, ChevronDown, ChevronUp,
  CheckCircle, Clock, Shield, Wrench, Award, MapPin, Users, Zap
} from 'lucide-react'

const PHONE = process.env.NEXT_PUBLIC_PHONE || '+919876543210'
const WA_MSG = encodeURIComponent('Hello ElectroFix! I need appliance repair service.')

const TRUST_STATS = [
  { icon: Users,  value: '500+', label: 'Customers Served' },
  { icon: Wrench, value: '10+',  label: 'Expert Technicians' },
  { icon: MapPin, value: '4+',   label: 'Cities Covered' },
  { icon: Award,  value: '5+',   label: 'Years Experience' },
]

const WHY_US = [
  { icon: CheckCircle, title: 'Verified Technicians',  desc: 'Background-checked, trained professionals' },
  { icon: Clock,       title: 'Same Day Service',      desc: 'Book now, get service today' },
  { icon: Shield,      title: 'Genuine Parts',         desc: 'Only original manufacturer parts' },
  { icon: Award,       title: 'Warranty on Service',   desc: '30-day warranty on all repairs' },
  { icon: Zap,         title: 'Affordable Pricing',    desc: 'Transparent pricing, no hidden charges' },
  { icon: Phone,       title: 'Quick Response',        desc: 'Call or WhatsApp for instant booking' },
]

const TESTIMONIALS = [
  { name: 'Rahul Sharma',   city: 'Raipur',   rating: 5, text: 'AC was repaired within 2 hours. Technician was professional and explained everything clearly. Highly recommend!' },
  { name: 'Priya Verma',    city: 'Bilaspur', rating: 5, text: 'Refrigerator was not cooling for 2 days. ElectroFix fixed it same day. Excellent service!' },
  { name: 'Amit Singh',     city: 'Durg',     rating: 5, text: 'Washing machine repair done perfectly. Very affordable and genuine parts used.' },
  { name: 'Sunita Agrawal', city: 'Raipur',   rating: 5, text: 'RO service done neatly. Technician arrived on time and was very knowledgeable.' },
]

const FAQS = [
  { q: 'AC repair/servicing mein kitna time lagta hai?',   a: 'Normal AC servicing 1-2 ghante mein hoti hai. Major repairs mein 2-4 ghante lag sakte hain.' },
  { q: 'Home visit charge kitna hai?',                     a: 'Home visit charge distance ke hisaab se ₹100-₹300 hota hai. Repair cost inspection ke baad batai jaati hai.' },
  { q: 'Kya repair par warranty milti hai?',              a: 'Haan! Har repair par 30 din ki warranty di jaati hai. Same problem wapas aaye to free service.' },
  { q: 'Kya genuine parts use kiye jaate hain?',          a: 'Bilkul! Hum sirf original manufacturer-approved parts use karte hain.' },
  { q: 'Same day service milti hai?',                      a: 'Haan, 8am-8pm booking par same day service available hai.' },
  { q: 'Konse appliances repair karte ho?',               a: 'AC, Refrigerator, Washing Machine, RO, Microwave, Geyser aur zyaatar home appliances.' },
]

const SERVICE_EMOJIS: Record<string, string> = {
  ac: '❄️', ro: '💧', 'washing machine': '🫧',
  refrigerator: '🧊', microwave: '📡', geyser: '🚿', default: '🔧',
}
function getEmoji(name: string) {
  const k = name.toLowerCase()
  return Object.entries(SERVICE_EMOJIS).find(([key]) => k.includes(key))?.[1] ?? SERVICE_EMOJIS.default
}

export default function HomePage() {
  const router = useRouter()
  const t = useT()
  const { setBookingService } = useStore()
  const [services,  setServices]  = useState<Service[]>([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [openFaq,   setOpenFaq]   = useState<number | null>(null)

  const fetchServices = useCallback(async () => {
    try {
      const res = await api.get('/customer/services')
      setServices(res.data.services || [])
    } catch {} finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchServices() }, [])

  const filtered = services.filter(s =>
    s.isActive && (s.name.toLowerCase().includes(search.toLowerCase()) || s.nameHindi?.includes(search))
  )

  const handleBook = (service?: Service) => {
    if (service) setBookingService(service)
    router.push('/book')
  }

  return (
    <Providers>
      <div className="min-h-screen bg-[var(--bg)]">
        <Navbar />

        {/* HERO */}
        <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary-400 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-400/30 rounded-full px-4 py-1.5 text-xs font-semibold text-green-300 mb-6">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Same Day Service Available
              </div>
              <h1 className="text-4xl md:text-5xl font-display font-black leading-tight mb-4">
                AC, Fridge &amp; Washing<br />
                Machine Repair<br />
                <span className="text-yellow-400">At Your Doorstep</span>
              </h1>
              <p className="text-white/80 text-lg mb-8 max-w-lg">
                Professional home appliance repair in Raipur. Verified technicians, genuine parts, 30-day warranty.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <button onClick={() => handleBook()}
                  className="btn-primary text-base px-6 py-3 text-white bg-primary-500 hover:bg-primary-600 rounded-xl font-bold flex items-center gap-2">
                  <Wrench size={18} /> Book Service Now
                </button>
                <a href={`tel:${PHONE}`}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-all">
                  <Phone size={18} /> Call Now
                </a>
                <a href={`https://wa.me/${PHONE.replace('+','')}?text=${WA_MSG}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-green-600 transition-all">
                  <MessageCircle size={18} /> WhatsApp
                </a>
              </div>
            </div>
            <div className="flex-shrink-0">
              <img src="/logo-icon.png" alt="ElectroFix Genius Refrigeration"
                className="w-48 h-48 md:w-56 md:h-56 object-contain drop-shadow-2xl" />
            </div>
          </div>
        </section>

        {/* TRUST STATS */}
        <section className="bg-primary-500 text-white py-8">
          <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {TRUST_STATS.map(({ icon: Icon, value, label }) => (
              <div key={label}>
                <Icon size={28} className="mx-auto mb-2 opacity-80" />
                <div className="text-3xl font-display font-black">{value}</div>
                <div className="text-white/80 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* SERVICES */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-[var(--text)] mb-2">Our Services</h2>
            <p className="text-[var(--text-muted)]">Expert repair for all major home appliances</p>
          </div>
          <div className="max-w-md mx-auto mb-8">
            <input className="input w-full text-center" placeholder="Search services... (AC, Fridge, RO...)"
              value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(6)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-[var(--border)] animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(sv => (
                <button key={sv._id} onClick={() => handleBook(sv)}
                  className="card p-6 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-200 group cursor-pointer">
                  <div className="text-4xl mb-3">{getEmoji(sv.name)}</div>
                  <h3 className="font-semibold text-[var(--text)] group-hover:text-primary-500 transition-colors">
                    {sv.name}
                  </h3>
                  <p className="text-xs text-[var(--text-muted)] mt-1">
                    {sv.hasCategories ? sv.categories.length : sv.problems.length} options
                  </p>
                  <span className="mt-3 inline-block text-xs text-primary-500 font-semibold group-hover:underline">
                    Book Now →
                  </span>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center py-10 text-[var(--text-muted)]">No services found</p>
              )}
            </div>
          )}
        </section>

        {/* WHY CHOOSE US */}
        <section className="bg-[var(--surface)] py-16">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-[var(--text)] mb-2">Why Choose ElectroFix?</h2>
              <p className="text-[var(--text-muted)]">Raipur ka most trusted appliance repair service</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
              {WHY_US.map(({ icon: Icon, title, desc }) => (
                <div key={title} className="card p-5 flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center flex-shrink-0">
                    <Icon size={22} className="text-primary-500" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--text)] text-sm mb-1">{title}</h3>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section className="max-w-6xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-[var(--text)] mb-2">Customer Reviews</h2>
            <div className="flex items-center justify-center gap-1 text-yellow-400 mb-1">
              {[1,2,3,4,5].map(s => <Star key={s} size={18} fill="currentColor" />)}
              <span className="ml-2 text-[var(--text)] font-bold text-sm">4.9/5</span>
            </div>
            <p className="text-[var(--text-muted)] text-sm">Based on 500+ reviews</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {TESTIMONIALS.map((r, i) => (
              <div key={i} className="card p-5">
                <div className="flex gap-0.5 text-yellow-400 mb-3">
                  {[...Array(r.rating)].map((_,j) => <Star key={j} size={14} fill="currentColor" />)}
                </div>
                <p className="text-sm text-[var(--text-muted)] italic leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold text-sm">
                    {r.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text)]">{r.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{r.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-[var(--surface)] py-16">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-3xl font-display font-bold text-[var(--text)] mb-2">Frequently Asked Questions</h2>
              <p className="text-[var(--text-muted)]">Aapke sawal, hamare jawaab</p>
            </div>
            <div className="space-y-3">
              {FAQS.map((faq, i) => (
                <div key={i} className="card overflow-hidden">
                  <button className="w-full flex items-center justify-between p-5 text-left"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}>
                    <span className="font-semibold text-[var(--text)] pr-4 text-sm">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp size={18} className="text-primary-500 flex-shrink-0" />
                      : <ChevronDown size={18} className="text-[var(--text-muted)] flex-shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5 text-sm text-[var(--text-muted)] leading-relaxed border-t border-[var(--border)] pt-4">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* FAQ Schema for SEO */}
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: FAQS.map(f => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            })}} />
          </div>
        </section>

        {/* BOTTOM CTA */}
        <section className="bg-gradient-to-r from-primary-600 to-primary-700 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold mb-3">Appliance Repair Chahiye?</h2>
            <p className="text-white/80 mb-8 text-lg">Abhi book karo — same day service available</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={() => handleBook()}
                className="bg-white text-primary-600 font-bold px-8 py-3 rounded-xl hover:bg-white/90 transition-all flex items-center gap-2">
                <Wrench size={18} /> Book Service
              </button>
              <a href={`tel:${PHONE}`}
                className="flex items-center gap-2 border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-all">
                <Phone size={18} /> {PHONE}
              </a>
              <a href={`https://wa.me/${PHONE.replace('+','')}?text=${WA_MSG}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-green-600 transition-all">
                <MessageCircle size={18} /> WhatsApp
              </a>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="bg-slate-900 text-white py-12">
          <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <img src="/logo-navbar.png" alt="ElectroFix" className="h-10 mb-4" />
              <p className="text-slate-400 text-sm leading-relaxed">
                Raipur ka trusted home appliance repair service. AC, Refrigerator, Washing Machine, RO aur zyada.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">Services</h3>
              <ul className="space-y-2 text-slate-400 text-sm">
                {['AC Repair','Refrigerator Repair','Washing Machine Repair','RO Repair','Geyser Repair','Microwave Repair'].map(s => (
                  <li key={s}>
                    <button onClick={() => handleBook()} className="hover:text-white transition-colors text-left">
                      • {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-sm uppercase tracking-wider text-slate-300">Contact</h3>
              <ul className="space-y-3 text-slate-400 text-sm">
                <li>
                  <a href={`tel:${PHONE}`} className="flex items-center gap-2 hover:text-white transition-colors">
                    <Phone size={14} /> {PHONE}
                  </a>
                </li>
                <li>
                  <a href={`https://wa.me/${PHONE.replace('+','')}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-white transition-colors">
                    <MessageCircle size={14} /> WhatsApp Us
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin size={14} /> Raipur, Chhattisgarh
                </li>
              </ul>
              <div className="mt-6">
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Service Areas</p>
                <p className="text-sm text-slate-400">Raipur • Bilaspur • Durg • Bhilai</p>
              </div>
            </div>
          </div>
          <div className="max-w-6xl mx-auto px-4 pt-6 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-2">
            <p className="text-slate-500 text-xs">
              © {new Date().getFullYear()} ElectroFix Genius Refrigeration. All rights reserved.
            </p>
            <div className="flex gap-4 text-xs text-slate-500">
              <Link href="/login" className="hover:text-slate-300">Login</Link>
              <Link href="/register" className="hover:text-slate-300">Register</Link>
              <Link href="/bookings" className="hover:text-slate-300">My Bookings</Link>
            </div>
          </div>
        </footer>

        {/* FLOATING WHATSAPP */}
        <a href={`https://wa.me/${PHONE.replace('+','')}?text=${WA_MSG}`}
          target="_blank" rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-xl hover:bg-green-600 hover:scale-110 transition-all duration-200"
          title="Chat on WhatsApp">
          <MessageCircle size={28} className="text-white" fill="white" />
        </a>
      </div>
    </Providers>
  )
}
