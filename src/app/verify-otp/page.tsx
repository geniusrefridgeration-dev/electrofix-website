'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Mail, Phone } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function VerifyOTPPage() {
  const router = useRouter()
  const { pendingCustomerId, setPendingCustomerId, setAuth } = useStore()
  const t = useT()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const [canResend, setCanResend] = useState(false)

  // OTP display state (from backend devOTP field)
  const [shownOtp, setShownOtp] = useState<string | null>(null)
  const [sentVia, setSentVia] = useState<'email' | 'sms' | null>(null)
  const [sentTo, setSentTo] = useState<string | null>(null)


  console.log(otp, 'otp')
  console.log(shownOtp, 'shownOtp')

  const inputs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (!pendingCustomerId) {
      router.replace('/login')
    }
  }, [pendingCustomerId])

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) { setCanResend(true); return }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  // On first load, trigger resend to get devOTP shown
  useEffect(() => {
    if (!pendingCustomerId) return
    // Fetch initial OTP info by calling resend (will show devOTP)
    api.post('/customer/auth/resend-otp', { customerId: pendingCustomerId })
      .then((res) => {
        if (res.data.devOTP) setShownOtp(res.data.devOTP)
        // Detect sent via from message
        const msg: string = res.data.message || ''
        if (msg.includes('@')) {
          setSentVia('email')
          const match = msg.match(/\S+@\S+/)
          setSentTo(match ? match[0] : null)
        } else {
          setSentVia('sms')
          const match = msg.match(/\d{10}/)
          setSentTo(match ? match[0] : null)
        }
      })
      .catch(() => {})
  }, [pendingCustomerId])

  const handleChange = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) inputs.current[idx + 1]?.focus()
    if (!val && idx > 0) inputs.current[idx - 1]?.focus()
  }

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) inputs.current[idx - 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      inputs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const code = otp.join('')
    if (code.length < 6) { toast.error('Enter complete 6-digit OTP'); return }
    setLoading(true)
    try {
      const res = await api.post('/customer/auth/verify-otp', { customerId: pendingCustomerId, otp: code })
      setAuth(res.data.customer, res.data.token)
      setPendingCustomerId(null)
      toast.success('Verified! Welcome 🎉')
      router.replace('/home')
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (!canResend) return
    try {
      const res = await api.post('/customer/auth/resend-otp', { customerId: pendingCustomerId })
      if (res.data.devOTP) setShownOtp(res.data.devOTP)
      toast.success('OTP resent!')
      setCountdown(60)
      setCanResend(false)
      setOtp(['', '', '', '', '', ''])
      inputs.current[0]?.focus()
    } catch { toast.error('Failed to resend OTP') }
  }

  // Auto-fill from shown OTP when user clicks on it
  const handleClickShownOtp = () => {
    if (!shownOtp) return
    setOtp(shownOtp.split(''))
    inputs.current[5]?.focus()
    toast.success('OTP auto-filled!')
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4 animate-bounce-sm">
            <ShieldCheck size={30} className="text-green-500" />
          </div>
          <h1 className="text-2xl font-display font-bold text-[var(--text)]">{t('verifyOtp')}</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1 text-center">{t('enterOtp')}</p>

          {/* Sent via info */}
          {sentTo && (
            <div className="flex items-center gap-2 mt-3 px-4 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-full text-xs text-[var(--text-muted)]">
              {sentVia === 'email'
                ? <><Mail size={12} className="text-primary-500" /> OTP sent to <strong className="text-[var(--text)]">{sentTo}</strong></>
                : <><Phone size={12} className="text-primary-500" /> OTP sent to <strong className="text-[var(--text)]">{sentTo}</strong></>
              }
            </div>
          )}
        </div>

        <div className="card p-6 space-y-5 animate-fade-up">
          {/* 6-box OTP input */}
          <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputs.current[idx] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={clsx(
                  'w-11 h-13 text-center text-xl font-bold rounded-xl border-2 bg-[var(--bg)] text-[var(--text)]',
                  'focus:outline-none transition-colors',
                  digit
                    ? 'border-primary-400 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'border-[var(--border)] focus:border-primary-300'
                )}
                style={{ height: '52px' }}
              />
            ))}
          </div>

          {/* Development OTP display box */}
          {shownOtp && (
            <button
              type="button"
              onClick={handleClickShownOtp}
              className="w-full bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-2xl p-4 text-center hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors group"
            >
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
                🔐 Your OTP (tap to auto-fill)
              </p>
              <p className="text-3xl font-mono font-bold text-amber-700 dark:text-amber-300 tracking-[0.4em] group-hover:scale-105 transition-transform inline-block">
                {shownOtp}
              </p>
              {sentVia === 'email' && sentTo && (
                <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">
                  Also sent to {sentTo}
                </p>
              )}
            </button>
          )}

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={loading || otp.join('').length < 6}
            className="btn-primary w-full py-3.5"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verifying...
              </span>
            ) : t('verifyOtp')}
          </button>

          {/* Resend */}
          <div className="text-center">
            {canResend ? (
              <button
                onClick={handleResend}
                className="text-sm text-primary-500 font-semibold hover:underline"
              >
                {t('resendOtp')}
              </button>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">
                {t('resendIn')}{' '}
                <span className="font-bold text-[var(--text)] tabular-nums">{countdown}s</span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
