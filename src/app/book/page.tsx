'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft, CheckCircle, Wrench, Tag, AlertCircle, IndianRupee, MapPin, Zap, Pencil, X, Home, Hash } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import type { Category, Problem, HomeVisitConfig } from '@/types'
import clsx from 'clsx'
import toast from 'react-hot-toast'
import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'
import dynamic from 'next/dynamic'
import type { AddressComponents } from '@/components/ui/LocationPicker'
const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })
import { getLocalizedName } from '@/lib/getLocalizedName'

type Step = 'category' | 'problem' | 'confirm' | 'success'


// ── Address Edit Section ─────────────────────────────────────────────────────
function AddressEditSection({ customer, t }: { customer: any; t: (k: any) => string }) {
  const { updateCustomer } = useStore()
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [showMap,  setShowMap]  = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [form, setForm] = useState({
    street: customer?.address?.street || '',
    city:   customer?.address?.city   || '',
    state:  customer?.address?.state  || '',
    pincode:customer?.address?.pincode|| '',
  })

  const handleMapSelect = (_lat: number, _lng: number, addr?: AddressComponents) => {
    setLocation({ lat: _lat, lng: _lng })
    if (addr) setForm(f => ({ ...f, street: addr.street||f.street, city: addr.city||f.city, state: addr.state||f.state, pincode: addr.pincode||f.pincode }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = {
        address: { ...form, fullAddress: `${form.street}, ${form.city}, ${form.state} - ${form.pincode}` },
      }
      if (location) payload.location = { type: 'Point', coordinates: [location.lng, location.lat] }
      const res = await api.put('/customer/auth/profile', payload)
      updateCustomer(res.data.customer)
      setEditing(false); setShowMap(false)
      toast.success('Address updated!')
    } catch { toast.error('Failed to update address') }
    finally { setSaving(false) }
  }

  const addr = customer?.address
  const display = addr?.fullAddress || [addr?.street, addr?.city].filter(Boolean).join(', ')

  if (!editing) {
    return (
      <div className="flex items-start gap-2 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3">
        <MapPin size={15} className="text-blue-500 mt-0.5 flex-shrink-0" />
        <div className="flex-1 text-xs text-blue-700 dark:text-blue-300">
          <p className="font-semibold mb-0.5">Service Address</p>
          <p>{display}</p>
        </div>
        <button onClick={() => setEditing(true)} className="flex-shrink-0 p-1 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-800/40 text-blue-500 transition-colors">
          <Pencil size={13} />
        </button>
      </div>
    )
  }

  return (
    <div className="border border-blue-200 dark:border-blue-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20">
        <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5"><MapPin size={12}/> Edit Service Address</span>
        <button onClick={() => { setEditing(false); setShowMap(false) }} className="text-blue-400 hover:text-blue-600"><X size={14}/></button>
      </div>
      <div className="p-3 space-y-2">
        <div className="relative">
          <Home size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/>
          <input className="input pl-8 text-sm" placeholder="Street / House No." value={form.street} onChange={e => setForm(f=>({...f,street:e.target.value}))} />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input text-sm" placeholder="City" value={form.city} onChange={e => setForm(f=>({...f,city:e.target.value}))} />
          <input className="input text-sm" placeholder="State" value={form.state} onChange={e => setForm(f=>({...f,state:e.target.value}))} />
        </div>
        <div className="relative">
          <Hash size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"/>
          <input className="input pl-8 text-sm" placeholder="Pincode" maxLength={6} value={form.pincode} onChange={e => setForm(f=>({...f,pincode:e.target.value}))} />
        </div>

        {/* Map toggle */}
        <button type="button" onClick={() => setShowMap(!showMap)}
          className={clsx('w-full flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-semibold transition-colors',
            showMap ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300')}>
          <span className="flex items-center gap-1.5"><MapPin size={12}/>{location ? '📍 Location pinned' : t('orPickOnMap')}</span>
          <span>{showMap ? '▲' : '▼'}</span>
        </button>
        {showMap && <LocationPicker onSelect={handleMapSelect} onDeselect={() => setLocation(null)} initialLat={23.2599} initialLng={77.4126} />}

        <div className="flex gap-2 pt-1">
          <button onClick={() => { setEditing(false); setShowMap(false) }} className="btn-outline flex-1 text-sm py-2">Cancel</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm py-2">{saving ? '...' : 'Save Address'}</button>
        </div>
      </div>
    </div>
  )
}

export default function BookPage() {
  const router = useRouter()
  const { customer, bookingFlow, setBookingCategory, setBookingProblem, clearBookingFlow, language } = useStore()
  const t = useT()
  const { service, category, problem } = bookingFlow

  const [step, setStep] = useState<Step>(service?.hasCategories ? 'category' : 'problem')
  const [loading, setLoading] = useState(false)
  const [bookingResult, setBookingResult] = useState<any>(null)
  const [visitConfig, setVisitConfig] = useState<HomeVisitConfig | null>(null)

  useEffect(() => {
    if (!service || !customer) { router.replace('/home'); return }
    // If no categories, skip to problem step
    if (!service.hasCategories) setStep('problem')
    // Fetch home visit config
    api.get('/customer/home-visit-config').then((res) => setVisitConfig(res.data.config)).catch(() => {})
  }, [service, customer])

  const handleCategorySelect = (cat: Category) => {
    setBookingCategory(cat)
    setStep('problem')
  }

  const handleProblemSelect = (prob: Problem) => {
    setBookingProblem(prob)
    setStep('confirm')
  }

  const handleBook = async () => {
    if (!service || !problem || !customer) return
    setLoading(true)
    try {
      const payload: any = {
        serviceId: service._id,
        problemId: problem._id,
      }
      if (service.hasCategories && category) payload.categoryId = category._id

      const res = await api.post('/customer/bookings', payload)
      setBookingResult(res.data)
      setStep('success')
      clearBookingFlow()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Booking failed')
    } finally { setLoading(false) }
  }

  const handleBack = () => {
    if (step === 'problem' && service?.hasCategories) { setBookingCategory(null); setStep('category') }
    else if (step === 'problem') router.push('/home')
    else if (step === 'confirm') { setBookingProblem(null); setStep('problem') }
    else router.push('/home')
  }

  // Step indicator
  // Single Record<Step, number> covers all keys — avoids TS narrowing issues
  // when picking between two differently-shaped lookup objects.
  const stepIndexMap: Record<Step, number> = service?.hasCategories
    ? { category: 0, problem: 1, confirm: 2, success: 3 }
    : { category: -1, problem: 0, confirm: 1, success: 2 }

  const steps = service?.hasCategories
    ? ['Category', 'Problem', 'Confirm']
    : ['Problem', 'Confirm']
  const currentIdx = stepIndexMap[step]

  if (!service) return null

  return (
    <Providers>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
          {step !== 'success' && (
            <>
              {/* Back button */}
              <button onClick={handleBack} className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6 transition-colors">
                <ChevronLeft size={18} /> {t('back')}
              </button>

              {/* Service info */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <Wrench size={22} className="text-primary-500" />
                </div>
                <div>
                  <p className="font-display font-bold text-[var(--text)] text-lg">{service.name}</p>
                  {category && <p className="text-sm text-[var(--text-muted)]">→ {category.name}</p>}
                </div>
              </div>

              {/* Step progress */}
              <div className="flex items-center gap-2 mb-8">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={clsx('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      i < (currentIdx ?? 0) ? 'bg-green-500 text-white' :
                      i === currentIdx ? 'bg-primary-500 text-white' :
                      'bg-[var(--border)] text-[var(--text-muted)]')}>
                      {i < (currentIdx ?? 0) ? '✓' : i + 1}
                    </div>
                    <span className={clsx('text-xs font-medium hidden sm:inline', i === currentIdx ? 'text-[var(--text)]' : 'text-[var(--text-muted)]')}>{s}</span>
                    {i < steps.length - 1 && <div className={clsx('flex-1 h-0.5 w-8', i < (currentIdx ?? 0) ? 'bg-green-400' : 'bg-[var(--border)]')} />}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* STEP: Category */}
          {step === 'category' && (
            <div className="animate-fade-up">
              <h2 className="text-xl font-display font-bold text-[var(--text)] mb-4">{t('selectCategory')}</h2>
              <div className="grid grid-cols-2 gap-3">
                {service.categories.filter(c => c.isActive).map((cat) => (
                  <button key={cat._id} onClick={() => handleCategorySelect(cat)}
                    className="service-card hover:shadow-lg">
                    <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                      <Tag size={20} className="text-primary-500" />
                    </div>
                    <p className="font-semibold text-sm text-[var(--text)]">{getLocalizedName(cat, language)}</p>
                    <p className="text-xs text-[var(--text-muted)]">{cat.problems.length} problems</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Problem */}
          {step === 'problem' && (
            <div className="animate-fade-up">
              <h2 className="text-xl font-display font-bold text-[var(--text)] mb-4">{t('selectProblem')}</h2>
              <div className="space-y-3">
                {(service.hasCategories ? category?.problems : service.problems)
                  ?.filter(p => p.isActive)
                  .map((prob) => (
                  <button key={prob._id} onClick={() => handleProblemSelect(prob)}
                    className="w-full card p-4 flex items-center justify-between hover:border-primary-300 hover:shadow-md transition-all active:scale-[0.99] text-left group">
                    <div>
                      <p className="font-semibold text-sm text-[var(--text)] group-hover:text-primary-500 transition-colors">{getLocalizedName(prob, language)}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                        <IndianRupee size={11} />
                        {prob.isPriceFixed && prob.price ? prob.price : t('priceAfterInspection')}
                      </p>
                    </div>
                    <ChevronLeft size={16} className="text-[var(--text-muted)] rotate-180 group-hover:text-primary-500 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP: Confirm */}
          {step === 'confirm' && problem && (
            <div className="animate-fade-up space-y-4">
              <h2 className="text-xl font-display font-bold text-[var(--text)]">{t('confirmBooking')}</h2>

              <div className="card p-5 space-y-4">
                {/* Summary */}
                <div className="space-y-2">
                  {[
                    { label: 'Service', value: service.name },
                    category && { label: 'Category', value: category.name },
                    { label: 'Problem', value: problem.name },
                  ].filter(Boolean).map((item: any) => (
                    <div key={item.label} className="flex items-start justify-between text-sm">
                      <span className="text-[var(--text-muted)]">{item.label}</span>
                      <span className="font-semibold text-[var(--text)] text-right max-w-[60%]">{item.value}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[var(--border)] pt-3 space-y-2">
                  {/* Repair cost */}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-muted)]">{t('repairCharge')}</span>
                    <span className="font-semibold text-[var(--text)]">
                      {problem.isPriceFixed && problem.price ? `₹${problem.price}` : t('priceAfterInspection')}
                    </span>
                  </div>

                  {/* Visit charge slabs preview */}
                  {visitConfig && (
                    <div className="bg-[var(--bg)] rounded-xl p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin size={13} className="text-primary-500" />
                        <span className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{t('homeVisitCharge')}</span>
                      </div>
                      <div className="space-y-1">
                        {visitConfig.slabs.map((slab, i) => (
                          <div key={i} className="flex justify-between text-xs text-[var(--text-muted)]">
                            <span>{slab.label || `${slab.minKm}–${slab.maxKm} km`}</span>
                            <span className="font-medium">₹{slab.charge}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Address confirmation with edit */}
                <AddressEditSection customer={customer} t={t} />
              </div>

              <button onClick={handleBook} disabled={loading} className="btn-primary w-full py-4 text-base">
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    Booking...
                  </span>
                ) : t('bookNow')}
              </button>
            </div>
          )}

          {/* STEP: Success */}
          {step === 'success' && bookingResult && (
            <div className="flex flex-col items-center py-8 animate-fade-up text-center">
              <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-5">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[var(--text)]">{t('bookingSuccess')}</h2>
              <p className="text-sm text-[var(--text-muted)] mt-2 max-w-xs">{t('bookingSuccessMsg')}</p>

              <div className="card w-full max-w-sm mt-6 p-5 space-y-3 text-left">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{t('yourBookingId')}</span>
                  <span className="font-mono font-bold text-primary-500">{bookingResult.booking.bookingId}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Service</span>
                  <span className="font-semibold text-[var(--text)]">{bookingResult.booking.service?.serviceName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">Problem</span>
                  <span className="font-semibold text-[var(--text)]">{bookingResult.booking.service?.problemName}</span>
                </div>
                <div className="border-t border-[var(--border)] pt-3 flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">{t('homeVisitCharge')}</span>
                  <span className="font-bold text-[var(--text)]">₹{bookingResult.homeVisitCharge}
                    <span className="text-xs text-[var(--text-muted)] ml-1">({bookingResult.distanceKm} km)</span>
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-6 w-full max-w-sm">
                <button onClick={() => router.push('/bookings')} className="btn-outline flex-1">
                  {t('viewMyBookings')}
                </button>
                <button onClick={() => router.push('/home')} className="btn-primary flex-1">
                  {t('goHome')}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </Providers>
  )
}
