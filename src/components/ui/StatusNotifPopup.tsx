'use client'
import { useEffect, useState } from 'react'
import { CheckCircle, X, Truck, XCircle } from 'lucide-react'
import clsx from 'clsx'

export interface StatusNotif {
  id: string
  bookingId: string
  status: 'accepted' | 'rejected' | 'dispatched' | 'completed'
  message: string
}

const configs = {
  accepted:   { icon: CheckCircle, color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/30',   border: 'border-blue-200 dark:border-blue-700',   bar: 'bg-blue-500',   emoji: '✅' },
  rejected:   { icon: XCircle,     color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/30',     border: 'border-red-200 dark:border-red-700',     bar: 'bg-red-500',    emoji: '❌' },
  dispatched: { icon: Truck,       color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-700', bar: 'bg-purple-500', emoji: '🔧' },
  completed:  { icon: CheckCircle, color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/30',  border: 'border-green-200 dark:border-green-700',  bar: 'bg-green-500',  emoji: '🎉' },
}

// ── Sound sequences ──────────────────────────────────────────────────────────
const SOUNDS = {
  chime: {
    success:  [{ f:523,s:0,d:0.12 },{ f:659,s:0.13,d:0.12 },{ f:784,s:0.26,d:0.22 }],
    warning:  [{ f:659,s:0,d:0.15 },{ f:554,s:0.18,d:0.22 }],
    error:    [{ f:392,s:0,d:0.18 },{ f:330,s:0.20,d:0.28 }],
  },
  bell: {
    success:  [{ f:880,s:0,d:0.08 },{ f:880,s:0.10,d:0.08 },{ f:1047,s:0.22,d:0.30 }],
    warning:  [{ f:740,s:0,d:0.12 },{ f:740,s:0.15,d:0.20 }],
    error:    [{ f:370,s:0,d:0.15 },{ f:294,s:0.18,d:0.30 }],
  },
  ping: {
    success:  [{ f:1047,s:0,d:0.06 },{ f:1319,s:0.08,d:0.15 }],
    warning:  [{ f:880, s:0,d:0.10 },{ f:740, s:0.13,d:0.15 }],
    error:    [{ f:440, s:0,d:0.08 },{ f:349, s:0.10,d:0.20 }],
  },
  none: { success:[], warning:[], error:[] },
}

export function playNotifSound(
  type: 'success' | 'warning' | 'error' = 'success',
  soundType: 'chime' | 'bell' | 'ping' | 'none' = 'chime'
) {
  if (soundType === 'none') return
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const notes = (SOUNDS[soundType] || SOUNDS.chime)[type] || []
    notes.forEach(({ f, s, d }: any) => {
      const osc = ctx.createOscillator()
      const g   = ctx.createGain()
      osc.connect(g); g.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = f
      g.gain.setValueAtTime(0, ctx.currentTime + s)
      g.gain.linearRampToValueAtTime(0.3, ctx.currentTime + s + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + s + d)
      osc.start(ctx.currentTime + s)
      osc.stop(ctx.currentTime + s + d + 0.05)
    })
  } catch {}
}

function SinglePopup({ notif, onClose }: { notif: StatusNotif; onClose: (id: string) => void }) {
  const [progress, setProgress] = useState(100)
  const cfg = configs[notif.status]
  const { icon: Icon } = cfg
  const DURATION = 7000

  useEffect(() => {
    const start = Date.now()
    const interval = setInterval(() => {
      const pct = Math.max(0, 100 - ((Date.now() - start) / DURATION) * 100)
      setProgress(pct)
      if (pct === 0) { clearInterval(interval); onClose(notif.id) }
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className={clsx('w-80 rounded-2xl border shadow-2xl overflow-hidden bg-[var(--surface)] animate-slide-up', cfg.border)}>
      <div className="h-1 bg-[var(--border)]">
        <div className={clsx('h-full transition-none', cfg.bar)} style={{ width: `${progress}%` }} />
      </div>
      <div className="p-4 flex items-start gap-3">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 text-xl', cfg.bg)}>
          {cfg.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-[var(--text)]">Booking Update</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-relaxed">{notif.message}</p>
          <p className="text-xs font-mono text-primary-500 mt-1">#{notif.bookingId}</p>
        </div>
        <button onClick={() => onClose(notif.id)} className="p-1 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)] flex-shrink-0">
          <X size={14} />
        </button>
      </div>
    </div>
  )
}

export default function StatusNotifPopups({ notifs, onClose }: { notifs: StatusNotif[]; onClose: (id: string) => void }) {
  if (notifs.length === 0) return null
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {notifs.map(n => (
        <div key={n.id} className="pointer-events-auto">
          <SinglePopup notif={n} onClose={onClose} />
        </div>
      ))}
    </div>
  )
}
