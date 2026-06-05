'use client'
import { useEffect, useState } from 'react'
import { useStore } from '@/store'
import { Toaster } from 'react-hot-toast'
import StatusNotifPopups, { type StatusNotif, playNotifSound } from '@/components/ui/StatusNotifPopup'

const statusMessages: Record<string, Record<string, string>> = {
  english: {
    accepted:   '✅ Your booking has been accepted! We\'ll be there soon.',
    rejected:   '❌ Sorry, your booking was rejected.',
    dispatched: '🔧 Technician is on the way to your location!',
    completed:  '🎉 Repair completed! Thank you for choosing ElectroFix.',
  },
  hindi: {
    accepted:   '✅ आपकी बुकिंग स्वीकृत हो गई! हम जल्द आएंगे।',
    rejected:   '❌ माफ़ करें, आपकी बुकिंग अस्वीकृत हो गई।',
    dispatched: '🔧 तकनीशियन आपके घर की ओर निकल गया है!',
    completed:  '🎉 मरम्मत पूरी हो गई! ElectroFix चुनने के लिए धन्यवाद।',
  },
  hinglish: {
    accepted:   '✅ Aapki booking accept ho gayi! Hum jald aayenge.',
    rejected:   '❌ Sorry, aapki booking reject ho gayi.',
    dispatched: '🔧 Technician aapke ghar ki taraf nikal gaya hai!',
    completed:  '🎉 Repair complete! ElectroFix choose karne ka shukriya.',
  },
}

const soundType: Record<string, 'success' | 'warning' | 'error'> = {
  accepted: 'success', rejected: 'error', dispatched: 'success', completed: 'success',
}

export default function Providers({ children }: { children: React.ReactNode }) {
  const { theme, customer, language, notifSound } = useStore()
  const [notifs, setNotifs] = useState<StatusNotif[]>([])

  // Apply theme
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // Register Service Worker for background notifications
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return
    navigator.serviceWorker.register('/sw.js').catch(() => {})
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  // Socket.IO
  useEffect(() => {
    if (!customer || typeof window === 'undefined') return
    let socket: any = null
    let dead = false

    const init = async () => {
      try {
        const { io } = await import('socket.io-client')
        if (dead) return
        const url = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api').replace('/api', '')
        socket = io(url, { reconnectionAttempts: 5, transports: ['websocket', 'polling'] })

        socket.on('connect', () => {
          socket.emit('join_customer', customer.id || customer.id)
        })

        socket.on('booking_status_update', (data: any) => {
          const msgs = statusMessages[language] || statusMessages.english
          const message = msgs[data.status] || `Booking ${data.status}`
          const id = `notif_${Date.now()}`

          setNotifs(prev => [...prev, { id, bookingId: data.bookingId || id, status: data.status, message }])

          // Play sound based on user setting
          playNotifSound(soundType[data.status] || 'success', notifSound || 'chime')

          // Browser notification (works when tab is in background)
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification('ElectroFix — Booking Update', {
              body: message.replace(/[✅❌🔧🎉]/g, '').trim(),
              icon: '/favicon.ico',
              requireInteraction: true,
            })
          }
        })
      } catch (e) { console.error('Socket init error:', e) }
    }

    init()
    return () => { dead = true; if (socket) socket.disconnect() }
  }, [customer?.id, (customer as any)?._id, language, notifSound])

  const closeNotif = (id: string) => setNotifs(prev => prev.filter(n => n.id !== id))

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--surface)', color: 'var(--text)',
            border: '1px solid var(--border)', borderRadius: '14px',
            fontSize: '14px', fontFamily: 'Nunito, sans-serif',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
      {children}
      <StatusNotifPopups notifs={notifs} onClose={closeNotif} />
    </>
  )
}
