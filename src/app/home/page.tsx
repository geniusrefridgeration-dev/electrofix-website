'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Zap, ArrowRight, Wrench, ChevronRight } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import type { Service } from '@/types'
import Image from 'next/image'
import clsx from 'clsx'
import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'
import { getLocalizedName } from '@/lib/getLocalizedName'

function ServiceSkeleton() {
  return (
    <div className="card p-5 flex flex-col items-center gap-3">
      <div className="skeleton w-14 h-14 rounded-2xl" />
      <div className="skeleton w-20 h-4" />
    </div>
  )
}

export default function HomePage() {
  const router = useRouter()
  const { customer, setBookingService, language } = useStore()
  const t = useT()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.get('/customer/services').then((res) => {
      setServices(res.data.services)
    }).finally(() => setLoading(false))
  }, [])

  const filtered = services.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.nameHindi?.includes(search)) ||
    (s.nameHinglish?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleSelectService = (service: Service) => {
    if (!customer) { router.push('/login'); return }
    setBookingService(service)
    router.push('/book')
  }

  return (
    <Providers>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 space-y-8">
          {/* Hero */}
          <section className="animate-fade-up">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-500 to-primary-700 p-8 md:p-10">
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="absolute rounded-full bg-white"
                    style={{ width: `${60 + i * 30}px`, height: `${60 + i * 30}px`,
                      top: `${-20 + i * 15}%`, right: `${-5 + i * 8}%`, opacity: 0.3 - i * 0.04 }} />
                ))}
              </div>

              <div className="relative">
                <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-1.5 mb-4">
                  <Zap size={14} className="text-white" fill="white" />
                  <span className="text-white text-xs font-semibold">ElectroFix</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-white leading-tight">
                  {t('heroTitle')}<br />
                  <span className="text-yellow-300">{t('heroHighlight')}</span>
                </h1>
                <p className="text-white/80 mt-2 text-sm md:text-base max-w-sm">{t('heroSubtitle')}</p>

                {!customer && (
                  <button
                    onClick={() => router.push('/register')}
                    className="mt-5 inline-flex items-center gap-2 bg-white text-primary-600 font-bold px-6 py-3 rounded-xl text-sm hover:bg-yellow-50 transition-colors active:scale-95">
                    {t('bookNow')} <ArrowRight size={16} />
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Services */}
          <section className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-display font-bold text-[var(--text)]">{t('ourServices')}</h2>
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  className="input pl-9 py-2 w-44 text-sm"
                  placeholder={t('searchServices')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {[...Array(8)].map((_, i) => <ServiceSkeleton key={i} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="card flex flex-col items-center py-12 text-[var(--text-muted)]">
                <Wrench size={40} className="mb-3 opacity-30" />
                <p className="font-medium">{t('noData')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {filtered.map((service, i) => (
                  <button
                    key={service._id}
                    onClick={() => handleSelectService(service)}
                    className="service-card group animate-fade-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {service.image ? (
                      <div className="w-14 h-14 rounded-2xl overflow-hidden relative flex-shrink-0">
                        <Image src={service.image} alt={service.name} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                        <Wrench size={24} className="text-primary-500" />
                      </div>
                    )}
                    <p className="font-semibold text-sm text-[var(--text)] group-hover:text-primary-500 transition-colors">
                      {service.name}
                    </p>
                    <ChevronRight size={14} className="text-[var(--text-muted)] group-hover:text-primary-500 transition-colors" />
                  </button>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    </Providers>
  )
}
