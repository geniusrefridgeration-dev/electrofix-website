'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { Zap, Eye, EyeOff, MapPin, User, Phone, Mail, Lock, Home, Building, Hash, ChevronDown, ChevronUp } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import type { AddressComponents } from '@/components/ui/LocationPicker'

const LocationPicker = dynamic(() => import('@/components/ui/LocationPicker'), { ssr: false })

interface RegisterForm {
  name: string; mobile: string; email?: string; password: string; confirmPassword: string
  street: string; city: string; state: string; pincode: string
}

export default function RegisterPage() {
  const router = useRouter()
  const { setPendingCustomerId } = useStore()
  const t = useT()
  const [showPass,    setShowPass]    = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [location,    setLocation]    = useState<{ lat: number; lng: number } | null>(null)
  const [showMap,     setShowMap]     = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<RegisterForm>()

  // Watch address fields to sync with map
  const watchedStreet  = watch('street')
  const watchedCity    = watch('city')
  const watchedState   = watch('state')
  const watchedPincode = watch('pincode')

  // When map selects a location + geocodes it → auto-fill address fields
  const handleMapSelect = (lat: number, lng: number, addr?: AddressComponents) => {
    setLocation({ lat, lng })
    if (addr) {
      if (addr.street)  setValue('street',  addr.street,  { shouldValidate: true })
      if (addr.city)    setValue('city',    addr.city,    { shouldValidate: true })
      if (addr.state)   setValue('state',   addr.state,   { shouldValidate: true })
      if (addr.pincode) setValue('pincode', addr.pincode, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) { toast.error('Passwords do not match'); return }
    setLoading(true)
    try {
      const payload: any = {
        name: data.name, mobile: data.mobile, password: data.password,
        address: {
          street: data.street, city: data.city,
          state: data.state, pincode: data.pincode,
          fullAddress: `${data.street}, ${data.city}, ${data.state} - ${data.pincode}`,
        },
      }
      if (data.email)  payload.email    = data.email
      if (location)    payload.location = { type: 'Point', coordinates: [location.lng, location.lat] }

      const res = await api.post('/customer/auth/register', payload)
      setPendingCustomerId(res.data.customerId)
      toast.success('OTP sent! Please verify')
      router.push('/verify-otp')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-icon.png" alt="ElectroFix" className="w-24 h-24 rounded-2xl object-cover shadow-lg mb-3" />
          <h1 className="text-2xl font-display font-bold text-[var(--text)]">{t('registerTitle')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="card p-6 space-y-4 animate-fade-up">
          {/* Name */}
          <div>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input {...register('name', { required: 'Name is required' })}
                className={clsx('input pl-10', errors.name && 'border-red-400')}
                placeholder={t('fullName')} />
            </div>
            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
          </div>

          {/* Mobile */}
          <div>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input {...register('mobile', {
                required: 'Mobile is required',
                pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid Indian mobile number' }
              })}
                className={clsx('input pl-10', errors.mobile && 'border-red-400')}
                placeholder={t('mobile')} type="tel" maxLength={10} />
            </div>
            {errors.mobile && <p className="text-xs text-red-500 mt-1">{errors.mobile.message}</p>}
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input {...register('email', { pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' } })}
                className="input pl-10" placeholder={t('email')} type="email" />
            </div>
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>}
          </div>

          {/* Password */}
          <div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input {...register('password', { required: 'Password required', minLength: { value: 6, message: 'Min 6 characters' } })}
                type={showPass ? 'text' : 'password'}
                className={clsx('input pl-10 pr-10', errors.password && 'border-red-400')}
                placeholder={t('password')} />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input {...register('confirmPassword', { required: 'Please confirm password' })}
                type={showConfirm ? 'text' : 'password'}
                className={clsx('input pl-10 pr-10', errors.confirmPassword && 'border-red-400')}
                placeholder={t('confirmPassword')} />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>

          {/* Address section */}
          <div className="border-t border-[var(--border)] pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-3">{t('address')}</p>

            {/* Street */}
            <div className="mb-3">
              <div className="relative">
                <Home size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input {...register('street', { required: 'Street address required' })}
                  className={clsx('input pl-10', errors.street && 'border-red-400')}
                  placeholder={t('streetAddress')} />
              </div>
              {errors.street && <p className="text-xs text-red-500 mt-1">{errors.street.message}</p>}
            </div>

            {/* City + State */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <input {...register('city', { required: 'City required' })}
                  className={clsx('input', errors.city && 'border-red-400')} placeholder={t('city')} />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city.message}</p>}
              </div>
              <div>
                <input {...register('state', { required: 'State required' })}
                  className={clsx('input', errors.state && 'border-red-400')} placeholder={t('state')} />
                {errors.state && <p className="text-xs text-red-500 mt-1">{errors.state.message}</p>}
              </div>
            </div>

            {/* Pincode */}
            <div className="mb-3">
              <div className="relative">
                <Hash size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input {...register('pincode', { required: 'Pincode required', pattern: { value: /^\d{6}$/, message: '6 digit pincode' } })}
                  className={clsx('input pl-10', errors.pincode && 'border-red-400')}
                  placeholder={t('pincode')} maxLength={6} />
              </div>
              {errors.pincode && <p className="text-xs text-red-500 mt-1">{errors.pincode.message}</p>}
            </div>
          </div>

          {/* Map toggle */}
          <div>
            <button type="button" onClick={() => setShowMap(!showMap)}
              className={clsx(
                'w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-sm font-semibold transition-colors',
                showMap
                  ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'border-[var(--border)] text-[var(--text-muted)] hover:border-primary-300 hover:text-primary-500'
              )}>
              <span className="flex items-center gap-2">
                <MapPin size={15} />
                {location
                  ? `📍 Location pinned on map`
                  : t('orPickOnMap')}
              </span>
              {showMap ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>

            {showMap && (
              <div className="mt-3">
                <LocationPicker
                  onSelect={handleMapSelect}
                  onDeselect={() => setLocation(null)}
                  syncAddressFields={{
                    street: watchedStreet  || '',
                    city:   watchedCity    || '',
                    state:  watchedState   || '',
                    pincode: watchedPincode || '',
                  }}
                />
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                {t('loading')}
              </span>
            ) : t('sendOtp')}
          </button>
        </form>

        <p className="text-center text-sm text-[var(--text-muted)] mt-5">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/login" className="text-primary-500 font-semibold hover:underline">{t('loginHere')}</Link>
        </p>
      </div>
    </div>
  )
}
