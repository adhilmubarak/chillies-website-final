
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import MenuItemCard from './components/MenuItemCard';
import CartSidebar from './components/CartSidebar';
import OrderTrackerModal from './components/OrderTrackerModal';
import AdminPanel from './components/AdminPanel';
import { Category, MenuItem, CartItem, Order, CategoryConfig, Coupon, CustomOffer, LoyaltyAccount, FoodRating, Complaint } from './types';
import { MENU_ITEMS } from './data.ts';
import { db } from './firebase';
import { collection, addDoc, query, onSnapshot, doc, setDoc, updateDoc, getDocs, where, deleteDoc } from 'firebase/firestore';
import { Search, Bike, Store, Clock, Flame, ShoppingBag, CheckCircle, XCircle, User, Star, AlertCircle, MessageSquare, Send, X, Info } from 'lucide-react';
import BottomNav from './components/BottomNav';
import NotificationTicker from './components/NotificationTicker';
import SmartSuggestion from './components/SmartSuggestion';
import ChefsChoice from './components/ChefsChoice';
import FlashSaleView from './components/FlashSaleView';
import HappyHourView from './components/HappyHourView';
import StoreStatusAlert from './components/StoreStatusAlert';
import OffersPage from './components/OffersPage';
import RewardsPage from './components/RewardsPage';
import FeedbackModal from './components/FeedbackModal';
import ComplaintsPage from './components/ComplaintsPage';
import DeliveryPanel from './components/DeliveryPanel';
import KitchenPanel from './components/KitchenPanel';
import ShawarmaLoader from './components/ShawarmaLoader';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { PushNotifications } from '@capacitor/push-notifications';
import { registerPlugin } from '@capacitor/core';

// KOT Printing Helper
export const printKOT = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=600,height=600');
  if (!printWindow) return;
  
  const itemsHtml = order.items.map(item => `
    <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 22px;">
      <span>${item.quantity}x ${item.name}</span>
    </div>
  `).join('');

  printWindow.document.write(`
    <html>
      <head>
        <title>KOT - #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; margin: 0; color: #000; background: #fff; font-weight: bold; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 15px; }
          .order-highlight { 
            font-size: 32px; 
            font-weight: 900; 
            border: 4px solid #000; 
            display: inline-block; 
            padding: 10px 25px; 
            margin: 10px 0;
          }
          .details { 
            text-align: left; 
            font-size: 18px; 
            margin-bottom: 15px; 
            padding-bottom: 10px;
            border-bottom: 2px dashed #000;
          }
          h2 { margin: 0; font-size: 36px; text-transform: uppercase; letter-spacing: 2px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>KOT</h2>
          <div class="order-highlight">#${order.id}</div>
          <p style="font-size: 16px; margin: 5px 0;">${order.date} | ${order.timestamp}</p>
        </div>
        <div class="details">
          <div style="font-size: 24px; text-decoration: underline; margin-bottom: 10px;"><strong>TYPE:</strong> ${order.type.toUpperCase()}</div>
          ${order.type === 'delivery' && order.customerName ? `<div><strong>For:</strong> ${order.customerName}</div>` : ''}
        </div>
        <div style="font-size: 20px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase;">Items to prepare:</div>
        <div>${itemsHtml}</div>
        <div style="text-align: center; margin-top: 30px; font-size: 14px; border-top: 2px solid #000; padding-top: 10px;">
          End of Ticket
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

export const printThermalBill = (order: Order) => {
  const printWindow = window.open('', '_blank', 'width=600,height=600');
  if (!printWindow) return;
  const itemsHtml = order.items.map(item => `<div style="display: flex; justify-content: space-between; margin-bottom: 5px;"><span>${item.quantity}x ${item.name}</span><span>₹${item.price * item.quantity}</span></div>`).join('');
  printWindow.document.write(`<html><head><style>body { font-family: monospace; width: 80mm; padding: 10px; margin: 0; }</style></head><body><h2 style="text-align:center">Chillies Restaurant</h2><p style="text-align:center">Order #${order.id}</p><hr/>${itemsHtml}<hr/><div style="display:flex; justify-content:space-between; font-weight:bold"><span>Total</span><span>₹${order.total}</span></div><p style="text-align:center; margin-top:20px">Thank you!</p></body></html>`);
  printWindow.document.close();
  setTimeout(() => { printWindow.print(); printWindow.close(); }, 500);
};

const arrayBufferToBase64 = (buffer: Uint8Array) => {
  let binary = '';
  for (let i = 0; i < buffer.byteLength; i++) binary += String.fromCharCode(buffer[i]);
  return window.btoa(binary);
};

const NetworkPrinter = Capacitor.isNativePlatform() ? registerPlugin<any>('NetworkPrinter') : null;

export const discoverNetworkPrinters = async (): Promise<{printers: string[], scannedSubnets: string[]}> => {
  if (!NetworkPrinter) return { printers: [], scannedSubnets: [] };
  const result = await NetworkPrinter.discoverPrinters();
  return { printers: result.printers || [], scannedSubnets: result.scannedSubnets || [] };
};

export const printNetworkKOT = async (order: Order, printers: {name: string, ip: string}[]) => {
  if (!NetworkPrinter) { printKOT(order); return; }
  let bytes: number[] = [0x1B, 0x40, 0x1B, 0x61, 1, 0x1D, 0x21, 0x11];
  const title = "KOT\n"; for(let i=0; i<title.length; i++) bytes.push(title.charCodeAt(i));
  bytes.push(0x1D, 0x21, 0x00);
  const info = `Order #${order.id}\n${order.date} | ${order.timestamp}\n\n`; for(let i=0; i<info.length; i++) bytes.push(info.charCodeAt(i));
  bytes.push(0x1B, 0x61, 0);
  order.items.forEach(item => { const line = `${item.quantity}x ${item.name}\n`; for(let i=0; i<line.length; i++) bytes.push(line.charCodeAt(i)); });
  bytes.push(0x0A, 0x0A, 0x0A, 0x0A, 0x1D, 0x56, 0x00);
  const base64Data = arrayBufferToBase64(new Uint8Array(bytes));
  for (const p of printers) if (p.ip) await NetworkPrinter.print({ ip: p.ip, port: 9100, data: base64Data });
};

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(MENU_ITEMS);
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
      latestBroadcast: null as { title: string; body: string; timestamp: number } | null,
      adminTokens: [] as string[],
      kotPrinters: [] as {name: string, ip: string}[],
      selectedTheme: 'classic' as 'classic' | 'professional'
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [initialTrackId, setInitialTrackId] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category>('Breads');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestion, setSuggestion] = useState<MenuItem | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const [isAdminOpen, setIsAdminOpen] = useState(location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/delivery') || Capacitor.isNativePlatform());
  const [isLoading, setIsLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const isSpecialPath = location.pathname.startsWith('/admin') || location.pathname.startsWith('/kitchen') || location.pathname.startsWith('/delivery');
    setIsAdminOpen(isSpecialPath || Capacitor.isNativePlatform());
  }, [location.pathname]);

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
    const tid = params.get('tid') || params.get('trackId');
    if (tid || location.pathname === '/track') {
      if (tid) setInitialTrackId(tid);
      setIsTrackerOpen(true);
      if (tid) window.history.replaceState({}, '', window.location.pathname);
    }
  }, [location.search, location.pathname]);

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

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      items.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
      setMenuItems(items.length > 0 ? items : MENU_ITEMS);
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
                latestBroadcast: data.latestBroadcast || null,
                adminTokens: data.adminTokens || [],
                kotPrinters: data.kotPrinters || [],
                selectedTheme: data.selectedTheme || 'classic'
            });
        }
    });
    return () => unsubscribe();
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

  const isStoreOpen = storeSettings.acceptingOrders && (() => {
      const [startH, startM] = storeSettings.startTime.split(':').map(Number);
      const [endH, endM] = storeSettings.endTime.split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      if (startMin <= endMin) return currMin >= startMin && currMin <= endMin;
      return currMin >= startMin || currMin <= endMin;
  })();

  const checkAvailability = (catName: string) => {
      if (!isStoreOpen) return { isAvailable: false, reason: 'Store Closed' };
      const config = dbCategories.find(c => c.name === catName);
      if (!config) return { isAvailable: true };
      if (config.isUnavailable) return { isAvailable: false, reason: 'Category Offline' };
      const [startH, startM] = (config.startTime || '00:00').split(':').map(Number);
      const [endH, endM] = (config.endTime || '23:59').split(':').map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;
      const currMin = currentTime.getHours() * 60 + currentTime.getMinutes();
      const active = startMin <= endMin ? (currMin >= startMin && currMin <= endMin) : (currMin >= startMin || currMin <= endMin);
      return { isAvailable: active, availabilityTime: config.startTime };
  };

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
    setOrders(prev => [order, ...prev]);
    try {
        const savedIds = JSON.parse(localStorage.getItem('myOrders') || '[]');
        savedIds.push(order.id);
        localStorage.setItem('myOrders', JSON.stringify(savedIds));
    } catch(e) {}
  };

  const orderedCats = dbCategories.map(c => c.name);
  if (isFlashSaleActive) orderedCats.unshift('Flash Sale');
  if (isHappyHourActive) orderedCats.unshift('Happy Hour');

  const filteredItems = menuItems.filter(item => 
    item.category === activeCategory && 
    (item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
     item.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const observerTarget = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const currentIndex = orderedCats.indexOf(activeCategory);
        if (currentIndex !== -1 && currentIndex < orderedCats.length - 1) {
          setActiveCategory(orderedCats[currentIndex + 1]);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    }, { threshold: 1.0 });
    if (observerTarget.current) observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [activeCategory, orderedCats]);

  return (
    <React.Suspense fallback={<ShawarmaLoader />}>
      {!isAdminOpen && (
        <>
          <Navbar 
            currentTime={currentTime}
            cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
            onOpenCart={() => setIsCartOpen(true)} 
            onOpenTracker={() => setIsTrackerOpen(true)}
            hasTicker={!isStoreOpen || isFlashSaleActive || isHappyHourActive || storeSettings.isAnnouncementActive}
          />
          <NotificationTicker 
            isFlashSaleActive={isFlashSaleActive} 
            isHappyHourActive={isHappyHourActive}
            flashSaleEndTime={promoSettings.flashSaleEndTime}
            isStoreOpen={isStoreOpen}
            startTime={storeSettings.startTime}
            announcement={storeSettings.announcement}
            isAnnouncementActive={storeSettings.isAnnouncementActive}
          />
        </>
      )}

      <Routes>
        <Route path="/admin" element={
          <AdminPanel 
            isOpen={true}
            onClose={() => navigate('/')}
            items={menuItems}
            categories={dbCategories}
            orders={orders}
            coupons={coupons}
            isStoreOpen={isStoreOpen}
            promoSettings={promoSettings}
            storeSettings={storeSettings}
            onAddItem={async (item) => { await addDoc(collection(db, 'menuItems'), item); }}
            onUpdateItem={async (item) => { if (item.id) await updateDoc(doc(db, 'menuItems', item.id), item as any); }}
            onDeleteItem={async (id) => { await deleteDoc(doc(db, 'menuItems', id)); }}
            onAddCategory={async (name) => { await addDoc(collection(db, 'categories'), { name, isUnavailable: false, startTime: '00:00', endTime: '23:59' }); }}
            onDeleteCategory={async (id) => { await deleteDoc(doc(db, 'categories', id)); }}
            onUpdateOrderStatus={async (id, s, pm, fid) => {
              if (fid) await updateDoc(doc(db, 'orders', fid), { status: s });
              else {
                const q = query(collection(db, 'orders'), where("id", "==", id));
                const snap = await getDocs(q);
                for (const d of snap.docs) await updateDoc(d.ref, { status: s });
              }
            }}
            riderLocation={riderLocation}
            onAddCoupon={async (c) => { await addDoc(collection(db, 'coupons'), c); }}
            onDeleteCoupon={async (id) => { await deleteDoc(doc(db, 'coupons', id)); }}
            onUpdateStoreSettings={async (s) => { await setDoc(doc(db, 'settings', 'general'), s); }}
            onUpdatePromos={async (p) => { await updateDoc(doc(db, 'settings', 'general'), p); }}
            foodRatings={foodRatings}
            customOffers={customOffers}
          />
        } />
        <Route path="/kitchen" element={<KitchenPanel orders={orders} onUpdateOrderStatus={async (id: string, s: Order['status'], pm?: string, fid?: string) => { 
            try {
              const updates: any = { status: s };
              if (s === 'ready') updates.assignedAt = Date.now();
              if (fid) {
                await updateDoc(doc(db, 'orders', fid), updates);
              } else {
                const q = query(collection(db, 'orders'), where("id", "==", id)); 
                const snap = await getDocs(q); 
                for (const d of snap.docs) await updateDoc(d.ref, updates);
              }
            } catch(e) { console.error(e); }
        }} />} />
        <Route path="/delivery" element={<DeliveryPanel orders={orders} onUpdateOrderStatus={async (id: string, s: Order['status'], pm?: string, fid?: string) => {
            try {
              if (fid) await updateDoc(doc(db, 'orders', fid), { status: s });
              else {
                const q = query(collection(db, 'orders'), where("id", "==", id));
                const snap = await getDocs(q);
                for (const d of snap.docs) await updateDoc(d.ref, { status: s });
              }
            } catch(e) { console.error(e); }
        }} onUpdateRiderLocation={async (lat: number, lng: number) => { await setDoc(doc(db, 'tracking', 'rider1'), { lat, lng, timestamp: Date.now() }); }} deliveryUpiId={storeSettings.deliveryUpiId} />} />
        <Route path="/offers" element={<OffersPage isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} flashSaleEndTime={promoSettings.flashSaleEndTime} happyHourStartTime={promoSettings.happyHourStartTime} happyHourEndTime={promoSettings.happyHourEndTime} customOffers={customOffers} />} />
        <Route path="/rewards" element={<RewardsPage loyaltyAccounts={loyaltyAccounts} onEnrollLoyalty={async (phone: string, name: string) => { await addDoc(collection(db, 'loyalty'), { phone, customerName: name, points: 0, lastUpdated: Date.now() }); }} />} />
        <Route path="/complaints" element={<ComplaintsPage />} />
        <Route path="/track" element={<div className="min-h-screen bg-stone-950 flex items-center justify-center"><p className="text-stone-500 font-mono text-xs uppercase tracking-widest animate-pulse">Initializing Tracker...</p></div>} />
        <Route path="/*" element={
          <div className="relative min-h-screen font-sans text-stone-200 overflow-x-hidden bg-stone-950">
            <Hero />
            <StoreStatusAlert isStoreOpen={isStoreOpen} startTime={storeSettings.startTime} endTime={storeSettings.endTime} />
            <ChefsChoice items={menuItems.filter(item => item.isChefChoice)} onAdd={addToCart} isFlashSaleActive={isFlashSaleActive} checkAvailability={checkAvailability} isStoreOpen={isStoreOpen} cartItems={cartItems} allMenuItems={menuItems} onShowSuggestion={setSuggestion} />
            
            <section id="menu" className="pb-24 pt-12 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24">
              <div className="max-w-md mx-auto mb-12 px-2 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search menu..." className="w-full pl-12 pr-4 py-4 bg-stone-900 border border-stone-800 rounded-full text-white focus:border-brand-500 outline-none" />
              </div>

              <div className="flex overflow-x-auto gap-2 pb-8 scrollbar-hide">
                {orderedCats.map(cat => (
                  <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full border text-[10px] uppercase tracking-widest font-bold ${activeCategory === cat ? 'bg-brand-500 text-white' : 'border-stone-800 text-stone-500'}`}>{cat}</button>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredItems.map((item, i) => (
                  <MenuItemCard key={item.id} item={item} onAdd={addToCart} index={i} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} isAvailable={checkAvailability(item.category).isAvailable} isStoreOpen={isStoreOpen} cartItems={cartItems} allMenuItems={menuItems} onShowSuggestion={setSuggestion} />
                ))}
              </div>
              <div ref={observerTarget} className="h-20" />
            </section>
            <Footer onOpenAdmin={() => navigate('/admin')} onOpenTC={() => {}} />
          </div>
        } />
      </Routes>

      {!isAdminOpen && (
        <BottomNav 
          activeSection={activeSection}
          onOpenCart={() => setIsCartOpen(true)} onOpenTracker={() => setIsTrackerOpen(true)} 
          cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        />
      )}

      <CartSidebar 
        isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} cartItems={cartItems} 
        onUpdateQuantity={(id: string, delta: number) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0))} 
        onRemove={(id: string) => setCartItems(prev => prev.filter(i => i.id !== id))} 
        onClearCart={() => setCartItems([])} onShowNotification={() => {}} 
        onAddOrder={handleAddOrder} 
        onTrackOrder={(id?: string) => { setIsCartOpen(false); if(id) setInitialTrackId(id); setIsTrackerOpen(true); }} 
        coupons={coupons} allMenuItems={menuItems} onAddToCart={addToCart} 
        loyaltyAccounts={loyaltyAccounts} storeSettings={storeSettings} 
      />
      <OrderTrackerModal isOpen={isTrackerOpen} onClose={() => { setIsTrackerOpen(false); setInitialTrackId(''); }} initialOrderId={initialTrackId} riderLocation={riderLocation} orders={orders} />
      {suggestion && <SmartSuggestion suggestion={suggestion} onAdd={addToCart} onClose={() => setSuggestion(null)} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} />}
      
      {showInstallBanner && (
        <div className="fixed bottom-24 left-4 right-4 bg-stone-900 border border-brand-500/30 rounded-2xl p-4 z-[99999] flex justify-between items-center shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center text-white font-black">C</div>
             <div>
               <h4 className="text-white text-xs font-bold uppercase">Install Chillies</h4>
               <p className="text-stone-500 text-[10px]">Faster tracking & ordering</p>
             </div>
          </div>
          <button onClick={handleInstallClick} className="bg-brand-500 text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase">Install</button>
        </div>
      )}
    </React.Suspense>
  );
}

const Footer = ({ onOpenAdmin, onOpenTC }: any) => (
  <footer className="bg-stone-950 border-t border-white/5 py-12 px-4 text-center">
    <h2 className="font-serif text-2xl text-white mb-2">Chillies Restaurant</h2>
    <p className="text-stone-500 text-xs uppercase tracking-widest mb-8">Premium Dining Experience</p>
    <div className="flex justify-center gap-8 mb-8 text-[10px] uppercase tracking-widest font-bold text-stone-500">
      <button onClick={onOpenAdmin} className="hover:text-brand-500 transition-colors">Admin Login</button>
      <button onClick={onOpenTC} className="hover:text-brand-500 transition-colors">Terms & Conditions</button>
    </div>
    <p className="text-stone-700 text-[10px]">&copy; 2026 Chillies Restaurant. All rights reserved.</p>
  </footer>
);

export default App;