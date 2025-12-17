import React, { useState, useEffect, useRef, useMemo } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import ChefsChoice from './components/ChefsChoice';
import MenuItemCard from './components/MenuItemCard';
import FlashSaleView from './components/FlashSaleView';
import HappyHourView from './components/HappyHourView';
import CartSidebar from './components/CartSidebar';
import AdminPanel from './components/AdminPanel';
import Footer from './components/Footer';
import OrderTrackerModal from './components/OrderTrackerModal';
import SmartSuggestion from './components/SmartSuggestion';
import NotificationTicker from './components/NotificationTicker';
import { MENU_ITEMS as INITIAL_MENU_ITEMS } from './data';
import { MenuItem, CartItem, Category, Order, Coupon, CategoryConfig } from './types';
import { CheckCircle, X, WifiOff, Search, Zap, Clock, Lock, PartyPopper } from 'lucide-react';

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

// Added export for printThermalBill used by multiple components
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

  printWindow.document.write(`
    <html>
      <head>
        <title>Order #${order.id}</title>
        <style>
          body { font-family: 'Courier New', Courier, monospace; width: 80mm; padding: 10px; margin: 0; color: #000; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .footer { text-align: center; border-top: 1px dashed #000; padding-top: 10px; margin-top: 10px; font-size: 12px; }
          .total { font-weight: bold; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
          h2 { margin: 5px 0; }
          p { margin: 2px 0; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>CHILLIES</h2>
          <p>Valiyakulam, Alappuzha</p>
          <p>Order ID: #${order.id}</p>
          <p>${order.date} ${order.timestamp}</p>
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
  }, 250);
};

function App() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [dbCategories, setDbCategories] = useState<CategoryConfig[]>([
      { id: '1', name: 'Starters' },
      { id: '2', name: 'Main Course' },
      { id: '3', name: 'Desserts' },
      { id: '4', name: 'Drinks' }
  ]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isFlashSaleActiveFromDb, setIsFlashSaleActiveFromDb] = useState(false);
  const [flashSaleEndTime, setFlashSaleEndTime] = useState('23:59');
  const [isHappyHourActive, setIsHappyHourActive] = useState(false);
  const settingsLoadedRef = useRef(false);
  const [storeSettings, setStoreSettings] = useState({
      acceptingOrders: true,
      startTime: '07:00',
      endTime: '23:00'
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [notification, setNotification] = useState<{ show: boolean; message: string; type?: 'success' | 'error' | 'info' } | null>(null);
  const [suggestion, setSuggestion] = useState<MenuItem | null>(null);
  const [showTC, setShowTC] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [trackingOrderId, setTrackingOrderId] = useState('');

  // Auto-Update Current Time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Check if Flash Sale should be active based on current time
  const isFlashSaleActive = useMemo(() => {
    if (!isFlashSaleActiveFromDb) return false;
    
    const [h, m] = flashSaleEndTime.split(':').map(Number);
    const endMinutes = h * 60 + m;
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
    
    return currentMinutes < endMinutes;
  }, [isFlashSaleActiveFromDb, flashSaleEndTime, currentTime]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackId = params.get('trackId');
    if (trackId) {
        setTrackingOrderId(trackId);
        setIsTrackerOpen(true);
        window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkTimeRange = (startStr?: string, endStr?: string): boolean => {
      if (!startStr || !endStr) return true;
      const now = currentTime;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const [startH, startM] = startStr.split(':').map(Number);
      const [endH, endM] = endStr.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      if (startMinutes <= endMinutes) {
          return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
      } else {
          return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
      }
  };

  const isStoreOpen = storeSettings.acceptingOrders && checkTimeRange(storeSettings.startTime, storeSettings.endTime);

  const checkAvailability = (catName: string) => {
      if (!isStoreOpen) return { isAvailable: false, reason: 'Store Closed' };
      const config = dbCategories.find(c => c.name === catName);
      if (!config) return { isAvailable: true };
      const active = checkTimeRange(config.startTime, config.endTime);
      return { isAvailable: active, availabilityTime: config.startTime };
  };

  const displayCategoryNames = ['All', ...dbCategories.map(c => c.name)];

  useEffect(() => {
    const q = query(collection(db, 'menuItems'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as MenuItem));
      if (items.length > 0) setMenuItems(items);
      setIsLoading(false);
    }, () => setIsLoading(false));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'categories'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
      if (fetched.length > 0) setDbCategories(fetched);
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
    const settingsRef = doc(db, 'settings', 'general');
    const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setIsFlashSaleActiveFromDb(data.isFlashSaleActive || false);
            setFlashSaleEndTime(data.flashSaleEndTime || '23:59');
            setIsHappyHourActive(data.isHappyHourActive || false);
            setStoreSettings({
                acceptingOrders: data.acceptingOrders ?? true,
                startTime: data.startTime || '07:00',
                endTime: data.endTime || '23:00'
            });
            if (!settingsLoadedRef.current) {
                if (data.isFlashSaleActive) setActiveCategory('Flash Sale');
                else if (data.isHappyHourActive) setActiveCategory('Happy Hour');
                settingsLoadedRef.current = true;
            }
        }
    });
    return () => unsubscribe();
  }, []);

  // Switch category if flash sale expires while looking at it
  useEffect(() => {
    if (activeCategory === 'Flash Sale' && !isFlashSaleActive) {
      setActiveCategory('All');
    }
  }, [isFlashSaleActive, activeCategory]);

  const addToCart = (item: MenuItem) => {
    if (!isStoreOpen) {
        setNotification({ show: true, message: 'Restaurant is closed for orders.', type: 'error' });
        return;
    }
    let price = item.price;
    if (isFlashSaleActive && item.isFlashSale && item.flashSalePrice) price = item.flashSalePrice;
    else if (isHappyHourActive && item.isHappyHour && item.happyHourPrice) price = item.happyHourPrice;

    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1, price } : i);
      return [...prev, { ...item, quantity: 1, price }];
    });
    setNotification({ show: true, message: `${item.name} added to cart`, type: 'success' });
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesCategory = false;
    if (activeCategory === 'Flash Sale') matchesCategory = !!item.isFlashSale;
    else if (activeCategory === 'Happy Hour') matchesCategory = !!item.isHappyHour;
    else if (activeCategory === 'All') matchesCategory = !item.isExclusive;
    else matchesCategory = item.category === activeCategory && !item.isExclusive;
    return matchesCategory && matchesSearch;
  });

  const chefsChoiceItems = menuItems.filter(item => item.isChefChoice && !item.isExclusive);
  const hasTicker = isFlashSaleActive || isHappyHourActive;

  return (
    <div className={`relative min-h-screen font-sans text-stone-200 overflow-x-hidden selection:bg-gold-500 selection:text-black`}>
      <div className={`fixed inset-0 bg-stone-950 -z-10`} />
      
      <NotificationTicker 
        isFlashSaleActive={isFlashSaleActive} 
        isHappyHourActive={isHappyHourActive}
        flashSaleEndTime={flashSaleEndTime}
      />

      <Navbar 
        cartItemCount={cartItems.reduce((acc, i) => acc + i.quantity, 0)} 
        onOpenCart={() => setIsCartOpen(true)} 
        onOpenTracker={() => setIsTrackerOpen(true)}
        hasTicker={hasTicker}
      />
      
      <Hero />
      
      <ChefsChoice 
        items={chefsChoiceItems} 
        onAdd={addToCart} 
        isFlashSaleActive={isFlashSaleActive}
        checkAvailability={checkAvailability}
        isStoreOpen={isStoreOpen}
        cartItems={cartItems}
        allMenuItems={menuItems}
        onShowSuggestion={setSuggestion}
      />

      <section id="menu" className="pb-24 pt-12 px-4 md:px-8 max-w-7xl mx-auto scroll-mt-24 md:scroll-mt-32">
        <div className="text-center mb-10 md:mb-16 space-y-4 md:space-y-6">
          <span className="text-gold-500 uppercase tracking-[0.3em] text-[10px] md:text-xs font-bold block">Our Selection</span>
          <h2 className="text-3xl md:text-6xl font-serif text-white relative inline-block">
            Curated Menu
            <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-16 md:w-24 h-1 bg-gold-500 rounded-full"></span>
          </h2>
        </div>

        <div className="max-w-md mx-auto mb-10 md:mb-12 relative px-2">
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={18} />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search menu..."
                    className="block w-full pl-12 pr-4 py-4 bg-stone-900 border border-stone-800 rounded-full text-stone-200 focus:border-gold-500 focus:outline-none transition-all"
                />
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 mb-12">
            <div className="flex gap-3 w-full justify-center px-4 overflow-x-auto scrollbar-hide">
                {isFlashSaleActive && (
                    <button
                        onClick={() => setActiveCategory('Flash Sale')}
                        className={`flex-shrink-0 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 ${
                            activeCategory === 'Flash Sale' ? 'bg-red-600 text-white' : 'bg-stone-900 text-red-500 border border-red-500/30'
                        }`}
                    >
                        <Zap size={14} fill="currentColor" /> Flash Sale
                    </button>
                )}
                {isHappyHourActive && (
                    <button
                        onClick={() => setActiveCategory('Happy Hour')}
                        className={`flex-shrink-0 px-6 py-3 rounded-full font-bold uppercase tracking-widest text-[10px] md:text-xs flex items-center gap-2 ${
                            activeCategory === 'Happy Hour' ? 'bg-purple-600 text-white' : 'bg-stone-900 text-purple-500 border border-purple-500/30'
                        }`}
                    >
                        <PartyPopper size={14} fill="currentColor" /> Happy Hour
                    </button>
                )}
            </div>

            <div className="flex w-full overflow-x-auto scrollbar-hide md:flex-wrap md:justify-center gap-2 px-4 pb-4">
                {displayCategoryNames.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-6 md:px-8 py-3 rounded-full border transition-all text-[10px] md:text-xs font-bold uppercase tracking-widest ${
                            activeCategory === cat ? 'bg-gold-500 border-gold-500 text-stone-950' : 'bg-transparent border-stone-800 text-stone-500'
                        }`}
                    >
                        {cat}
                    </button>
                ))}
            </div>
        </div>

        {isLoading ? (
            <div className="flex flex-col items-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-stone-500 text-xs tracking-widest uppercase">Loading...</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
                {filteredItems.map((item, index) => (
                    <MenuItemCard 
                        key={item.id} 
                        item={item} 
                        onAdd={addToCart} 
                        index={index} 
                        isFlashSaleActive={isFlashSaleActive}
                        isHappyHourActive={isHappyHourActive}
                        isAvailable={checkAvailability(item.category).isAvailable}
                        isStoreOpen={isStoreOpen}
                        cartItems={cartItems}
                        allMenuItems={menuItems}
                        onShowSuggestion={setSuggestion}
                    />
                ))}
                {filteredItems.length === 0 && (
                    <div className="col-span-full text-center py-20 border-2 border-dashed border-stone-800 rounded-3xl">
                        <p className="text-stone-500 uppercase tracking-widest text-sm">No items found.</p>
                    </div>
                )}
            </div>
        )}
      </section>

      <Footer onOpenAdmin={() => setIsAdminOpen(true)} onOpenTC={() => setShowTC(true)} />
      
      <OrderTrackerModal isOpen={isTrackerOpen} onClose={() => setIsTrackerOpen(false)} initialOrderId={trackingOrderId} />
      {suggestion && <SmartSuggestion suggestion={suggestion} onAdd={addToCart} onClose={() => setSuggestion(null)} isFlashSaleActive={isFlashSaleActive} isHappyHourActive={isHappyHourActive} />}
      
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={(id, delta) => setCartItems(prev => prev.map(i => i.id === id ? {...i, quantity: Math.max(0, i.quantity + delta)} : i).filter(i => i.quantity > 0))}
        onRemove={id => setCartItems(prev => prev.filter(i => i.id !== id))}
        onClearCart={() => setCartItems([])}
        onShowNotification={msg => setNotification({ show: true, message: msg, type: 'success' })}
        onAddOrder={async o => { try { await addDoc(collection(db, 'orders'), o); } catch (e) { console.error(e); } }}
        onTrackOrder={() => setIsTrackerOpen(true)}
        coupons={coupons}
      />
      
      <AdminPanel 
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        items={menuItems}
        categories={dbCategories}
        orders={orders}
        coupons={coupons}
        isFlashSaleActive={isFlashSaleActiveFromDb}
        flashSaleEndTime={flashSaleEndTime}
        isHappyHourActive={isHappyHourActive}
        onAddItem={async i => { const {id, ...d} = i; await addDoc(collection(db, 'menuItems'), d); }}
        onUpdateItem={async i => { if(i.id) await updateDoc(doc(db, 'menuItems', i.id), {...i}); }}
        onDeleteItem={async id => await deleteDoc(doc(db, 'menuItems', id))}
        onAddCategory={n => addDoc(collection(db, 'categories'), {name: n})}
        onUpdateCategory={c => updateDoc(doc(db, 'categories', c.id), {name: c.name, startTime: c.startTime, endTime: c.endTime})}
        onDeleteCategory={async n => { const q = query(collection(db, 'categories'), where("name", "==", n)); const s = await getDocs(q); s.forEach(d => deleteDoc(d.ref)); }}
        onUpdateOrderStatus={async (id, s) => { const q = query(collection(db, 'orders'), where("id", "==", id)); const snap = await getDocs(q); snap.forEach(d => updateDoc(d.ref, {status: s})); }}
        onAddCoupon={c => addDoc(collection(db, 'coupons'), c)}
        onDeleteCoupon={id => deleteDoc(doc(db, 'coupons', id))}
        onUpdateStoreSettings={s => setDoc(doc(db, 'settings', 'general'), s, {merge: true})}
        onToggleFlashSale={isActive => setDoc(doc(db, 'settings', 'general'), { isFlashSaleActive: isActive }, { merge: true })}
        onUpdateFlashSaleEndTime={time => setDoc(doc(db, 'settings', 'general'), { flashSaleEndTime: time }, { merge: true })}
        onToggleHappyHour={isActive => setDoc(doc(db, 'settings', 'general'), { isHappyHourActive: isActive }, { merge: true })}
      />
    </div>
  );
}

export default App;