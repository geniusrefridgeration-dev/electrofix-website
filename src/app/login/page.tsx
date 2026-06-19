'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function LoginPage() {
  const router = useRouter()
  const { setPendingCustomerId, customer } = useStore()
  const t = useT()
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  // Already logged in → go home
  if (customer) {
    router.replace('/home')
    return null
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!mobile || !password) { toast.error('Please fill all fields'); return }
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error('Invalid mobile number'); return }

    setLoading(true)
    try {
      const res = await api.post('/customer/auth/login', { mobile, password })
      setPendingCustomerId(res.data.customerId)
      toast.success(res.data.message)
      router.push('/verify-otp')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Login failed')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex flex-col items-center justify-center py-10 px-4">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary-100 dark:bg-primary-900/10 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-primary-50 dark:bg-primary-900/5 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo-icon.png" alt="ElectroFix" className="w-16 h-16 rounded-2xl object-cover shadow-lg mb-3 animate-bounce-sm" />
          <h1 className="text-2xl font-display font-bold text-[var(--text)]">{t('loginTitle')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">{t('loginSubtitle')}</p>
        </div>

        <form onSubmit={handleLogin} className="card p-6 space-y-4 animate-fade-up">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
              {t('mobile')}
            </label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="input pl-10"
                placeholder="9876543210"
                type="tel"
                maxLength={10}
                autoComplete="tel"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)] mb-1.5">
              {t('password')}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPass ? 'text' : 'password'}
                className="input pl-10 pr-10"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 mt-2">
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {t('loading')}
              </span>
            ) : t('sendOtp')}
          </button>
        </form>

        <div className="flex flex-col items-center gap-2 mt-5">
          <Link href="/forgot-password" className="text-sm text-[var(--text-muted)] hover:text-primary-500 transition-colors">Forgot Password?</Link>
          <p className="text-sm text-[var(--text-muted)]">
            {t('dontHaveAccount')}{' '}
            <Link href="/register" className="text-primary-500 font-semibold hover:underline">{t('registerHere')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
