'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Shield, Eye, EyeOff } from 'lucide-react'
import { useStore, useT } from '@/store'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Providers from '@/components/Providers'

type Step = 'mobile' | 'otp' | 'password'

export default function ForgotPasswordPage() {
  const router   = useRouter()
  const t        = useT()
  const [step,       setStep]       = useState<Step>('mobile')
  const [mobile,     setMobile]     = useState('')
  const [customerId, setCustomerId] = useState('')
  const [otp,        setOtp]        = useState('')
  const [devOtp,     setDevOtp]     = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPass,   setShowPass]   = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [countdown,  setCountdown]  = useState(0)

  const startTimer = () => {
    setCountdown(60)
    const id = setInterval(() => setCountdown(c => { if (c <= 1) { clearInterval(id); return 0 } return c - 1 }), 1000)
  }

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(mobile)) { toast.error('Valid mobile number daalo'); return }
    setLoading(true)
    try {
      const res = await api.post('/customer/auth/forgot-password', { mobile })
      setCustomerId(res.data.customerId)
      if (res.data.devOTP) setDevOtp(res.data.devOTP)
      setStep('otp'); startTimer()
      toast.success(res.data.message)
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const handleReset = async () => {
    if (otp.length !== 6)    { toast.error('6 digit OTP daalo'); return }
    if (password.length < 6) { toast.error('Password min 6 characters'); return }
    if (password !== confirm) { toast.error('Passwords match nahi kar rahe'); return }
    setLoading(true)
    try {
      await api.post('/customer/auth/reset-password', { customerId, otp, newPassword: password })
      toast.success('Password reset ho gaya! Login karo.')
      router.push('/login')
    } catch (e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <Providers>
      <div className="min-h-screen bg-[var(--bg)] flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text)] mb-6">
            <ArrowLeft size={16}/> Back to Login
          </Link>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                <Shield size={22} className="text-primary-500"/>
              </div>
              <div>
                <h1 className="font-display font-bold text-xl text-[var(--text)]">Forgot Password</h1>
                <p className="text-xs text-[var(--text-muted)]">{step === 'mobile' ? 'Mobile number daalo' : 'OTP + new password'}</p>
              </div>
            </div>

            {step === 'mobile' && (
              <div className="space-y-4">
                <div>
                  <label className="label">Mobile Number</label>
                  <div className="flex gap-2">
                    <span className="input-field w-16 text-center font-semibold text-sm">+91</span>
                    <input className="input-field flex-1" type="tel" placeholder="9876543210" maxLength={10}
                      value={mobile} onChange={e => setMobile(e.target.value.replace(/\D/g,'').slice(0,10))} />
                  </div>
                </div>
                <button onClick={handleSendOtp} disabled={loading || mobile.length !== 10} className="btn-primary w-full justify-center">
                  {loading ? '...' : 'Send OTP'}
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <p className="text-sm text-[var(--text-muted)]">OTP sent to +91 {mobile}</p>
                {devOtp && (
                  <div onClick={() => setOtp(devOtp)} className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-dashed border-yellow-300 rounded-xl p-4 text-center cursor-pointer">
                    <p className="text-xs font-semibold text-yellow-600 mb-1">🔐 Your OTP (tap to fill)</p>
                    <p className="text-3xl font-black tracking-widest text-yellow-800 dark:text-yellow-300">{devOtp}</p>
                  </div>
                )}
                <div>
                  <label className="label">Enter OTP</label>
                  <input className="input-field text-center text-2xl font-bold tracking-widest" maxLength={6}
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))} />
                </div>
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input className="input-field pr-10" type={showPass?'text':'password'} placeholder="Min 6 characters"
                      value={password} onChange={e => setPassword(e.target.value)} />
                    <button onClick={() => setShowPass(p=>!p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Confirm Password</label>
                  <input className="input-field" type="password" placeholder="Password dobara daalo"
                    value={confirm} onChange={e => setConfirm(e.target.value)} />
                </div>
                <button onClick={handleReset} disabled={loading} className="btn-primary w-full justify-center">
                  {loading ? '...' : 'Reset Password'}
                </button>
                <div className="text-center text-sm">
                  {countdown > 0
                    ? <span className="text-[var(--text-muted)]">Resend in {countdown}s</span>
                    : <button onClick={handleSendOtp} className="text-primary-500 font-semibold">Resend OTP</button>}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Providers>
  )
}
