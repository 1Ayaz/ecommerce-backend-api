self.addEventListener('push', function (event) {
    if (event.data) {
        const data = event.data.json();

        const options = {
            body: data.body || 'You have a new update.',
            icon: data.icon || '/icon-192.png',
            badge: '/icon-192.png', // Small monochrome icon for Android status bar
            vibrate: [200, 100, 200, 100, 200, 100, 200], // Aggressive buzz
            data: {
                dateOfArrival: Date.now(),
                primaryKey: '1'
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title || 'Mubarak Chicken', options)
        );
    }
});

self.addEventListener('notificationclick', function (event) {
    event.notification.close();
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
});
