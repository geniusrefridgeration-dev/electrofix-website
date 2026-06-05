'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Customer, Language, BookingFlow, Service, Category, Problem } from '@/types'

interface AppStore {
  // Auth
  customer: Customer | null
  token: string | null
  setAuth: (customer: Customer, token: string) => void
  clearAuth: () => void
  updateCustomer: (data: Partial<Customer>) => void

  // OTP flow
  pendingCustomerId: string | null
  setPendingCustomerId: (id: string | null) => void

  // Language
  language: Language
  setLanguage: (lang: Language) => void

  // Theme
  theme: 'light' | 'dark'
  setTheme: (t: 'light' | 'dark') => void
  toggleTheme: () => void

  // Notification sound setting
  notifSound: 'chime' | 'bell' | 'ping' | 'none'
  setNotifSound: (s: 'chime' | 'bell' | 'ping' | 'none') => void

  // Booking flow (step-by-step)
  bookingFlow: BookingFlow
  setBookingService: (service: Service | null) => void
  setBookingCategory: (cat: Category | null) => void
  setBookingProblem: (prob: Problem | null) => void
  clearBookingFlow: () => void
}

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Auth
      customer: null,
      token: null,
      setAuth: (customer, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('ef_token', token)
          localStorage.setItem('ef_customer', JSON.stringify(customer))
        }
        set({ customer, token })
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ef_token')
          localStorage.removeItem('ef_customer')
        }
        set({ customer: null, token: null })
      },
      updateCustomer: (data) => set((s) => ({ customer: s.customer ? { ...s.customer, ...data } : null })),

      // OTP
      pendingCustomerId: null,
      setPendingCustomerId: (id) => set({ pendingCustomerId: id }),

      // Language
      language: 'english',
      setLanguage: (lang) => set({ language: lang }),

      // Theme
      theme: 'light',
      setTheme: (theme) => {
        if (typeof window !== 'undefined') document.documentElement.classList.toggle('dark', theme === 'dark')
        set({ theme })
      },
      toggleTheme: () => {
        const next = get().theme === 'light' ? 'dark' : 'light'
        if (typeof window !== 'undefined') document.documentElement.classList.toggle('dark', next === 'dark')
        set({ theme: next })
      },

      // Notification sound
      notifSound: 'chime' as const,
      setNotifSound: (notifSound: 'chime' | 'bell' | 'ping' | 'none') => set({ notifSound }),

      // Booking flow
      bookingFlow: { service: null, category: null, problem: null },
      setBookingService:  (service)  => set((s) => ({ bookingFlow: { ...s.bookingFlow, service, category: null, problem: null } })),
      setBookingCategory: (category) => set((s) => ({ bookingFlow: { ...s.bookingFlow, category, problem: null } })),
      setBookingProblem:  (problem)  => set((s) => ({ bookingFlow: { ...s.bookingFlow, problem } })),
      clearBookingFlow:   () => set({ bookingFlow: { service: null, category: null, problem: null } }),
    }),
    {
      name: 'electrofix-customer',
      partialize: (s: AppStore) => ({ language: s.language, theme: s.theme, customer: s.customer, token: s.token, notifSound: s.notifSound }),
    }
  )
)

// Translation hook
import { t } from '@/lib/translations'
export const useT = () => {
  const language = useStore((s) => s.language)
  return (key: keyof typeof t.english): string => {
    const lang = t[language] as any
    return lang?.[key] ?? (t.english as any)[key] ?? key
  }
}
