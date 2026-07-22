'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Zap, Sun, Moon, Languages, User, ChevronDown, Menu, X } from 'lucide-react'
import { useStore, useT } from '@/store'
import { useState } from 'react'
import clsx from 'clsx'
import type { Language } from '@/types'

const LANGS: { value: Language; label: string; flag: string }[] = [
  { value: 'english',  label: 'English',  flag: '🇬🇧' },
  { value: 'hindi',    label: 'हिंदी',    flag: '🇮🇳' },
  { value: 'hinglish', label: 'Hinglish', flag: '🔤' },
]

export default function Navbar() {
  const { customer, clearAuth, theme, toggleTheme, language, setLanguage } = useStore()
  const t = useT()
  const router = useRouter()
  const pathname = usePathname()
  const [showLang, setShowLang] = useState(false)
  const [showMobile, setShowMobile] = useState(false)

  const navLinks = [
    { href: '/home',     label: t('home') },
    { href: '/bookings', label: t('bookings') },
    { href: '/profile',  label: t('profile') },
  ]

  return (
    <nav className="sticky top-0 z-50 bg-[var(--surface)]/90 backdrop-blur-md border-b border-[var(--border)]">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/home" className="flex items-center flex-shrink-0">
          <div className="bg-white rounded-xl px-2 py-1 flex-shrink-0"><img src="/logo-navbar.png" alt="ElectroFix" className="h-12 w-auto" /></div>
        </Link>

        {/* Desktop Nav links (only when logged in) */}
        {customer && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href}
                className={clsx('px-4 py-2 rounded-xl text-sm font-semibold transition-colors',
                  pathname === href
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500'
                    : 'text-[var(--text-muted)] hover:text-[var(--text)] hover:bg-[var(--border)]'
                )}>
                {label}
              </Link>
            ))}
          </div>
        )}

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {/* Language */}
          <div className="relative">
            <button onClick={() => setShowLang(!showLang)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-sm text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors">
              <Languages size={16} />
              <span className="hidden sm:inline text-xs">{LANGS.find(l => l.value === language)?.flag}</span>
              <ChevronDown size={12} />
            </button>
            {showLang && (
              <div className="absolute right-0 top-full mt-1 w-36 card py-1 shadow-lg z-50 animate-scale-in">
                {LANGS.map((lang) => (
                  <button key={lang.value}
                    onClick={() => { setLanguage(lang.value); setShowLang(false) }}
                    className={clsx('w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--bg)] transition-colors',
                      language === lang.value ? 'text-primary-500 font-semibold' : 'text-[var(--text)]')}>
                    <span>{lang.flag}</span><span>{lang.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme */}
          <button onClick={toggleTheme}
            className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors"
            aria-label="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Profile / Login */}
          {customer ? (
            <Link href="/profile"
              className="flex items-center gap-2 ml-1 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-sm font-semibold hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors">
              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-primary-200 dark:bg-primary-800 flex items-center justify-center">
                {(customer as any).profileImage ? (
                  <img src={(customer as any).profileImage} alt={customer.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] font-bold text-primary-600">{customer.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <span className="hidden sm:inline max-w-[80px] truncate">{customer.name.split(' ')[0]}</span>
            </Link>
          ) : (
            <Link href="/login"
              className="ml-1 btn-primary py-2 px-4 text-sm">
              {t('login')}
            </Link>
          )}

          {/* Mobile hamburger (when logged in) */}
          {customer && (
            <button onClick={() => setShowMobile(!showMobile)}
              className="md:hidden p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors ml-1">
              {showMobile ? <X size={18} /> : <Menu size={18} />}
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {customer && showMobile && (
        <div className="md:hidden border-t border-[var(--border)] px-4 py-3 space-y-1 bg-[var(--surface)] animate-fade-in">
          {navLinks.map(({ href, label }) => (
            <Link key={href} href={href}
              onClick={() => setShowMobile(false)}
              className={clsx('block px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors',
                pathname === href
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-500'
                  : 'text-[var(--text-muted)] hover:bg-[var(--border)]')}>
              {label}
            </Link>
          ))}
          <button onClick={() => { clearAuth(); router.push('/login') }}
            className="block w-full text-left px-4 py-2.5 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            {t('logout')}
          </button>
        </div>
      )}
    </nav>
  )
}
