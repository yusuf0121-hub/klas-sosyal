self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Klas Sosyal', body: 'Yeni bir bildirimin var.' };
  event.waitUntil(self.registration.showNotification(data.title || 'Klas Sosyal', {
    body: data.body || 'Yeni bir bildirimin var.',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: data.url || '/' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windows) => {
    const target = event.notification.data?.url || '/';
    const existing = windows.find((client) => 'focus' in client);
    if (existing) return existing.focus();
    return clients.openWindow(target);
  }));
});
