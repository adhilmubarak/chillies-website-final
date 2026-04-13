import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ChefsChoice from './components/ChefsChoice';
import MenuItemCard from './components/MenuItemCard';
import FlashSaleView from './components/FlashSaleView';
import HappyHourView from './components/HappyHourView';
import CartSidebar from './components/CartSidebar';
import AdminPanel from './components/AdminPanel';
import DeliveryPanel from './components/DeliveryPanel';
import KitchenPanel from './components/KitchenPanel';
import RewardsPage from './components/RewardsPage';
import Footer from './components/Footer';
import OrderTrackerModal from './components/OrderTrackerModal';
import SmartSuggestion from './components/SmartSuggestion';
import NotificationTicker from './components/NotificationTicker';
import StoreStatusAlert from './components/StoreStatusAlert';
import BottomNav from './components/BottomNav';
import FeedbackModal from './components/FeedbackModal';
import OffersPage from './components/OffersPage';
import ComplaintsPage from './components/ComplaintsPage';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from './data';
import ShawarmaLoader from './components/ShawarmaLoader';
import { MenuItem, CategoryConfig, CartItem, Order, Coupon, CustomOffer, FoodRating, LoyaltyAccount, Category, Complaint } from './types';
import { Search, X } from 'lucide-react';

import { db } from './firebase';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  setDoc
} from 'firebase/firestore';

export const printThermalBill = (order: Order) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsHtml = order.items
    .map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span>${item.quantity}x ${item.name}</span>
        <span>₹${(item.price * item.quantity).toFixed(2)}</span>
      </div>
    `)
    .join('');
  const trackingQrUrl = order.trackingLink ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(order.trackingLink)}&bgcolor=ffffff&color=000000&margin=0` : '';

  printWindow.document.write(`
    <html>
      <head>
        <title>Order #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; margin: 0; color: #000; background: #fff; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .order-highlight { 
            font-size: 24px; 
            font-weight: bold; 
            border: 2px solid #000; 
            display: inline-block; 
            padding: 5px 15px; 
            margin: 10px 0;
          }
          .customer-info { 
            text-align: left; 
            font-size: 14px; 
            margin-bottom: 10px; 
            padding-bottom: 5px;
            border-bottom: 1px dotted #000;
          }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
          .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          .qr-section { text-align: center; margin-top: 15px; padding: 10px; border: 1px solid #eee; border-radius: 8px; }
          .qr-label { font-size: 10px; margin-bottom: 5px; color: #666; font-family: sans-serif; text-transform: uppercase; letter-spacing: 1px; }
          h2 { margin: 5px 0; }
          p { margin: 2px 0; font-size: 12px; }
          img { max-width: 120px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CHILLIES</h2>
          <p>Valiyakulam, Alappuzha</p>
          <div class="order-highlight">#${order.id}</div>
          <p>${order.date} ${order.timestamp}</p>
        </div>
        <div class="customer-info">
          <div><strong>Name:</strong> ${order.customerName}</div>
          <div><strong>Phone:</strong> ${order.contactNumber}</div>
          ${order.address ? `<div><strong>Addr:</strong> ${order.address}</div>` : ''}
          <div><strong>Type:</strong> ${order.type.toUpperCase()}</div>
        </div>
        <div style="font-size: 14px;">${itemsHtml}</div>
        <div class="total" style="font-size: 14px;">
          <div style="display: flex; justify-content: space-between;">
            <span>Subtotal:</span>
            <span>₹${(order.subtotal || 0).toFixed(2)}</span>
          </div>
          ${order.deliveryCharge ? `<div style="display: flex; justify-content: space-between;"><span>Delivery:</span><span>₹${order.deliveryCharge.toFixed(2)}</span></div>` : ''}
          ${order.discount ? `<div style="display: flex; justify-content: space-between;"><span>Discount:</span><span>-₹${order.discount.toFixed(2)}</span></div>` : ''}
          <div style="display: flex; justify-content: space-between; font-size: 1.1em; margin-top: 5px;">
            <span>TOTAL:</span>
            <span>₹${order.total.toFixed(2)}</span>
          </div>
        </div>
        
        ${order.trackingLink ? `
        <div class="qr-section">
          <div class="qr-label">Scan to track order</div>
          <img src="${trackingQrUrl}" alt="Tracking QR Code" />
        </div>
        ` : ''}

        <div class="footer">
          <p>Thank you for dining with us!</p>
          <p>Spread Happiness</p>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
    printWindow.close();
  }, 500);
};

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryConfig[]>([
      { id: '1', name: 'Breads' },
      { id: '2', name: 'Starters' },
      { id: '3', name: 'Main Course' },
      { id: '4', name: 'Desserts' },
      { id: '5', name: 'Drinks' }
  ]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [customOffers, setCustomOffers] = useState<CustomOffer[]>([]);
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<LoyaltyAccount[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [activeSection, setActiveSection] = useState('home');
  const [foodRatings, setFoodRatings] = useState<FoodRating[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [riderLocation, setRiderLocation] = useState<{lat: number, lng: number, timestamp: number} | null>(null);

  const [promoSettings, setPromoSettings] = useState({
      isFlashSaleActive: false,
      flashSaleDate: new Date().toISOString().split('T')[0],
      flashSaleStartTime: '18:00',
      flashSaleEndTime: '21:00',
      isHappyHourActive: false,
      happyHourStartTime: '16:00',
      happyHourEndTime: '18:00'
  });

  const [storeSettings, setStoreSettings] = useState({
      acceptingOrders: true,
      startTime: '07:00',
      endTime: '23:00',
      deliveryUpiId: '',
      announcement: '',
      isAnnouncementActive: false,
      loyaltyPointsRatio: 10,
      minimumPointsToRedeem: 50,
      latestBroadcast: null as { title: string; body: string; timestamp: number } | null
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [initialTrackId, setInitialTrackId] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Breads');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestion, setSuggestion] = useState<MenuItem | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(location.pathname === '/admin');
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(splashTimer);
  }, []);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tid = params.get('tid');
    if (tid) {
      setInitialTrackId(tid);
      setIsTrackerOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search]);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    const isStandalone = ('standalone' in window.navigator) && !!(window.navigator as any).standalone;
    
    if (isIOSDevice && !isStandalone) {
      setIsIOS(true);
      setShowInstallBanner(true);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
    }
    setDeferredPrompt(null);
  };


  // Request notifications gracefully when the user interacts
  const requestNotifications = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  const fireNotification = async (title: string, options: any) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        if ('serviceWorker' in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          if (regs.length > 0) {
            const registration = await navigator.serviceWorker.ready;
            if (registration && registration.showNotification) {
              await registration.showNotification(title, options);
              return;
            }
          }
        }
        // Fallback for desktop web or dev mode without SW
        new Notification(title, options);
      } catch (e) {
        new Notification(title, options);
      }
    }
  };

  // Push Notification logic for Flash Sales
  const prevPromoRef = React.useRef<any>(null);
  useEffect(() => {
    if (prevPromoRef.current) {
       if (!prevPromoRef.current.isFlashSaleActive && promoSettings.isFlashSaleActive) {
          fireNotification('⚡ Flash Sale is LIVE!', { body: 'Special discounts are active right now. Order before they are gone!', icon: '/pwa-icon.svg', vibrate: [200, 100, 200] });
       }
    }
    prevPromoRef.current = promoSettings;
  }, [promoSettings.isFlashSaleActive]);

  // Push Notification logic for Broadcasts
  const prevBroadcastRef = React.useRef<any>(null);
  useEffect(() => {
    if (storeSettings.latestBroadcast) {
       if (!prevBroadcastRef.current || prevBroadcastRef.current.timestamp !== storeSettings.latestBroadcast.timestamp) {
          fireNotification(storeSettings.latestBroadcast.title, { 
              body: storeSettings.latestBroadcast.body, 
              icon: '/pwa-icon.svg', 
              vibrate: [200, 100, 200] 
          });
       }
       prevBroadcastRef.current = storeSettings.latestBroadcast;
    }
  }, [storeSettings.latestBroadcast]);

  // Push Notification logic for Local Orders
  const prevOrdersRef = React.useRef<Record<string, string>>({});
  useEffect(() => {
    const myOrderIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
    orders.forEach(order => {
       const prevStatus = prevOrdersRef.current[order.id];
       if (myOrderIds.includes(order.id) && prevStatus && prevStatus !== order.status) {
           const messages: Record<string, string> = {
              preparing: '👨‍🍳 Your order is now being prepared.',
              ready: '🥡 Your order is ready!',
              out_for_delivery: '🛵 Your order is out for delivery! Track it live.',
              delivered: '✨ Your order is complete. Enjoy!',
              cancelled: '❌ Your order was cancelled.'
           };
           if (messages[order.status]) {
               fireNotification(`Order #${order.id} Update`, { body: messages[order.status], icon: '/pwa-icon.svg', vibrate: [200, 100, 200] });
           }
       }
       prevOrdersRef.current[order.id] = order.status;
    });
  }, [orders]);

  // Abandoned Cart Notification logic
  useEffect(() => {
    let timer: number;
    if (cartItems.length > 0 && !isCartOpen) {
      timer = window.setTimeout(() => {
        fireNotification('Hungry? 😋', { 
            body: 'Your delicious food is waiting in the cart! Complete your order before the kitchen closes.', 
            icon: '/pwa-192x192.png', 
            vibrate: [200, 100, 200] 
        });
      }, 15 * 60 * 1000); // 15 minutes
    }
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [cartItems, isCartOpen]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('tid') || params.get('trackId');
    if (trackId) {
      setInitialTrackId(trackId);
      setIsTrackerOpen(true);
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
  }, []);

  const isFlashSaleActive = useMemo(() => {
    if (!promoSettings.isFlashSaleActive) return false;
    const today = currentTime.toISOString().split('T')[0];
    if (promoSettings.flashSaleDate && today !== promoSettings.flashSaleDate) return false;
    const [startH, startM] = promoSettings.flashSaleStartTime.split(':').map(Number);
    const [endH, endM] = promoSettings.flashSaleEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, currentTime]);

  const isHappyHourActive = useMemo(() => {
    if (!promoSettings.isHappyHourActive) return false;
    const [startH, startM] = promoSettings.happyHourStartTime.split(':').map(Number);
    const [endH, endM] = promoSettings.happyHourEndTime.split(':').map(Number);
    const startMin = startH * 60 + startM;
    const endMin = endH * 60 + endM;
    const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
    return currMin >= startMin && currMin < endMin;
  }, [promoSettings, currentTime]);

  const checkTimeRange = (startStr?: string, endStr?: string): boolean => {
      if (!startStr || !endStr) return true;
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      if (startMin <= endMin) return currMin >= startMin && currMin <= endMin;
      return currMin >= startMin || currMin <= endMin;
  };

  const isStoreOpen = storeSettings.acceptingOrders && checkTimeRange(storeSettings.startTime, storeSettings.endTime);

  const checkAvailability = (catName: string) => {
      if (!isStoreOpen) return { isAvailable: false, reason: 'Store Closed' };
      const config = dbCategories.find(c => c.name === catName);
      if (!config) return { isAvailable: true };
      if (config.isUnavailable) return { isAvailable: false, reason: 'Category Offline' };
      const active = checkTimeRange(config.startTime, config.endTime);
      return { isAvailable: active, availabilityTime: config.startTime };
  };

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMenuItems(items.length > 0 ? items : INITIAL_MENU_ITEMS);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
      if (fetched.length > 0) setDbCategories(fetched.sort((a,b) => (a.order || 0) - (b.order || 0)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'orders')); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id } as any));
      setOrders(fetched.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'coupons'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCoupons(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Coupon)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'foodRatings'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as FoodRating));
      setFoodRatings(fetched.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'customOffers'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setCustomOffers(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CustomOffer)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = doc(db, 'tracking', 'rider1');
    const unsubscribe = onSnapshot(q, (docSnap) => {
      if (docSnap.exists()) {
        setRiderLocation(docSnap.data() as any);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'loyalty'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setLoyaltyAccounts(snapshot.docs.map(d => ({ ...d.data(), id: d.id } as LoyaltyAccount)));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'complaints'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Complaint));
      setComplaints(fetched.sort((a, b) => b.createdAt - a.createdAt));
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setPromoSettings({
                isFlashSaleActive: data.isFlashSaleActive || false,
                flashSaleDate: data.flashSaleDate || new Date().toISOString().split('T')[0],
                flashSaleStartTime: data.flashSaleStartTime || '18:00',
                flashSaleEndTime: data.flashSaleEndTime || '21:00',
                isHappyHourActive: data.isHappyHourActive || false,
                happyHourStartTime: data.happyHourStartTime || '16:00',
                happyHourEndTime: data.happyHourEndTime || '18:00'
            });
            setStoreSettings({
                acceptingOrders: data.acceptingOrders !== false,
                startTime: data.startTime || '07:00',
                endTime: data.endTime || '23:00',
                deliveryUpiId: data.deliveryUpiId || '',
                announcement: data.announcement || '',
                isAnnouncementActive: data.isAnnouncementActive || false,
                loyaltyPointsRatio: data.loyaltyPointsRatio || 10,
                minimumPointsToRedeem: data.minimumPointsToRedeem || 50,
                latestBroadcast: data.latestBroadcast || null
            });
        }
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (item: MenuItem) => {
    if (!isStoreOpen) return;
    let price = item.price;
    if (isFlashSaleActive && item.isFlashSale && item.flashSalePrice) price = item.flashSalePrice;
    else if (isHappyHourActive && item.isHappyHour && item.happyHourPrice) price = item.happyHourPrice;

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, price } : i);
      return [...prev, { ...item, quantity: 1, price }];
    });
  };

  const handleAddOrder = async (order: Order) => {
    try {
      requestNotifications(); // Ask for notification permission during checkout interaction
      
      const myOrders = JSON.parse(localStorage.getItem('myOrders') || '[]');
      if (!myOrders.includes(order.id)) {
          myOrders.push(order.id);
          localStorage.setItem('myOrders', JSON.stringify(myOrders));
      }

      await addDoc(collection(db, 'orders'), order);
      
      if (order.contactNumber && order.contactNumber.length === 10) {
          const account = loyaltyAccounts.find(l => l.phone === order.contactNumber);
          const ratio = storeSettings.loyaltyPointsRatio || 10;
          const pointsEarned = Math.floor(order.total / ratio);
          
          if (account && account.id) {
              const newPoints = account.points - (order.pointsRedeemed || 0) + pointsEarned;
              await updateDoc(doc(db, 'loyalty', account.id), { 
                  points: newPoints, 
                  lastUpdated: Date.now() 
              });
          }
      }
    } catch (error) {
      console.error("Error adding order: ", error);
    }
  };

  useEffect(() => {
    if (activeCategory === 'Flash Sale' && !isFlashSaleActive) {
      setActiveCategory('Breads');
    } else if (activeCategory === 'Happy Hour' && !isHappyHourActive) {
      setActiveCategory('Breads');
    }
  }, [isFlashSaleActive, isHappyHourActive, activeCategory]);

  const orderedCats = useMemo(() => [
    ...dbCategories.filter(c => !c.isUnavailable && (c.name.toLowerCase() === 'breads' || c.name.toLowerCase() === 'bread')).map(c => c.name),
    ...(isFlashSaleActive ? ['Flash Sale'] : []), 
    ...(isHappyHourActive ? ['Happy Hour'] : []), 
    ...dbCategories.filter(c => !c.isUnavailable && c.name.toLowerCase() !== 'breads' && c.name.toLowerCase() !== 'bread').map(c => c.name),
    'All'
  ], [dbCategories, isFlashSaleActive, isHappyHourActive]);

  const observerTarget = React.useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const el = observerTarget.current;
    if (!el) return;
    
    let isInitialRender = true;
    const observer = new IntersectionObserver(
        (entries) => {
            if (isInitialRender) {
                isInitialRender = false;
                return;
            }
            if (entries[0].isIntersecting) {
               const currentIndex = orderedCats.indexOf(activeCategory);
               if (currentIndex !== -1 && currentIndex < orderedCats.length - 2) {
                   const nextCat = orderedCats[currentIndex + 1];
                   setActiveCategory(nextCat);
                   setTimeout(() => {
                       document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' });
                   }, 50);
               }
            }
        }, 
        { threshold: 0.1 }
    );
    
    const t = setTimeout(() => observer.observe(el), 800);
    return () => { clearTimeout(t); observer.disconnect(); };
  }, [activeCategory, orderedCats]);

  const filteredItems = menuItems.filter(item => {
    const parentCategory = dbCategories.find(c => c.name === item.category);
    if (parentCategory?.isUnavailable) return false;

    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = false;
    if (activeCategory === 'Flash Sale') matchesCategory = !!item.isFlashSale;
    else if (activeCategory === 'Happy Hour') matchesCategory = !!item.isHappyHour;
    else if (activeCategory === 'All') matchesCategory = !item.isExclusive;
    else matchesCategory = item.category === activeCategory && !item.isExclusive;
    return matchesCategory && matchesSearch;
  });

  return (
    <>
    <Routes>
      <Route path="/admin" element={
        <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden bg-stone-950">
          <AdminPanel 
            isOpen={isAdminOpen} 
            onClose={() => setIsAdminOpen(false)} 
            items={menuItems}
            categories={dbCategories}
            orders={orders}
            coupons={coupons}
            customOffers={customOffers}
            foodRatings={foodRatings}
            complaints={complaints}
            isStoreOpen={isStoreOpen}
            promoSettings={promoSettings}
            storeSettings={storeSettings}
            riderLocation={riderLocation}
            onAddItem={async i => { const {id, ...d} = i; await addDoc(collection(db, 'menuItems'), d); }}
            onUpdateItem={async i => { if(i.id) await updateDoc(doc(db, 'menuItems', i.id), {...i}); }}
            onDeleteItem={async id => await deleteDoc(doc(db, 'menuItems', id))}
            onAddCategory={n => addDoc(collection(db, 'categories'), {name: n, startTime: '00:00', endTime: '23:59', isUnavailable: false, order: dbCategories.length})}
            onUpdateCategory={async c => {
              await updateDoc(doc(db, 'categories', c.id), {name: c.name, startTime: c.startTime || '00:00', endTime: c.endTime || '23:59', isUnavailable: c.isUnavailable || false});
              if (c.isUnavailable) {
                const snap = await getDocs(query(collection(db, 'menuItems'), where('category', '==', c.name)));
                snap.forEach(d => updateDoc(d.ref, {isUnavailable: true}));
              }
            }}
            onDeleteCategory={async n => { const q = query(collection(db, 'categories'), where("name", "==", n)); const s = await getDocs(q); s.forEach(d => deleteDoc(d.ref)); }}
            onReorderCategory={async (dir: 'up' | 'down', index: number) => {
              const newArray = [...dbCategories];
              if (dir === 'up' && index > 0) {
                [newArray[index], newArray[index - 1]] = [newArray[index - 1], newArray[index]];
              } else if (dir === 'down' && index < newArray.length - 1) {
                [newArray[index], newArray[index + 1]] = [newArray[index + 1], newArray[index]];
              } else return;
              setDbCategories(newArray);
              await Promise.all(newArray.map((cat, i) => updateDoc(doc(db, 'categories', cat.id), { order: i })));
            }}
            onUpdateOrderStatus={async (id, s, pm) => { 
              const q = query(collection(db, 'orders'), where("id", "==", id)); 
              const snap = await getDocs(q); 
              snap.forEach(d => {
                const updates: any = { status: s };
                if (pm) updates.paymentMethod = pm;
                if (s === 'ready' || s === 'out_for_delivery') {
                  updates.assignedAt = Date.now();
                }
                updateDoc(d.ref, updates);
              }); 
            }}
            onAddCoupon={c => addDoc(collection(db, 'coupons'), c)} onDeleteCoupon={id => deleteDoc(doc(db, 'coupons', id))}
            onAddCustomOffer={o => addDoc(collection(db, 'customOffers'), o)}
            onUpdateCustomOffer={async o => { if(o.id) await updateDoc(doc(db, 'customOffers', o.id), {...o}); }}
            onDeleteCustomOffer={async id => await deleteDoc(doc(db, 'customOffers', id))}
            onUpdateStoreSettings={s => setDoc(doc(db, 'settings', 'general'), s, {merge: true})}
            onUpdatePromos={p => setDoc(doc(db, 'settings', 'general'), p, {merge: true})}
            onTestNotification={() => fireNotification('System Alert', { body: 'Push Notifications are enabled and working correctly on this device!', icon: '/pwa-icon.svg', vibrate: [200, 100, 200] })}
            loyaltyAccounts={loyaltyAccounts}
            onAddLoyaltyAccount={async (phone: string, points: number) => { await addDoc(collection(db, 'loyalty'), { phone, points, lastUpdated: Date.now() }); }}
            onUpdateLoyaltyAccount={async (id: string, points: number) => { await updateDoc(doc(db, 'loyalty', id), { points, lastUpdated: Date.now() }); }}
            onUpdateComplaint={async (id: string, st: 'open' | 'resolved') => { await updateDoc(doc(db, 'complaints', id), { status: st }); }}
            onDeleteComplaint={async (id: string) => await deleteDoc(doc(db, 'complaints', id))}
            onAddOrder={handleAddOrder}
          />
        </div>
      } />
      <Route path="/delivery" element={
        <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden bg-stone-950">
          <DeliveryPanel 
            orders={orders}
            onUpdateOrderStatus={async (id, s, pm) => { 
                const q = query(collection(db, 'orders'), where("id", "==", id)); 
                const snap = await getDocs(q); 
                snap.forEach(d => {
                  const updates: any = { status: s };
                  if (pm) updates.paymentMethod = pm;
                  if (s === 'ready' || s === 'out_for_delivery') {
                      updates.assignedAt = Date.now();
                  }
                  updateDoc(d.ref, updates);
                }); 
            }}
            onUpdateRiderLocation={async (lat, lng) => { await setDoc(doc(db, 'tracking', 'rider1'), { lat, lng, timestamp: Date.now() }); }}
            deliveryUpiId={storeSettings.deliveryUpiId}
          />
        </div>
      } />
      <Route path="/kitchen" element={
        <KitchenPanel 
          orders={orders}
          onUpdateOrderStatus={async (id, s, pm) => { 
              const q = query(collection(db, 'orders'), where("id", "==", id)); 
              const snap = await getDocs(q); 
              snap.forEach(d => {
                const updates: any = { status: s };
                if (s === 'ready') updates.assignedAt = Date.now();
                updateDoc(d.ref, updates);
              }); 
          }}
        />
      } />
      <Route path="/offers" element={
        <OffersPage 
          isFlashSaleActive={isFlashSaleActive}
          isHappyHourActive={isHappyHourActive}
          flashSaleEndTime={promoSettings.flashSaleEndTime}
          happyHourStartTime={promoSettings.happyHourStartTime}
          happyHourEndTime={promoSettings.happyHourEndTime}
          customOffers={customOffers}
        />
      } />
      <Route path="/rewards" element={<RewardsPage loyaltyAccounts={loyaltyAccounts} onEnrollLoyalty={async (phone: string, name: string) => { await addDoc(collection(db, 'loyalty'), { phone, customerName: name, points: 0, lastUpdated: Date.now() }); }} />} />
      <Route path="/feedback" element={<FeedbackModal />} />
      <Route path="/complaints" element={<ComplaintsPage />} />
      <Route path="/*" element={
        <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden">
          <div className="fixed inset-0 bg-stone-950 -z-10" />
      
      <NotificationTicker 
        isFlashSaleActive={isFlashSaleActive} 
        isHappyHourActive={isHappyHourActive}
        flashSaleEndTime={promoSettings.flashSaleEndTime}
        isStoreOpen={isStoreOpen}
        startTime={storeSettings.startTime}
        announcement={storeSettings.announcement}
        isAnnouncementActive={storeSettings.isAnnouncementActive}
      />

      <Navbar 
        currentTime={currentTime}
        cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTracker={() => {
            setInitialTrackId('');
            setIsTrackerOpen(true);
        }}
        hasTicker={!isStoreOpen || isFlashSaleActive || isHappyHourActive || storeSettings.isAnnouncementActive}
      />
      
      <Hero />
      
      <StoreStatusAlert 
        isStoreOpen={isStoreOpen} 
        startTime={storeSettings.startTime} 
        endTime={storeSettings.endTime} 
      />

      <ChefsChoice 
        items={menuItems.filter(item => item.isChefChoice && !item.isExclusive)} 
        onAdd={addToCart} 
        isFlashSaleActive={isFlashSaleActive}
        checkAvailability={checkAvailability}
        isStoreOpen={isStoreOpen}
        cartItems={cartItems}
        allMenuItems={menuItems}
        onShowSuggestion={(s) => setSuggestion(s)}
      />

      <section id="menu" className="pb-24 pt-12 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24 md:scroll-mt-32">
        <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <span className="text-brand-500 uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold block">Our Selection</span>
          <h2 className="text-3xl md:text-6xl font-serif text-stone-50 relative inline-block">
            Curated Menu
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 md:w-24 h-1 bg-brand-500 rounded-full"></span>
          </h2>
        </div>

        <div className="max-w-md mx-auto mb-10 md:mb-12 px-2">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                    type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="block w-full pl-12 pr-4 py-4 bg-stone-900 border border-stone-800 rounded-full text-stone-200 focus:border-brand-500 focus:outline-none"
                />
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 mb-12">
            <div className="flex w-full overflow-x-auto scrollbar-hide md:flex-wrap md:justify-center gap-2 px-4 pb-4">
                {orderedCats.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-6 md:px-8 py-3 rounded-full border transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                            activeCategory === cat ? 'bg-brand-500 border-brand-500 text-white' : 'bg-transparent border-stone-800 text-stone-500'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {(isLoading || showSplash) ? (
            <ShawarmaLoader />
        ) : (
            <>
              {activeCategory === 'Flash Sale' && (
                <FlashSaleView 
                  items={menuItems.filter(i => i.isFlashSale)} 
                  onAdd={addToCart} 
                  isFlashSaleActive={isFlashSaleActive}
                  flashSaleEndTime={promoSettings.flashSaleEndTime}
                  checkAvailability={checkAvailability}
                  isStoreOpen={isStoreOpen}
                  cartItems={cartItems}
                  allMenuItems={menuItems}
                  onShowSuggestion={(s) => setSuggestion(s)}
                />
              )}
              {activeCategory === 'Happy Hour' && (
                <HappyHourView 
                  items={menuItems.filter(i => i.isHappyHour)} 
                  onAdd={addToCart} 
                  isHappyHourActive={isHappyHourActive}
                  checkAvailability={checkAvailability}
                  isStoreOpen={isStoreOpen}
                  cartItems={cartItems}
                  allMenuItems={menuItems}
                  onShowSuggestion={(s) => setSuggestion(s)}
                />
              )}
              {activeCategory !== 'Flash Sale' && activeCategory !== 'Happy Hour' && (
                <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                    {filteredItems.map((item, index) => (
                        <MenuItemCard 
                            key={item.id} item={item} onAdd={addToCart} index={index} 
                            isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive}
                            isAvailable={checkAvailability(item.category).isAvailable}
                            isStoreOpen={isStoreOpen} cartItems={cartItems} allMenuItems={menuItems} 
                            onShowSuggestion={(s) => setSuggestion(s)}
                        />
                    ))}
                </div>
                {orderedCats.indexOf(activeCategory) !== -1 && orderedCats.indexOf(activeCategory) < orderedCats.length - 2 && (
                    <div ref={observerTarget} className="w-full h-32 flex justify-center items-center opacity-70">
                        <div className="flex flex-col items-center animate-pulse">
                            <span className="text-[10px] uppercase font-bold tracking-[0.3em] text-stone-500 mb-4">Scroll to next</span>
                            <div className="w-px h-12 bg-gradient-to-b from-stone-600 to-transparent"></div>
                        </div>
                    </div>
                )}
                </>
              )}
            </>
        )}
      </section>

      <Footer onOpenAdmin={() => navigate('/admin')} onOpenTC={() => {}} />
      <BottomNav 
        cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTracker={() => {
            setInitialTrackId('');
            setIsTrackerOpen(true);
        }}
        activeSection={activeSection}
      />
      <OrderTrackerModal 
        isOpen={isTrackerOpen} 
        onClose={() => {
            setIsTrackerOpen(false);
            setInitialTrackId('');
        }} 
        initialOrderId={initialTrackId}
        riderLocation={riderLocation}
        orders={orders}
      />
      {suggestion && <SmartSuggestion suggestion={suggestion} onAdd={addToCart} onClose={() => setSuggestion(null)} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} />}
      
      <CartSidebar
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems}
        onUpdateQuantity={(id, delta) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0))}
        onRemove={id => setCartItems(prev => prev.filter(i => i.id !== id))}
        onClearCart={() => setCartItems([])} onShowNotification={() => {}} 
        onAddOrder={handleAddOrder}
        onTrackOrder={() => {
            setIsCartOpen(false);
            setIsTrackerOpen(true);
        }} coupons={coupons}
        allMenuItems={menuItems}
        onAddToCart={addToCart}
        loyaltyAccounts={loyaltyAccounts}
        storeSettings={storeSettings}
      />

        </div>
      } />
    </Routes>
    
    {showInstallBanner && (deferredPrompt || isIOS) && (
        <div className="fixed bottom-24 left-4 right-4 md:left-auto md:right-8 md:bottom-8 md:w-96 bg-stone-900 border border-brand-500/50 rounded-2xl p-4 shadow-2xl z-[100] animate-fade-in flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className="flex gap-3 items-center">
                    <img src="/pwa-192x192.png" alt="App Icon" className="w-10 h-10 rounded-xl object-contain drop-shadow-md" onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png'; }} />
                    <div>
                        <h4 className="text-white font-bold text-sm">Install Chillies App</h4>
                        <p className="text-stone-400 text-xs text-balance">Get a faster, full-screen experience directly from your home screen.</p>
                    </div>
                </div>
                <button onClick={() => setShowInstallBanner(false)} className="text-stone-500 hover:text-white p-1 transition-colors"><X size={16} /></button>
            </div>
            {isIOS ? (
                <div className="mt-2 text-center text-xs text-stone-300 bg-stone-800 p-3 rounded-xl border border-stone-700">
                    To install, tap the <strong className="text-white">Share</strong> icon below, then select <strong className="text-white">Add to Home Screen</strong>.
                </div>
            ) : (
                <button onClick={handleInstallClick} className="w-full bg-brand-500 hover:bg-brand-400 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl transition-all shadow-lg active:scale-95">
                    Install Now
                </button>
            )}
        </div>
    )}
    </>
  );
}

export default App;