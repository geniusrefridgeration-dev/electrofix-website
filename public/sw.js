// ElectroFix Service Worker — Background Push Notifications
self.addEventListener('install', e => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(clients.claim()))

self.addEventListener('push', e => {
  if (!e.data) return
  try {
    const data = e.data.json()
    e.waitUntil(
      self.registration.showNotification(data.title || 'ElectroFix', {
        body:    data.body  || 'Booking update',
        icon:    data.icon  || '/favicon.ico',
        badge:   '/favicon.ico',
        tag:     data.tag   || 'electrofix-notif',
        data:    { url: data.url || '/' },
        vibrate: [200, 100, 200],
        requireInteraction: true,
      })
    )
  } catch {}
})

self.addEventListener('notificationclick', e => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(list => {
      const url = e.notification.data?.url || '/'
      for (const client of list) {
        if ('focus' in client) { client.focus(); return }
      }
      clients.openWindow(url)
    })
  )
})
