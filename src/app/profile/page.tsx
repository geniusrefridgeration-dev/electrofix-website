'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, MapPin, Languages, Moon, Sun, Save, LogOut, Pencil, Camera, Bell, Volume2, VolumeX, ChevronDown, ChevronUp, Hash, Home } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import type { Language } from '@/types'
import Navbar from '@/components/layout/Navbar'
import Providers from '@/components/Providers'
import dynamic from 'next/dynamic'
import type { AddressComponents } from '@/components/ui/LocationPicker'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })

const LANGS: { value: Language; label: string; flag: string }[] = [
  { value: 'english',  label: 'English',  flag: '🇬🇧' },
  { value: 'hindi',    label: 'हिंदी',    flag: '🇮🇳' },
  { value: 'hinglish', label: 'Hinglish', flag: '🔤' },
]

const SOUNDS = [
  { value: 'chime', label: 'Chime 🎵', desc: 'Soft melody' },
  { value: 'bell',  label: 'Bell 🔔',  desc: 'Classic bell' },
  { value: 'ping',  label: 'Ping 🔊',  desc: 'Short ping' },
  { value: 'none',  label: 'None 🔇',  desc: 'Silent' },
] as const

export default function ProfilePage() {
  const router = useRouter()
  const { customer, clearAuth, updateCustomer, theme, toggleTheme, language, setLanguage, notifSound, setNotifSound } = useStore()
  const t = useT()
  const [editing,  setEditing]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [showMap,  setShowMap]  = useState(false)
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [imgLoading, setImgLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    name: customer?.name || '', email: customer?.email || '',
    street: customer?.address?.street || '', city: customer?.address?.city || '',
    state: customer?.address?.state || '', pincode: customer?.address?.pincode || '',
  })

  useEffect(() => { if (!customer) router.replace('/login') }, [customer])
  if (!customer) return null

  const handleMapSelect = (lat: number, lng: number, addr?: AddressComponents) => {
    setLocation({ lat, lng })
    if (addr) {
      setForm(f => ({
        ...f,
        street:  addr.street  || f.street,
        city:    addr.city    || f.city,
        state:   addr.state   || f.state,
        pincode: addr.pincode || f.pincode,
      }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload: any = {
        name: form.name, email: form.email || undefined,
        address: { street: form.street, city: form.city, state: form.state, pincode: form.pincode, fullAddress: `${form.street}, ${form.city}, ${form.state} - ${form.pincode}` },
        preferredLanguage: language,
      }
      if (location) payload.location = { type: 'Point', coordinates: [location.lng, location.lat] }
      const res = await api.put('/customer/auth/profile', payload)
      updateCustomer(res.data.customer)
      setEditing(false)
      setShowMap(false)
      toast.success(t('profileUpdated'))
    } catch { toast.error('Failed to update profile') }
    finally { setSaving(false) }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImgLoading(true)
    try {
      const fd = new FormData()
      fd.append('image', file)
      const res = await api.post('/customer/auth/profile/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      updateCustomer({ profileImage: res.data.profileImage })
      toast.success('Profile photo updated!')
    } catch { toast.error('Image upload failed') }
    finally { setImgLoading(false) }
  }

  const handleLogout = () => { clearAuth(); router.push('/login'); toast.success('Logged out') }

  return (
    <Providers>
      <div className="min-h-screen bg-[var(--bg)] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-8 space-y-5">

          {/* Profile header */}
          <div className="card p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-4">
                {/* Avatar with upload */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    {customer.profileImage ? (
                      <img src={customer.profileImage} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary-600 dark:text-primary-400 font-bold text-xl">
                        {customer.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={imgLoading}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg hover:bg-primary-600 transition-colors"
                  >
                    {imgLoading ? <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin"/> : <Camera size={12} />}
                  </button>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </div>
                <div>
                  <p className="font-display font-bold text-[var(--text)] text-lg">{customer.name}</p>
                  <p className="text-sm text-[var(--text-muted)]">{customer.mobile}</p>
                </div>
              </div>
              <button onClick={() => setEditing(!editing)}
                className={clsx('p-2 rounded-xl transition-colors', editing ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500' : 'hover:bg-[var(--border)] text-[var(--text-muted)]')}>
                <Pencil size={17} />
              </button>
            </div>

            {!editing ? (
              <div className="space-y-3">
                {[
                  { icon: Phone,  label: 'Mobile',  value: customer.mobile },
                  { icon: Mail,   label: 'Email',   value: customer.email || '—' },
                  { icon: MapPin, label: 'Address', value: customer.address?.fullAddress || `${customer.address?.street}, ${customer.address?.city}` },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-start gap-3 py-2 border-b border-[var(--border)] last:border-0">
                    <Icon size={15} className="text-primary-500 mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="text-sm font-medium text-[var(--text)]">{value}</p></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">{t('fullName')}</label>
                  <input className="input text-sm" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">{t('email')}</label>
                  <input className="input text-sm" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                </div>
                {/* Address fields */}
                <div className="border-t border-[var(--border)] pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">{t('address')}</p>
                  <div className="space-y-2">
                    <div className="relative">
                      <Home size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input className="input pl-8 text-sm" placeholder={t('streetAddress')} value={form.street} onChange={e => setForm({...form, street: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder={t('city')} value={form.city} onChange={e => setForm({...form, city: e.target.value})} />
                      <input className="input text-sm" placeholder={t('state')} value={form.state} onChange={e => setForm({...form, state: e.target.value})} />
                    </div>
                    <div className="relative">
                      <Hash size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                      <input className="input pl-8 text-sm" placeholder={t('pincode')} maxLength={6} value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value})} />
                    </div>
                  </div>

                  {/* Map toggle */}
                  <button type="button" onClick={() => setShowMap(!showMap)}
                    className={clsx('mt-3 w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors',
                      showMap ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300')}>
                    <span className="flex items-center gap-2">
                      <MapPin size={14} />
                      {location ? '📍 Location pinned' : t('orPickOnMap')}
                    </span>
                    {showMap ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                  </button>
                  {showMap && (
                    <div className="mt-3">
                      <LocationPicker
                        onSelect={handleMapSelect}
                        onDeselect={() => setLocation(null)}
                        initialLat={customer.location?.coordinates?.[1] || 23.2599}
                        initialLng={customer.location?.coordinates?.[0] || 77.4126}
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-1">
                  <button onClick={() => { setEditing(false); setShowMap(false) }} className="btn-outline flex-1">{t('cancel')}</button>
                  <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                    <Save size={15} />
                    {saving ? '...' : t('saveChanges')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preferences */}
          <div className="card p-5 space-y-5 animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="font-display font-bold text-[var(--text)]">Preferences</h3>

            {/* Language */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-1.5"><Languages size={13} /> {t('language')}</p>
              <div className="flex gap-2">
                {LANGS.map(lang => (
                  <button key={lang.value} onClick={() => setLanguage(lang.value)}
                    className={clsx('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition-colors flex-1 justify-center',
                      language === lang.value ? 'bg-primary-500 text-white' : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--border)]')}>
                    <span>{lang.flag}</span>
                    <span className="hidden sm:inline text-xs">{lang.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Theme */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2">{t('theme')}</p>
              <div className="flex gap-2">
                {(['light', 'dark'] as const).map(th => (
                  <button key={th} onClick={() => theme !== th && toggleTheme()}
                    className={clsx('flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex-1 justify-center',
                      theme === th ? 'bg-primary-500 text-white' : 'bg-[var(--bg)] text-[var(--text-muted)] hover:bg-[var(--border)]')}>
                    {th === 'light' ? <Sun size={14}/> : <Moon size={14}/>}
                    {th === 'light' ? t('light') : t('dark')}
                  </button>
                ))}
              </div>
            </div>

            {/* Notification Sound */}
            <div>
              <p className="text-xs font-semibold text-[var(--text-muted)] mb-2 flex items-center gap-1.5"><Bell size={13}/> Notification Sound</p>
              <div className="grid grid-cols-2 gap-2">
                {SOUNDS.map(s => (
                  <button key={s.value} onClick={() => setNotifSound(s.value)}
                    className={clsx('flex flex-col items-start px-3 py-2.5 rounded-xl text-sm transition-colors border',
                      notifSound === s.value ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300')}>
                    <span className="font-semibold text-xs">{s.label}</span>
                    <span className="text-[10px] opacity-70">{s.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Logout */}
          <button onClick={handleLogout}
            className="w-full card p-4 flex items-center justify-center gap-2 text-red-500 font-semibold text-sm hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors animate-fade-up">
            <LogOut size={17}/> {t('logout')}
          </button>
        </main>
      </div>
    </Providers>
  )
}
