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
  const notificationTitle = payload.notification.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/pwa-192x192.png',
    badge: '/pwa-192x192.png',
    tag: payload.notification.tag || 'new_order',
    vibrate: [300, 100, 300, 100, 300],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
