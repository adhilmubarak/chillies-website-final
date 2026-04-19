importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyDaF9QwsQBuBuz_blvJCPQQspxIlA-ldio",
    authDomain: "chillies-debd6.firebaseapp.com",
    projectId: "chillies-debd6",
    storageBucket: "chillies-debd6.firebasestorage.app",
    messagingSenderId: "868591964292",
    appId: "1:868591964292:web:2a3b00f43008a07177b2d1",
    measurementId: "G-22RTL2DRFV"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // If the payload contains a notification object, the FCM SDK handles
  // displaying the message automatically in the background. 
  if (payload.notification) {
      console.log('[firebase-messaging-sw.js] Payload has notification, letting FCM handle it.');
      return;
  }

  // Support both notification object (standard) or data object containing title/body
  const title = (payload.notification && payload.notification.title) || (payload.data && payload.data.title) || 'New Notification';
  const body = (payload.notification && payload.notification.body) || (payload.data && payload.data.body) || 'You have a new update.';

  
  const notificationOptions = {
    body: body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: (payload.notification && payload.notification.tag) || (payload.data && payload.data.orderId) || 'new_order',
    vibrate: [300, 100, 300, 100, 300],
    requireInteraction: true,
    data: Object.assign({}, payload.data, {
      url: '/admin' // Store the URL we want to open on click
    })
  };

  return self.registration.showNotification(title, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
  event.notification.close();
  
  const urlToOpen = new URL(event.notification.data.url || '/admin', self.location.origin).href;

  const promiseChain = clients.matchAll({
    type: 'window',
    includeUncontrolled: true
  }).then((windowClients) => {
    let matchingClient = null;
    for (let i = 0; i < windowClients.length; i++) {
      const windowClient = windowClients[i];
      if (windowClient.url === urlToOpen) {
        matchingClient = windowClient;
        break;
      }
    }
    if (matchingClient) {
      return matchingClient.focus();
    } else {
      return clients.openWindow(urlToOpen);
    }
  });

  event.waitUntil(promiseChain);
});
